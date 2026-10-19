// ============================================================================
// src/cgame/cg_draw.ts
// Quake III Arena Authentic 2D/3D HUD using Original 1999 id Software .TGA
// Graphics from pak0.pk3:
//   - Big Status-Bar Digits: gfx/2d/numbers/zero_32b.tga .. nine_32b.tga
//   - Crosshairs: gfx/2d/crosshaira.tga .. crosshairj.tga
//   - Weapon & Status Icons: icons/iconw_*.tga, iconh_red.tga, iconr_yellow.tga
//   - Character Portraits: models/players/*/icon_default.tga
//   - Medals: menu/medals/medal_impressive.tga, medal_excellent.tga, medal_gauntlet.tga
// ============================================================================

import { WEAPON_SPECS } from '../game/bg_misc';
import { Q3GameArena } from '../game/g_main';
import { Cmd } from '../qcommon/cmd';
import { Cvars } from '../qcommon/cvar';
import { VFS } from '../qcommon/files';
import { PmType, Powerup, Weapon } from '../qcommon/q_shared';
import { decodeTga } from '../renderer/tr_image';

const Q3_COLOR_TABLE: Record<string, string> = {
  '0': '#222222',
  '1': '#ff3322',
  '2': '#33ff44',
  '3': '#ffee22',
  '4': '#3388ff',
  '5': '#22eeff',
  '6': '#ff44ff',
  '7': '#ffffff',
};

const DIGIT_TGA_NAMES: Record<string, string> = {
  '0': 'gfx/2d/numbers/zero_32b.tga',
  '1': 'gfx/2d/numbers/one_32b.tga',
  '2': 'gfx/2d/numbers/two_32b.tga',
  '3': 'gfx/2d/numbers/three_32b.tga',
  '4': 'gfx/2d/numbers/four_32b.tga',
  '5': 'gfx/2d/numbers/five_32b.tga',
  '6': 'gfx/2d/numbers/six_32b.tga',
  '7': 'gfx/2d/numbers/seven_32b.tga',
  '8': 'gfx/2d/numbers/eight_32b.tga',
  '9': 'gfx/2d/numbers/nine_32b.tga',
  '-': 'gfx/2d/numbers/minus_32b.tga',
};

const MEDAL_TGA_MAP: Record<string, string> = {
  IMPRESSIVE: 'menu/medals/medal_impressive.tga',
  EXCELLENT: 'menu/medals/medal_excellent.tga',
  HUMILIATION: 'menu/medals/medal_gauntlet.tga',
  ACCURACY: 'menu/medals/medal_accuracy.tga',
};

export class CgHudAndConsole {
  private ctx: CanvasRenderingContext2D;
  public consoleOpen = false;
  public scoreboardOpen = false;
  public consoleInput = '';
  private cmdHistory: string[] = [];
  private historyIndex = -1;
  private fps = 60;
  private frameCounter = 0;
  private lastFpsSampleMs = performance.now();

  // Cache of decoded 1999 .TGA HUD Sprites from pak0.pk3 as Offscreen/HTMLCanvasElement
  private hudSpriteCache = new Map<string, HTMLCanvasElement | null>();

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    VFS.onChange(() => {
      this.hudSpriteCache.clear();
    });
  }

  /**
   * Decodes an original 1999 Quake 3 .TGA sprite from VFS into a cached canvas
   */
  private getHudSprite(path: string, tintColor?: [number, number, number]): HTMLCanvasElement | null {
    const cacheKey = tintColor ? `${path}#${tintColor.join(',')}` : path;
    if (this.hudSpriteCache.has(cacheKey)) {
      return this.hudSpriteCache.get(cacheKey)!;
    }

    const norm = VFS.normalizePath(path);
    const candidates = [norm, norm.replace(/\.(tga|jpg|png)$/i, '') + '.tga'];
    for (const cand of candidates) {
      const bytes = VFS.readFile(cand);
      if (bytes && cand.endsWith('.tga')) {
        try {
          const decoded = decodeTga(bytes);
          if (!decoded) continue;
          const c = document.createElement('canvas');
          c.width = decoded.width;
          c.height = decoded.height;
          const cctx = c.getContext('2d')!;
          const imgData = cctx.createImageData(decoded.width, decoded.height);
          const src = decoded.data;
          const dst = imgData.data;

          if (tintColor) {
            const [tr, tg, tb] = tintColor;
            for (let i = 0; i < src.length; i += 4) {
              dst[i] = (src[i] * tr) >> 8;
              dst[i + 1] = (src[i + 1] * tg) >> 8;
              dst[i + 2] = (src[i + 2] * tb) >> 8;
              dst[i + 3] = src[i + 3];
            }
          } else {
            dst.set(src);
          }

          cctx.putImageData(imgData, 0, 0);
          this.hudSpriteCache.set(cacheKey, c);
          return c;
        } catch {
          // fallback below
        }
      }
    }

    this.hudSpriteCache.set(cacheKey, null);
    return null;
  }

  public handleConsoleKeyDown(e: KeyboardEvent): boolean {
    if (e.key === '`' || e.key === '~' || e.key === '^' || e.code === 'Backquote') {
      e.preventDefault();
      this.consoleOpen = !this.consoleOpen;
      return true;
    }

    if (!this.consoleOpen) return false;

    e.preventDefault();
    if (e.key === 'Escape') {
      this.consoleOpen = false;
    } else if (e.key === 'Enter') {
      const cmdText = this.consoleInput.trim();
      if (cmdText) {
        Cmd.print(`^3] ${cmdText}`);
        this.cmdHistory.push(cmdText);
        this.historyIndex = this.cmdHistory.length;
        Cmd.executeText(cmdText);
      }
      this.consoleInput = '';
    } else if (e.key === 'Backspace') {
      this.consoleInput = this.consoleInput.slice(0, -1);
    } else if (e.key === 'ArrowUp') {
      if (this.cmdHistory.length > 0) {
        this.historyIndex = Math.max(0, this.historyIndex - 1);
        this.consoleInput = this.cmdHistory[this.historyIndex] || '';
      }
    } else if (e.key === 'ArrowDown') {
      if (this.historyIndex < this.cmdHistory.length - 1) {
        this.historyIndex++;
        this.consoleInput = this.cmdHistory[this.historyIndex] || '';
      } else {
        this.historyIndex = this.cmdHistory.length;
        this.consoleInput = '';
      }
    } else if (e.key === 'Tab') {
      this.autocompleteConsoleInput();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      this.consoleInput += e.key;
    }

    return true;
  }

  private autocompleteConsoleInput(): void {
    const clean = this.consoleInput.trim().replace(/^[\/\\]+/, '').toLowerCase();
    if (!clean) return;
    const candidates = [
      ...Cmd.listCommands(),
      ...Cvars.listAll().map((c) => c.name),
    ];
    const match = candidates.find((c) => c.toLowerCase().startsWith(clean));
    if (match) {
      this.consoleInput = `/${match} `;
    }
  }

  public render(arena: Q3GameArena): void {
    const ctx = this.ctx;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Update FPS counter
    this.frameCounter++;
    const now = performance.now();
    if (now - this.lastFpsSampleMs >= 400) {
      this.fps = Math.round((this.frameCounter * 1000) / (now - this.lastFpsSampleMs));
      this.frameCounter = 0;
      this.lastFpsSampleMs = now;
    }

    ctx.clearRect(0, 0, w, h);

    const local = arena.clients[0];
    if (!local) return;
    const ps = local.ps;

    // 1. Blood / Damage Screen Flash
    if (ps.damageCount > 0) {
      const alpha = Math.min(0.45, ps.damageCount * 0.008);
      ctx.fillStyle = `rgba(220, 15, 10, ${alpha.toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);
      ps.damageCount = Math.max(0, ps.damageCount - 1.5);
    }

    // 2. Quad Damage Blue Screen Vignette
    if ((ps.powerups[Powerup.PW_QUAD] || 0) > arena.timeMs) {
      const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.75);
      grad.addColorStop(0, 'rgba(0, 90, 255, 0)');
      grad.addColorStop(1, 'rgba(30, 130, 255, 0.22)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    if (Cvars.variableIntegerValue('cg_draw2D')) {
      this.drawCrosshair(ctx, w, h);
      this.drawKillFeed(ctx, arena);
      this.drawTopRightTelemetry(ctx, w, arena, ps);
      this.drawCenterBannersAndMedals(ctx, w, h, arena);
      this.drawWeaponBar(ctx, w, h, ps);
      this.drawStatusBar(ctx, w, h, arena, ps, local.modelSpec);
    }

    if (this.scoreboardOpen || ps.pm_type === PmType.PM_DEAD) {
      this.drawScoreboard(ctx, w, h, arena);
    }

    if (this.consoleOpen) {
      this.drawDropDownConsole(ctx, w, h);
    }
  }

  private drawCrosshair(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const style = Cvars.variableIntegerValue('cg_drawCrosshair');
    if (style <= 0) return;
    const size = Cvars.variableValue('cg_crosshairSize') || 28;
    const cx = w * 0.5;
    const cy = h * 0.5;

    // Try original 1999 pak0.pk3 crosshaira..crosshairj.tga first!
    const letter = String.fromCharCode(97 + ((style - 1) % 10));
    const chSprite = this.getHudSprite(`gfx/2d/crosshair${letter}.tga`);
    if (chSprite) {
      ctx.save();
      ctx.drawImage(chSprite, cx - size * 0.5, cy - size * 0.5, size, size);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.strokeStyle = 'rgba(80, 255, 120, 0.92)';
    ctx.fillStyle = 'rgba(80, 255, 120, 0.95)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.42, 0, Math.PI * 2);
    ctx.stroke();

    const gap = 4;
    const len = size * 0.48;
    ctx.beginPath();
    ctx.moveTo(cx - len, cy); ctx.lineTo(cx - gap, cy);
    ctx.moveTo(cx + gap, cy); ctx.lineTo(cx + len, cy);
    ctx.moveTo(cx, cy - len); ctx.lineTo(cx, cy - gap);
    ctx.moveTo(cx, cy + gap); ctx.lineTo(cx, cy + len);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawKillFeed(ctx: CanvasRenderingContext2D, arena: Q3GameArena): void {
    ctx.save();
    ctx.font = 'bold 14px "Courier New", monospace';
    let y = 26;
    for (const kf of arena.killFeed) {
      const age = arena.timeMs - kf.timeMs;
      if (age > 7000) continue;
      const alpha = age > 5500 ? 1 - (age - 5500) / 1500 : 1;
      ctx.globalAlpha = Math.max(0, alpha);
      this.drawColoredQ3Text(
        ctx,
        `^3${kf.attacker} ^7fragged ^1${kf.victim} ^7[^5${kf.weaponName}^7]`,
        16,
        y
      );
      y += 20;
    }
    ctx.restore();
  }

  private drawTopRightTelemetry(
    ctx: CanvasRenderingContext2D,
    w: number,
    arena: Q3GameArena,
    ps: Q3GameArena['clients'][0]['ps']
  ): void {
    ctx.save();
    ctx.textAlign = 'right';
    ctx.font = 'bold 14px "Courier New", monospace';
    let y = 56;

    if (Cvars.variableIntegerValue('cg_drawFPS')) {
      ctx.fillStyle = '#ffee55';
      ctx.fillText(`${this.fps} FPS`, w - 16, y);
      y += 18;
    }

    if (Cvars.variableIntegerValue('cg_drawSpeed')) {
      const ups = Math.round(Math.hypot(ps.velocity[0], ps.velocity[1]));
      ctx.fillStyle = ups >= 450 ? '#33ff66' : '#66ddff';
      ctx.fillText(`${ups} ups`, w - 16, y);
      y += 18;
    }

    if (Cvars.variableIntegerValue('cg_drawTimer')) {
      const totalSec = Math.floor(arena.timeMs / 1000);
      const mins = Math.floor(totalSec / 60);
      const secs = String(totalSec % 60).padStart(2, '0');
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${mins}:${secs}`, w - 16, y);
      y += 18;
    }

    // Renderer stats & active powerup timers
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = '#bbbbbb';
    ctx.fillText(
      `Draws: ${arena.renderer.stats.drawCalls} | Tris: ${arena.renderer.stats.tris}`,
      w - 16,
      y
    );
    y += 24;

    if ((ps.powerups[Powerup.PW_QUAD] || 0) > arena.timeMs) {
      const rem = Math.ceil((ps.powerups[Powerup.PW_QUAD] - arena.timeMs) / 1000);
      const quadIcon = this.getHudSprite('icons/quad.tga');
      if (quadIcon) {
        ctx.drawImage(quadIcon, w - 190, y - 22, 28, 28);
      }
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.fillStyle = '#44aaff';
      ctx.fillText(`QUAD: ${rem}s`, w - 16, y);
      y += 30;
    }
    if ((ps.powerups[Powerup.PW_HASTE] || 0) > arena.timeMs) {
      const rem = Math.ceil((ps.powerups[Powerup.PW_HASTE] - arena.timeMs) / 1000);
      const hasteIcon = this.getHudSprite('icons/haste.tga');
      if (hasteIcon) {
        ctx.drawImage(hasteIcon, w - 190, y - 22, 28, 28);
      }
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.fillStyle = '#ffee33';
      ctx.fillText(`HASTE: ${rem}s`, w - 16, y);
    }

    ctx.restore();
  }

  private drawCenterBannersAndMedals(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    arena: Q3GameArena
  ): void {
    ctx.save();
    ctx.textAlign = 'center';

    // Map / Fight Banner
    if (arena.centerBanner && arena.timeMs - arena.centerBanner.timeMs < 3200) {
      const age = arena.timeMs - arena.centerBanner.timeMs;
      ctx.globalAlpha = age > 2400 ? 1 - (age - 2400) / 800 : 1;
      ctx.font = 'bold 34px "Courier New", monospace';
      ctx.fillStyle = '#ff4500';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 10;
      ctx.fillText(arena.centerBanner.text, w / 2, h * 0.24);
      ctx.font = 'bold 24px "Courier New", monospace';
      ctx.fillStyle = '#ffee55';
      ctx.fillText(arena.centerBanner.subtext, w / 2, h * 0.24 + 34);
    }

    // Active Medal ("IMPRESSIVE", "EXCELLENT", "HUMILIATION") with Original 1999 Medal .TGA!
    if (arena.activeMedal && arena.timeMs - arena.activeMedal.timeMs < 2600) {
      const age = arena.timeMs - arena.activeMedal.timeMs;
      ctx.globalAlpha = age > 2000 ? 1 - (age - 2000) / 600 : 1;

      const medalPath = MEDAL_TGA_MAP[arena.activeMedal.name];
      if (medalPath) {
        const medalSprite = this.getHudSprite(medalPath);
        if (medalSprite) {
          ctx.drawImage(medalSprite, w / 2 - 28, h * 0.08, 56, 56);
        }
      }

      ctx.font = 'bold 26px "Courier New", monospace';
      ctx.fillStyle = '#44eeff';
      ctx.shadowColor = '#003366';
      ctx.shadowBlur = 12;
      ctx.fillText(
        `${arena.activeMedal.name} (x${arena.activeMedal.count})`,
        w / 2,
        h * 0.08 + 80
      );
    }

    // Item Pickup Notification
    if (arena.pickupNotice && arena.timeMs - arena.pickupNotice.timeMs < 2000) {
      ctx.globalAlpha = 1 - (arena.timeMs - arena.pickupNotice.timeMs) / 2000;
      ctx.font = 'bold 18px "Courier New", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(arena.pickupNotice.name, w / 2, h - 145);
    }

    ctx.restore();
  }

  private drawWeaponBar(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    ps: Q3GameArena['clients'][0]['ps']
  ): void {
    const weapons: Weapon[] = [
      Weapon.WP_GAUNTLET,
      Weapon.WP_MACHINEGUN,
      Weapon.WP_SHOTGUN,
      Weapon.WP_GRENADE_LAUNCHER,
      Weapon.WP_ROCKET_LAUNCHER,
      Weapon.WP_LIGHTNING,
      Weapon.WP_RAILGUN,
      Weapon.WP_PLASMAGUN,
      Weapon.WP_BFG,
    ];

    const boxW = 56;
    const boxH = 42;
    const gap = 5;
    const totalW = weapons.length * (boxW + gap) - gap;
    let x = (w - totalW) * 0.5;
    const y = h - 122;

    ctx.save();
    for (let i = 0; i < weapons.length; i++) {
      const wp = weapons[i];
      const spec = WEAPON_SPECS[wp];
      const owned = (ps.weaponsMask & (1 << wp)) !== 0;
      const selected = ps.weapon === wp;
      const ammo = ps.ammo[wp];

      ctx.fillStyle = selected
        ? 'rgba(255, 75, 0, 0.42)'
        : owned
        ? 'rgba(20, 20, 28, 0.78)'
        : 'rgba(10, 10, 14, 0.35)';
      ctx.strokeStyle = selected
        ? '#ffcc33'
        : owned
        ? `rgb(${(spec.color[0] * 255) | 0}, ${(spec.color[1] * 255) | 0}, ${(spec.color[2] * 255) | 0})`
        : '#333333';
      ctx.lineWidth = selected ? 2.5 : 1;

      ctx.fillRect(x, y, boxW, boxH);
      ctx.strokeRect(x, y, boxW, boxH);

      // Draw original 1999 pak0.pk3 weapon icon (icons/iconw_*.tga)
      const iconSprite = spec.iconPath ? this.getHudSprite(spec.iconPath) : null;
      if (iconSprite) {
        ctx.save();
        ctx.globalAlpha = owned ? 1.0 : 0.25;
        ctx.drawImage(iconSprite, x + 4, y + 3, 24, 24);
        ctx.restore();
      }

      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.fillStyle = owned ? '#ffffff' : '#555555';
      ctx.fillText(`${i + 1}`, x + 32, y + 15);

      if (owned) {
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.fillStyle = ammo === 0 ? '#ff3333' : '#ffeeaa';
        ctx.fillText(ammo === -1 ? '∞' : String(ammo), x + 6, y + 37);
      }

      x += boxW + gap;
    }
    ctx.restore();
  }

  /**
   * Draws a multi-digit number using the original 1999 Quake III Arena
   * `gfx/2d/numbers/zero_32b.tga .. nine_32b.tga` sprites!
   */
  private drawQ3NumberSprites(
    ctx: CanvasRenderingContext2D,
    value: number,
    rightEdgeX: number,
    topY: number,
    warnLow: boolean
  ): boolean {
    const str = String(value);
    const tint: [number, number, number] = warnLow ? [255, 45, 30] : [255, 200, 35];
    const digitW = 28;
    const digitH = 38;

    // Check if zero_32b.tga is available in VFS
    if (!this.getHudSprite(DIGIT_TGA_NAMES['0'], tint)) {
      return false;
    }

    let curX = rightEdgeX - str.length * digitW;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      const path = DIGIT_TGA_NAMES[ch];
      const sp = path ? this.getHudSprite(path, tint) : null;
      if (sp) {
        ctx.drawImage(sp, curX, topY, digitW, digitH);
      }
      curX += digitW;
    }
    return true;
  }

  private drawStatusBar(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    arena: Q3GameArena,
    ps: Q3GameArena['clients'][0]['ps'],
    modelSpec: string
  ): void {
    const barY = h - 68;
    const cx = w * 0.5;

    ctx.save();

    const drawBigNumberBox = (
      bx: number,
      label: string,
      value: number,
      isInfinite: boolean,
      warnLow: boolean,
      accentColor: string,
      iconPath: string
    ) => {
      ctx.fillStyle = 'rgba(12, 8, 8, 0.84)';
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2;
      ctx.fillRect(bx - 102, barY, 204, 56);
      ctx.strokeRect(bx - 102, barY, 204, 56);

      // Draw original 1999 status icon (.tga)
      const iconSprite = iconPath ? this.getHudSprite(iconPath) : null;
      if (iconSprite) {
        ctx.drawImage(iconSprite, bx - 94, barY + 8, 40, 40);
      }

      let drewSprites = false;
      if (!isInfinite) {
        drewSprites = this.drawQ3NumberSprites(ctx, value, bx + 44, barY + 9, warnLow);
      }

      if (!drewSprites) {
        ctx.font = 'bold 38px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.fillStyle = warnLow ? '#ff2a1a' : '#ffcc22';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 6;
        ctx.fillText(isInfinite ? '∞' : String(value), bx + 44, barY + 42);
      }

      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#dddddd';
      ctx.fillText(label, bx + 50, barY + 38);
    };

    const curAmmo = ps.ammo[ps.weapon];
    const curWeaponSpec = WEAPON_SPECS[ps.weapon];
    drawBigNumberBox(
      cx - 245,
      'AMMO',
      curAmmo,
      curAmmo === -1,
      curAmmo !== -1 && curAmmo <= 5,
      '#ff6600',
      curWeaponSpec?.iconPath || 'icons/iconw_rocket.tga'
    );

    const modelName = (modelSpec.split('/')[0] || 'sarge').toLowerCase();
    const headIconPath = `models/players/${modelName}/icon_default.tga`;
    drawBigNumberBox(
      cx,
      'HEALTH',
      Math.max(0, ps.health),
      false,
      ps.health <= 25,
      '#ff3300',
      VFS.fileExists(headIconPath) ? headIconPath : 'icons/iconh_red.tga'
    );

    drawBigNumberBox(
      cx + 245,
      'ARMOR',
      ps.armor,
      false,
      false,
      '#ffcc00',
      ps.armor >= 100 ? 'icons/iconr_red.tga' : 'icons/iconr_yellow.tga'
    );

    // Bottom-right Score vs Leader
    const sorted = [...arena.clients].sort(
      (a, b) => b.ps.persistant.score - a.ps.persistant.score
    );
    const topScore = sorted[0]?.ps.persistant.score || 0;
    ctx.textAlign = 'right';
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.fillStyle = '#3399ff';
    ctx.fillText(
      `FRAGS: ${ps.persistant.score} / ${Cvars.variableIntegerValue('fraglimit')} (LEAD: ${topScore})`,
      w - 18,
      h - 24
    );

    ctx.restore();
  }

  private drawScoreboard(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    arena: Q3GameArena
  ): void {
    const sbW = 580;
    const sbH = 340;
    const x = (w - sbW) * 0.5;
    const y = (h - sbH) * 0.5;

    ctx.save();
    ctx.fillStyle = 'rgba(10, 6, 6, 0.90)';
    ctx.strokeStyle = '#ff4500';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, sbW, sbH);
    ctx.strokeRect(x, y, sbW, sbH);

    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillStyle = '#ff5500';
    ctx.textAlign = 'center';
    ctx.fillText(`QUAKE III ARENA — ${arena.mapTitle.toUpperCase()}`, w * 0.5, y + 36);

    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillStyle = '#ffcc66';
    ctx.textAlign = 'left';
    ctx.fillText('PLAYER', x + 28, y + 72);
    ctx.fillText('MODEL', x + 210, y + 72);
    ctx.fillText('FRAGS', x + 360, y + 72);
    ctx.fillText('HITS', x + 445, y + 72);
    ctx.fillText('PING', x + 510, y + 72);

    const sorted = [...arena.clients].sort(
      (a, b) => b.ps.persistant.score - a.ps.persistant.score
    );
    let rowY = y + 102;
    for (const cl of sorted) {
      if (cl.clientNum === 0) {
        ctx.fillStyle = 'rgba(255, 69, 0, 0.22)';
        ctx.fillRect(x + 16, rowY - 16, sbW - 32, 24);
      }

      // Draw original player icon on scoreboard if present
      const mName = (cl.modelSpec.split('/')[0] || 'sarge').toLowerCase();
      const iconSp = this.getHudSprite(`models/players/${mName}/icon_default.tga`);
      if (iconSp) {
        ctx.drawImage(iconSp, x + 20, rowY - 15, 20, 20);
      }

      ctx.fillStyle = cl.clientNum === 0 ? '#ffee55' : '#ffffff';
      ctx.fillText(cl.name, x + 46, rowY);
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText(cl.modelSpec, x + 210, rowY);
      ctx.fillStyle = '#44ff66';
      ctx.fillText(String(cl.ps.persistant.score), x + 360, rowY);
      ctx.fillStyle = '#66ccff';
      ctx.fillText(String(cl.ps.persistant.hits), x + 445, rowY);
      ctx.fillStyle = '#cccccc';
      ctx.fillText(cl.isBot ? 'BOT' : '0', x + 510, rowY);
      rowY += 28;
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#88ff88';
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText(
      `VFS: ${VFS.getMountedPaksSummary()} | WASD=Move, Space=Jump/StrafeJump, 1-9=Weapons, ~=Console`,
      w * 0.5,
      y + sbH - 18
    );

    ctx.restore();
  }

  private drawDropDownConsole(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const conH = Math.floor(h * 0.48);
    ctx.save();
    ctx.fillStyle = 'rgba(14, 6, 4, 0.93)';
    ctx.fillRect(0, 0, w, conH);
    ctx.strokeStyle = '#ff3b00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, conH);
    ctx.lineTo(w, conH);
    ctx.stroke();

    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillStyle = '#ff5522';
    ctx.fillText(
      'Q3A 1.32c HTML5/WebGL2 Engine Console — Commands: /map q3dm17, /map q3dm7, /addbot visor 5, /give all, /noclip, /r_lightmap 1',
      14,
      22
    );

    const logs = Cmd.getLogs();
    const maxLines = Math.floor((conH - 65) / 18);
    const visible = logs.slice(-maxLines);
    let ly = 46;
    for (const line of visible) {
      this.drawColoredQ3Text(ctx, line, 16, ly);
      ly += 18;
    }

    // Input prompt
    ctx.fillStyle = '#ffee44';
    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.fillText(`] ${this.consoleInput}_`, 16, conH - 14);
    ctx.restore();
  }

  private drawColoredQ3Text(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number
  ): void {
    let curX = x;
    ctx.fillStyle = '#ffffff';
    let i = 0;
    while (i < text.length) {
      if (text[i] === '^' && i + 1 < text.length && Q3_COLOR_TABLE[text[i + 1]]) {
        ctx.fillStyle = Q3_COLOR_TABLE[text[i + 1]];
        i += 2;
        continue;
      }
      let nextCaret = text.indexOf('^', i);
      if (nextCaret === -1) nextCaret = text.length;
      const chunk = text.slice(i, nextCaret);
      ctx.fillText(chunk, curX, y);
      curX += ctx.measureText(chunk).width;
      i = nextCaret;
    }
  }
}
