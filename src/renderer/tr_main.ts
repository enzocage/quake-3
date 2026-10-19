// ============================================================================
// src/renderer/tr_main.ts
// Quake III Arena Main WebGL2 Renderer (RE_LoadWorldMap, RE_RenderScene,
// PVS Culling, Multipass Shaders, MD3 Morphing, Decals, Flares, Beams & Rails)
// ============================================================================

import { Cvars } from '../qcommon/cvar';
import { VFS } from '../qcommon/files';
import {
  AnglesToAxis,
  AxisClear,
  buildEntityModelMatrix,
  buildQuakeViewMatrix,
  DEG2RAD,
  DynamicLight,
  Mat3,
  mat4Identity,
  mat4Multiply,
  mat4Perspective,
  RefEntity,
  RefEntityType,
  RF_DEPTHHACK,
  RF_THIRD_PERSON,
  SURF_NODRAW,
  Vec3,
  vec3Add,
  vec3Cross,
  vec3MA,
  vec3Normalize,
  vec3Sub,
} from '../qcommon/q_shared';
import { BspMap, BspSurface, MST_FLARE } from './tr_bsp';
import { TextureManager } from './tr_image';
import { LightmapAtlas } from './tr_lightmap';
import { Md3Model, parseSkinFile } from './tr_model';
import { MultipassShaderExecutor } from './tr_shader_compiler';
import { Q3Shader, ShaderStage, Shaders } from './tr_shader_parse';

export interface DecalMark {
  origin: Vec3;
  normal: Vec3;
  radius: number;
  shaderName: string;
  color: [number, number, number, number];
  spawnTime: number;
}

export class Q3Renderer {
  public gl: WebGL2RenderingContext;
  public textures: TextureManager;
  public executor: MultipassShaderExecutor;
  public bsp: BspMap | null = null;
  public lightmapAtlas: LightmapAtlas | null = null;

  private worldVao: WebGLVertexArrayObject | null = null;
  private worldVbo: WebGLBuffer | null = null;
  private worldIbo: WebGLBuffer | null = null;

  // Dynamic Quad/Beam VAO for Sprites, Flares, Railgun Cores, Lightning Bolts & Decals
  private dynVao: WebGLVertexArrayObject;
  private dynVbo: WebGLBuffer;
  private dynIbo: WebGLBuffer;
  private dynVertScratch = new Float32Array(256 * 20);
  private dynIdxScratch = new Uint32Array(512 * 3);

  private md3Cache = new Map<string, Md3Model>();
  private skinCache = new Map<string, Map<string, string>>();

  // Scene buffers populated between RE_ClearScene and RE_RenderScene
  private sceneEntities: RefEntity[] = [];
  private sceneDlights: DynamicLight[] = [];
  private decals: DecalMark[] = [];

  private identityMat = mat4Identity();
  private viewMat = new Float32Array(16);
  private projMat = new Float32Array(16);
  private viewProjMat = new Float32Array(16);
  private entityModelMat = new Float32Array(16);

  public stats = {
    drawCalls: 0,
    tris: 0,
    visibleSurfaces: 0,
    culledSurfaces: 0,
  };

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      depth: true,
      stencil: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    if (!gl) {
      throw new Error('WebGL2 is required to run the Quake III Arena engine.');
    }
    this.gl = gl;
    this.textures = new TextureManager(gl);
    this.executor = new MultipassShaderExecutor(gl);

    // Initialize dynamic quad/beam VAO
    this.dynVao = gl.createVertexArray()!;
    this.dynVbo = gl.createBuffer()!;
    this.dynIbo = gl.createBuffer()!;
    this.setupInterleavedVao20(this.dynVao, this.dynVbo, this.dynIbo);
  }

  private setupInterleavedVao20(
    vao: WebGLVertexArrayObject,
    vbo: WebGLBuffer,
    ibo: WebGLBuffer
  ): void {
    const gl = this.gl;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.dynVertScratch.byteLength, gl.DYNAMIC_DRAW);

    const stride = 20 * 4;
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 3 * 4);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, 5 * 4);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 3, gl.FLOAT, false, stride, 7 * 4);
    gl.enableVertexAttribArray(4);
    gl.vertexAttribPointer(4, 4, gl.FLOAT, false, stride, 10 * 4);
    gl.enableVertexAttribArray(5);
    gl.vertexAttribPointer(5, 3, gl.FLOAT, false, stride, 14 * 4);
    gl.enableVertexAttribArray(6);
    gl.vertexAttribPointer(6, 3, gl.FLOAT, false, stride, 17 * 4);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.dynIdxScratch.byteLength, gl.DYNAMIC_DRAW);
    gl.bindVertexArray(null);
  }

  public loadWorldMap(bspPath: string): BspMap {
    const raw = VFS.readFile(bspPath);
    if (!raw) {
      throw new Error(`BSP file not found in VFS: ${bspPath}`);
    }

    Shaders.loadAllFromVFS();

    const bsp = new BspMap(raw);
    this.lightmapAtlas = new LightmapAtlas(this.gl, bsp.lightmapLump);
    bsp.rebuildGpuBuffersWithAtlas(this.lightmapAtlas);
    this.bsp = bsp;
    this.decals = [];

    this.uploadWorldGeometry(bsp);
    return bsp;
  }

  private uploadWorldGeometry(bsp: BspMap): void {
    const gl = this.gl;
    if (this.worldVao) gl.deleteVertexArray(this.worldVao);
    if (this.worldVbo) gl.deleteBuffer(this.worldVbo);
    if (this.worldIbo) gl.deleteBuffer(this.worldIbo);

    this.worldVao = gl.createVertexArray()!;
    this.worldVbo = gl.createBuffer()!;
    this.worldIbo = gl.createBuffer()!;

    // Convert 14-float BSP vertex array to 20-float layout (pos1 = pos0, norm1 = norm0)
    const numVerts = bsp.gpuVertexData.length / 14;
    const vbo20 = new Float32Array(numVerts * 20);
    for (let i = 0; i < numVerts; i++) {
      const s = i * 14;
      const d = i * 20;
      for (let k = 0; k < 14; k++) vbo20[d + k] = bsp.gpuVertexData[s + k];
      vbo20[d + 14] = bsp.gpuVertexData[s + 0];
      vbo20[d + 15] = bsp.gpuVertexData[s + 1];
      vbo20[d + 16] = bsp.gpuVertexData[s + 2];
      vbo20[d + 17] = bsp.gpuVertexData[s + 7];
      vbo20[d + 18] = bsp.gpuVertexData[s + 8];
      vbo20[d + 19] = bsp.gpuVertexData[s + 9];
    }

    gl.bindVertexArray(this.worldVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.worldVbo);
    gl.bufferData(gl.ARRAY_BUFFER, vbo20, gl.STATIC_DRAW);

    const stride = 20 * 4;
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 3 * 4);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, 5 * 4);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 3, gl.FLOAT, false, stride, 7 * 4);
    gl.enableVertexAttribArray(4);
    gl.vertexAttribPointer(4, 4, gl.FLOAT, false, stride, 10 * 4);
    gl.enableVertexAttribArray(5);
    gl.vertexAttribPointer(5, 3, gl.FLOAT, false, stride, 14 * 4);
    gl.enableVertexAttribArray(6);
    gl.vertexAttribPointer(6, 3, gl.FLOAT, false, stride, 17 * 4);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.worldIbo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bsp.gpuIndexData, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
  }

  public registerModel(modelPath: string): Md3Model | null {
    if (!modelPath || modelPath.startsWith('*')) return null;
    const norm = VFS.normalizePath(modelPath);
    const cached = this.md3Cache.get(norm);
    if (cached) return cached;

    const bytes = VFS.readFile(norm);
    if (!bytes) return null;
    try {
      const md3 = new Md3Model(this.gl, bytes, norm);
      this.md3Cache.set(norm, md3);
      return md3;
    } catch {
      return null;
    }
  }

  public registerSkin(skinPath: string): Map<string, string> {
    const norm = VFS.normalizePath(skinPath);
    let skin = this.skinCache.get(norm);
    if (!skin) {
      skin = parseSkinFile(norm);
      this.skinCache.set(norm, skin);
    }
    return skin;
  }

  public clearScene(): void {
    this.sceneEntities.length = 0;
    this.sceneDlights.length = 0;
  }

  public addRefEntityToScene(ent: RefEntity): void {
    this.sceneEntities.push({
      ...ent,
      origin: [ent.origin[0], ent.origin[1], ent.origin[2]],
      oldorigin: [ent.oldorigin[0], ent.oldorigin[1], ent.oldorigin[2]],
      lightingOrigin: [ent.lightingOrigin[0], ent.lightingOrigin[1], ent.lightingOrigin[2]],
      axis: [
        [ent.axis[0][0], ent.axis[0][1], ent.axis[0][2]],
        [ent.axis[1][0], ent.axis[1][1], ent.axis[1][2]],
        [ent.axis[2][0], ent.axis[2][1], ent.axis[2][2]],
      ],
      shaderRGBA: [ent.shaderRGBA[0], ent.shaderRGBA[1], ent.shaderRGBA[2], ent.shaderRGBA[3]],
    });
  }

  public addLightToScene(origin: Vec3, radius: number, r: number, g: number, b: number): void {
    if (radius <= 0) return;
    this.sceneDlights.push({
      origin: [origin[0], origin[1], origin[2]],
      radius,
      color: [r, g, b],
    });
  }

  public addImpactMark(
    origin: Vec3,
    normal: Vec3,
    radius: number,
    shaderName: string,
    color: [number, number, number, number],
    timeSec: number
  ): void {
    if (!Cvars.variableIntegerValue('cg_marks')) return;
    this.decals.push({
      origin: [origin[0], origin[1], origin[2]],
      normal: [normal[0], normal[1], normal[2]],
      radius,
      shaderName,
      color,
      spawnTime: timeSec,
    });
    if (this.decals.length > 96) {
      this.decals.shift();
    }
  }

  /**
   * Renders the complete 3D Quake III Arena scene
   */
  public renderScene(cameraOrigin: Vec3, cameraAngles: Vec3, timeSec: number): void {
    const gl = this.gl;
    const width = gl.canvas.width;
    const height = gl.canvas.height;

    this.stats.drawCalls = 0;
    this.stats.tris = 0;
    this.stats.visibleSurfaces = 0;
    this.stats.culledSurfaces = 0;

    gl.viewport(0, 0, width, height);
    gl.depthMask(true);
    gl.clearColor(0.04, 0.04, 0.08, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthRange(0.0, 1.0);

    // Hor+ Widescreen FOV calculation
    const baseFovX = Math.max(60, Math.min(140, Cvars.variableValue('cg_fov') || 100));
    const fovYRad = 2.0 * Math.atan(Math.tan((baseFovX * DEG2RAD) * 0.5) * (3.0 / 4.0));
    const aspect = width / Math.max(1, height);

    const viewAxis: Mat3 = AxisClear();
    AnglesToAxis(cameraAngles, viewAxis);
    buildQuakeViewMatrix(cameraOrigin, viewAxis, this.viewMat);
    mat4Perspective(fovYRad, aspect, 4.0, 8192.0, this.projMat);
    mat4Multiply(this.projMat, this.viewMat, this.viewProjMat);

    this.executor.useAndSetFrameUniforms(
      this.viewProjMat,
      cameraOrigin,
      timeSec,
      this.sceneDlights
    );

    if (this.lightmapAtlas) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.lightmapAtlas.texture);
      gl.activeTexture(gl.TEXTURE0);
    }

    // 1. Render BSP World Surfaces (PVS Culling + Sort Order: Sky -> Opaque -> Translucent)
    if (this.bsp && this.worldVao) {
      this.renderBspWorld(this.bsp, cameraOrigin, timeSec);
    }

    // 2. Render Inline Brush Models (*1, *2, etc.) and 3rd-Person MD3 Models
    const isThirdPerson = Cvars.variableIntegerValue('cg_thirdPerson') !== 0;
    const firstPersonWeapons: RefEntity[] = [];

    for (const ent of this.sceneEntities) {
      if ((ent.renderfx & RF_THIRD_PERSON) && !isThirdPerson) {
        continue;
      }
      if (ent.renderfx & RF_DEPTHHACK) {
        firstPersonWeapons.push(ent);
        continue;
      }
      this.renderRefEntity(ent, cameraOrigin, viewAxis, timeSec);
    }

    // 3. Render Projected Wall Impact Decals / Marks
    this.renderDecals(timeSec);

    // 4. Render BSP Corona Flares (MST_FLARE = 4)
    if (this.bsp && Cvars.variableIntegerValue('r_flares')) {
      this.renderBspFlares(this.bsp, cameraOrigin, viewAxis, timeSec);
    }

    // 5. Render First-Person View Weapon with Depth-Hack [0.0, 0.3]
    if (firstPersonWeapons.length > 0 && Cvars.variableIntegerValue('cg_drawGun')) {
      gl.depthRange(0.0, 0.3);
      for (const fpEnt of firstPersonWeapons) {
        this.renderRefEntity(fpEnt, cameraOrigin, viewAxis, timeSec);
      }
      gl.depthRange(0.0, 1.0);
    }

    // 6. Optional Wireframe Overlay (r_showtris 1)
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.disable(gl.POLYGON_OFFSET_FILL);
  }

  private renderBspWorld(bsp: BspMap, cameraOrigin: Vec3, timeSec: number): void {
    const gl = this.gl;
    const leafIdx = bsp.findLeaf(cameraOrigin);
    const viewerCluster =
      leafIdx >= 0 && leafIdx < bsp.leafs.length ? bsp.leafs[leafIdx].cluster : -1;

    const visited = new Uint8Array(bsp.surfaces.length);
    const visibleSurfs: Array<{ surf: BspSurface; shader: Q3Shader }> = [];

    for (const leaf of bsp.leafs) {
      if (!bsp.isClusterVisible(viewerCluster, leaf.cluster)) {
        this.stats.culledSurfaces += leaf.numLeafSurfaces;
        continue;
      }
      for (let i = 0; i < leaf.numLeafSurfaces; i++) {
        const surfIdx = bsp.leafSurfaces[leaf.firstLeafSurface + i];
        if (visited[surfIdx]) continue;
        visited[surfIdx] = 1;

        const surf = bsp.surfaces[surfIdx];
        if (surf.iboNumIndexes === 0) continue;

        const bspShader = bsp.shaders[surf.shaderNum];
        if (bspShader && (bspShader.surfaceFlags & SURF_NODRAW)) continue;

        const shader = Shaders.getShader(
          bspShader ? bspShader.name : '*default',
          surf.lightmapNum >= 0
        );
        if (shader.isSky && Cvars.variableIntegerValue('r_fastsky')) continue;

        visibleSurfs.push({ surf, shader });
      }
    }

    this.stats.visibleSurfaces = visibleSurfs.length;

    // Sort by Q3 shader.sort (Sky=2, Opaque=3, Decal=4, Banner=6, Additive=9)
    visibleSurfs.sort((a, b) => {
      if (a.shader.sort !== b.shader.sort) return a.shader.sort - b.shader.sort;
      return a.surf.shaderNum - b.surf.shaderNum;
    });

    gl.bindVertexArray(this.worldVao);
    this.executor.setEntityTransformAndLighting(
      this.identityMat,
      0.0,
      [1, 1, 1],
      [0, 0, 0],
      [0, 0, 1]
    );

    const lightmapOnly = Cvars.variableIntegerValue('r_lightmap') !== 0;

    for (const item of visibleSurfs) {
      const { surf, shader } = item;
      this.executor.setDeformUniforms(shader.deforms);

      if (lightmapOnly && surf.lightmapNum >= 0) {
        const lmStage: ShaderStage = {
          map: '$lightmap',
          clamp: true,
          animFreq: 0,
          animMaps: [],
          blendSrc: 'GL_ONE',
          blendDst: 'GL_ZERO',
          hasBlend: false,
          rgbGen: 'identity',
          alphaGen: 'identity',
          tcGen: 'lightmap',
          tcMods: [],
          depthFunc: 'lequal',
          depthWrite: true,
          depthWriteExplicit: true,
          alphaFunc: 'NONE',
        };
        this.drawSurfaceStage(surf, lmStage, shader, timeSec, [255, 255, 255, 255], false);
        continue;
      }

      // Single-pass Base + Lightmap optimization
      if (surf.lightmapNum >= 0 && this.executor.canSinglePassLightmap(shader)) {
        this.drawSurfaceStage(
          surf,
          shader.stages[0],
          shader,
          timeSec,
          [255, 255, 255, 255],
          true
        );
      } else {
        // Multipass execution across all stages
        for (const stage of shader.stages) {
          this.drawSurfaceStage(
            surf,
            stage,
            shader,
            timeSec,
            [255, 255, 255, 255],
            false
          );
        }
      }
    }
  }

  private drawSurfaceStage(
    surf: BspSurface,
    stage: ShaderStage,
    shader: Q3Shader,
    timeSec: number,
    entityRGBA: [number, number, number, number],
    combineLightmap: boolean
  ): void {
    const gl = this.gl;
    this.executor.bindStageState(stage, shader, timeSec, entityRGBA, combineLightmap);

    let tex: WebGLTexture;
    if (stage.map.toLowerCase() === '$lightmap' && this.lightmapAtlas) {
      tex = this.lightmapAtlas.texture;
    } else if (stage.animMaps.length > 0 && stage.animFreq > 0) {
      const frameIdx = Math.floor(timeSec * stage.animFreq) % stage.animMaps.length;
      tex = this.textures.getTexture(stage.animMaps[frameIdx], stage.clamp);
    } else {
      tex = this.textures.getTexture(stage.map, stage.clamp);
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);

    gl.drawElements(
      gl.TRIANGLES,
      surf.iboNumIndexes,
      gl.UNSIGNED_INT,
      surf.iboFirstIndex * 4
    );
    this.stats.drawCalls++;
    this.stats.tris += surf.iboNumIndexes / 3;
  }

  private renderRefEntity(
    ent: RefEntity,
    cameraOrigin: Vec3,
    viewAxis: Mat3,
    timeSec: number
  ): void {
    if (ent.reType === RefEntityType.RT_SPRITE) {
      this.renderSpriteEntity(ent, viewAxis, timeSec);
      return;
    }
    if (
      ent.reType === RefEntityType.RT_RAIL_CORE ||
      ent.reType === RefEntityType.RT_LIGHTNING ||
      ent.reType === RefEntityType.RT_BEAM
    ) {
      this.renderBeamEntity(ent, cameraOrigin, timeSec);
      return;
    }

    // Inline BSP Brush Model (*1, *2, ...)
    if (ent.hModel.startsWith('*') && this.bsp && this.worldVao) {
      const modelIdx = Number.parseInt(ent.hModel.slice(1), 10);
      if (modelIdx > 0 && modelIdx < this.bsp.models.length) {
        const bModel = this.bsp.models[modelIdx];
        buildEntityModelMatrix(ent.origin, ent.axis, this.entityModelMat);
        this.gl.bindVertexArray(this.worldVao);
        this.executor.setEntityTransformAndLighting(
          this.entityModelMat,
          0.0,
          [1, 1, 1],
          [0, 0, 0],
          [0, 0, 1]
        );
        for (let i = 0; i < bModel.numSurfaces; i++) {
          const surf = this.bsp.surfaces[bModel.firstSurface + i];
          if (surf.iboNumIndexes === 0) continue;
          const bspShader = this.bsp.shaders[surf.shaderNum];
          const shader = Shaders.getShader(bspShader ? bspShader.name : '*default', true);
          this.executor.setDeformUniforms(shader.deforms);
          if (this.executor.canSinglePassLightmap(shader)) {
            this.drawSurfaceStage(surf, shader.stages[0], shader, timeSec, ent.shaderRGBA, true);
          } else {
            for (const stage of shader.stages) {
              this.drawSurfaceStage(surf, stage, shader, timeSec, ent.shaderRGBA, false);
            }
          }
        }
      }
      return;
    }

    // MD3 Model
    const md3 = this.registerModel(ent.hModel);
    if (!md3) return;

    buildEntityModelMatrix(ent.origin, ent.axis, this.entityModelMat);
    const lightPos = ent.lightingOrigin[0] !== 0 || ent.lightingOrigin[1] !== 0
      ? ent.lightingOrigin
      : ent.origin;
    const lg = this.bsp
      ? this.bsp.sampleLightgrid(lightPos)
      : { ambient: [0.45, 0.45, 0.5] as Vec3, directed: [0.75, 0.72, 0.68] as Vec3, lightDir: [0.3, 0.4, 0.85] as Vec3 };

    const f0 = Math.max(0, Math.min(md3.numFrames - 1, ent.oldframe));
    const f1 = Math.max(0, Math.min(md3.numFrames - 1, ent.frame));
    const frontLerp = 1.0 - Math.max(0, Math.min(1, ent.backlerp));

    this.executor.setEntityTransformAndLighting(
      this.entityModelMat,
      frontLerp,
      lg.ambient,
      lg.directed,
      lg.lightDir
    );

    const skinMap = ent.customSkin ? this.registerSkin(ent.customSkin) : null;
    const gl = this.gl;

    for (const surf of md3.surfaces) {
      const frame0 = surf.framesPosNorm[Math.min(surf.numFrames - 1, f0)];
      const frame1 = surf.framesPosNorm[Math.min(surf.numFrames - 1, f1)];
      const scratch = surf.interleavedScratch;

      for (let v = 0; v < surf.numVerts; v++) {
        const d = v * 20;
        const v3 = v * 3;
        const v2 = v * 2;
        scratch[d + 0] = frame0.pos[v3 + 0];
        scratch[d + 1] = frame0.pos[v3 + 1];
        scratch[d + 2] = frame0.pos[v3 + 2];
        scratch[d + 3] = surf.stData[v2 + 0];
        scratch[d + 4] = surf.stData[v2 + 1];
        scratch[d + 5] = 0;
        scratch[d + 6] = 0;
        scratch[d + 7] = frame0.norm[v3 + 0];
        scratch[d + 8] = frame0.norm[v3 + 1];
        scratch[d + 9] = frame0.norm[v3 + 2];
        scratch[d + 10] = ent.shaderRGBA[0] / 255;
        scratch[d + 11] = ent.shaderRGBA[1] / 255;
        scratch[d + 12] = ent.shaderRGBA[2] / 255;
        scratch[d + 13] = ent.shaderRGBA[3] / 255;
        scratch[d + 14] = frame1.pos[v3 + 0];
        scratch[d + 15] = frame1.pos[v3 + 1];
        scratch[d + 16] = frame1.pos[v3 + 2];
        scratch[d + 17] = frame1.norm[v3 + 0];
        scratch[d + 18] = frame1.norm[v3 + 1];
        scratch[d + 19] = frame1.norm[v3 + 2];
      }

      gl.bindVertexArray(surf.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, surf.vboDynamic);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, scratch);

      let shaderName = ent.customShader;
      if (!shaderName && skinMap && skinMap.has(surf.name)) {
        shaderName = skinMap.get(surf.name)!;
      }
      if (!shaderName) {
        shaderName = surf.shaders[0] || '*default';
      }

      const shader = Shaders.getShader(shaderName, false);
      this.executor.setDeformUniforms(shader.deforms);

      for (const stage of shader.stages) {
        this.executor.bindStageState(stage, shader, timeSec, ent.shaderRGBA, false);
        const tex = this.textures.getTexture(stage.map, stage.clamp);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.drawElements(gl.TRIANGLES, surf.numTriangles * 3, gl.UNSIGNED_INT, 0);
        this.stats.drawCalls++;
        this.stats.tris += surf.numTriangles;
      }
    }
  }

  private renderSpriteEntity(ent: RefEntity, viewAxis: Mat3, timeSec: number): void {
    const r = ent.radius || 16;
    const left = viewAxis[1];
    const up = viewAxis[2];

    const p0: Vec3 = [
      ent.origin[0] + (-left[0] - up[0]) * r,
      ent.origin[1] + (-left[1] - up[1]) * r,
      ent.origin[2] + (-left[2] - up[2]) * r,
    ];
    const p1: Vec3 = [
      ent.origin[0] + (left[0] - up[0]) * r,
      ent.origin[1] + (left[1] - up[1]) * r,
      ent.origin[2] + (left[2] - up[2]) * r,
    ];
    const p2: Vec3 = [
      ent.origin[0] + (left[0] + up[0]) * r,
      ent.origin[1] + (left[1] + up[1]) * r,
      ent.origin[2] + (left[2] + up[2]) * r,
    ];
    const p3: Vec3 = [
      ent.origin[0] + (-left[0] + up[0]) * r,
      ent.origin[1] + (-left[1] + up[1]) * r,
      ent.origin[2] + (-left[2] + up[2]) * r,
    ];

    this.drawDynamicQuad(p0, p1, p2, p3, ent.customShader || 'flareShader', ent.shaderRGBA, timeSec);
  }

  private renderBeamEntity(ent: RefEntity, cameraOrigin: Vec3, timeSec: number): void {
    const start = ent.origin;
    const end = ent.oldorigin;
    const dir: Vec3 = [0, 0, 0];
    vec3Sub(end, start, dir);
    const len = vec3Normalize(dir);
    if (len < 1) return;

    const toCam: Vec3 = [0, 0, 0];
    vec3Sub(cameraOrigin, start, toCam);
    const right: Vec3 = [0, 0, 0];
    vec3Cross(dir, toCam, right);
    vec3Normalize(right);

    const width =
      ent.reType === RefEntityType.RT_RAIL_CORE
        ? Cvars.variableValue('r_railCoreWidth') || 6
        : ent.radius || 8;

    const p0: Vec3 = [start[0] - right[0] * width, start[1] - right[1] * width, start[2] - right[2] * width];
    const p1: Vec3 = [end[0] - right[0] * width, end[1] - right[1] * width, end[2] - right[2] * width];
    const p2: Vec3 = [end[0] + right[0] * width, end[1] + right[1] * width, end[2] + right[2] * width];
    const p3: Vec3 = [start[0] + right[0] * width, start[1] + right[1] * width, start[2] + right[2] * width];

    const shaderName =
      ent.customShader ||
      (ent.reType === RefEntityType.RT_RAIL_CORE ? 'railCore' : 'lightningBolt');
    this.drawDynamicQuad(p0, p1, p2, p3, shaderName, ent.shaderRGBA, timeSec);
  }

  private renderBspFlares(bsp: BspMap, cameraOrigin: Vec3, viewAxis: Mat3, timeSec: number): void {
    for (const surf of bsp.surfaces) {
      if (surf.surfaceType !== MST_FLARE) continue;
      const dist = Math.hypot(
        surf.origin[0] - cameraOrigin[0],
        surf.origin[1] - cameraOrigin[1],
        surf.origin[2] - cameraOrigin[2]
      );
      if (dist > 1800) continue;
      const r = 26 + Math.min(36, dist * 0.03);
      const rgba: [number, number, number, number] = [
        Math.min(255, (surf.flareColor[0] * 255) | 0),
        Math.min(255, (surf.flareColor[1] * 255) | 0),
        Math.min(255, (surf.flareColor[2] * 255) | 0),
        190,
      ];
      this.renderSpriteEntity(
        {
          reType: RefEntityType.RT_SPRITE,
          renderfx: 0,
          hModel: '',
          lightingOrigin: surf.origin,
          axis: AxisClear(),
          nonNormalizedAxes: false,
          origin: surf.origin,
          frame: 0,
          oldorigin: surf.origin,
          oldframe: 0,
          backlerp: 0,
          skinNum: 0,
          customSkin: '',
          customShader: 'flareShader',
          shaderRGBA: rgba,
          shaderTexCoord: [0, 0],
          shaderTime: 0,
          radius: r,
          rotation: 0,
        },
        viewAxis,
        timeSec
      );
    }
  }

  private renderDecals(timeSec: number): void {
    this.decals = this.decals.filter((d) => timeSec - d.spawnTime < 20.0);
    for (const dec of this.decals) {
      const n = dec.normal;
      const upRef: Vec3 = Math.abs(n[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
      const tangent: Vec3 = [0, 0, 0];
      const bitangent: Vec3 = [0, 0, 0];
      vec3Cross(n, upRef, tangent);
      vec3Normalize(tangent);
      vec3Cross(n, tangent, bitangent);
      vec3Normalize(bitangent);

      const orig: Vec3 = [0, 0, 0];
      vec3MA(dec.origin, 0.5, n, orig); // slight offset along normal
      const r = dec.radius;

      const p0: Vec3 = [
        orig[0] + (-tangent[0] - bitangent[0]) * r,
        orig[1] + (-tangent[1] - bitangent[1]) * r,
        orig[2] + (-tangent[2] - bitangent[2]) * r,
      ];
      const p1: Vec3 = [
        orig[0] + (tangent[0] - bitangent[0]) * r,
        orig[1] + (tangent[1] - bitangent[1]) * r,
        orig[2] + (tangent[2] - bitangent[2]) * r,
      ];
      const p2: Vec3 = [
        orig[0] + (tangent[0] + bitangent[0]) * r,
        orig[1] + (tangent[1] + bitangent[1]) * r,
        orig[2] + (tangent[2] + bitangent[2]) * r,
      ];
      const p3: Vec3 = [
        orig[0] + (-tangent[0] + bitangent[0]) * r,
        orig[1] + (-tangent[1] + bitangent[1]) * r,
        orig[2] + (-tangent[2] + bitangent[2]) * r,
      ];

      this.drawDynamicQuad(p0, p1, p2, p3, dec.shaderName, dec.color, timeSec);
    }
  }

  private drawDynamicQuad(
    p0: Vec3,
    p1: Vec3,
    p2: Vec3,
    p3: Vec3,
    shaderName: string,
    rgba: [number, number, number, number],
    timeSec: number
  ): void {
    const gl = this.gl;
    const pts = [p0, p1, p2, p3];
    const uvs = [
      [0, 1],
      [1, 1],
      [1, 0],
      [0, 0],
    ];

    for (let i = 0; i < 4; i++) {
      const b = i * 20;
      const p = pts[i];
      this.dynVertScratch[b + 0] = p[0];
      this.dynVertScratch[b + 1] = p[1];
      this.dynVertScratch[b + 2] = p[2];
      this.dynVertScratch[b + 3] = uvs[i][0];
      this.dynVertScratch[b + 4] = uvs[i][1];
      this.dynVertScratch[b + 5] = 0;
      this.dynVertScratch[b + 6] = 0;
      this.dynVertScratch[b + 7] = 0;
      this.dynVertScratch[b + 8] = 0;
      this.dynVertScratch[b + 9] = 1;
      this.dynVertScratch[b + 10] = rgba[0] / 255;
      this.dynVertScratch[b + 11] = rgba[1] / 255;
      this.dynVertScratch[b + 12] = rgba[2] / 255;
      this.dynVertScratch[b + 13] = rgba[3] / 255;
      this.dynVertScratch[b + 14] = p[0];
      this.dynVertScratch[b + 15] = p[1];
      this.dynVertScratch[b + 16] = p[2];
      this.dynVertScratch[b + 17] = 0;
      this.dynVertScratch[b + 18] = 0;
      this.dynVertScratch[b + 19] = 1;
    }

    this.dynIdxScratch[0] = 0;
    this.dynIdxScratch[1] = 1;
    this.dynIdxScratch[2] = 2;
    this.dynIdxScratch[3] = 0;
    this.dynIdxScratch[4] = 2;
    this.dynIdxScratch[5] = 3;

    gl.bindVertexArray(this.dynVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.dynVbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.dynVertScratch.subarray(0, 4 * 20));
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.dynIbo);
    gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, this.dynIdxScratch.subarray(0, 6));

    this.executor.setEntityTransformAndLighting(
      this.identityMat,
      0.0,
      [1, 1, 1],
      [0, 0, 0],
      [0, 0, 1]
    );

    const shader = Shaders.getShader(shaderName, false);
    this.executor.setDeformUniforms(shader.deforms);

    for (const stage of shader.stages) {
      this.executor.bindStageState(stage, shader, timeSec, rgba, false);
      const tex = this.textures.getTexture(stage.map, stage.clamp);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);
      this.stats.drawCalls++;
      this.stats.tris += 2;
    }
  }
}
