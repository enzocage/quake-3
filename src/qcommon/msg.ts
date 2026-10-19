// ============================================================================
// src/qcommon/msg.ts
// Quake III Arena Bitstream Packer & Snapshot-Delta Compressor (qcommon/msg.c)
// ============================================================================

import { PlayerState } from './q_shared';

export class Q3BitMessage {
  public buffer: Uint8Array;
  private view: DataView;
  public cursize = 0;

  constructor(maxBytes = 16384) {
    this.buffer = new Uint8Array(maxBytes);
    this.view = new DataView(this.buffer.buffer);
  }

  public writeByte(val: number): void {
    this.view.setUint8(this.cursize++, val & 0xff);
  }

  public writeShort(val: number): void {
    this.view.setInt16(this.cursize, val, true);
    this.cursize += 2;
  }

  public writeLong(val: number): void {
    this.view.setInt32(this.cursize, val | 0, true);
    this.cursize += 4;
  }

  public writeFloat(val: number): void {
    this.view.setFloat32(this.cursize, val, true);
    this.cursize += 4;
  }

  public writeDeltaPlayerState(from: PlayerState | null, to: PlayerState): void {
    let mask = 0;
    if (!from || from.origin[0] !== to.origin[0] || from.origin[1] !== to.origin[1] || from.origin[2] !== to.origin[2]) {
      mask |= 1;
    }
    if (!from || from.velocity[0] !== to.velocity[0] || from.velocity[1] !== to.velocity[1] || from.velocity[2] !== to.velocity[2]) {
      mask |= 2;
    }
    if (!from || from.health !== to.health || from.armor !== to.armor || from.weapon !== to.weapon) {
      mask |= 4;
    }

    this.writeByte(mask);
    if (mask & 1) {
      this.writeFloat(to.origin[0]);
      this.writeFloat(to.origin[1]);
      this.writeFloat(to.origin[2]);
    }
    if (mask & 2) {
      this.writeFloat(to.velocity[0]);
      this.writeFloat(to.velocity[1]);
      this.writeFloat(to.velocity[2]);
    }
    if (mask & 4) {
      this.writeShort(to.health);
      this.writeShort(to.armor);
      this.writeByte(to.weapon);
    }
  }
}
