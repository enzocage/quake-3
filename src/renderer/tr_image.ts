// ============================================================================
// src/renderer/tr_image.ts
// Quake III Arena Texture Manager — .TGA (Uncompressed & RLE Type 2/3/10),
// .JPG/.PNG Decoder, Procedural Texture Synthesis & WebGL2 Mipmap Upload
// ============================================================================

import { VFS } from '../qcommon/files';

export interface DecodedImage {
  width: number;
  height: number;
  data: Uint8Array; // RGBA8
}

export class TextureManager {
  private gl: WebGL2RenderingContext;
  private cache = new Map<string, WebGLTexture>();
  public whiteTexture: WebGLTexture;
  public defaultTexture: WebGLTexture;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.whiteTexture = this.createSolidTexture(255, 255, 255, 255);
    this.defaultTexture = this.createCheckerTexture();
    this.cache.set('$whiteimage', this.whiteTexture);
    this.cache.set('*white', this.whiteTexture);
    this.cache.set('*default', this.defaultTexture);
  }

  public getTexture(rawName: string, clampToEdge = false): WebGLTexture {
    if (!rawName || rawName === '$whiteimage' || rawName === '*white') {
      return this.whiteTexture;
    }
    const key = VFS.stripExtension(rawName) + (clampToEdge ? '|clamp' : '');
    const cached = this.cache.get(key);
    if (cached) return cached;

    const found = VFS.findImageFile(rawName);
    if (found) {
      if (found.ext === '.tga') {
        const decoded = decodeTga(found.data);
        if (decoded) {
          const tex = this.uploadRGBA(decoded.width, decoded.height, decoded.data, clampToEdge);
          this.cache.set(key, tex);
          return tex;
        }
      } else {
        // Async decode for .jpg / .png / .webp with immediate placeholder
        const placeholder = this.createProceduralFallback(rawName, clampToEdge);
        this.cache.set(key, placeholder);
        this.decodeBrowserImageIntoTexture(found.data, found.ext, placeholder, clampToEdge);
        return placeholder;
      }
    }

    const fallback = this.createProceduralFallback(rawName, clampToEdge);
    this.cache.set(key, fallback);
    return fallback;
  }

  public uploadRGBA(
    width: number,
    height: number,
    rgba: Uint8Array,
    clampToEdge = false
  ): WebGLTexture {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      rgba
    );
    gl.generateMipmap(gl.TEXTURE_2D);

    const wrap = clampToEdge ? gl.CLAMP_TO_EDGE : gl.REPEAT;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const ext = gl.getExtension('EXT_texture_filter_anisotropic');
    if (ext) {
      const maxAniso = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
      gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, maxAniso));
    }

    return tex;
  }

  private decodeBrowserImageIntoTexture(
    bytes: Uint8Array,
    ext: string,
    targetTex: WebGLTexture,
    clampToEdge: boolean
  ): void {
    const mime =
      ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], { type: mime });
    createImageBitmap(blob)
      .then((bmp) => {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, targetTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bmp);
        gl.generateMipmap(gl.TEXTURE_2D);
        const wrap = clampToEdge ? gl.CLAMP_TO_EDGE : gl.REPEAT;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
      })
      .catch(() => {});
  }

  private createSolidTexture(r: number, g: number, b: number, a: number): WebGLTexture {
    return this.uploadRGBA(2, 2, new Uint8Array([r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a]), true);
  }

  private createCheckerTexture(): WebGLTexture {
    const w = 64, h = 64;
    const data = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const c = ((x >> 3) ^ (y >> 3)) & 1 ? 150 : 65;
        data[i + 0] = c;
        data[i + 1] = c;
        data[i + 2] = c + 10;
        data[i + 3] = 255;
      }
    }
    return this.uploadRGBA(w, h, data, false);
  }

  private createProceduralFallback(name: string, clampToEdge: boolean): WebGLTexture {
    const lower = name.toLowerCase();
    const w = 64, h = 64;
    const data = new Uint8Array(w * h * 4);

    // Pick thematic colors based on shader/texture path
    let br = 110, bg = 105, bb = 100;
    if (lower.includes('lava') || lower.includes('fire') || lower.includes('flame')) {
      br = 235; bg = 85; bb = 15;
    } else if (lower.includes('water') || lower.includes('slime') || lower.includes('teleport') || lower.includes('quad')) {
      br = 50; bg = 140; bb = 235;
    } else if (lower.includes('sky') || lower.includes('space')) {
      br = 28; bg = 35; bb = 72;
    } else if (lower.includes('jumppad') || lower.includes('bounce')) {
      br = 215; bg = 140; bb = 35;
    } else if (lower.includes('metal') || lower.includes('clang')) {
      br = 95; bg = 102; bb = 115;
    }

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const border = x < 2 || y < 2 || x > 61 || y > 61 ? 0.65 : 1.0;
        const pat = 0.88 + 0.12 * Math.sin(x * 0.35) * Math.cos(y * 0.35);
        data[i + 0] = Math.min(255, (br * border * pat) | 0);
        data[i + 1] = Math.min(255, (bg * border * pat) | 0);
        data[i + 2] = Math.min(255, (bb * border * pat) | 0);
        data[i + 3] = 255;
      }
    }
    return this.uploadRGBA(w, h, data, clampToEdge);
  }
}

/**
 * Full Quake III .TGA Decoder (LoadTGA in tr_image.c)
 * Supports Type 2 (Uncompressed RGB/RGBA), Type 3 (Grayscale), Type 10 (RLE RGB/RGBA)
 */
export function decodeTga(buffer: Uint8Array): DecodedImage | null {
  if (buffer.byteLength < 18) return null;
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  const idLength = view.getUint8(0);
  const colormapType = view.getUint8(1);
  const imageType = view.getUint8(2);
  const width = view.getUint16(12, true);
  const height = view.getUint16(14, true);
  const pixelSize = view.getUint8(16); // 8, 24, or 32
  const attributes = view.getUint8(17);

  if (colormapType !== 0 || width <= 0 || height <= 0) return null;
  if (imageType !== 2 && imageType !== 3 && imageType !== 10) return null;

  const topLeftOrigin = (attributes & 0x20) !== 0;
  const out = new Uint8Array(width * height * 4);
  let srcPtr = 18 + idLength;
  const bytesPerPixel = pixelSize >> 3;

  const writePixel = (pixelIndex: number, r: number, g: number, b: number, a: number) => {
    const x = pixelIndex % width;
    const rawY = (pixelIndex / width) | 0;
    const y = topLeftOrigin ? rawY : height - 1 - rawY;
    const dst = (y * width + x) * 4;
    out[dst + 0] = r;
    out[dst + 1] = g;
    out[dst + 2] = b;
    out[dst + 3] = a;
  };

  const totalPixels = width * height;

  if (imageType === 2 || imageType === 3) {
    for (let p = 0; p < totalPixels && srcPtr + bytesPerPixel <= buffer.byteLength; p++) {
      if (bytesPerPixel === 1) {
        const v = buffer[srcPtr++];
        writePixel(p, v, v, v, 255);
      } else if (bytesPerPixel === 3) {
        const b = buffer[srcPtr++];
        const g = buffer[srcPtr++];
        const r = buffer[srcPtr++];
        writePixel(p, r, g, b, 255);
      } else if (bytesPerPixel === 4) {
        const b = buffer[srcPtr++];
        const g = buffer[srcPtr++];
        const r = buffer[srcPtr++];
        const a = buffer[srcPtr++];
        writePixel(p, r, g, b, a);
      }
    }
  } else if (imageType === 10) {
    // RLE Compressed
    let p = 0;
    while (p < totalPixels && srcPtr < buffer.byteLength) {
      const packetHeader = buffer[srcPtr++];
      const packetSize = 1 + (packetHeader & 0x7f);
      if (packetHeader & 0x80) {
        // RLE run packet
        const b = buffer[srcPtr++];
        const g = bytesPerPixel > 1 ? buffer[srcPtr++] : b;
        const r = bytesPerPixel > 2 ? buffer[srcPtr++] : b;
        const a = bytesPerPixel > 3 ? buffer[srcPtr++] : 255;
        for (let j = 0; j < packetSize && p < totalPixels; j++, p++) {
          writePixel(p, r, g, b, a);
        }
      } else {
        // Raw packet
        for (let j = 0; j < packetSize && p < totalPixels && srcPtr + bytesPerPixel <= buffer.byteLength; j++, p++) {
          const b = buffer[srcPtr++];
          const g = bytesPerPixel > 1 ? buffer[srcPtr++] : b;
          const r = bytesPerPixel > 2 ? buffer[srcPtr++] : b;
          const a = bytesPerPixel > 3 ? buffer[srcPtr++] : 255;
          writePixel(p, r, g, b, a);
        }
      }
    }
  }

  return { width, height, data: out };
}
