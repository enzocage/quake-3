// ============================================================================
// src/renderer/tr_model.ts
// Quake III Arena .MD3 (IDP3 v15) Binary Parser, 16-bit Spherical Normal LUT,
// .skin File Parser, R_LerpTag Tag-Rigging & GPU Vertex Morphing
// ============================================================================

import {
  AxisClear,
  Mat3,
  MatrixMultiply3x3,
  RefEntity,
  Vec2,
  Vec3,
  vec3Lerp,
  vec3MA,
  vec3Normalize,
} from '../qcommon/q_shared';
import { VFS } from '../qcommon/files';

export const MD3_VERSION = 15;
export const MD3_XYZ_SCALE = 1.0 / 64.0;

// Precompute 65,536-entry Spherical Normal Lookup Table (lat/lng -> unit Vec3)
const NORMAL_LUT = new Float32Array(65536 * 3);
(function initNormalLut() {
  for (let i = 0; i < 65536; i++) {
    const lat = (((i >> 8) & 0xff) * Math.PI * 2.0) / 255.0;
    const lng = ((i & 0xff) * Math.PI * 2.0) / 255.0;
    NORMAL_LUT[i * 3 + 0] = Math.cos(lat) * Math.sin(lng);
    NORMAL_LUT[i * 3 + 1] = Math.sin(lat) * Math.sin(lng);
    NORMAL_LUT[i * 3 + 2] = Math.cos(lng);
  }
})();

export interface Md3Frame {
  bounds: [Vec3, Vec3];
  localOrigin: Vec3;
  radius: number;
  name: string;
}

export interface Md3Tag {
  name: string;
  origin: Vec3;
  axis: Mat3;
}

export interface Md3SurfaceGpu {
  name: string;
  shaders: string[];
  numFrames: number;
  numVerts: number;
  numTriangles: number;
  vao: WebGLVertexArrayObject;
  vboDynamic: WebGLBuffer;
  ibo: WebGLBuffer;
  stData: Float32Array;
  framesPosNorm: Array<{ pos: Float32Array; norm: Float32Array }>;
  interleavedScratch: Float32Array; // 14 floats per vertex matching BSP layout + morph target
}

export class Md3Model {
  public name: string;
  public numFrames: number;
  public numTags: number;
  public frames: Md3Frame[] = [];
  public tagsByFrame: Md3Tag[][] = [];
  public surfaces: Md3SurfaceGpu[] = [];

  constructor(gl: WebGL2RenderingContext, buffer: Uint8Array, fallbackName = '') {
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const readAscii = (ofs: number, maxLen: number): string => {
      let s = '';
      for (let i = 0; i < maxLen; i++) {
        const c = view.getUint8(ofs + i);
        if (c === 0) break;
        s += String.fromCharCode(c);
      }
      return s;
    };

    const ident = readAscii(0, 4);
    const version = view.getInt32(4, true);
    if (ident !== 'IDP3' || version !== MD3_VERSION) {
      throw new Error(`Invalid MD3 header: ident=${ident}, version=${version}`);
    }

    this.name = readAscii(8, 64) || fallbackName;
    this.numFrames = view.getInt32(76, true);
    this.numTags = view.getInt32(80, true);
    const numSurfaces = view.getInt32(84, true);
    const ofsFrames = view.getInt32(92, true);
    const ofsTags = view.getInt32(96, true);
    let ofsSurfaces = view.getInt32(100, true);

    // 1. Parse Frames (56 bytes each)
    for (let f = 0; f < this.numFrames; f++) {
      const b = ofsFrames + f * 56;
      this.frames.push({
        bounds: [
          [view.getFloat32(b + 0, true), view.getFloat32(b + 4, true), view.getFloat32(b + 8, true)],
          [view.getFloat32(b + 12, true), view.getFloat32(b + 16, true), view.getFloat32(b + 20, true)],
        ],
        localOrigin: [
          view.getFloat32(b + 24, true),
          view.getFloat32(b + 28, true),
          view.getFloat32(b + 32, true),
        ],
        radius: view.getFloat32(b + 36, true),
        name: readAscii(b + 40, 16),
      });
    }

    // 2. Parse Tags (112 bytes each)
    for (let f = 0; f < this.numFrames; f++) {
      const frameTags: Md3Tag[] = [];
      for (let t = 0; t < this.numTags; t++) {
        const b = ofsTags + (f * this.numTags + t) * 112;
        const name = readAscii(b, 64).toLowerCase();
        const origin: Vec3 = [
          view.getFloat32(b + 64, true),
          view.getFloat32(b + 68, true),
          view.getFloat32(b + 72, true),
        ];
        const axis: Mat3 = [
          [view.getFloat32(b + 76, true), view.getFloat32(b + 80, true), view.getFloat32(b + 84, true)],
          [view.getFloat32(b + 88, true), view.getFloat32(b + 92, true), view.getFloat32(b + 96, true)],
          [view.getFloat32(b + 100, true), view.getFloat32(b + 104, true), view.getFloat32(b + 108, true)],
        ];
        frameTags.push({ name, origin, axis });
      }
      this.tagsByFrame.push(frameTags);
    }

    // 3. Parse Surfaces
    for (let s = 0; s < numSurfaces; s++) {
      const sb = ofsSurfaces;
      const surfName = readAscii(sb + 4, 64).toLowerCase();
      const sNumFrames = view.getInt32(sb + 72, true);
      const sNumShaders = view.getInt32(sb + 76, true);
      const sNumVerts = view.getInt32(sb + 80, true);
      const sNumTris = view.getInt32(sb + 84, true);

      const relTris = view.getInt32(sb + 88, true);
      const relShaders = view.getInt32(sb + 92, true);
      const relSt = view.getInt32(sb + 96, true);
      const relXyz = view.getInt32(sb + 100, true);
      const relEnd = view.getInt32(sb + 104, true);

      const shaders: string[] = [];
      for (let sh = 0; sh < sNumShaders; sh++) {
        shaders.push(readAscii(sb + relShaders + sh * 68, 64));
      }

      const indexData = new Uint32Array(sNumTris * 3);
      for (let tr = 0; tr < sNumTris; tr++) {
        const tb = sb + relTris + tr * 12;
        indexData[tr * 3 + 0] = view.getInt32(tb + 0, true);
        indexData[tr * 3 + 1] = view.getInt32(tb + 4, true);
        indexData[tr * 3 + 2] = view.getInt32(tb + 8, true);
      }

      const stData = new Float32Array(sNumVerts * 2);
      for (let v = 0; v < sNumVerts; v++) {
        const stb = sb + relSt + v * 8;
        stData[v * 2 + 0] = view.getFloat32(stb + 0, true);
        stData[v * 2 + 1] = view.getFloat32(stb + 4, true);
      }

      const framesPosNorm: Array<{ pos: Float32Array; norm: Float32Array }> = [];
      for (let f = 0; f < sNumFrames; f++) {
        const pos = new Float32Array(sNumVerts * 3);
        const norm = new Float32Array(sNumVerts * 3);
        for (let v = 0; v < sNumVerts; v++) {
          const vb = sb + relXyz + (f * sNumVerts + v) * 8;
          pos[v * 3 + 0] = view.getInt16(vb + 0, true) * MD3_XYZ_SCALE;
          pos[v * 3 + 1] = view.getInt16(vb + 2, true) * MD3_XYZ_SCALE;
          pos[v * 3 + 2] = view.getInt16(vb + 4, true) * MD3_XYZ_SCALE;

          const normCode = view.getUint16(vb + 6, true);
          norm[v * 3 + 0] = NORMAL_LUT[normCode * 3 + 0];
          norm[v * 3 + 1] = NORMAL_LUT[normCode * 3 + 1];
          norm[v * 3 + 2] = NORMAL_LUT[normCode * 3 + 2];
        }
        framesPosNorm.push({ pos, norm });
      }

      // Build WebGL2 VAO (20 floats per vertex: pos0(3), st(2), lm(2), norm0(3), rgba(4), pos1(3), norm1(3))
      const vao = gl.createVertexArray()!;
      const vboDynamic = gl.createBuffer()!;
      const ibo = gl.createBuffer()!;
      const interleavedScratch = new Float32Array(sNumVerts * 20);

      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, vboDynamic);
      gl.bufferData(gl.ARRAY_BUFFER, interleavedScratch.byteLength, gl.DYNAMIC_DRAW);

      const stride = 20 * 4;
      // 0: a_pos0 (3)
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
      // 1: a_st (2)
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 3 * 4);
      // 2: a_lm (2)
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, 5 * 4);
      // 3: a_norm0 (3)
      gl.enableVertexAttribArray(3);
      gl.vertexAttribPointer(3, 3, gl.FLOAT, false, stride, 7 * 4);
      // 4: a_color (4)
      gl.enableVertexAttribArray(4);
      gl.vertexAttribPointer(4, 4, gl.FLOAT, false, stride, 10 * 4);
      // 5: a_pos1 (3)
      gl.enableVertexAttribArray(5);
      gl.vertexAttribPointer(5, 3, gl.FLOAT, false, stride, 14 * 4);
      // 6: a_norm1 (3)
      gl.enableVertexAttribArray(6);
      gl.vertexAttribPointer(6, 3, gl.FLOAT, false, stride, 17 * 4);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);
      gl.bindVertexArray(null);

      this.surfaces.push({
        name: surfName,
        shaders,
        numFrames: sNumFrames,
        numVerts: sNumVerts,
        numTriangles: sNumTris,
        vao,
        vboDynamic,
        ibo,
        stData,
        framesPosNorm,
        interleavedScratch,
      });

      ofsSurfaces += relEnd;
    }
  }

  /**
   * Interpolates a named tag (`tag_torso`, `tag_head`, `tag_weapon`, `tag_flash`)
   * between `startFrame` and `endFrame` by `frac = 1.0 - backlerp` (R_LerpTag in tr_model.c)
   */
  public lerpTag(tagName: string, startFrame: number, endFrame: number, frac: number): Md3Tag | null {
    if (this.numTags === 0 || this.tagsByFrame.length === 0) return null;
    const f0 = Math.max(0, Math.min(this.numFrames - 1, startFrame));
    const f1 = Math.max(0, Math.min(this.numFrames - 1, endFrame));
    const key = tagName.toLowerCase();

    const startTag = this.tagsByFrame[f0].find((t) => t.name === key);
    const endTag = this.tagsByFrame[f1].find((t) => t.name === key);
    if (!startTag || !endTag) return null;

    const origin = vec3Lerp(startTag.origin, endTag.origin, frac);
    const axis: Mat3 = AxisClear();
    for (let i = 0; i < 3; i++) {
      vec3Lerp(startTag.axis[i], endTag.axis[i], frac, axis[i]);
      vec3Normalize(axis[i]);
    }
    return { name: key, origin, axis };
  }
}

/**
 * Positions and rotates `entity` onto `parent`'s `tagName` attachment point
 * Matches CG_PositionRotatedEntityOnTag in cg_ents.c!
 */
export function positionRotatedEntityOnTag(
  entity: RefEntity,
  parent: RefEntity,
  parentModel: Md3Model,
  tagName: string
): boolean {
  const lerped = parentModel.lerpTag(
    tagName,
    parent.oldframe,
    parent.frame,
    1.0 - parent.backlerp
  );
  if (!lerped) return false;

  // entity.origin = parent.origin + sum(lerped.origin[i] * parent.axis[i])
  entity.origin[0] = parent.origin[0];
  entity.origin[1] = parent.origin[1];
  entity.origin[2] = parent.origin[2];
  for (let i = 0; i < 3; i++) {
    vec3MA(entity.origin, lerped.origin[i], parent.axis[i], entity.origin);
  }

  // tempAxis = entity.axis * lerped.axis; entity.axis = tempAxis * parent.axis
  const tempAxis: Mat3 = AxisClear();
  MatrixMultiply3x3(entity.axis, lerped.axis, tempAxis);
  MatrixMultiply3x3(tempAxis, parent.axis, entity.axis);
  return true;
}

/**
 * Parses a Quake III .skin file (e.g. "u_torso,models/players/sarge/upper")
 */
export function parseSkinFile(skinPath: string): Map<string, string> {
  const map = new Map<string, string>();
  const text = VFS.readTextFile(skinPath);
  if (!text) return map;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) continue;
    const comma = trimmed.indexOf(',');
    if (comma > 0) {
      const surf = trimmed.slice(0, comma).trim().toLowerCase();
      const shader = trimmed.slice(comma + 1).trim();
      if (surf && shader && !surf.startsWith('tag_')) {
        map.set(surf, shader);
      }
    }
  }
  return map;
}
