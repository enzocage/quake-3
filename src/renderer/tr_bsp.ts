// ============================================================================
// src/renderer/tr_bsp.ts
// Quake III Arena IBSP v46 Complete 17-Lump Parser, Bezier Patch Builder,
// PVS Cluster Visibility & 3D Lightgrid (LUMP_LIGHTGRID) Sampler
// ============================================================================

import { Vec2, Vec3, vec3Dot } from '../qcommon/q_shared';
import { Q3Tokenizer } from '../qcommon/cmd';
import { BspDrawVert, tessellateBezierPatch } from './tr_curve';
import { LightmapAtlas } from './tr_lightmap';

export const BSP_VERSION_Q3 = 46;

export const MST_BAD = 0;
export const MST_PLANAR = 1;
export const MST_PATCH = 2;
export const MST_TRIANGLE_SOUP = 3;
export const MST_FLARE = 4;

export interface BspShaderRef {
  name: string;
  surfaceFlags: number;
  contentFlags: number;
}

export interface BspPlane {
  normal: Vec3;
  dist: number;
}

export interface BspNode {
  planeNum: number;
  children: [number, number]; // negative = -(leafIndex + 1)
  mins: Vec3;
  maxs: Vec3;
}

export interface BspLeaf {
  cluster: number;
  area: number;
  mins: Vec3;
  maxs: Vec3;
  firstLeafSurface: number;
  numLeafSurfaces: number;
  firstLeafBrush: number;
  numLeafBrushes: number;
}

export interface BspModel {
  mins: Vec3;
  maxs: Vec3;
  firstSurface: number;
  numSurfaces: number;
  firstBrush: number;
  numBrushes: number;
}

export interface BspBrush {
  firstSide: number;
  numSides: number;
  shaderNum: number;
}

export interface BspBrushSide {
  planeNum: number;
  shaderNum: number;
}

export interface BspFog {
  shader: string;
  brushNum: number;
  visibleSide: number;
  bounds: [Vec3, Vec3];
}

export interface BspSurface {
  index: number;
  shaderNum: number;
  fogNum: number;
  surfaceType: number;
  firstVert: number;
  numVerts: number;
  firstIndex: number;
  numIndexes: number;
  lightmapNum: number;
  origin: Vec3;
  normal: Vec3;
  flareColor: Vec3;
  patchWidth: number;
  patchHeight: number;
  // Expanded geometry in combined VBO/IBO
  vboFirstVert: number;
  vboNumVerts: number;
  iboFirstIndex: number;
  iboNumIndexes: number;
}

export interface LightgridSample {
  ambient: Vec3;  // 0..1 RGB
  directed: Vec3; // 0..1 RGB
  lightDir: Vec3; // normalized vector pointing towards light source
}

export class BspMap {
  public entitiesRaw = '';
  public entities: Array<Record<string, string>> = [];
  public shaders: BspShaderRef[] = [];
  public planes: BspPlane[] = [];
  public nodes: BspNode[] = [];
  public leafs: BspLeaf[] = [];
  public leafSurfaces: Int32Array = new Int32Array(0);
  public leafBrushes: Int32Array = new Int32Array(0);
  public models: BspModel[] = [];
  public brushes: BspBrush[] = [];
  public brushSides: BspBrushSide[] = [];
  public drawVerts: BspDrawVert[] = [];
  public drawIndexes: Int32Array = new Int32Array(0);
  public fogs: BspFog[] = [];
  public surfaces: BspSurface[] = [];
  public lightmapLump: Uint8Array = new Uint8Array(0);
  public lightgridLump: Uint8Array = new Uint8Array(0);
  public numClusters = 0;
  public clusterBytes = 0;
  public visBitsets: Uint8Array = new Uint8Array(0);

  // Expanded GPU Buffers (World + Tessellated Bezier Patches + Inline Models)
  public gpuVertexData: Float32Array = new Float32Array(0); // 14 floats per vertex: xyz(3), st(2), lm(2), normal(3), rgba(4)
  public gpuIndexData: Uint32Array = new Uint32Array(0);

  private gridMins: Vec3 = [0, 0, 0];
  private gridBounds: Vec3 = [1, 1, 1];

  constructor(buffer: Uint8Array, lightmapAtlas?: LightmapAtlas) {
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const magic =
      String.fromCharCode(view.getUint8(0)) +
      String.fromCharCode(view.getUint8(1)) +
      String.fromCharCode(view.getUint8(2)) +
      String.fromCharCode(view.getUint8(3));
    const version = view.getInt32(4, true);

    if (magic !== 'IBSP' || version !== BSP_VERSION_Q3) {
      throw new Error(`Invalid Quake 3 BSP header: magic=${magic}, version=${version} (expected IBSP v46)`);
    }

    const lumps: Array<{ ofs: number; len: number }> = [];
    for (let i = 0; i < 17; i++) {
      lumps.push({
        ofs: view.getInt32(8 + i * 8 + 0, true),
        len: view.getInt32(8 + i * 8 + 4, true),
      });
    }

    const readAscii = (ofs: number, maxLen: number): string => {
      let s = '';
      for (let i = 0; i < maxLen; i++) {
        const c = view.getUint8(ofs + i);
        if (c === 0) break;
        s += String.fromCharCode(c);
      }
      return s;
    };

    // Lump 0: Entities
    this.entitiesRaw = new TextDecoder('utf-8')
      .decode(buffer.subarray(lumps[0].ofs, lumps[0].ofs + lumps[0].len))
      .replace(/\0+$/, '');
    this.entities = this.parseEntities(this.entitiesRaw);

    // Lump 1: Shaders (72 bytes)
    const nShaders = Math.floor(lumps[1].len / 72);
    for (let i = 0; i < nShaders; i++) {
      const b = lumps[1].ofs + i * 72;
      this.shaders.push({
        name: readAscii(b, 64),
        surfaceFlags: view.getInt32(b + 64, true),
        contentFlags: view.getInt32(b + 68, true),
      });
    }

    // Lump 2: Planes (16 bytes)
    const nPlanes = Math.floor(lumps[2].len / 16);
    for (let i = 0; i < nPlanes; i++) {
      const b = lumps[2].ofs + i * 16;
      this.planes.push({
        normal: [view.getFloat32(b, true), view.getFloat32(b + 4, true), view.getFloat32(b + 8, true)],
        dist: view.getFloat32(b + 12, true),
      });
    }

    // Lump 3: Nodes (36 bytes)
    const nNodes = Math.floor(lumps[3].len / 36);
    for (let i = 0; i < nNodes; i++) {
      const b = lumps[3].ofs + i * 36;
      this.nodes.push({
        planeNum: view.getInt32(b, true),
        children: [view.getInt32(b + 4, true), view.getInt32(b + 8, true)],
        mins: [view.getInt32(b + 12, true), view.getInt32(b + 16, true), view.getInt32(b + 20, true)],
        maxs: [view.getInt32(b + 24, true), view.getInt32(b + 28, true), view.getInt32(b + 32, true)],
      });
    }

    // Lump 4: Leafs (48 bytes)
    const nLeafs = Math.floor(lumps[4].len / 48);
    for (let i = 0; i < nLeafs; i++) {
      const b = lumps[4].ofs + i * 48;
      this.leafs.push({
        cluster: view.getInt32(b + 0, true),
        area: view.getInt32(b + 4, true),
        mins: [view.getInt32(b + 8, true), view.getInt32(b + 12, true), view.getInt32(b + 16, true)],
        maxs: [view.getInt32(b + 20, true), view.getInt32(b + 24, true), view.getInt32(b + 28, true)],
        firstLeafSurface: view.getInt32(b + 32, true),
        numLeafSurfaces: view.getInt32(b + 36, true),
        firstLeafBrush: view.getInt32(b + 40, true),
        numLeafBrushes: view.getInt32(b + 44, true),
      });
    }

    // Lump 5: Leafsurfaces (4 bytes)
    const nLeafSurfs = Math.floor(lumps[5].len / 4);
    this.leafSurfaces = new Int32Array(nLeafSurfs);
    for (let i = 0; i < nLeafSurfs; i++) {
      this.leafSurfaces[i] = view.getInt32(lumps[5].ofs + i * 4, true);
    }

    // Lump 6: Leafbrushes (4 bytes)
    const nLeafBrushes = Math.floor(lumps[6].len / 4);
    this.leafBrushes = new Int32Array(nLeafBrushes);
    for (let i = 0; i < nLeafBrushes; i++) {
      this.leafBrushes[i] = view.getInt32(lumps[6].ofs + i * 4, true);
    }

    // Lump 7: Models (40 bytes)
    const nModels = Math.floor(lumps[7].len / 40);
    for (let i = 0; i < nModels; i++) {
      const b = lumps[7].ofs + i * 40;
      this.models.push({
        mins: [view.getFloat32(b + 0, true), view.getFloat32(b + 4, true), view.getFloat32(b + 8, true)],
        maxs: [view.getFloat32(b + 12, true), view.getFloat32(b + 16, true), view.getFloat32(b + 20, true)],
        firstSurface: view.getInt32(b + 24, true),
        numSurfaces: view.getInt32(b + 28, true),
        firstBrush: view.getInt32(b + 32, true),
        numBrushes: view.getInt32(b + 36, true),
      });
    }

    // Lump 8: Brushes (12 bytes)
    const nBrushes = Math.floor(lumps[8].len / 12);
    for (let i = 0; i < nBrushes; i++) {
      const b = lumps[8].ofs + i * 12;
      this.brushes.push({
        firstSide: view.getInt32(b + 0, true),
        numSides: view.getInt32(b + 4, true),
        shaderNum: view.getInt32(b + 8, true),
      });
    }

    // Lump 9: Brushsides (8 bytes)
    const nBrushSides = Math.floor(lumps[9].len / 8);
    for (let i = 0; i < nBrushSides; i++) {
      const b = lumps[9].ofs + i * 8;
      this.brushSides.push({
        planeNum: view.getInt32(b + 0, true),
        shaderNum: view.getInt32(b + 4, true),
      });
    }

    // Lump 10: Drawverts (44 bytes)
    const nVerts = Math.floor(lumps[10].len / 44);
    for (let i = 0; i < nVerts; i++) {
      const b = lumps[10].ofs + i * 44;
      this.drawVerts.push({
        xyz: [view.getFloat32(b + 0, true), view.getFloat32(b + 4, true), view.getFloat32(b + 8, true)],
        st: [view.getFloat32(b + 12, true), view.getFloat32(b + 16, true)],
        lightmap: [view.getFloat32(b + 20, true), view.getFloat32(b + 24, true)],
        normal: [view.getFloat32(b + 28, true), view.getFloat32(b + 32, true), view.getFloat32(b + 36, true)],
        color: [
          view.getUint8(b + 40),
          view.getUint8(b + 41),
          view.getUint8(b + 42),
          view.getUint8(b + 43),
        ],
      });
    }

    // Lump 11: Drawindexes (4 bytes)
    const nIndexes = Math.floor(lumps[11].len / 4);
    this.drawIndexes = new Int32Array(nIndexes);
    for (let i = 0; i < nIndexes; i++) {
      this.drawIndexes[i] = view.getInt32(lumps[11].ofs + i * 4, true);
    }

    // Lump 12: Fogs (72 bytes)
    const nFogs = Math.floor(lumps[12].len / 72);
    for (let i = 0; i < nFogs; i++) {
      const b = lumps[12].ofs + i * 72;
      const brushNum = view.getInt32(b + 64, true);
      const bounds = this.computeBrushBounds(brushNum);
      this.fogs.push({
        shader: readAscii(b, 64),
        brushNum,
        visibleSide: view.getInt32(b + 68, true),
        bounds,
      });
    }

    // Lump 13: Surfaces (104 bytes)
    const nSurfaces = Math.floor(lumps[13].len / 104);
    for (let i = 0; i < nSurfaces; i++) {
      const b = lumps[13].ofs + i * 104;
      this.surfaces.push({
        index: i,
        shaderNum: view.getInt32(b + 0, true),
        fogNum: view.getInt32(b + 4, true),
        surfaceType: view.getInt32(b + 8, true),
        firstVert: view.getInt32(b + 12, true),
        numVerts: view.getInt32(b + 16, true),
        firstIndex: view.getInt32(b + 20, true),
        numIndexes: view.getInt32(b + 24, true),
        lightmapNum: view.getInt32(b + 28, true),
        origin: [view.getFloat32(b + 48, true), view.getFloat32(b + 52, true), view.getFloat32(b + 56, true)],
        flareColor: [view.getFloat32(b + 60, true), view.getFloat32(b + 64, true), view.getFloat32(b + 68, true)],
        normal: [view.getFloat32(b + 84, true), view.getFloat32(b + 88, true), view.getFloat32(b + 92, true)],
        patchWidth: view.getInt32(b + 96, true),
        patchHeight: view.getInt32(b + 100, true),
        vboFirstVert: 0,
        vboNumVerts: 0,
        iboFirstIndex: 0,
        iboNumIndexes: 0,
      });
    }

    // Lump 14: Lightmaps
    this.lightmapLump = buffer.subarray(lumps[14].ofs, lumps[14].ofs + lumps[14].len);

    // Lump 15: Lightgrid
    this.lightgridLump = buffer.subarray(lumps[15].ofs, lumps[15].ofs + lumps[15].len);
    if (this.models.length > 0) {
      const wMins = this.models[0].mins;
      const wMaxs = this.models[0].maxs;
      this.gridMins = [
        64 * Math.ceil(wMins[0] / 64),
        64 * Math.ceil(wMins[1] / 64),
        128 * Math.ceil(wMins[2] / 128),
      ];
      const maxs = [
        64 * Math.floor(wMaxs[0] / 64),
        64 * Math.floor(wMaxs[1] / 64),
        128 * Math.floor(wMaxs[2] / 128),
      ];
      this.gridBounds = [
        Math.max(1, (maxs[0] - this.gridMins[0]) / 64 + 1),
        Math.max(1, (maxs[1] - this.gridMins[1]) / 64 + 1),
        Math.max(1, (maxs[2] - this.gridMins[2]) / 128 + 1),
      ];
    }

    // Lump 16: Visibility (PVS)
    if (lumps[16].len >= 8) {
      this.numClusters = view.getInt32(lumps[16].ofs + 0, true);
      this.clusterBytes = view.getInt32(lumps[16].ofs + 4, true);
      this.visBitsets = buffer.subarray(lumps[16].ofs + 8, lumps[16].ofs + lumps[16].len);
    }

    this.buildExpandedGpuBuffers(lightmapAtlas);
  }

  public rebuildGpuBuffersWithAtlas(lightmapAtlas: LightmapAtlas): void {
    this.buildExpandedGpuBuffers(lightmapAtlas);
  }

  private buildExpandedGpuBuffers(lightmapAtlas?: LightmapAtlas): void {
    const allVerts: BspDrawVert[] = [];
    const allIndexes: number[] = [];

    const remapLm = (lmNum: number, uv: Vec2): Vec2 => {
      return lightmapAtlas ? lightmapAtlas.remapUV(lmNum, uv[0], uv[1]) : uv;
    };

    for (const surf of this.surfaces) {
      if (surf.surfaceType === MST_PLANAR || surf.surfaceType === MST_TRIANGLE_SOUP) {
        surf.vboFirstVert = allVerts.length;
        surf.vboNumVerts = surf.numVerts;
        surf.iboFirstIndex = allIndexes.length;
        surf.iboNumIndexes = surf.numIndexes;

        for (let i = 0; i < surf.numVerts; i++) {
          const sv = this.drawVerts[surf.firstVert + i];
          allVerts.push({
            xyz: sv.xyz,
            st: sv.st,
            lightmap: remapLm(surf.lightmapNum, sv.lightmap),
            normal: sv.normal,
            color: sv.color,
          });
        }

        for (let i = 0; i < surf.numIndexes; i++) {
          allIndexes.push(surf.vboFirstVert + this.drawIndexes[surf.firstIndex + i]);
        }
      } else if (surf.surfaceType === MST_PATCH && surf.patchWidth >= 3 && surf.patchHeight >= 3) {
        const controlGrid = this.drawVerts.slice(surf.firstVert, surf.firstVert + surf.numVerts);
        const tess = tessellateBezierPatch(controlGrid, surf.patchWidth, surf.patchHeight, 6);

        surf.vboFirstVert = allVerts.length;
        surf.vboNumVerts = tess.verts.length;
        surf.iboFirstIndex = allIndexes.length;
        surf.iboNumIndexes = tess.indexes.length;

        for (const tv of tess.verts) {
          allVerts.push({
            xyz: tv.xyz,
            st: tv.st,
            lightmap: remapLm(surf.lightmapNum, tv.lightmap),
            normal: tv.normal,
            color: tv.color,
          });
        }
        for (const idx of tess.indexes) {
          allIndexes.push(surf.vboFirstVert + idx);
        }
      }
    }

    // Pack into Float32Array (14 floats per vertex)
    this.gpuVertexData = new Float32Array(allVerts.length * 14);
    for (let i = 0; i < allVerts.length; i++) {
      const v = allVerts[i];
      const o = i * 14;
      this.gpuVertexData[o + 0] = v.xyz[0];
      this.gpuVertexData[o + 1] = v.xyz[1];
      this.gpuVertexData[o + 2] = v.xyz[2];
      this.gpuVertexData[o + 3] = v.st[0];
      this.gpuVertexData[o + 4] = v.st[1];
      this.gpuVertexData[o + 5] = v.lightmap[0];
      this.gpuVertexData[o + 6] = v.lightmap[1];
      this.gpuVertexData[o + 7] = v.normal[0];
      this.gpuVertexData[o + 8] = v.normal[1];
      this.gpuVertexData[o + 9] = v.normal[2];
      this.gpuVertexData[o + 10] = v.color[0] / 255.0;
      this.gpuVertexData[o + 11] = v.color[1] / 255.0;
      this.gpuVertexData[o + 12] = v.color[2] / 255.0;
      this.gpuVertexData[o + 13] = v.color[3] / 255.0;
    }

    this.gpuIndexData = new Uint32Array(allIndexes);
  }

  /**
   * Finds the BSP leaf index containing a 3D point (R_PointInLeaf)
   */
  public findLeaf(point: Vec3): number {
    if (this.nodes.length === 0) return 0;
    let nodeNum = 0;
    while (nodeNum >= 0) {
      const node = this.nodes[nodeNum];
      const plane = this.planes[node.planeNum];
      const d = vec3Dot(point, plane.normal) - plane.dist;
      nodeNum = d >= 0 ? node.children[0] : node.children[1];
    }
    return -nodeNum - 1;
  }

  /**
   * Checks PVS visibility between two cluster indices (R_ClusterVisible)
   */
  public isClusterVisible(viewerCluster: number, targetCluster: number): boolean {
    if (viewerCluster < 0 || targetCluster < 0 || this.numClusters === 0) return true;
    if (viewerCluster >= this.numClusters || targetCluster >= this.numClusters) return true;
    const byteIndex = viewerCluster * this.clusterBytes + (targetCluster >> 3);
    if (byteIndex >= this.visBitsets.byteLength) return true;
    return (this.visBitsets[byteIndex] & (1 << (targetCluster & 7))) !== 0;
  }

  /**
   * Samples the 3D Lightgrid (LUMP_LIGHTGRID) at `origin` for dynamic MD3 entity shading
   */
  public sampleLightgrid(origin: Vec3): LightgridSample {
    const numCells = Math.floor(this.lightgridLump.byteLength / 8);
    if (numCells === 0) {
      return {
        ambient: [0.42, 0.42, 0.46],
        directed: [0.75, 0.72, 0.68],
        lightDir: [0.4, 0.3, 0.86],
      };
    }

    const gx = Math.max(0, Math.min(this.gridBounds[0] - 1, Math.floor((origin[0] - this.gridMins[0]) / 64)));
    const gy = Math.max(0, Math.min(this.gridBounds[1] - 1, Math.floor((origin[1] - this.gridMins[1]) / 64)));
    const gz = Math.max(0, Math.min(this.gridBounds[2] - 1, Math.floor((origin[2] - this.gridMins[2]) / 128)));

    const cellIndex = Math.min(
      numCells - 1,
      gz * (this.gridBounds[0] * this.gridBounds[1]) + gy * this.gridBounds[0] + gx
    );
    const ofs = cellIndex * 8;
    const ar = this.lightgridLump[ofs + 0] / 255.0;
    const ag = this.lightgridLump[ofs + 1] / 255.0;
    const ab = this.lightgridLump[ofs + 2] / 255.0;
    const dr = this.lightgridLump[ofs + 3] / 255.0;
    const dg = this.lightgridLump[ofs + 4] / 255.0;
    const db = this.lightgridLump[ofs + 5] / 255.0;
    const lat = (this.lightgridLump[ofs + 6] * Math.PI * 2) / 255.0;
    const lng = (this.lightgridLump[ofs + 7] * Math.PI * 2) / 255.0;

    return {
      ambient: [Math.max(0.22, ar * 1.4), Math.max(0.22, ag * 1.4), Math.max(0.25, ab * 1.4)],
      directed: [dr * 1.5, dg * 1.5, db * 1.5],
      lightDir: [Math.cos(lat) * Math.sin(lng), Math.sin(lat) * Math.sin(lng), Math.cos(lng)],
    };
  }

  private computeBrushBounds(brushNum: number): [Vec3, Vec3] {
    const mins: Vec3 = [-9999, -9999, -9999];
    const maxs: Vec3 = [9999, 9999, 9999];
    if (brushNum < 0 || brushNum >= this.brushes.length) return [mins, maxs];
    const br = this.brushes[brushNum];
    for (let i = 0; i < br.numSides; i++) {
      const side = this.brushSides[br.firstSide + i];
      const pl = this.planes[side.planeNum];
      if (pl.normal[0] === 1) maxs[0] = pl.dist;
      else if (pl.normal[0] === -1) mins[0] = -pl.dist;
      else if (pl.normal[1] === 1) maxs[1] = pl.dist;
      else if (pl.normal[1] === -1) mins[1] = -pl.dist;
      else if (pl.normal[2] === 1) maxs[2] = pl.dist;
      else if (pl.normal[2] === -1) mins[2] = -pl.dist;
    }
    return [mins, maxs];
  }

  private parseEntities(raw: string): Array<Record<string, string>> {
    const list: Array<Record<string, string>> = [];
    const tokenizer = new Q3Tokenizer(raw);
    while (!tokenizer.eof()) {
      const tok = tokenizer.nextToken(true);
      if (!tok) break;
      if (tok !== '{') continue;
      const ent: Record<string, string> = {};
      while (!tokenizer.eof()) {
        const key = tokenizer.nextToken(true);
        if (!key || key === '}') break;
        const val = tokenizer.nextToken(true);
        ent[key.toLowerCase()] = val;
      }
      list.push(ent);
    }
    return list;
  }
}
