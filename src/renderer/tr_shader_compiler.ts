// ============================================================================
// src/renderer/tr_shader_compiler.ts
// Quake III Arena WebGL2 GLSL ES 3.00 Multipass Shader Program & Stage Executor
// Evaluates WaveForms, tcGen, chained tcMod matrices, rgbGen, alphaGen,
// deformVertexes, alphaFunc, blendFunc, Dynamic Lights & Overbright Gamma
// ============================================================================

import { Cvars } from '../qcommon/cvar';
import { DEG2RAD, DynamicLight, Vec3 } from '../qcommon/q_shared';
import { DeformVertexesOp, Q3Shader, ShaderStage, TcModOp, WaveForm } from './tr_shader_parse';

/**
 * Evaluates a Quake III WaveForm at time `t` (in seconds)
 */
export function evalWaveForm(wave: WaveForm, t: number): number {
  const x = ((wave.phase + t * wave.freq) % 1.0 + 1.0) % 1.0;
  let y = 0;
  switch (wave.func) {
    case 'sin':
      y = Math.sin(x * Math.PI * 2.0);
      break;
    case 'triangle':
      y = x < 0.5 ? x * 4.0 - 1.0 : 3.0 - x * 4.0;
      break;
    case 'square':
      y = x < 0.5 ? 1.0 : -1.0;
      break;
    case 'sawtooth':
      y = x;
      break;
    case 'inversesawtooth':
      y = 1.0 - x;
      break;
    case 'noise':
      y = Math.sin(x * 37.0) * Math.cos(x * 91.0);
      break;
  }
  return wave.base + y * wave.amplitude;
}

/**
 * Computes the combined 3x2 affine UV matrix + turbulence parameters for a stage's tcMods
 */
export function computeTcModMatrix(
  tcMods: TcModOp[],
  timeSec: number,
  outMat6: Float32Array,
  outTurb4: Float32Array
): void {
  // Represent 2D affine UV transform:
  // u' = m00 * u + m10 * v + t0
  // v' = m01 * u + m11 * v + t1
  let m00 = 1, m01 = 0;
  let m10 = 0, m11 = 1;
  let t0 = 0, t1 = 0;

  outTurb4[0] = 0; // amp
  outTurb4[1] = 0; // phase
  outTurb4[2] = 0; // freq
  outTurb4[3] = 0; // active flag

  const concat = (b00: number, b01: number, b10: number, b11: number, bt0: number, bt1: number) => {
    const n00 = m00 * b00 + m01 * b10;
    const n01 = m00 * b01 + m01 * b11;
    const n10 = m10 * b00 + m11 * b10;
    const n11 = m10 * b01 + m11 * b11;
    const nt0 = t0 * b00 + t1 * b10 + bt0;
    const nt1 = t0 * b01 + t1 * b11 + bt1;
    m00 = n00; m01 = n01;
    m10 = n10; m11 = n11;
    t0 = nt0; t1 = nt1;
  };

  for (const mod of tcMods) {
    switch (mod.type) {
      case 'scroll': {
        const ds = (mod.sSpeed * timeSec) % 1.0;
        const dt = (mod.tSpeed * timeSec) % 1.0;
        concat(1, 0, 0, 1, ds, dt);
        break;
      }
      case 'scale': {
        concat(mod.sScale, 0, 0, mod.tScale, 0, 0);
        break;
      }
      case 'stretch': {
        const val = evalWaveForm(mod.wave, timeSec);
        const p = Math.abs(val) > 1e-4 ? 1.0 / val : 1.0;
        const off = 0.5 - 0.5 * p;
        concat(p, 0, 0, p, off, off);
        break;
      }
      case 'rotate': {
        const rad = -mod.degPerSec * timeSec * DEG2RAD;
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        concat(c, -s, s, c, 0.5 - 0.5 * c + 0.5 * s, 0.5 - 0.5 * s - 0.5 * c);
        break;
      }
      case 'transform': {
        concat(mod.m00, mod.m01, mod.m10, mod.m11, mod.t0, mod.t1);
        break;
      }
      case 'turb': {
        outTurb4[0] = mod.amplitude;
        outTurb4[1] = mod.phase;
        outTurb4[2] = mod.freq;
        outTurb4[3] = 1.0;
        break;
      }
    }
  }

  outMat6[0] = m00;
  outMat6[1] = m01;
  outMat6[2] = m10;
  outMat6[3] = m11;
  outMat6[4] = t0;
  outMat6[5] = t1;
}

export function mapGlBlendFactor(gl: WebGL2RenderingContext, factor: string): number {
  switch (factor.toUpperCase()) {
    case 'GL_ONE': return gl.ONE;
    case 'GL_ZERO': return gl.ZERO;
    case 'GL_DST_COLOR': return gl.DST_COLOR;
    case 'GL_ONE_MINUS_DST_COLOR': return gl.ONE_MINUS_DST_COLOR;
    case 'GL_SRC_ALPHA': return gl.SRC_ALPHA;
    case 'GL_ONE_MINUS_SRC_ALPHA': return gl.ONE_MINUS_SRC_ALPHA;
    case 'GL_DST_ALPHA': return gl.DST_ALPHA;
    case 'GL_ONE_MINUS_DST_ALPHA': return gl.ONE_MINUS_DST_ALPHA;
    case 'GL_SRC_COLOR': return gl.SRC_COLOR;
    case 'GL_ONE_MINUS_SRC_COLOR': return gl.ONE_MINUS_SRC_COLOR;
    default: return gl.ONE;
  }
}

const VERTEX_SHADER_SRC = `#version 300 es
precision highp float;

layout(location = 0) in vec3 a_pos0;
layout(location = 1) in vec2 a_st;
layout(location = 2) in vec2 a_lm;
layout(location = 3) in vec3 a_norm0;
layout(location = 4) in vec4 a_color;
layout(location = 5) in vec3 a_pos1;
layout(location = 6) in vec3 a_norm1;

uniform mat4 u_viewProjMatrix;
uniform mat4 u_modelMatrix;
uniform float u_morphLerp;       // 0.0 for static BSP, [0..1] for MD3 morphing
uniform float u_time;
uniform vec3 u_cameraPos;

// DeformVertexes wave uniform: x=spread, y=base, z=amp, w=freq (0 if inactive)
uniform vec4 u_deformWave;
uniform float u_deformPhase;

// Stage tcGen & tcMod uniforms
uniform int u_tcGenMode;         // 0=base, 1=lightmap, 2=environment
uniform float u_tcMat[6];        // [m00, m01, m10, m11, t0, t1]
uniform vec4 u_tcTurb;           // [amp, phase, freq, active]

out vec3 v_worldPos;
out vec3 v_worldNorm;
out vec2 v_uv;
out vec2 v_lmUv;
out vec4 v_vertColor;

void main() {
  vec3 localPos = mix(a_pos0, a_pos1, u_morphLerp);
  vec3 localNorm = normalize(mix(a_norm0, a_norm1, u_morphLerp));

  // Apply deformVertexes wave if active
  if (abs(u_deformWave.z) > 0.0001) {
    float off = (localPos.x + localPos.y + localPos.z) * u_deformWave.x;
    float w = u_deformWave.y + sin((u_deformPhase + u_time * u_deformWave.w + off) * 6.2831853) * u_deformWave.z;
    localPos += localNorm * w;
  }

  vec4 worldPos4 = u_modelMatrix * vec4(localPos, 1.0);
  v_worldPos = worldPos4.xyz;
  v_worldNorm = normalize(mat3(u_modelMatrix) * localNorm);
  v_vertColor = a_color;
  v_lmUv = a_lm;

  // Compute initial texture coordinates (tcGen)
  vec2 uv = a_st;
  if (u_tcGenMode == 1) {
    uv = a_lm;
  } else if (u_tcGenMode == 2) {
    // RB_CalcEnvironmentTexCoords
    vec3 viewer = normalize(u_cameraPos - v_worldPos);
    float d = dot(v_worldNorm, viewer);
    vec3 reflected = v_worldNorm * (2.0 * d) - viewer;
    uv = vec2(0.5 + reflected.y * 0.5, 0.5 - reflected.z * 0.5);
  }

  // Apply tcMod turbulence if active
  if (u_tcTurb.w > 0.5) {
    float now = u_tcTurb.y + u_time * u_tcTurb.z;
    uv.x += sin(((localPos.x + localPos.z) * 0.001 + now) * 6.2831853) * u_tcTurb.x;
    uv.y += sin((localPos.y * 0.001 + now) * 6.2831853) * u_tcTurb.x;
  }

  // Apply chained 3x2 affine tcMod matrix
  v_uv = vec2(
    uv.x * u_tcMat[0] + uv.y * u_tcMat[2] + u_tcMat[4],
    uv.x * u_tcMat[1] + uv.y * u_tcMat[3] + u_tcMat[5]
  );

  gl_Position = u_viewProjMatrix * worldPos4;
}
`;

const FRAGMENT_SHADER_SRC = `#version 300 es
precision highp float;

in vec3 v_worldPos;
in vec3 v_worldNorm;
in vec2 v_uv;
in vec2 v_lmUv;
in vec4 v_vertColor;

uniform sampler2D u_tex0;
uniform sampler2D u_lightmapTex;

uniform int u_combineLightmap;   // 1 = fast-path single-pass base * lightmap + dlights
uniform int u_rgbGenMode;        // 0=uniformColor, 1=vertex, 2=oneMinusVertex, 3=lightingDiffuse
uniform int u_alphaGenMode;      // 0=uniformAlpha, 1=vertex, 2=lightingSpecular, 3=portal
uniform vec4 u_stageColor;       // evaluated wave/entity/const RGBA
uniform float u_portalRange;
uniform int u_alphaFunc;         // 0=NONE, 1=GT0, 2=LT128, 3=GE128

// 3D Lightgrid uniforms for MD3 models
uniform vec3 u_lightAmbient;
uniform vec3 u_lightDirected;
uniform vec3 u_lightDir;
uniform vec3 u_cameraPos;

// Dynamic point lights (up to 16 active dlights)
uniform int u_numDlights;
uniform vec4 u_dlightPosRadius[16];
uniform vec3 u_dlightColor[16];

// Overbright & Gamma
uniform float u_overbright;
uniform float u_gamma;

out vec4 fragColor;

void main() {
  vec4 texSample = texture(u_tex0, v_uv);

  // Compute stage RGB
  vec3 rgb = u_stageColor.rgb;
  if (u_rgbGenMode == 1) {
    rgb = v_vertColor.rgb;
  } else if (u_rgbGenMode == 2) {
    rgb = vec3(1.0) - v_vertColor.rgb;
  } else if (u_rgbGenMode == 3) {
    float ndotl = max(0.0, dot(normalize(v_worldNorm), normalize(u_lightDir)));
    rgb = u_lightAmbient + u_lightDirected * ndotl;
  }

  // Compute stage Alpha
  float alpha = u_stageColor.a;
  if (u_alphaGenMode == 1) {
    alpha = v_vertColor.a;
  } else if (u_alphaGenMode == 2) {
    vec3 n = normalize(v_worldNorm);
    vec3 l = normalize(u_lightDir);
    vec3 v = normalize(u_cameraPos - v_worldPos);
    vec3 r = reflect(-l, n);
    alpha = pow(max(0.0, dot(r, v)), 4.0);
  } else if (u_alphaGenMode == 3) {
    float dist = length(v_worldPos - u_cameraPos);
    alpha = clamp(dist / max(1.0, u_portalRange), 0.0, 1.0);
  }

  vec4 color = vec4(texSample.rgb * rgb, texSample.a * alpha);

  // AlphaFunc discard (GT0, LT128, GE128)
  if (u_alphaFunc == 1 && color.a <= 0.0) discard;
  if (u_alphaFunc == 2 && color.a >= 0.5) discard;
  if (u_alphaFunc == 3 && color.a < 0.5) discard;

  // Single-pass Lightmap + Dynamic Light fast path
  if (u_combineLightmap == 1) {
    vec3 lm = texture(u_lightmapTex, v_lmUv).rgb * u_overbright;
    for (int i = 0; i < 16; i++) {
      if (i >= u_numDlights) break;
      vec3 dlPos = u_dlightPosRadius[i].xyz;
      float dlRad = u_dlightPosRadius[i].w;
      float dist = length(v_worldPos - dlPos);
      if (dist < dlRad) {
        float atten = (1.0 - dist / dlRad);
        lm += u_dlightColor[i] * (atten * atten * 1.6);
      }
    }
    color.rgb *= lm;
  } else if (u_rgbGenMode == 3 && u_numDlights > 0) {
    // Add dynamic lights to MD3 models
    vec3 dlAdd = vec3(0.0);
    for (int i = 0; i < 16; i++) {
      if (i >= u_numDlights) break;
      vec3 dlPos = u_dlightPosRadius[i].xyz;
      float dlRad = u_dlightPosRadius[i].w;
      float dist = length(v_worldPos - dlPos);
      if (dist < dlRad) {
        float atten = (1.0 - dist / dlRad);
        dlAdd += u_dlightColor[i] * (atten * 1.2);
      }
    }
    color.rgb += texSample.rgb * dlAdd;
  }

  // Apply gamma correction
  color.rgb = pow(max(color.rgb, vec3(0.0)), vec3(1.0 / max(0.5, u_gamma)));
  fragColor = color;
}
`;

export class MultipassShaderExecutor {
  private gl: WebGL2RenderingContext;
  public program: WebGLProgram;
  private locs: Record<string, WebGLUniformLocation | null> = {};
  private tcMatBuf = new Float32Array(6);
  private tcTurbBuf = new Float32Array(4);
  private dlightPosRadBuf = new Float32Array(16 * 4);
  private dlightColBuf = new Float32Array(16 * 3);

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.program = this.compileProgram(VERTEX_SHADER_SRC, FRAGMENT_SHADER_SRC);
    const uniformNames = [
      'u_viewProjMatrix',
      'u_modelMatrix',
      'u_morphLerp',
      'u_time',
      'u_cameraPos',
      'u_deformWave',
      'u_deformPhase',
      'u_tcGenMode',
      'u_tcMat',
      'u_tcTurb',
      'u_tex0',
      'u_lightmapTex',
      'u_combineLightmap',
      'u_rgbGenMode',
      'u_alphaGenMode',
      'u_stageColor',
      'u_portalRange',
      'u_alphaFunc',
      'u_lightAmbient',
      'u_lightDirected',
      'u_lightDir',
      'u_numDlights',
      'u_dlightPosRadius',
      'u_dlightColor',
      'u_overbright',
      'u_gamma',
    ];
    for (const name of uniformNames) {
      this.locs[name] = gl.getUniformLocation(this.program, name);
    }
  }

  public useAndSetFrameUniforms(
    viewProjMatrix: Float32Array,
    cameraPos: Vec3,
    timeSec: number,
    dlights: DynamicLight[]
  ): void {
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.uniformMatrix4fv(this.locs.u_viewProjMatrix, false, viewProjMatrix);
    gl.uniform3f(this.locs.u_cameraPos, cameraPos[0], cameraPos[1], cameraPos[2]);
    gl.uniform1f(this.locs.u_time, timeSec);
    gl.uniform1i(this.locs.u_tex0, 0);
    gl.uniform1i(this.locs.u_lightmapTex, 1);

    const overbright = Cvars.variableIntegerValue('r_fullbright')
      ? 2.0
      : 1.0 + Cvars.variableValue('r_overBrightBits') * 0.55;
    gl.uniform1f(this.locs.u_overbright, overbright);
    gl.uniform1f(this.locs.u_gamma, Cvars.variableValue('r_gamma') || 1.15);

    const numDl = Cvars.variableIntegerValue('r_dynamiclight') ? Math.min(16, dlights.length) : 0;
    gl.uniform1i(this.locs.u_numDlights, numDl);
    for (let i = 0; i < numDl; i++) {
      const dl = dlights[i];
      this.dlightPosRadBuf[i * 4 + 0] = dl.origin[0];
      this.dlightPosRadBuf[i * 4 + 1] = dl.origin[1];
      this.dlightPosRadBuf[i * 4 + 2] = dl.origin[2];
      this.dlightPosRadBuf[i * 4 + 3] = dl.radius;
      this.dlightColBuf[i * 3 + 0] = dl.color[0];
      this.dlightColBuf[i * 3 + 1] = dl.color[1];
      this.dlightColBuf[i * 3 + 2] = dl.color[2];
    }
    if (numDl > 0) {
      gl.uniform4fv(this.locs.u_dlightPosRadius, this.dlightPosRadBuf);
      gl.uniform3fv(this.locs.u_dlightColor, this.dlightColBuf);
    }
  }

  public setEntityTransformAndLighting(
    modelMatrix: Float32Array,
    morphLerp: number,
    ambient: Vec3,
    directed: Vec3,
    lightDir: Vec3
  ): void {
    const gl = this.gl;
    gl.uniformMatrix4fv(this.locs.u_modelMatrix, false, modelMatrix);
    gl.uniform1f(this.locs.u_morphLerp, morphLerp);
    gl.uniform3f(this.locs.u_lightAmbient, ambient[0], ambient[1], ambient[2]);
    gl.uniform3f(this.locs.u_lightDirected, directed[0], directed[1], directed[2]);
    gl.uniform3f(this.locs.u_lightDir, lightDir[0], lightDir[1], lightDir[2]);
  }

  public setDeformUniforms(deforms: DeformVertexesOp[]): void {
    const gl = this.gl;
    const waveDef = deforms.find((d) => d.type === 'wave') as
      | { type: 'wave'; spread: number; wave: WaveForm }
      | undefined;
    if (waveDef) {
      gl.uniform4f(
        this.locs.u_deformWave,
        waveDef.spread,
        waveDef.wave.base,
        waveDef.wave.amplitude,
        waveDef.wave.freq
      );
      gl.uniform1f(this.locs.u_deformPhase, waveDef.wave.phase);
    } else {
      gl.uniform4f(this.locs.u_deformWave, 0, 0, 0, 0);
      gl.uniform1f(this.locs.u_deformPhase, 0);
    }
  }

  /**
   * Checks if a 2-stage shader is eligible for single-pass Base+Lightmap combination
   */
  public canSinglePassLightmap(shader: Q3Shader): boolean {
    if (shader.stages.length !== 2) return false;
    const s0 = shader.stages[0];
    const s1 = shader.stages[1];
    if (
      !s0.hasBlend &&
      s0.map !== '$lightmap' &&
      s1.map.toLowerCase() === '$lightmap' &&
      s1.blendSrc === 'GL_DST_COLOR' &&
      s1.blendDst === 'GL_ZERO'
    ) {
      return true;
    }
    return false;
  }

  public bindStageState(
    stage: ShaderStage,
    shader: Q3Shader,
    timeSec: number,
    entityRGBA: [number, number, number, number],
    combineLightmap: boolean
  ): void {
    const gl = this.gl;

    // Culling
    if (shader.cull === 'none') {
      gl.disable(gl.CULL_FACE);
    } else {
      gl.enable(gl.CULL_FACE);
      // In Quake 3 BSPs, front faces have clockwise winding in OpenGL after coordinate flip
      gl.cullFace(shader.cull === 'front' ? gl.FRONT : gl.BACK);
    }

    // PolygonOffset (for decals/marks)
    if (shader.polygonOffset) {
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(-1.0, -2.0);
    } else {
      gl.disable(gl.POLYGON_OFFSET_FILL);
    }

    // Blending & Depth
    if (stage.hasBlend && !combineLightmap) {
      gl.enable(gl.BLEND);
      gl.blendFunc(
        mapGlBlendFactor(gl, stage.blendSrc),
        mapGlBlendFactor(gl, stage.blendDst)
      );
    } else {
      gl.disable(gl.BLEND);
    }

    gl.depthFunc(stage.depthFunc === 'equal' ? gl.EQUAL : gl.LEQUAL);
    gl.depthMask(stage.depthWrite);

    // tcGen & tcMod
    const tcGenInt = stage.tcGen === 'lightmap' ? 1 : stage.tcGen === 'environment' ? 2 : 0;
    gl.uniform1i(this.locs.u_tcGenMode, tcGenInt);
    computeTcModMatrix(stage.tcMods, timeSec, this.tcMatBuf, this.tcTurbBuf);
    gl.uniform1fv(this.locs.u_tcMat, this.tcMatBuf);
    gl.uniform4fv(this.locs.u_tcTurb, this.tcTurbBuf);

    // rgbGen & alphaGen
    let r = 1, g = 1, b = 1, a = 1;
    let rgbMode = 0;
    if (stage.rgbGen === 'vertex') {
      rgbMode = 1;
    } else if (stage.rgbGen === 'oneMinusVertex') {
      rgbMode = 2;
    } else if (stage.rgbGen === 'lightingDiffuse') {
      rgbMode = 3;
    } else if (stage.rgbGen === 'wave' && stage.rgbWave) {
      const w = Math.max(0, Math.min(1, evalWaveForm(stage.rgbWave, timeSec)));
      r = w; g = w; b = w;
    } else if (stage.rgbGen === 'entity') {
      r = entityRGBA[0] / 255;
      g = entityRGBA[1] / 255;
      b = entityRGBA[2] / 255;
    } else if (stage.rgbGen === 'oneMinusEntity') {
      r = 1 - entityRGBA[0] / 255;
      g = 1 - entityRGBA[1] / 255;
      b = 1 - entityRGBA[2] / 255;
    } else if (stage.rgbGen === 'const' && stage.rgbConst) {
      [r, g, b] = stage.rgbConst;
    }

    let alphaMode = 0;
    if (stage.alphaGen === 'vertex') {
      alphaMode = 1;
    } else if (stage.alphaGen === 'lightingSpecular') {
      alphaMode = 2;
    } else if (stage.alphaGen === 'portal') {
      alphaMode = 3;
      gl.uniform1f(this.locs.u_portalRange, stage.portalRange || 256);
    } else if (stage.alphaGen === 'wave' && stage.alphaWave) {
      a = Math.max(0, Math.min(1, evalWaveForm(stage.alphaWave, timeSec)));
    } else if (stage.alphaGen === 'entity') {
      a = entityRGBA[3] / 255;
    } else if (stage.alphaGen === 'const' && stage.alphaConst !== undefined) {
      a = stage.alphaConst;
    }

    gl.uniform1i(this.locs.u_rgbGenMode, rgbMode);
    gl.uniform1i(this.locs.u_alphaGenMode, alphaMode);
    gl.uniform4f(this.locs.u_stageColor, r, g, b, a);
    gl.uniform1i(this.locs.u_combineLightmap, combineLightmap ? 1 : 0);

    const afInt =
      stage.alphaFunc === 'GT0'
        ? 1
        : stage.alphaFunc === 'LT128'
        ? 2
        : stage.alphaFunc === 'GE128'
        ? 3
        : 0;
    gl.uniform1i(this.locs.u_alphaFunc, afInt);
  }

  private compileProgram(vsSrc: string, fsSrc: string): WebGLProgram {
    const gl = this.gl;
    const vs = this.compileShader(gl.VERTEX_SHADER, vsSrc);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSrc);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(`WebGL2 Program Link Error: ${gl.getProgramInfoLog(prog)}`);
    }
    return prog;
  }

  private compileShader(type: number, src: string): WebGLShader {
    const gl = this.gl;
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error(`WebGL2 Shader Compile Error: ${gl.getShaderInfoLog(sh)}`);
    }
    return sh;
  }
}
