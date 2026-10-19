// ============================================================================
// src/ui/cin_roq.ts
// Quake III Arena .RoQ Video Stream Decoder (RoQ_INFO, RoQ_QUAD_CODEBOOK, VQ)
// ============================================================================

export const RoQ_IDENT = 0x1084;
export const RoQ_INFO = 0x1001;
export const RoQ_QUAD_CODEBOOK = 0x1002;
export const RoQ_QUAD_VQ = 0x1011;
export const RoQ_SOUND_MONO22 = 0x1020;
export const RoQ_SOUND_STEREO22 = 0x1021;

export class RoqVideoDecoder {
  public width = 0;
  public height = 0;
  public frameBuffer: Uint8Array = new Uint8Array(0);

  public inspectHeader(buffer: Uint8Array): boolean {
    if (buffer.byteLength < 8) return false;
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const id = view.getUint16(0, true);
    return id === RoQ_IDENT;
  }
}
