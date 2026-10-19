// ============================================================================
// src/renderer/tr_lightmap.ts
// Quake III Arena Lightmap Atlas Packer (LUMP_LIGHTMAPS 128x128x3 -> 2048x2048)
// with R_ColorShiftLightingBytes Overbright Scaling (r_mapOverBrightBits)
// ============================================================================

import { Cvars } from '../qcommon/cvar';
import { Vec2 } from '../qcommon/q_shared';

export const LIGHTMAP_PAGE_SIZE = 128;
export const LIGHTMAP_ATLAS_SIZE = 2048; // 16x16 grid = up to 256 lightmaps per BSP!
export const LIGHTMAP_GRID_DIM = LIGHTMAP_ATLAS_SIZE / LIGHTMAP_PAGE_SIZE; // 16

export class LightmapAtlas {
  public texture: WebGLTexture;
  public numLightmaps = 0;

  constructor(gl: WebGL2RenderingContext, rawLump14: Uint8Array) {
    const pageBytes = LIGHTMAP_PAGE_SIZE * LIGHTMAP_PAGE_SIZE * 3; // 49152 bytes
    this.numLightmaps = Math.floor(rawLump14.byteLength / pageBytes);

    const atlasRGBA = new Uint8Array(LIGHTMAP_ATLAS_SIZE * LIGHTMAP_ATLAS_SIZE * 4);
    // Fill default white for unlit surfaces (lightmapNum < 0) at last cell (15, 15)
    atlasRGBA.fill(255);

    const overbrightShift = Math.max(0, Cvars.variableIntegerValue('r_mapOverBrightBits'));

    for (let i = 0; i < Math.min(this.numLightmaps, 255); i++) {
      const gridX = (i % LIGHTMAP_GRID_DIM) * LIGHTMAP_PAGE_SIZE;
      const gridY = Math.floor(i / LIGHTMAP_GRID_DIM) * LIGHTMAP_PAGE_SIZE;
      const srcBase = i * pageBytes;

      for (let y = 0; y < LIGHTMAP_PAGE_SIZE; y++) {
        for (let x = 0; x < LIGHTMAP_PAGE_SIZE; x++) {
          const srcIdx = srcBase + (y * LIGHTMAP_PAGE_SIZE + x) * 3;
          let r = rawLump14[srcIdx + 0] << overbrightShift;
          let g = rawLump14[srcIdx + 1] << overbrightShift;
          let b = rawLump14[srcIdx + 2] << overbrightShift;

          // R_ColorShiftLightingBytes: preserve color hue ratio when clamping > 255
          if ((r | g | b) > 255) {
            const max = r > g ? (r > b ? r : b) : g > b ? g : b;
            r = ((r * 255) / max) | 0;
            g = ((g * 255) / max) | 0;
            b = ((b * 255) / max) | 0;
          }

          const dstIdx = ((gridY + y) * LIGHTMAP_ATLAS_SIZE + (gridX + x)) * 4;
          atlasRGBA[dstIdx + 0] = r;
          atlasRGBA[dstIdx + 1] = g;
          atlasRGBA[dstIdx + 2] = b;
          atlasRGBA[dstIdx + 3] = 255;
        }
      }
    }

    this.texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      LIGHTMAP_ATLAS_SIZE,
      LIGHTMAP_ATLAS_SIZE,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      atlasRGBA
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  /**
   * Remaps a local [0..1] surface lightmap UV into the global 2048x2048 Lightmap Atlas UV
   */
  public remapUV(lightmapNum: number, u: number, v: number): Vec2 {
    const slot = lightmapNum >= 0 && lightmapNum < 255 ? lightmapNum : 255; // 255 = pure white cell
    const cellX = slot % LIGHTMAP_GRID_DIM;
    const cellY = Math.floor(slot / LIGHTMAP_GRID_DIM);
    const scale = 1.0 / LIGHTMAP_GRID_DIM;
    // Clamp slightly inward by half a texel to avoid bleeding across atlas borders
    const halfTexel = 0.5 / LIGHTMAP_PAGE_SIZE;
    const cu = Math.max(halfTexel, Math.min(1.0 - halfTexel, u));
    const cv = Math.max(halfTexel, Math.min(1.0 - halfTexel, v));
    return [(cellX + cu) * scale, (cellY + cv) * scale];
  }
}
