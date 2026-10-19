// ============================================================================
// src/qcommon/files.ts
// Quake III Arena Virtual File System (VFS) — .PK3 (ZIP) Mount, IndexedDB Cache,
// Case-Insensitive Path Resolution, Extension Fallback & NeonKnightOA Loader
// ============================================================================

import { unzipSync } from 'fflate';
import { Cmd } from './cmd';

export interface VfsPakMount {
  name: string;
  priority: number; // Higher priority overrides lower (e.g. pak8 > pak0 > nk-oa-assets)
  files: Map<string, Uint8Array>;
}

const IDB_NAME = 'q3_arena_vfs_db_v1';
const IDB_STORE = 'pk3_archives';

export class VirtualFileSystem {
  private mounts: VfsPakMount[] = [];
  private looseFiles = new Map<string, Uint8Array>();
  private textDecoder = new TextDecoder('utf-8');
  private changeListeners: Array<() => void> = [];

  public normalizePath(rawPath: string): string {
    return rawPath
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
      .replace(/\/+/g, '/')
      .trim()
      .toLowerCase();
  }

  public stripExtension(path: string): string {
    const norm = this.normalizePath(path);
    const dot = norm.lastIndexOf('.');
    const slash = norm.lastIndexOf('/');
    if (dot > slash) {
      return norm.slice(0, dot);
    }
    return norm;
  }

  /**
   * Mounts a .PK3 (Standard ZIP) archive into the VFS
   */
  public mountPk3(name: string, buffer: ArrayBuffer | Uint8Array, priority = 10, saveToIdb = false): number {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const unzipped = unzipSync(bytes);
    const fileMap = new Map<string, Uint8Array>();
    let count = 0;

    for (const [entryPath, data] of Object.entries(unzipped)) {
      if (entryPath.endsWith('/') || data.byteLength === 0) continue;
      const norm = this.normalizePath(entryPath);
      fileMap.set(norm, data);
      count++;
    }

    // Remove existing mount with same name
    this.mounts = this.mounts.filter((m) => m.name.toLowerCase() !== name.toLowerCase());
    this.mounts.push({
      name,
      priority,
      files: fileMap,
    });

    // Sort mounts descending by priority, then descending alphabetically (pak8 > pak0)
    this.mounts.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.name.localeCompare(a.name, undefined, { numeric: true });
    });

    Cmd.print(`^2VFS: Mounted ^3${name}^7 (${count} files, priority ${priority})`);

    if (saveToIdb) {
      this.savePk3ToIdb(name, bytes, priority).catch(() => {});
    }

    this.notifyChange();
    return count;
  }

  /**
   * Mounts a single loose file (e.g., dropped .bsp, .md3, .shader, .wav, .tga)
   */
  public writeFile(path: string, data: Uint8Array | string): void {
    const norm = this.normalizePath(path);
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    this.looseFiles.set(norm, bytes);
  }

  /**
   * Reads a file by exact normalized path (or returns null)
   */
  public readFile(path: string): Uint8Array | null {
    const norm = this.normalizePath(path);
    const loose = this.looseFiles.get(norm);
    if (loose) return loose;

    for (const mount of this.mounts) {
      const hit = mount.files.get(norm);
      if (hit) return hit;
    }
    return null;
  }

  /**
   * Checks whether a file exists in the VFS
   */
  public fileExists(path: string): boolean {
    return this.readFile(path) !== null;
  }

  /**
   * Reads a file as UTF-8 text
   */
  public readTextFile(path: string): string | null {
    const data = this.readFile(path);
    if (!data) return null;
    return this.textDecoder.decode(data);
  }

  /**
   * Quake 3 R_FindImageFile logic:
   * Resolves image path by trying exact path, then .tga, .jpg, .png, .webp
   */
  public findImageFile(path: string): { path: string; data: Uint8Array; ext: string } | null {
    const base = this.stripExtension(path);
    const extensions = ['.tga', '.jpg', '.jpeg', '.png', '.webp'];

    for (const ext of extensions) {
      const candidate = base + ext;
      const data = this.readFile(candidate);
      if (data) {
        return { path: candidate, data, ext };
      }
    }
    return null;
  }

  /**
   * Lists all files across all mounted PK3s matching prefix and extension
   */
  public listFiles(dirPrefix = '', extension = ''): string[] {
    const normPrefix = this.normalizePath(dirPrefix);
    const normExt = extension.toLowerCase();
    const results = new Set<string>();

    for (const k of this.looseFiles.keys()) {
      if ((!normPrefix || k.startsWith(normPrefix)) && (!normExt || k.endsWith(normExt))) {
        results.add(k);
      }
    }
    for (const mount of this.mounts) {
      for (const k of mount.files.keys()) {
        if ((!normPrefix || k.startsWith(normPrefix)) && (!normExt || k.endsWith(normExt))) {
          results.add(k);
        }
      }
    }
    return Array.from(results).sort();
  }

  public getMountedPaksSummary(): string {
    const totalFiles = this.mounts.reduce((acc, m) => acc + m.files.size, 0) + this.looseFiles.size;
    return `${this.mounts.length} PK3s (${totalFiles} files)`;
  }

  public onChange(cb: () => void): void {
    this.changeListeners.push(cb);
  }

  private notifyChange(): void {
    for (const cb of this.changeListeners) cb();
  }

  /**
   * Loads cached user/downloaded PK3 archives from IndexedDB
   */
  public async loadCachedPk3sFromIdb(): Promise<void> {
    if (typeof indexedDB === 'undefined') return;
    try {
      const db = await this.openIdb();
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.getAll();
      const records: Array<{ name: string; bytes: Uint8Array; priority: number }> = await new Promise(
        (resolve, reject) => {
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        }
      );
      for (const rec of records) {
        this.mountPk3(rec.name, rec.bytes, rec.priority, false);
      }
    } catch {
      // ignore IndexedDB unavailable
    }
  }

  private async savePk3ToIdb(name: string, bytes: Uint8Array, priority: number): Promise<void> {
    if (typeof indexedDB === 'undefined') return;
    const db = await this.openIdb();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.put({ name, bytes, priority });
  }

  private openIdb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'name' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Fetches and mounts open-source Quake 3 / OpenArena assets directly from
   * NeonKnightOA/nk-oa-assets on GitHub (raw.githubusercontent.com)
   */
  public async fetchNeonKnightOAAssets(onProgress?: (status: string) => void): Promise<number> {
    const baseUrl = 'https://raw.githubusercontent.com/NeonKnightOA/nk-oa-assets/master';
    const assetList = [
      'scripts/common.shader',
      'scripts/gfx.shader',
      'scripts/models.shader',
      'scripts/sfx.shader',
      'scripts/sky.shader',
      'scripts/liquid.shader',
      'scripts/oa_fogs.shader',
      'scripts/weapons.shader',
      'scripts/bots.txt',
      'scripts/arenas.txt',
    ];

    let fetched = 0;
    for (const relPath of assetList) {
      try {
        onProgress?.(`Lade nk-oa-assets: ${relPath}...`);
        const res = await fetch(`${baseUrl}/${relPath}`);
        if (res.ok) {
          const buf = new Uint8Array(await res.arrayBuffer());
          this.writeFile(relPath, buf);
          fetched++;
        }
      } catch {
        // continue if offline
      }
    }
    if (fetched > 0) {
      Cmd.print(`^2NeonKnightOA/nk-oa-assets: ^7${fetched} Original-Skripte/Shader erfolgreich gemountet.`);
      this.notifyChange();
    }
    return fetched;
  }
}

export const VFS = new VirtualFileSystem();
