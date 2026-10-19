// ============================================================================
// src/renderer/tr_shader_parse.ts
// Quake III Arena Multipass Shader Script Parser (scripts/*.shader)
// Parses all global & per-stage directives into Q3Shader AST definitions
// ============================================================================

import { Q3Tokenizer } from '../qcommon/cmd';
import { VFS } from '../qcommon/files';
import {
  CONTENTS_AREAPORTAL,
  CONTENTS_CLUSTERPORTAL,
  CONTENTS_DONOTENTER,
  CONTENTS_FOG,
  CONTENTS_LAVA,
  CONTENTS_ORIGIN,
  CONTENTS_PLAYERCLIP,
  CONTENTS_SLIME,
  CONTENTS_SOLID,
  CONTENTS_STRUCTURAL,
  CONTENTS_TRANSLUCENT,
  CONTENTS_WATER,
  SURF_ALPHASHADOW,
  SURF_FLESH,
  SURF_LADDER,
  SURF_METALSTEPS,
  SURF_NODAMAGE,
  SURF_NODLIGHT,
  SURF_NODRAW,
  SURF_NOIMPACT,
  SURF_NOLIGHTMAP,
  SURF_NOMARKS,
  SURF_NONSOLID,
  SURF_NOSTEPS,
  SURF_POINTLIGHT,
  SURF_SKY,
  SURF_SLICK,
  Vec3,
} from '../qcommon/q_shared';

export type WaveFuncName = 'sin' | 'triangle' | 'square' | 'sawtooth' | 'inversesawtooth' | 'noise';

export interface WaveForm {
  func: WaveFuncName;
  base: number;
  amplitude: number;
  phase: number;
  freq: number;
}

export type TcModOp =
  | { type: 'scroll'; sSpeed: number; tSpeed: number }
  | { type: 'scale'; sScale: number; tScale: number }
  | { type: 'rotate'; degPerSec: number }
  | { type: 'stretch'; wave: WaveForm }
  | { type: 'turb'; base: number; amplitude: number; phase: number; freq: number }
  | { type: 'transform'; m00: number; m01: number; m10: number; m11: number; t0: number; t1: number };

export type DeformVertexesOp =
  | { type: 'wave'; spread: number; wave: WaveForm }
  | { type: 'move'; dir: Vec3; wave: WaveForm }
  | { type: 'bulge'; width: number; height: number; speed: number }
  | { type: 'normal'; freq: number; amplitude: number }
  | { type: 'autosprite' }
  | { type: 'autosprite2' };

export interface ShaderStage {
  map: string; // '$lightmap', '$whiteimage', or texture path
  clamp: boolean;
  animFreq: number;
  animMaps: string[];
  blendSrc: string; // e.g., 'GL_ONE', 'GL_DST_COLOR', 'GL_SRC_ALPHA'
  blendDst: string; // e.g., 'GL_ZERO', 'GL_ONE', 'GL_ONE_MINUS_SRC_ALPHA'
  hasBlend: boolean;
  rgbGen: 'identity' | 'identityLighting' | 'vertex' | 'exactVertex' | 'oneMinusVertex' | 'entity' | 'oneMinusEntity' | 'lightingDiffuse' | 'wave' | 'const';
  rgbWave?: WaveForm;
  rgbConst?: Vec3;
  alphaGen: 'identity' | 'vertex' | 'oneMinusVertex' | 'entity' | 'oneMinusEntity' | 'lightingSpecular' | 'portal' | 'wave' | 'const';
  alphaWave?: WaveForm;
  alphaConst?: number;
  portalRange?: number;
  tcGen: 'base' | 'lightmap' | 'environment' | 'vector';
  tcGenVecS?: Vec3;
  tcGenVecT?: Vec3;
  tcMods: TcModOp[];
  depthFunc: 'lequal' | 'equal';
  depthWrite: boolean;
  depthWriteExplicit: boolean;
  alphaFunc: 'NONE' | 'GT0' | 'LT128' | 'GE128';
}

export interface Q3Shader {
  name: string;
  sort: number; // 1=portal, 2=sky, 3=opaque, 4=decal, 5=seeThrough, 6=banner, 8=underwater, 9=additive, 16=nearest
  cull: 'front' | 'back' | 'none';
  polygonOffset: boolean;
  surfaceFlags: number;
  contentFlags: number;
  isSky: boolean;
  skyParms?: { farbox: string; cloudHeight: number; nearbox: string };
  fogParms?: { color: Vec3; depthForOpaque: number };
  deforms: DeformVertexesOp[];
  stages: ShaderStage[];
}

export class ShaderRegistry {
  private shaders = new Map<string, Q3Shader>();

  public loadAllFromVFS(): number {
    this.shaders.clear();
    const shaderFiles = VFS.listFiles('scripts/', '.shader');
    for (const file of shaderFiles) {
      const text = VFS.readTextFile(file);
      if (text) {
        this.parseShaderFile(text);
      }
    }
    return this.shaders.size;
  }

  public parseShaderFile(text: string): void {
    const tk = new Q3Tokenizer(text);
    while (!tk.eof()) {
      const shaderName = tk.nextToken(true);
      if (!shaderName) break;
      const openBrace = tk.nextToken(true);
      if (openBrace !== '{') break;

      const shader = this.parseSingleShader(VFS.stripExtension(shaderName), tk);
      this.shaders.set(shader.name, shader);
    }
  }

  public getShader(rawName: string, hasLightmap = true): Q3Shader {
    const norm = VFS.stripExtension(rawName);
    const existing = this.shaders.get(norm);
    if (existing) return existing;

    // Synthesize default Quake 3 shader (Base Texture + Lightmap Filter stage if world surface)
    const def: Q3Shader = {
      name: norm,
      sort: 3, // SS_OPAQUE
      cull: 'front',
      polygonOffset: false,
      surfaceFlags: 0,
      contentFlags: CONTENTS_SOLID,
      isSky: norm.startsWith('skies/'),
      deforms: [],
      stages: [
        {
          map: norm,
          clamp: false,
          animFreq: 0,
          animMaps: [],
          blendSrc: 'GL_ONE',
          blendDst: 'GL_ZERO',
          hasBlend: false,
          rgbGen: hasLightmap ? 'identity' : 'lightingDiffuse',
          alphaGen: 'identity',
          tcGen: 'base',
          tcMods: [],
          depthFunc: 'lequal',
          depthWrite: true,
          depthWriteExplicit: false,
          alphaFunc: 'NONE',
        },
      ],
    };

    if (hasLightmap && !def.isSky) {
      def.stages.push({
        map: '$lightmap',
        clamp: true,
        animFreq: 0,
        animMaps: [],
        blendSrc: 'GL_DST_COLOR',
        blendDst: 'GL_ZERO',
        hasBlend: true,
        rgbGen: 'identity',
        alphaGen: 'identity',
        tcGen: 'lightmap',
        tcMods: [],
        depthFunc: 'lequal',
        depthWrite: false,
        depthWriteExplicit: false,
        alphaFunc: 'NONE',
      });
    }

    this.shaders.set(norm, def);
    return def;
  }

  private parseSingleShader(name: string, tk: Q3Tokenizer): Q3Shader {
    const shader: Q3Shader = {
      name,
      sort: 0,
      cull: 'front',
      polygonOffset: false,
      surfaceFlags: 0,
      contentFlags: CONTENTS_SOLID,
      isSky: false,
      deforms: [],
      stages: [],
    };

    while (!tk.eof()) {
      const tok = tk.nextToken(true);
      if (!tok || tok === '}') break;

      if (tok === '{') {
        const stage = this.parseStage(tk);
        if (stage) shader.stages.push(stage);
        continue;
      }

      const cmd = tok.toLowerCase();
      if (cmd === 'surfaceparm') {
        const parm = tk.nextToken(false).toLowerCase();
        this.applySurfaceParm(shader, parm);
      } else if (cmd === 'cull') {
        const c = tk.nextToken(false).toLowerCase();
        if (c === 'none' || c === 'twosided' || c === 'disable') shader.cull = 'none';
        else if (c === 'back' || c === 'backsided') shader.cull = 'back';
        else shader.cull = 'front';
      } else if (cmd === 'polygonoffset') {
        shader.polygonOffset = true;
      } else if (cmd === 'sort') {
        const s = tk.nextToken(false).toLowerCase();
        const sortMap: Record<string, number> = {
          portal: 1,
          sky: 2,
          opaque: 3,
          decal: 4,
          seethrough: 5,
          banner: 6,
          underwater: 8,
          additive: 9,
          nearest: 16,
        };
        shader.sort = sortMap[s] ?? (Number.parseFloat(s) || 3);
      } else if (cmd === 'skyparms') {
        const farbox = tk.nextToken(false);
        const cloudHeight = Number.parseFloat(tk.nextToken(false)) || 512;
        const nearbox = tk.nextToken(false);
        shader.isSky = true;
        shader.sort = 2;
        shader.skyParms = { farbox, cloudHeight, nearbox };
      } else if (cmd === 'fogparms') {
        let t = tk.nextToken(false);
        if (t === '(') t = tk.nextToken(false);
        const r = Number.parseFloat(t) || 0;
        const g = Number.parseFloat(tk.nextToken(false)) || 0;
        const b = Number.parseFloat(tk.nextToken(false)) || 0;
        let next = tk.nextToken(false);
        if (next === ')') next = tk.nextToken(false);
        const depth = Number.parseFloat(next) || 512;
        shader.fogParms = { color: [r, g, b], depthForOpaque: depth };
      } else if (cmd === 'deformvertexes') {
        const sub = tk.nextToken(false).toLowerCase();
        if (sub === 'autosprite') {
          shader.deforms.push({ type: 'autosprite' });
        } else if (sub === 'autosprite2') {
          shader.deforms.push({ type: 'autosprite2' });
        } else if (sub === 'wave') {
          const div = Number.parseFloat(tk.nextToken(false)) || 100;
          const wave = this.parseWaveForm(tk);
          shader.deforms.push({ type: 'wave', spread: 1.0 / div, wave });
        } else if (sub === 'move') {
          const dx = Number.parseFloat(tk.nextToken(false)) || 0;
          const dy = Number.parseFloat(tk.nextToken(false)) || 0;
          const dz = Number.parseFloat(tk.nextToken(false)) || 0;
          const wave = this.parseWaveForm(tk);
          shader.deforms.push({ type: 'move', dir: [dx, dy, dz], wave });
        } else if (sub === 'bulge') {
          const w = Number.parseFloat(tk.nextToken(false)) || 1;
          const h = Number.parseFloat(tk.nextToken(false)) || 1;
          const spd = Number.parseFloat(tk.nextToken(false)) || 1;
          shader.deforms.push({ type: 'bulge', width: w, height: h, speed: spd });
        } else if (sub === 'normal') {
          const freq = Number.parseFloat(tk.nextToken(false)) || 1;
          const amp = Number.parseFloat(tk.nextToken(false)) || 0.2;
          shader.deforms.push({ type: 'normal', freq, amplitude: amp });
        } else {
          tk.skipRestOfLine();
        }
      } else {
        tk.skipRestOfLine();
      }
    }

    // Determine automatic sort order if not explicitly specified
    if (shader.sort === 0) {
      if (shader.isSky) shader.sort = 2;
      else if (shader.polygonOffset) shader.sort = 4;
      else if (shader.stages.length > 0 && shader.stages[0].hasBlend) shader.sort = 9;
      else shader.sort = 3;
    }

    return shader;
  }

  private parseStage(tk: Q3Tokenizer): ShaderStage | null {
    const stage: ShaderStage = {
      map: '$whiteimage',
      clamp: false,
      animFreq: 0,
      animMaps: [],
      blendSrc: 'GL_ONE',
      blendDst: 'GL_ZERO',
      hasBlend: false,
      rgbGen: 'identity',
      alphaGen: 'identity',
      tcGen: 'base',
      tcMods: [],
      depthFunc: 'lequal',
      depthWrite: true,
      depthWriteExplicit: false,
      alphaFunc: 'NONE',
    };

    while (!tk.eof()) {
      const tok = tk.nextToken(true);
      if (!tok || tok === '}') break;
      const cmd = tok.toLowerCase();

      if (cmd === 'map' || cmd === 'clampmap') {
        stage.clamp = cmd === 'clampmap';
        stage.map = tk.nextToken(false);
        if (stage.map.toLowerCase() === '$lightmap') {
          stage.tcGen = 'lightmap';
        }
      } else if (cmd === 'animmap') {
        stage.animFreq = Number.parseFloat(tk.nextToken(false)) || 1;
        while (true) {
          const f = tk.nextToken(false);
          if (!f) break;
          stage.animMaps.push(f);
        }
        if (stage.animMaps.length > 0) stage.map = stage.animMaps[0];
      } else if (cmd === 'blendfunc') {
        const b1 = tk.nextToken(false).toUpperCase();
        if (b1 === 'ADD' || b1 === 'GL_ADD') {
          stage.blendSrc = 'GL_ONE';
          stage.blendDst = 'GL_ONE';
        } else if (b1 === 'FILTER') {
          stage.blendSrc = 'GL_DST_COLOR';
          stage.blendDst = 'GL_ZERO';
        } else if (b1 === 'BLEND') {
          stage.blendSrc = 'GL_SRC_ALPHA';
          stage.blendDst = 'GL_ONE_MINUS_SRC_ALPHA';
        } else {
          stage.blendSrc = b1;
          stage.blendDst = tk.nextToken(false).toUpperCase() || 'GL_ZERO';
        }
        stage.hasBlend = !(stage.blendSrc === 'GL_ONE' && stage.blendDst === 'GL_ZERO');
        if (stage.hasBlend && !stage.depthWriteExplicit) {
          stage.depthWrite = false;
        }
      } else if (cmd === 'rgbgen') {
        const mode = tk.nextToken(false).toLowerCase();
        if (mode === 'wave') {
          stage.rgbGen = 'wave';
          stage.rgbWave = this.parseWaveForm(tk);
        } else if (mode === 'const') {
          stage.rgbGen = 'const';
          let t = tk.nextToken(false);
          if (t === '(') t = tk.nextToken(false);
          const r = Number.parseFloat(t) || 1;
          const g = Number.parseFloat(tk.nextToken(false)) || 1;
          const b = Number.parseFloat(tk.nextToken(false)) || 1;
          tk.skipRestOfLine();
          stage.rgbConst = [r, g, b];
        } else if (mode === 'lightingdiffuse') {
          stage.rgbGen = 'lightingDiffuse';
        } else if (mode === 'vertex' || mode === 'exactvertex') {
          stage.rgbGen = 'vertex';
        } else if (mode === 'oneminusvertex') {
          stage.rgbGen = 'oneMinusVertex';
        } else if (mode === 'entity') {
          stage.rgbGen = 'entity';
        } else if (mode === 'oneminusentity') {
          stage.rgbGen = 'oneMinusEntity';
        } else {
          stage.rgbGen = 'identity';
        }
      } else if (cmd === 'alphagen') {
        const mode = tk.nextToken(false).toLowerCase();
        if (mode === 'wave') {
          stage.alphaGen = 'wave';
          stage.alphaWave = this.parseWaveForm(tk);
        } else if (mode === 'const') {
          stage.alphaGen = 'const';
          stage.alphaConst = Number.parseFloat(tk.nextToken(false)) ?? 1.0;
        } else if (mode === 'lightingspecular') {
          stage.alphaGen = 'lightingSpecular';
        } else if (mode === 'portal') {
          stage.alphaGen = 'portal';
          stage.portalRange = Number.parseFloat(tk.nextToken(false)) || 256;
        } else if (mode === 'vertex') {
          stage.alphaGen = 'vertex';
        } else if (mode === 'entity') {
          stage.alphaGen = 'entity';
        } else {
          stage.alphaGen = 'identity';
        }
      } else if (cmd === 'tcgen' || cmd === 'texgen') {
        const mode = tk.nextToken(false).toLowerCase();
        if (mode === 'environment') stage.tcGen = 'environment';
        else if (mode === 'lightmap') stage.tcGen = 'lightmap';
        else if (mode === 'vector') {
          stage.tcGen = 'vector';
          tk.skipRestOfLine();
        } else stage.tcGen = 'base';
      } else if (cmd === 'tcmod') {
        const op = tk.nextToken(false).toLowerCase();
        if (op === 'scroll') {
          const s = Number.parseFloat(tk.nextToken(false)) || 0;
          const t = Number.parseFloat(tk.nextToken(false)) || 0;
          stage.tcMods.push({ type: 'scroll', sSpeed: s, tSpeed: t });
        } else if (op === 'scale') {
          const s = Number.parseFloat(tk.nextToken(false)) || 1;
          const t = Number.parseFloat(tk.nextToken(false)) || 1;
          stage.tcMods.push({ type: 'scale', sScale: s, tScale: t });
        } else if (op === 'rotate') {
          const deg = Number.parseFloat(tk.nextToken(false)) || 0;
          stage.tcMods.push({ type: 'rotate', degPerSec: deg });
        } else if (op === 'stretch') {
          stage.tcMods.push({ type: 'stretch', wave: this.parseWaveForm(tk) });
        } else if (op === 'turb') {
          const base = Number.parseFloat(tk.nextToken(false)) || 0;
          const amp = Number.parseFloat(tk.nextToken(false)) || 0.1;
          const phase = Number.parseFloat(tk.nextToken(false)) || 0;
          const freq = Number.parseFloat(tk.nextToken(false)) || 1;
          stage.tcMods.push({ type: 'turb', base, amplitude: amp, phase, freq });
        } else if (op === 'transform') {
          const m00 = Number.parseFloat(tk.nextToken(false)) || 1;
          const m01 = Number.parseFloat(tk.nextToken(false)) || 0;
          const m10 = Number.parseFloat(tk.nextToken(false)) || 0;
          const m11 = Number.parseFloat(tk.nextToken(false)) || 1;
          const t0 = Number.parseFloat(tk.nextToken(false)) || 0;
          const t1 = Number.parseFloat(tk.nextToken(false)) || 0;
          stage.tcMods.push({ type: 'transform', m00, m01, m10, m11, t0, t1 });
        } else {
          tk.skipRestOfLine();
        }
      } else if (cmd === 'depthfunc') {
        const df = tk.nextToken(false).toLowerCase();
        stage.depthFunc = df === 'equal' ? 'equal' : 'lequal';
      } else if (cmd === 'depthwrite') {
        stage.depthWrite = true;
        stage.depthWriteExplicit = true;
      } else if (cmd === 'alphafunc') {
        const af = tk.nextToken(false).toUpperCase();
        if (af === 'GT0' || af === 'LT128' || af === 'GE128') {
          stage.alphaFunc = af;
        }
      } else {
        tk.skipRestOfLine();
      }
    }

    return stage;
  }

  private parseWaveForm(tk: Q3Tokenizer): WaveForm {
    const fnRaw = tk.nextToken(false).toLowerCase();
    let func: WaveFuncName = 'sin';
    if (
      fnRaw === 'triangle' ||
      fnRaw === 'square' ||
      fnRaw === 'sawtooth' ||
      fnRaw === 'inversesawtooth' ||
      fnRaw === 'noise'
    ) {
      func = fnRaw;
    }
    const base = Number.parseFloat(tk.nextToken(false)) || 0;
    const amplitude = Number.parseFloat(tk.nextToken(false)) || 0;
    const phase = Number.parseFloat(tk.nextToken(false)) || 0;
    const freq = Number.parseFloat(tk.nextToken(false)) || 1;
    return { func, base, amplitude, phase, freq };
  }

  private applySurfaceParm(shader: Q3Shader, parm: string): void {
    switch (parm) {
      case 'sky':
        shader.surfaceFlags |= SURF_SKY;
        shader.isSky = true;
        break;
      case 'slick':
        shader.surfaceFlags |= SURF_SLICK;
        break;
      case 'nodamage':
        shader.surfaceFlags |= SURF_NODAMAGE;
        break;
      case 'noimpact':
        shader.surfaceFlags |= SURF_NOIMPACT;
        break;
      case 'nomarks':
        shader.surfaceFlags |= SURF_NOMARKS;
        break;
      case 'ladder':
        shader.surfaceFlags |= SURF_LADDER;
        break;
      case 'flesh':
        shader.surfaceFlags |= SURF_FLESH;
        break;
      case 'metalsteps':
        shader.surfaceFlags |= SURF_METALSTEPS;
        break;
      case 'nosteps':
        shader.surfaceFlags |= SURF_NOSTEPS;
        break;
      case 'nodraw':
        shader.surfaceFlags |= SURF_NODRAW;
        break;
      case 'nolightmap':
        shader.surfaceFlags |= SURF_NOLIGHTMAP;
        break;
      case 'pointlight':
        shader.surfaceFlags |= SURF_POINTLIGHT;
        break;
      case 'nonsolid':
        shader.surfaceFlags |= SURF_NONSOLID;
        shader.contentFlags &= ~CONTENTS_SOLID;
        break;
      case 'alphashadow':
        shader.surfaceFlags |= SURF_ALPHASHADOW;
        break;
      case 'nodlight':
        shader.surfaceFlags |= SURF_NODLIGHT;
        break;
      case 'lava':
        shader.contentFlags = CONTENTS_LAVA;
        break;
      case 'slime':
        shader.contentFlags = CONTENTS_SLIME;
        break;
      case 'water':
        shader.contentFlags = CONTENTS_WATER;
        break;
      case 'fog':
        shader.contentFlags = CONTENTS_FOG;
        break;
      case 'trans':
        shader.contentFlags |= CONTENTS_TRANSLUCENT;
        break;
      case 'areaportal':
        shader.contentFlags |= CONTENTS_AREAPORTAL;
        break;
      case 'clusterportal':
        shader.contentFlags |= CONTENTS_CLUSTERPORTAL;
        break;
      case 'donotenter':
        shader.contentFlags |= CONTENTS_DONOTENTER;
        break;
      case 'playerclip':
        shader.contentFlags |= CONTENTS_PLAYERCLIP;
        break;
      case 'origin':
        shader.contentFlags |= CONTENTS_ORIGIN;
        break;
      case 'structural':
        shader.contentFlags |= CONTENTS_STRUCTURAL;
        break;
    }
  }
}

export const Shaders = new ShaderRegistry();
