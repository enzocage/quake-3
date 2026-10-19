// ============================================================================
// src/cgame/cg_players.ts
// Quake III Arena Multipart MD3 Player Model Assembler & Tag-Rigger
// Parses animation.cfg (including the LEGS_WALKCR frame skip quirk!) and
// links lower.md3 -> tag_torso -> upper.md3 -> tag_head & tag_weapon
// ============================================================================

import { Q3Tokenizer } from '../qcommon/cmd';
import { VFS } from '../qcommon/files';
import {
  AnglesToAxis,
  AnimationDef,
  AnimNumber,
  AxisClear,
  LerpAngle,
  Mat3,
  Powerup,
  RefEntity,
  RefEntityType,
  RF_THIRD_PERSON,
  Vec3,
  vec3Clone,
} from '../qcommon/q_shared';
import { WEAPON_SPECS } from '../game/bg_misc';
import { Q3Renderer } from '../renderer/tr_main';
import { positionRotatedEntityOnTag } from '../renderer/tr_model';

export interface PlayerModelCache {
  modelName: string;
  lowerPath: string;
  upperPath: string;
  headPath: string;
  lowerSkin: string;
  upperSkin: string;
  headSkin: string;
  animations: AnimationDef[];
}

export class CgPlayerManager {
  private renderer: Q3Renderer;
  private modelCache = new Map<string, PlayerModelCache>();

  constructor(renderer: Q3Renderer) {
    this.renderer = renderer;
  }

  public getPlayerModel(modelSpec = 'sarge/default'): PlayerModelCache {
    const [rawModel, rawSkin] = modelSpec.toLowerCase().split('/');
    const modelName = rawModel || 'sarge';
    const skinName = rawSkin || 'default';
    const key = `${modelName}/${skinName}`;

    const cached = this.modelCache.get(key);
    if (cached) return cached;

    const baseDir = `models/players/${modelName}`;
    const animText =
      VFS.readTextFile(`${baseDir}/animation.cfg`) ||
      VFS.readTextFile('models/players/sarge/animation.cfg') ||
      '';
    const animations = this.parseAnimationCfg(animText);

    const info: PlayerModelCache = {
      modelName,
      lowerPath: `${baseDir}/lower.md3`,
      upperPath: `${baseDir}/upper.md3`,
      headPath: `${baseDir}/head.md3`,
      lowerSkin: `${baseDir}/lower_${skinName}.skin`,
      upperSkin: `${baseDir}/upper_${skinName}.skin`,
      headSkin: `${baseDir}/head_${skinName}.skin`,
      animations,
    };

    // Pre-register MD3 models
    this.renderer.registerModel(info.lowerPath);
    this.renderer.registerModel(info.upperPath);
    this.renderer.registerModel(info.headPath);

    this.modelCache.set(key, info);
    return info;
  }

  /**
   * Parses Quake III `animation.cfg` (CG_ParseAnimationFile in cg_players.c)
   * Explicitly handles the 3ds Max export offset between TORSO_GESTURE and LEGS_WALKCR!
   */
  private parseAnimationCfg(text: string): AnimationDef[] {
    const anims: AnimationDef[] = [];
    for (let i = 0; i < AnimNumber.MAX_ANIMATIONS; i++) {
      anims.push({
        firstFrame: 0,
        numFrames: 1,
        loopFrames: 1,
        frameLerp: 100,
        initialLerp: 100,
        reversed: false,
        flipflop: false,
      });
    }

    const tk = new Q3Tokenizer(text);
    // Skip gender / headoffset / footsteps header keywords
    while (!tk.eof()) {
      const tok = tk.nextToken(true);
      if (!tok) break;
      const lower = tok.toLowerCase();
      if (lower === 'sex' || lower === 'footsteps') {
        tk.nextToken(false);
        continue;
      }
      if (lower === 'headoffset') {
        tk.nextToken(false);
        tk.nextToken(false);
        tk.nextToken(false);
        continue;
      }
      // First numeric token is BOTH_DEATH1 firstFrame
      const firstNum = Number.parseInt(tok, 10);
      if (!Number.isNaN(firstNum)) {
        this.readAnimEntry(anims, 0, firstNum, tk);
        for (let i = 1; i < AnimNumber.MAX_ANIMATIONS; i++) {
          const ff = Number.parseInt(tk.nextToken(true), 10);
          if (Number.isNaN(ff)) break;
          this.readAnimEntry(anims, i, ff, tk);
        }
        break;
      }
    }

    // Quake 3 LEGS frame skip correction!
    const skip =
      anims[AnimNumber.LEGS_WALKCR].firstFrame -
      anims[AnimNumber.TORSO_GESTURE].firstFrame;
    if (skip > 0) {
      for (let i = AnimNumber.LEGS_WALKCR; i < AnimNumber.MAX_ANIMATIONS; i++) {
        anims[i].firstFrame -= skip;
      }
    }

    return anims;
  }

  private readAnimEntry(
    anims: AnimationDef[],
    index: number,
    firstFrame: number,
    tk: Q3Tokenizer
  ): void {
    let numFrames = Number.parseInt(tk.nextToken(false), 10) || 1;
    const loopFrames = Number.parseInt(tk.nextToken(false), 10) || 0;
    let fps = Number.parseFloat(tk.nextToken(false)) || 15;
    if (fps <= 0) fps = 15;

    let reversed = false;
    if (numFrames < 0) {
      numFrames = -numFrames;
      reversed = true;
    }

    const msec = 1000.0 / fps;
    anims[index] = {
      firstFrame,
      numFrames,
      loopFrames,
      frameLerp: msec,
      initialLerp: msec,
      reversed,
      flipflop: false,
    };
  }

  private computeAnimFrames(
    anim: AnimationDef,
    timeMs: number
  ): { oldFrame: number; frame: number; backlerp: number } {
    if (anim.numFrames <= 1) {
      return { oldFrame: anim.firstFrame, frame: anim.firstFrame, backlerp: 0 };
    }
    const exactFrame = timeMs / anim.frameLerp;
    const fInt = Math.floor(exactFrame);
    const frac = exactFrame - fInt;

    const curRel = fInt % anim.numFrames;
    const nextRel = (fInt + 1) % anim.numFrames;
    return {
      oldFrame: Math.max(0, anim.firstFrame + curRel),
      frame: Math.max(0, anim.firstFrame + nextRel),
      backlerp: 1.0 - frac,
    };
  }

  /**
   * Assembles and submits `lower.md3`, `upper.md3`, `head.md3`, and `weapon.md3`
   * connected via `tag_torso`, `tag_head`, and `tag_weapon` (CG_Player in cg_players.c)
   */
  public addPlayerToScene(params: {
    origin: Vec3;
    velocity: Vec3;
    viewangles: Vec3;
    legsAnim: AnimNumber;
    torsoAnim: AnimNumber;
    weapon: number;
    modelSpec: string;
    isLocalPlayer: boolean;
    powerups: number[];
    timeMs: number;
    muzzleFlashActive: boolean;
  }): void {
    const pModel = this.getPlayerModel(params.modelSpec);
    const lowerMd3 = this.renderer.registerModel(pModel.lowerPath);
    const upperMd3 = this.renderer.registerModel(pModel.upperPath);
    const headMd3 = this.renderer.registerModel(pModel.headPath);
    if (!lowerMd3 || !upperMd3 || !headMd3) return;

    const renderfx = params.isLocalPlayer ? RF_THIRD_PERSON : 0;

    // 1. Compute split angles for Legs, Torso, and Head (CG_PlayerAngles)
    const yaw = params.viewangles[1];
    const pitch = params.viewangles[0];

    const horizSpeed = Math.hypot(params.velocity[0], params.velocity[1]);
    let legsYaw = yaw;
    if (horizSpeed > 25) {
      const moveYaw = (Math.atan2(params.velocity[1], params.velocity[0]) * 180) / Math.PI;
      legsYaw = LerpAngle(yaw, moveYaw, 0.45);
    }

    const legsAngles: Vec3 = [0, legsYaw, 0];
    const torsoAngles: Vec3 = [pitch * 0.35, AngleNormalize(yaw - legsYaw) * 0.6, 0];
    const headAngles: Vec3 = [pitch * 0.55, AngleNormalize(yaw - legsYaw) * 0.4, 0];

    const legsAxis: Mat3 = AxisClear();
    const torsoAxis: Mat3 = AxisClear();
    const headAxis: Mat3 = AxisClear();
    AnglesToAxis(legsAngles, legsAxis);
    AnglesToAxis(torsoAngles, torsoAxis);
    AnglesToAxis(headAngles, headAxis);

    const legsFrames = this.computeAnimFrames(
      pModel.animations[params.legsAnim] || pModel.animations[AnimNumber.LEGS_IDLE],
      params.timeMs
    );
    const torsoFrames = this.computeAnimFrames(
      pModel.animations[params.torsoAnim] || pModel.animations[AnimNumber.TORSO_STAND],
      params.timeMs
    );

    const hasQuad = (params.powerups[Powerup.PW_QUAD] || 0) > params.timeMs;

    // 2. Lower Body (lower.md3)
    const legsEnt: RefEntity = {
      reType: RefEntityType.RT_MODEL,
      renderfx,
      hModel: pModel.lowerPath,
      lightingOrigin: vec3Clone(params.origin),
      axis: legsAxis,
      nonNormalizedAxes: false,
      origin: vec3Clone(params.origin),
      oldorigin: vec3Clone(params.origin),
      oldframe: legsFrames.oldFrame,
      frame: legsFrames.frame,
      backlerp: legsFrames.backlerp,
      skinNum: 0,
      customSkin: pModel.lowerSkin,
      customShader: '',
      shaderRGBA: [255, 255, 255, 255],
      shaderTexCoord: [0, 0],
      shaderTime: 0,
      radius: 0,
      rotation: 0,
    };
    this.renderer.addRefEntityToScene(legsEnt);
    if (hasQuad) {
      this.renderer.addRefEntityToScene({
        ...legsEnt,
        customShader: 'models/powerups/instant/quad_shell',
      });
    }

    // 3. Upper Body (upper.md3) attached to lower.md3's `tag_torso`
    const torsoEnt: RefEntity = {
      ...legsEnt,
      hModel: pModel.upperPath,
      axis: torsoAxis,
      oldframe: torsoFrames.oldFrame,
      frame: torsoFrames.frame,
      backlerp: torsoFrames.backlerp,
      customSkin: pModel.upperSkin,
    };
    positionRotatedEntityOnTag(torsoEnt, legsEnt, lowerMd3, 'tag_torso');
    this.renderer.addRefEntityToScene(torsoEnt);
    if (hasQuad) {
      this.renderer.addRefEntityToScene({
        ...torsoEnt,
        customShader: 'models/powerups/instant/quad_shell',
      });
    }

    // 4. Head (head.md3) attached to upper.md3's `tag_head`
    const headEnt: RefEntity = {
      ...torsoEnt,
      hModel: pModel.headPath,
      axis: headAxis,
      oldframe: 0,
      frame: 0,
      backlerp: 0,
      customSkin: pModel.headSkin,
    };
    positionRotatedEntityOnTag(headEnt, torsoEnt, upperMd3, 'tag_head');
    this.renderer.addRefEntityToScene(headEnt);
    if (hasQuad) {
      this.renderer.addRefEntityToScene({
        ...headEnt,
        customShader: 'models/powerups/instant/quad_shell',
      });
    }

    // 5. Third-Person Weapon attached to upper.md3's `tag_weapon`
    const wSpec = WEAPON_SPECS[params.weapon as keyof typeof WEAPON_SPECS];
    if (wSpec && wSpec.modelPath) {
      const gunEnt: RefEntity = {
        ...torsoEnt,
        hModel: wSpec.modelPath,
        axis: AxisClear(),
        oldframe: 0,
        frame: 0,
        backlerp: 0,
        customSkin: '',
      };
      positionRotatedEntityOnTag(gunEnt, torsoEnt, upperMd3, 'tag_weapon');
      this.renderer.addRefEntityToScene(gunEnt);

      if (params.muzzleFlashActive) {
        const wMd3 = this.renderer.registerModel(wSpec.modelPath);
        const flashEnt: RefEntity = {
          ...gunEnt,
          reType: RefEntityType.RT_SPRITE,
          customShader: 'flareShader',
          radius: 14,
          shaderRGBA: [
            (wSpec.color[0] * 255) | 0,
            (wSpec.color[1] * 255) | 0,
            (wSpec.color[2] * 255) | 0,
            255,
          ],
        };
        if (wMd3) {
          positionRotatedEntityOnTag(flashEnt, gunEnt, wMd3, 'tag_flash');
        }
        this.renderer.addRefEntityToScene(flashEnt);
        this.renderer.addLightToScene(
          flashEnt.origin,
          180,
          wSpec.color[0],
          wSpec.color[1],
          wSpec.color[2]
        );
      }
    }
  }
}

function AngleNormalize(a: number): number {
  let r = a % 360;
  if (r > 180) r -= 360;
  if (r < -180) r += 360;
  return r;
}
