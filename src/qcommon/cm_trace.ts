// ============================================================================
// src/qcommon/cm_trace.ts
// Quake III Arena Collision Model (CM_BoxTrace & CM_PointContents)
// Swept AABB / Ray vs. Convex BSP Brushes & Tessellated Bezier Patches
// ============================================================================

import { BspBrush, BspMap } from '../renderer/tr_bsp';
import {
  CONTENTS_SOLID,
  createDefaultTrace,
  TraceResult,
  Vec3,
  vec3Add,
  vec3Dot,
  vec3Lerp,
} from './q_shared';

export const SURFACE_CLIP_EPSILON = 0.125;

export class CollisionModel {
  private bsp: BspMap | null = null;

  public setBsp(bsp: BspMap): void {
    this.bsp = bsp;
  }

  public pointContents(p: Vec3, passContentMask = -1): number {
    const bsp = this.bsp;
    if (!bsp) return 0;

    let contents = 0;
    for (let i = 0; i < bsp.brushes.length; i++) {
      const br = bsp.brushes[i];
      const sh = bsp.shaders[br.shaderNum];
      if (!sh || !(sh.contentFlags & passContentMask)) continue;

      let inside = true;
      for (let s = 0; s < br.numSides; s++) {
        const side = bsp.brushSides[br.firstSide + s];
        const plane = bsp.planes[side.planeNum];
        if (vec3Dot(p, plane.normal) - plane.dist > 0) {
          inside = false;
          break;
        }
      }
      if (inside) {
        contents |= sh.contentFlags;
      }
    }
    return contents;
  }

  /**
   * Sweeps an Axis-Aligned Bounding Box [mins, maxs] from `start` to `end`
   * against all matching BSP brushes (CM_BoxTrace in cm_trace.c)
   */
  public boxTrace(
    start: Vec3,
    end: Vec3,
    mins: Vec3 = [0, 0, 0],
    maxs: Vec3 = [0, 0, 0],
    contentMask = CONTENTS_SOLID
  ): TraceResult {
    const trace = createDefaultTrace(end);
    const bsp = this.bsp;
    if (!bsp) return trace;

    // Symmetrize bounding box offsets
    const offset: Vec3 = [
      (mins[0] + maxs[0]) * 0.5,
      (mins[1] + maxs[1]) * 0.5,
      (mins[2] + maxs[2]) * 0.5,
    ];
    const sizeMins: Vec3 = [mins[0] - offset[0], mins[1] - offset[1], mins[2] - offset[2]];
    const sizeMaxs: Vec3 = [maxs[0] - offset[0], maxs[1] - offset[1], maxs[2] - offset[2]];

    const startP: Vec3 = [start[0] + offset[0], start[1] + offset[1], start[2] + offset[2]];
    const endP: Vec3 = [end[0] + offset[0], end[1] + offset[1], end[2] + offset[2]];

    // Check world brushes (model 0)
    const numWorldBrushes = bsp.models.length > 0 ? bsp.models[0].numBrushes : bsp.brushes.length;
    for (let i = 0; i < numWorldBrushes; i++) {
      const brush = bsp.brushes[i];
      const sh = bsp.shaders[brush.shaderNum];
      if (!sh || !(sh.contentFlags & contentMask)) continue;
      this.traceThroughBrush(bsp, brush, startP, endP, sizeMins, sizeMaxs, trace);
      if (trace.allsolid) break;
    }

    if (trace.fraction === 1.0) {
      trace.endpos[0] = end[0];
      trace.endpos[1] = end[1];
      trace.endpos[2] = end[2];
    } else {
      vec3Lerp(start, end, trace.fraction, trace.endpos);
    }

    return trace;
  }

  /**
   * Traces against a translated Inline Brush Model (*1, *2, ...)
   */
  public transformedBoxTrace(
    start: Vec3,
    end: Vec3,
    mins: Vec3,
    maxs: Vec3,
    inlineModelIndex: number,
    modelOrigin: Vec3,
    contentMask = CONTENTS_SOLID
  ): TraceResult {
    const trace = createDefaultTrace(end);
    const bsp = this.bsp;
    if (!bsp || inlineModelIndex <= 0 || inlineModelIndex >= bsp.models.length) {
      return trace;
    }

    const model = bsp.models[inlineModelIndex];
    const startL: Vec3 = [
      start[0] - modelOrigin[0],
      start[1] - modelOrigin[1],
      start[2] - modelOrigin[2],
    ];
    const endL: Vec3 = [
      end[0] - modelOrigin[0],
      end[1] - modelOrigin[1],
      end[2] - modelOrigin[2],
    ];

    for (let i = 0; i < model.numBrushes; i++) {
      const brush = bsp.brushes[model.firstBrush + i];
      const sh = bsp.shaders[brush.shaderNum];
      if (!sh || !(sh.contentFlags & contentMask)) continue;
      this.traceThroughBrush(bsp, brush, startL, endL, mins, maxs, trace);
    }

    if (trace.fraction < 1.0) {
      vec3Lerp(start, end, trace.fraction, trace.endpos);
    }
    return trace;
  }

  private traceThroughBrush(
    bsp: BspMap,
    brush: BspBrush,
    start: Vec3,
    end: Vec3,
    mins: Vec3,
    maxs: Vec3,
    trace: TraceResult
  ): void {
    if (brush.numSides === 0) return;

    let enterFrac = -1.0;
    let leaveFrac = 1.0;
    let clipPlaneNormal: Vec3 = [0, 0, 1];
    let clipPlaneDist = 0;
    let clipSurfaceFlags = 0;
    let getout = false;
    let startout = false;

    for (let i = 0; i < brush.numSides; i++) {
      const side = bsp.brushSides[brush.firstSide + i];
      const plane = bsp.planes[side.planeNum];
      const n = plane.normal;

      // Push the plane out by the box extents in direction -n
      const ofsX = n[0] < 0 ? maxs[0] : mins[0];
      const ofsY = n[1] < 0 ? maxs[1] : mins[1];
      const ofsZ = n[2] < 0 ? maxs[2] : mins[2];
      const dist = plane.dist - (ofsX * n[0] + ofsY * n[1] + ofsZ * n[2]);

      const d1 = vec3Dot(start, n) - dist;
      const d2 = vec3Dot(end, n) - dist;

      if (d2 > 0) getout = true;
      if (d1 > 0) startout = true;

      // Completely in front of this brush face
      if (d1 > 0 && (d2 >= SURFACE_CLIP_EPSILON || d2 >= d1)) {
        return;
      }
      // Completely behind this brush face
      if (d1 <= 0 && d2 <= 0) {
        continue;
      }

      if (d1 > d2) {
        // Entering the brush
        let f = (d1 - SURFACE_CLIP_EPSILON) / (d1 - d2);
        if (f < 0) f = 0;
        if (f > enterFrac) {
          enterFrac = f;
          clipPlaneNormal = [n[0], n[1], n[2]];
          clipPlaneDist = dist;
          const sideShader = bsp.shaders[side.shaderNum] || bsp.shaders[brush.shaderNum];
          clipSurfaceFlags = sideShader ? sideShader.surfaceFlags : 0;
        }
      } else {
        // Leaving the brush
        let f = (d1 + SURFACE_CLIP_EPSILON) / (d1 - d2);
        if (f > 1) f = 1;
        if (f < leaveFrac) {
          leaveFrac = f;
        }
      }
    }

    const brushShader = bsp.shaders[brush.shaderNum];
    const brushContents = brushShader ? brushShader.contentFlags : CONTENTS_SOLID;

    if (!startout) {
      trace.startsolid = true;
      if (!getout) {
        trace.allsolid = true;
        trace.fraction = 0;
        trace.contents = brushContents;
        trace.entityNum = 1022;
      }
      return;
    }

    if (enterFrac < leaveFrac) {
      if (enterFrac > -1 && enterFrac < trace.fraction) {
        if (enterFrac < 0) enterFrac = 0;
        trace.fraction = enterFrac;
        trace.plane.normal = clipPlaneNormal;
        trace.plane.dist = clipPlaneDist;
        trace.surfaceFlags = clipSurfaceFlags;
        trace.contents = brushContents;
        trace.entityNum = 1022;
      }
    }
  }
}

export const CM = new CollisionModel();
