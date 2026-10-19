// ============================================================================
// src/renderer/tr_curve.ts
// Quake III Arena Biquadratic Bezier Patch Tessellator (MST_PATCH = 2)
// Evaluates 3x3 Bernstein basis polynomials for Position, ST, Lightmap,
// Normal, and Vertex Color
// ============================================================================

import { Vec2, Vec3, vec3Normalize } from '../qcommon/q_shared';

export interface BspDrawVert {
  xyz: Vec3;
  st: Vec2;
  lightmap: Vec2;
  normal: Vec3;
  color: [number, number, number, number]; // 0..255 RGBA
}

export interface TessellatedPatch {
  verts: BspDrawVert[];
  indexes: number[];
}

/**
 * Tessellates a Quake III biquadratic Bezier patch of grid dimensions (patchWidth x patchHeight)
 * into triangles with subdivision level `steps` per 3x3 sub-patch.
 */
export function tessellateBezierPatch(
  controlVerts: BspDrawVert[],
  patchWidth: number,
  patchHeight: number,
  steps = 6
): TessellatedPatch {
  const numPatchesX = Math.floor((patchWidth - 1) / 2);
  const numPatchesY = Math.floor((patchHeight - 1) / 2);

  const outVerts: BspDrawVert[] = [];
  const outIndexes: number[] = [];

  for (let py = 0; py < numPatchesY; py++) {
    for (let px = 0; px < numPatchesX; px++) {
      const baseVertOffset = outVerts.length;
      const stride = steps + 1;

      // Extract 3x3 control grid for this sub-patch
      const cp: BspDrawVert[][] = [[], [], []];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const idx = (py * 2 + r) * patchWidth + (px * 2 + c);
          cp[r][c] = controlVerts[idx];
        }
      }

      for (let iy = 0; iy <= steps; iy++) {
        const v = iy / steps;
        const bv0 = (1 - v) * (1 - v);
        const bv1 = 2 * v * (1 - v);
        const bv2 = v * v;

        for (let ix = 0; ix <= steps; ix++) {
          const u = ix / steps;
          const bu0 = (1 - u) * (1 - u);
          const bu1 = 2 * u * (1 - u);
          const bu2 = u * u;

          const bw = [
            [bv0 * bu0, bv0 * bu1, bv0 * bu2],
            [bv1 * bu0, bv1 * bu1, bv1 * bu2],
            [bv2 * bu0, bv2 * bu1, bv2 * bu2],
          ];

          const xyz: Vec3 = [0, 0, 0];
          const st: Vec2 = [0, 0];
          const lm: Vec2 = [0, 0];
          const norm: Vec3 = [0, 0, 0];
          const col = [0, 0, 0, 0];

          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const w = bw[r][c];
              const pt = cp[r][c];
              xyz[0] += pt.xyz[0] * w;
              xyz[1] += pt.xyz[1] * w;
              xyz[2] += pt.xyz[2] * w;
              st[0] += pt.st[0] * w;
              st[1] += pt.st[1] * w;
              lm[0] += pt.lightmap[0] * w;
              lm[1] += pt.lightmap[1] * w;
              norm[0] += pt.normal[0] * w;
              norm[1] += pt.normal[1] * w;
              norm[2] += pt.normal[2] * w;
              col[0] += pt.color[0] * w;
              col[1] += pt.color[1] * w;
              col[2] += pt.color[2] * w;
              col[3] += pt.color[3] * w;
            }
          }

          vec3Normalize(norm);
          outVerts.push({
            xyz,
            st,
            lightmap: lm,
            normal: norm,
            color: [
              Math.round(col[0]),
              Math.round(col[1]),
              Math.round(col[2]),
              Math.round(col[3]),
            ],
          });
        }
      }

      for (let iy = 0; iy < steps; iy++) {
        for (let ix = 0; ix < steps; ix++) {
          const i00 = baseVertOffset + iy * stride + ix;
          const i10 = i00 + 1;
          const i01 = i00 + stride;
          const i11 = i01 + 1;
          outIndexes.push(i00, i01, i10, i10, i01, i11);
        }
      }
    }
  }

  return { verts: outVerts, indexes: outIndexes };
}
