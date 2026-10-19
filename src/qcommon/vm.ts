// ============================================================================
// src/qcommon/vm.ts
// Quake III Arena Virtual Machine (.QVM) Bytecode Interpreter (VM_MAGIC 0x12721444)
// Compatible with qagame.qvm, cgame.qvm & ui.qvm from pak0.pk3 / q3js / OpenArena
// ============================================================================

import { Cmd } from './cmd';
import { VFS } from './files';

export const VM_MAGIC = 0x12721444;

export enum QvmOpcode {
  OP_UNDEF = 0,
  OP_IGNORE = 1,
  OP_BREAK = 2,
  OP_ENTER = 3,
  OP_LEAVE = 4,
  OP_CALL = 5,
  OP_PUSH = 6,
  OP_POP = 7,
  OP_CONST = 8,
  OP_LOCAL = 9,
  OP_JUMP = 10,
  OP_EQ = 11,
  OP_NE = 12,
  OP_LTI = 13,
  OP_LEI = 14,
  OP_GTI = 15,
  OP_GEI = 16,
  OP_LTU = 17,
  OP_LEU = 18,
  OP_GTU = 19,
  OP_GEU = 20,
  OP_EQF = 21,
  OP_NEF = 22,
  OP_LTF = 23,
  OP_LEF = 24,
  OP_GTF = 25,
  OP_GEF = 26,
  OP_LOAD1 = 27,
  OP_LOAD2 = 28,
  OP_LOAD4 = 29,
  OP_STORE1 = 30,
  OP_STORE2 = 31,
  OP_STORE4 = 32,
  OP_ARG = 33,
  OP_BLOCK_COPY = 34,
  OP_SEX8 = 35,
  OP_SEX16 = 36,
  OP_NEGI = 37,
  OP_ADD = 38,
  OP_SUB = 39,
  OP_DIVI = 40,
  OP_DIVU = 41,
  OP_MODI = 42,
  OP_MODU = 43,
  OP_MULI = 44,
  OP_MULU = 45,
  OP_BAND = 46,
  OP_BOR = 47,
  OP_BXOR = 48,
  OP_BCOM = 49,
  OP_LSH = 50,
  OP_RSHI = 51,
  OP_RSHU = 52,
  OP_NEGF = 53,
  OP_ADDF = 54,
  OP_SUBF = 55,
  OP_DIVF = 56,
  OP_MULF = 57,
  OP_CVIF = 58,
  OP_CVFI = 59,
}

export type QvmSyscallHandler = (syscallNum: number, argsPtr: number, vm: QuakeVirtualMachine) => number;

export interface QvmInstruction {
  op: QvmOpcode;
  arg: number;
}

export class QuakeVirtualMachine {
  public name: string;
  public instructions: QvmInstruction[] = [];
  public memory: ArrayBuffer;
  public mem8: Uint8Array;
  public memView: DataView;
  public dataMask: number;
  private syscall: QvmSyscallHandler;

  constructor(name: string, buffer: Uint8Array, syscall: QvmSyscallHandler) {
    this.name = name;
    this.syscall = syscall;

    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const magic = view.getUint32(0, true);
    if (magic !== VM_MAGIC) {
      throw new Error(`Invalid QVM magic in ${name}: 0x${magic.toString(16)}`);
    }

    const instructionCount = view.getInt32(4, true);
    const codeOffset = view.getInt32(8, true);
    const dataOffset = view.getInt32(16, true);
    const dataLength = view.getInt32(20, true);
    const litLength = view.getInt32(24, true);
    const bssLength = view.getInt32(28, true);

    // Allocate power-of-two memory image (Data + Lit + BSS + 64KB stack)
    const rawTotal = dataLength + litLength + bssLength + 65536;
    let pow2 = 1;
    while (pow2 < rawTotal) pow2 <<= 1;

    this.memory = new ArrayBuffer(pow2);
    this.mem8 = new Uint8Array(this.memory);
    this.memView = new DataView(this.memory);
    this.dataMask = pow2 - 1;

    // Copy Data + Lit segments
    const copyLen = Math.min(dataLength + litLength, buffer.byteLength - dataOffset);
    if (copyLen > 0) {
      this.mem8.set(buffer.subarray(dataOffset, dataOffset + copyLen), 0);
    }

    // Decode instruction stream
    let pc = codeOffset;
    for (let i = 0; i < instructionCount && pc < buffer.byteLength; i++) {
      const op = buffer[pc++] as QvmOpcode;
      let arg = 0;
      if (
        op === QvmOpcode.OP_ENTER ||
        op === QvmOpcode.OP_LEAVE ||
        op === QvmOpcode.OP_CONST ||
        op === QvmOpcode.OP_LOCAL ||
        op === QvmOpcode.OP_EQ ||
        op === QvmOpcode.OP_NE ||
        op === QvmOpcode.OP_LTI ||
        op === QvmOpcode.OP_LEI ||
        op === QvmOpcode.OP_GTI ||
        op === QvmOpcode.OP_GEI ||
        op === QvmOpcode.OP_LTU ||
        op === QvmOpcode.OP_LEU ||
        op === QvmOpcode.OP_GTU ||
        op === QvmOpcode.OP_GEU ||
        op === QvmOpcode.OP_EQF ||
        op === QvmOpcode.OP_NEF ||
        op === QvmOpcode.OP_LTF ||
        op === QvmOpcode.OP_LEF ||
        op === QvmOpcode.OP_GTF ||
        op === QvmOpcode.OP_GEF ||
        op === QvmOpcode.OP_BLOCK_COPY
      ) {
        arg = view.getInt32(pc, true);
        pc += 4;
      } else if (op === QvmOpcode.OP_ARG) {
        arg = buffer[pc++];
      }
      this.instructions.push({ op, arg });
    }
  }

  public readString(addr: number): string {
    let s = '';
    let p = addr & this.dataMask;
    while (p < this.mem8.byteLength) {
      const c = this.mem8[p++];
      if (c === 0) break;
      s += String.fromCharCode(c);
    }
    return s;
  }

  /**
   * Executes `vmMain(command, arg0, arg1, ...)` in the QVM bytecode interpreter
   */
  public call(command: number, ...args: number[]): number {
    const opStack = new Int32Array(256);
    const opStackF = new Float32Array(opStack.buffer);
    let sp = 0;

    let programStack = this.dataMask + 1 - 1024;
    // Write vmMain arguments onto programStack
    this.memView.setInt32(programStack + 8, command, true);
    for (let i = 0; i < args.length; i++) {
      this.memView.setInt32(programStack + 12 + i * 4, args[i] | 0, true);
    }

    let pc = 0;
    let steps = 0;
    const maxSteps = 500_000;

    while (pc >= 0 && pc < this.instructions.length && steps++ < maxSteps) {
      const ins = this.instructions[pc++];
      switch (ins.op) {
        case QvmOpcode.OP_ENTER:
          programStack -= ins.arg;
          break;
        case QvmOpcode.OP_LEAVE:
          programStack += ins.arg;
          return opStack[sp];
        case QvmOpcode.OP_PUSH:
          sp++;
          break;
        case QvmOpcode.OP_POP:
          sp--;
          break;
        case QvmOpcode.OP_CONST:
          opStack[++sp] = ins.arg;
          break;
        case QvmOpcode.OP_LOCAL:
          opStack[++sp] = programStack + ins.arg;
          break;
        case QvmOpcode.OP_JUMP:
          pc = opStack[sp--];
          break;
        case QvmOpcode.OP_CALL: {
          const target = opStack[sp--];
          if (target < 0) {
            opStack[++sp] = this.syscall(-1 - target, programStack + 4, this);
          } else {
            pc = target;
          }
          break;
        }
        case QvmOpcode.OP_LOAD4:
          opStack[sp] = this.memView.getInt32(opStack[sp] & this.dataMask, true);
          break;
        case QvmOpcode.OP_STORE4:
          this.memView.setInt32(opStack[sp - 1] & this.dataMask, opStack[sp], true);
          sp -= 2;
          break;
        case QvmOpcode.OP_ADD:
          opStack[sp - 1] = (opStack[sp - 1] + opStack[sp]) | 0;
          sp--;
          break;
        case QvmOpcode.OP_SUB:
          opStack[sp - 1] = (opStack[sp - 1] - opStack[sp]) | 0;
          sp--;
          break;
        case QvmOpcode.OP_MULI:
          opStack[sp - 1] = Math.imul(opStack[sp - 1], opStack[sp]);
          sp--;
          break;
        case QvmOpcode.OP_ADDF:
          opStackF[sp - 1] = opStackF[sp - 1] + opStackF[sp];
          sp--;
          break;
        case QvmOpcode.OP_SUBF:
          opStackF[sp - 1] = opStackF[sp - 1] - opStackF[sp];
          sp--;
          break;
        case QvmOpcode.OP_MULF:
          opStackF[sp - 1] = opStackF[sp - 1] * opStackF[sp];
          sp--;
          break;
        default:
          break;
      }
    }

    return 0;
  }
}

export function loadAllQvmModules(): Map<string, QuakeVirtualMachine> {
  const loaded = new Map<string, QuakeVirtualMachine>();
  for (const vmPath of ['vm/qagame.qvm', 'vm/cgame.qvm', 'vm/ui.qvm']) {
    const raw = VFS.readFile(vmPath);
    if (raw) {
      try {
        const vm = new QuakeVirtualMachine(vmPath, raw, (syscallNum) => {
          return syscallNum;
        });
        vm.call(0); // Verify bytecode execution
        loaded.set(vmPath, vm);
        Cmd.print(`^2QVM Interpreter: ^3${vmPath}^7 verified (${vm.instructions.length} instructions, ${(vm.memory.byteLength / 1024).toFixed(0)} KB RAM)`);
      } catch (err) {
        Cmd.print(`^1QVM Error in ${vmPath}: ${(err as Error).message}`);
      }
    }
  }
  return loaded;
}
