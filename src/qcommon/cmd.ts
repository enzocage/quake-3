// ============================================================================
// src/qcommon/cmd.ts
// Quake III Arena Command Buffer, Tokenizer (COM_ParseExt) & Console Dispatcher
// ============================================================================

import { Cvars } from './cvar';

export type CommandHandler = (args: string[]) => void;

/**
 * Stateful Quake III Script Tokenizer (COM_ParseExt in q_shared.c)
 * Used for .shader scripts, .bsp entity lumps, animation.cfg, .skin files, and console commands
 */
export class Q3Tokenizer {
  private text: string;
  private pos = 0;
  private len: number;

  constructor(text: string) {
    this.text = text;
    this.len = text.length;
  }

  public eof(): boolean {
    return this.pos >= this.len;
  }

  /**
   * Parses the next token.
   * @param allowLineBreaks If false, returns '' if a newline is encountered before a token.
   */
  public nextToken(allowLineBreaks = true): string {
    while (this.pos < this.len) {
      // Skip whitespace
      while (this.pos < this.len) {
        const ch = this.text.charCodeAt(this.pos);
        if (ch > 32) break;
        if (!allowLineBreaks && ch === 10) {
          return '';
        }
        this.pos++;
      }

      if (this.pos >= this.len) return '';

      // Skip // single-line comments
      if (this.text[this.pos] === '/' && this.text[this.pos + 1] === '/') {
        while (this.pos < this.len && this.text.charCodeAt(this.pos) !== 10) {
          this.pos++;
        }
        continue;
      }

      // Skip /* multi-line comments */
      if (this.text[this.pos] === '/' && this.text[this.pos + 1] === '*') {
        this.pos += 2;
        while (
          this.pos < this.len &&
          !(this.text[this.pos] === '*' && this.text[this.pos + 1] === '/')
        ) {
          this.pos++;
        }
        if (this.pos < this.len) this.pos += 2;
        continue;
      }

      break;
    }

    if (this.pos >= this.len) return '';

    // Quoted string
    if (this.text[this.pos] === '"') {
      this.pos++;
      const start = this.pos;
      while (this.pos < this.len && this.text[this.pos] !== '"') {
        this.pos++;
      }
      const token = this.text.slice(start, this.pos);
      if (this.pos < this.len) this.pos++; // skip closing quote
      return token;
    }

    // Single-character braces
    if (this.text[this.pos] === '{' || this.text[this.pos] === '}') {
      return this.text[this.pos++];
    }

    // Regular word token
    const start = this.pos;
    while (this.pos < this.len) {
      const ch = this.text.charCodeAt(this.pos);
      if (ch <= 32) break;
      const c = this.text[this.pos];
      if (c === '{' || c === '}' || c === '"') break;
      if (c === '/' && (this.text[this.pos + 1] === '/' || this.text[this.pos + 1] === '*')) {
        break;
      }
      this.pos++;
    }

    return this.text.slice(start, this.pos);
  }

  public skipRestOfLine(): void {
    while (this.pos < this.len && this.text.charCodeAt(this.pos) !== 10) {
      this.pos++;
    }
    if (this.pos < this.len) this.pos++;
  }

  public skipBracedSection(initialDepth = 1): void {
    let depth = initialDepth;
    while (depth > 0 && !this.eof()) {
      const tok = this.nextToken(true);
      if (!tok) break;
      if (tok === '{') depth++;
      else if (tok === '}') depth--;
    }
  }
}

class CommandSystem {
  private commands = new Map<string, CommandHandler>();
  private logListeners: Array<(msg: string) => void> = [];
  private logHistory: string[] = [];

  constructor() {
    this.addCommand('cvarlist', () => {
      const all = Cvars.listAll();
      for (const c of all) {
        this.print(`  ^5${c.name}^7 = "${c.string}"`);
      }
      this.print(`${all.length} total cvars`);
    });

    this.addCommand('cmdlist', () => {
      const names = this.listCommands();
      this.print(`^3Available commands (${names.length}): ^7${names.join(', ')}`);
    });

    this.addCommand('set', (args) => {
      if (args.length < 3) {
        this.print('usage: set <variable> <value>');
        return;
      }
      Cvars.set(args[1], args.slice(2).join(' '));
      this.print(`^2${args[1]} ^7set to "${Cvars.variableString(args[1])}"`);
    });

    this.addCommand('toggle', (args) => {
      if (args.length < 2) return;
      const cur = Cvars.variableIntegerValue(args[1]);
      Cvars.set(args[1], cur ? '0' : '1');
      this.print(`^2${args[1]} ^7toggled to ${Cvars.variableString(args[1])}`);
    });
  }

  public addCommand(name: string, handler: CommandHandler): void {
    this.commands.set(name.toLowerCase(), handler);
  }

  public executeText(line: string): void {
    const clean = line.trim().replace(/^[\/\\]+/, '');
    if (!clean) return;

    const parts = clean.split(';').map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      const tokenizer = new Q3Tokenizer(part);
      const args: string[] = [];
      while (!tokenizer.eof()) {
        const tok = tokenizer.nextToken(false);
        if (!tok) break;
        args.push(tok);
      }
      if (args.length === 0) continue;

      const cmdName = args[0].toLowerCase();
      const handler = this.commands.get(cmdName);
      if (handler) {
        handler(args);
        continue;
      }

      // Check if it's a Cvar
      const existing = Cvars.listAll().find((c) => c.name.toLowerCase() === cmdName);
      if (existing || args.length === 2) {
        if (args.length === 1) {
          const v = Cvars.get(cmdName);
          this.print(`"${v.name}" is:"${v.string}^7" default:"${v.resetString}^7"`);
        } else {
          Cvars.set(cmdName, args.slice(1).join(' '));
          this.print(`^5${cmdName}^7 = "${Cvars.variableString(cmdName)}"`);
        }
        continue;
      }

      this.print(`^1Unknown command "${args[0]}"`);
    }
  }

  public print(msg: string): void {
    this.logHistory.push(msg);
    if (this.logHistory.length > 300) {
      this.logHistory.shift();
    }
    for (const listener of this.logListeners) {
      listener(msg);
    }
  }

  public onLog(listener: (msg: string) => void): void {
    this.logListeners.push(listener);
  }

  public getLogs(): string[] {
    return this.logHistory;
  }

  public listCommands(): string[] {
    return Array.from(this.commands.keys()).sort();
  }
}

export const Cmd = new CommandSystem();
