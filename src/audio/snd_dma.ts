// ============================================================================
// src/audio/snd_dma.ts
// Quake III Arena Web Audio API 3D Sound Engine & Announcer Queue (snd_dma.c)
// Features:
//   - Sanitizes 1999 id Software RIFF WAVE headers (strips trailing SoundForge
//     LIST/DISP chunks & fixes RIFF sizes) before hardware-sinc decodeAudioData
//   - Applies smooth de-click fade-in / fade-out envelopes on every AudioBuffer
//   - Quake 3 Channel Voice Stealing (CHAN_WEAPON, CHAN_PLAYER, CHAN_ANNOUNCER)
//     & per-sound retrigger throttling so rapid-fire weapons never stack into
//     static or clipping distortion
//   - Clean StereoPannerNode + Distance Attenuation + Master Limiter
// ============================================================================

import { Cvars } from '../qcommon/cvar';
import { VFS } from '../qcommon/files';
import { AngleVectors, Vec3, vec3Dist, vec3Dot, vec3Normalize, vec3Sub } from '../qcommon/q_shared';

export const SOUND_FULLVOLUME = 90.0;
export const SOUND_ATTENUATE = 0.00085;
const MAX_ACTIVE_VOICES = 10;

/**
 * Maps Announcer callouts to the exact 1999 Quake III Arena .WAV paths in pak0.pk3
 */
const ANNOUNCER_WAV_MAP: Record<string, string> = {
  'prepare to fight': 'sound/feedback/prepare.wav',
  'three': 'sound/feedback/three.wav',
  'two': 'sound/feedback/two.wav',
  'one': 'sound/feedback/one.wav',
  'fight!': 'sound/feedback/fight.wav',
  'fight': 'sound/feedback/fight.wav',
  'impressive': 'sound/feedback/impressive.wav',
  'excellent': 'sound/feedback/excellent.wav',
  'humiliation': 'sound/feedback/humiliation.wav',
  'accuracy': 'sound/feedback/accuracy.wav',
  'quad damage': 'sound/items/quaddamage.wav',
  'taken the lead': 'sound/feedback/takenlead.wav',
  'tied for the lead': 'sound/feedback/tiedlead.wav',
  'lost the lead': 'sound/feedback/lostlead.wav',
  '1 frag left': 'sound/feedback/1_frag.wav',
  '2 frags left': 'sound/feedback/2_frags.wav',
  '3 frags left': 'sound/feedback/3_frags.wav',
  'sudden death': 'sound/feedback/sudden_death.wav',
};

interface ActiveVoice {
  src: AudioBufferSourceNode;
  gain: GainNode;
  channelKey: string;
}

export class Q3SoundEngine {
  private ctx: AudioContext | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  private bufferCache = new Map<string, AudioBuffer>();
  private decodingSet = new Set<string>();
  private lastPlayTimeMs = new Map<string, number>();
  private channelVoices = new Map<string, ActiveVoice>();
  private activeVoices = new Set<ActiveVoice>();

  private announcerQueue: string[] = [];
  private isAnnouncing = false;

  private listenerOrigin: Vec3 = [0, 0, 0];
  private listenerRight: Vec3 = [0, 1, 0];

  public initOnUserGesture(): void {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterCompressor = this.ctx.createDynamicsCompressor();
      this.masterCompressor.threshold.value = -12;
      this.masterCompressor.knee.value = 10;
      this.masterCompressor.ratio.value = 10;
      this.masterCompressor.attack.value = 0.002;
      this.masterCompressor.release.value = 0.1;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.65;

      this.masterGain.connect(this.masterCompressor);
      this.masterCompressor.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public updateListener(origin: Vec3, angles: Vec3): void {
    this.listenerOrigin[0] = origin[0];
    this.listenerOrigin[1] = origin[1];
    this.listenerOrigin[2] = origin[2];

    const forward: Vec3 = [0, 0, 0];
    const right: Vec3 = [0, 0, 0];
    AngleVectors(angles, forward, right, null);
    this.listenerRight = right;
  }

  /**
   * Builds a clean standard 44-byte RIFF WAVE ArrayBuffer containing ONLY the
   * `fmt ` and `data` PCM chunks, stripping any trailing 1999 SoundForge
   * `LIST`/`DISP`/`PAD ` metadata chunks that cause clicks/static.
   */
  private sanitizeRiffWav(raw: Uint8Array): ArrayBuffer | null {
    if (raw.byteLength < 44) return null;
    const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);

    const isRiff =
      String.fromCharCode(raw[0], raw[1], raw[2], raw[3]) === 'RIFF' &&
      String.fromCharCode(raw[8], raw[9], raw[10], raw[11]) === 'WAVE';
    if (!isRiff) return null;

    let fmtOffset = -1;
    let dataOffset = -1;
    let dataSize = 0;

    let pos = 12;
    while (pos + 8 <= raw.byteLength) {
      const id = String.fromCharCode(raw[pos], raw[pos + 1], raw[pos + 2], raw[pos + 3]);
      const sz = view.getUint32(pos + 4, true);
      const body = pos + 8;

      if (id === 'fmt ' && sz >= 16 && body + 16 <= raw.byteLength) {
        fmtOffset = body;
      } else if (id === 'data') {
        dataOffset = body;
        dataSize = Math.min(sz, raw.byteLength - body);
        break;
      }
      pos = body + sz + (sz & 1);
    }

    if (fmtOffset < 0 || dataOffset < 0 || dataSize <= 0) return null;

    // Ensure dataSize is aligned to blockAlign
    const blockAlign = Math.max(1, view.getUint16(fmtOffset + 12, true));
    dataSize -= dataSize % blockAlign;
    if (dataSize <= 0) return null;

    const clean = new Uint8Array(44 + dataSize);
    const cv = new DataView(clean.buffer);
    // 'RIFF'
    clean[0] = 0x52; clean[1] = 0x49; clean[2] = 0x46; clean[3] = 0x46;
    cv.setUint32(4, 36 + dataSize, true);
    // 'WAVEfmt '
    clean[8] = 0x57; clean[9] = 0x41; clean[10] = 0x56; clean[11] = 0x45;
    clean[12] = 0x66; clean[13] = 0x6d; clean[14] = 0x74; clean[15] = 0x20;
    cv.setUint32(16, 16, true);
    clean.set(raw.subarray(fmtOffset, fmtOffset + 16), 20);
    // 'data'
    clean[36] = 0x64; clean[37] = 0x61; clean[38] = 0x74; clean[39] = 0x61;
    cv.setUint32(40, dataSize, true);
    clean.set(raw.subarray(dataOffset, dataOffset + dataSize), 44);

    return clean.buffer;
  }

  /**
   * Applies a smooth de-click envelope at the start and end of a decoded AudioBuffer
   */
  private applyDeclickEnvelope(buf: AudioBuffer): void {
    const len = buf.length;
    const fadeIn = Math.min(96, Math.floor(len * 0.05));
    const fadeOut = Math.min(256, Math.floor(len * 0.1));
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < fadeIn; i++) {
        data[i] *= i / fadeIn;
      }
      for (let i = 0; i < fadeOut; i++) {
        const idx = len - 1 - i;
        if (idx >= 0) data[idx] *= i / fadeOut;
      }
    }
  }

  public playLocalSound(soundPath: string, volumeScale = 1.0, onEnded?: () => void): void {
    this.playSoundAtOrigin(soundPath, null, volumeScale, onEnded);
  }

  public playSoundAtOrigin(
    soundPath: string,
    origin: Vec3 | null,
    volumeScale = 1.0,
    onEnded?: () => void
  ): void {
    this.initOnUserGesture();
    if (!this.ctx || !this.masterGain) {
      onEnded?.();
      return;
    }

    const masterVol = Cvars.variableValue('s_volume');
    if (masterVol <= 0.001) {
      onEnded?.();
      return;
    }

    const norm = VFS.normalizePath(soundPath);
    const nowMs = performance.now();

    // Per-sound minimum cooldown prevents any rapid-fire buzzing or static buildup
    const minCooldownMs = norm.includes('lg_fire') || norm.includes('lg_hum')
      ? 450
      : norm.includes('machgf')
      ? 110
      : norm.includes('land1') || norm.includes('jump1') || norm.includes('jumppad')
      ? 220
      : norm.includes('hit.wav')
      ? 75
      : 55;

    const lastMs = this.lastPlayTimeMs.get(norm) || 0;
    if (!onEnded && nowMs - lastMs < minCooldownMs) {
      return;
    }
    this.lastPlayTimeMs.set(norm, nowMs);

    let distAtten = 1.0;
    let panValue = 0.0;
    if (origin) {
      const dist = vec3Dist(origin, this.listenerOrigin);
      if (dist > SOUND_FULLVOLUME) {
        distAtten = Math.max(0, 1.0 - (dist - SOUND_FULLVOLUME) * SOUND_ATTENUATE);
      }
      if (distAtten <= 0.03) {
        onEnded?.();
        return;
      }
      if (dist > 8) {
        const dir: Vec3 = [0, 0, 0];
        vec3Sub(origin, this.listenerOrigin, dir);
        vec3Normalize(dir);
        panValue = Math.max(-0.8, Math.min(0.8, vec3Dot(dir, this.listenerRight)));
      }
    }

    const channelKey = onEnded
      ? 'CHAN_ANNOUNCER'
      : norm.includes('weapons/')
      ? `CHAN_WEAPON_${origin ? Math.round(origin[0] / 200) : 'LOCAL'}`
      : norm.includes('player/')
      ? `CHAN_PLAYER_${origin ? Math.round(origin[0] / 200) : 'LOCAL'}`
      : `CHAN_MISC_${norm}`;

    const finalGain = masterVol * volumeScale * distAtten;

    const cached = this.bufferCache.get(norm);
    if (cached) {
      this.triggerVoice(cached, channelKey, finalGain, panValue, onEnded);
      return;
    }

    if (this.decodingSet.has(norm)) {
      onEnded?.();
      return;
    }

    const raw = VFS.readFile(norm);
    if (!raw) {
      onEnded?.();
      return;
    }

    const cleanAb = this.sanitizeRiffWav(raw);
    if (!cleanAb) {
      onEnded?.();
      return;
    }

    this.decodingSet.add(norm);
    this.ctx
      .decodeAudioData(cleanAb)
      .then((audioBuf) => {
        this.decodingSet.delete(norm);
        this.applyDeclickEnvelope(audioBuf);
        this.bufferCache.set(norm, audioBuf);
        this.triggerVoice(audioBuf, channelKey, finalGain, panValue, onEnded);
      })
      .catch(() => {
        this.decodingSet.delete(norm);
        onEnded?.();
      });
  }

  private triggerVoice(
    buf: AudioBuffer,
    channelKey: string,
    gainValue: number,
    panValue: number,
    onEnded?: () => void
  ): void {
    if (!this.ctx || !this.masterGain) {
      onEnded?.();
      return;
    }

    // Fade out previous sound on the same channel so rapid shots don't stack
    const prev = this.channelVoices.get(channelKey);
    if (prev && channelKey !== 'CHAN_ANNOUNCER') {
      try {
        const t = this.ctx.currentTime;
        prev.gain.gain.setValueAtTime(prev.gain.gain.value, t);
        prev.gain.gain.linearRampToValueAtTime(0.0001, t + 0.018);
        prev.src.stop(t + 0.02);
      } catch {
        // ignore
      }
      this.activeVoices.delete(prev);
      this.channelVoices.delete(channelKey);
    }

    if (this.activeVoices.size >= MAX_ACTIVE_VOICES) {
      const oldest = this.activeVoices.values().next().value;
      if (oldest) {
        try {
          oldest.src.stop();
        } catch {
          // ignore
        }
        this.activeVoices.delete(oldest);
      }
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const gain = this.ctx.createGain();
    gain.gain.value = Math.max(0, Math.min(0.85, gainValue));

    if (typeof this.ctx.createStereoPanner === 'function' && Math.abs(panValue) > 0.01) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = panValue;
      src.connect(panner);
      panner.connect(gain);
    } else {
      src.connect(gain);
    }

    gain.connect(this.masterGain);

    const voice: ActiveVoice = {
      src,
      gain,
      channelKey,
    };
    this.activeVoices.add(voice);
    this.channelVoices.set(channelKey, voice);

    src.onended = () => {
      this.activeVoices.delete(voice);
      if (this.channelVoices.get(channelKey) === voice) {
        this.channelVoices.delete(channelKey);
      }
      onEnded?.();
    };

    src.start();
  }

  /**
   * Queues an iconic 1999 Quake III Arena Announcer Callout using the original
   * `sound/feedback/*.wav` voice files from `pak0.pk3`!
   */
  public queueAnnouncement(text: string): void {
    this.announcerQueue.push(text);
    this.processAnnouncerQueue();
  }

  private processAnnouncerQueue(): void {
    if (this.isAnnouncing || this.announcerQueue.length === 0) return;
    const next = this.announcerQueue.shift()!;
    this.isAnnouncing = true;

    const wavPath = ANNOUNCER_WAV_MAP[next.trim().toLowerCase()] || next;
    const norm = VFS.normalizePath(wavPath);

    if (VFS.fileExists(norm)) {
      let finished = false;
      const done = () => {
        if (finished) return;
        finished = true;
        this.isAnnouncing = false;
        this.processAnnouncerQueue();
      };
      this.playLocalSound(norm, 0.95, done);
      setTimeout(done, 2200);
      return;
    }

    setTimeout(() => {
      this.isAnnouncing = false;
      this.processAnnouncerQueue();
    }, 600);
  }
}

export const Sound = new Q3SoundEngine();
