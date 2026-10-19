// ============================================================================
// src/main.ts
// Quake III Arena (1999) HTML5 / WebGL2 Engine Bootstrapper & Main Loop
// Mounts .PK3 archives, initializes WebGL2 Renderer, Pmove Physics, QVM,
// 3D Sound, HUD/Console, PointerLock Controls & Drag-and-Drop .PK3 Loader
// ============================================================================

import { Sound } from './audio/snd_dma';
import { CgHudAndConsole } from './cgame/cg_draw';
import { Q3GameArena } from './game/g_main';
import { Cmd } from './qcommon/cmd';
import { Cvars } from './qcommon/cvar';
import { VFS } from './qcommon/files';
import {
  BUTTON_ATTACK,
  BUTTON_WALKING,
  PmType,
  Powerup,
  UserCmd,
  Vec3,
  Weapon,
} from './qcommon/q_shared';
import { EMBEDDED_PAK0_BASE64 } from './qcommon/embedded_pak0';
import { loadAllQvmModules } from './qcommon/vm';
import { Q3Renderer } from './renderer/tr_main';
import { Shaders } from './renderer/tr_shader_parse';

function decodeBase64ToUint8(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

async function bootstrapQuake3Arena(): Promise<void> {
  const glCanvas = document.getElementById('gl-canvas') as HTMLCanvasElement;
  const uiCanvas = document.getElementById('ui-canvas') as HTMLCanvasElement;
  const vfsBadge = document.getElementById('vfs-status-badge')!;
  const mapSelector = document.getElementById('map-selector') as HTMLSelectElement;
  const btnAddBot = document.getElementById('btn-add-bot') as HTMLButtonElement;
  const btnLoadPk3 = document.getElementById('btn-load-pk3') as HTMLButtonElement;
  const btnFetchOa = document.getElementById('btn-fetch-oa') as HTMLButtonElement;
  const btnToggleConsole = document.getElementById('btn-toggle-console') as HTMLButtonElement;
  const fileInput = document.getElementById('pk3-file-input') as HTMLInputElement;
  const dropOverlay = document.getElementById('pk3-drop-overlay')!;

  const resizeCanvases = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    glCanvas.width = Math.floor(window.innerWidth * dpr);
    glCanvas.height = Math.floor(window.innerHeight * dpr);
    uiCanvas.width = window.innerWidth;
    uiCanvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resizeCanvases);
  resizeCanvases();

  Cmd.print('^1================================================================');
  Cmd.print('^3QUAKE III ARENA (id Tech 3 v1.32c) — HTML5 / WebGL2 Engine');
  Cmd.print('^1================================================================');

  // 1. Mount Built-in / Starter pak0.pk3 + NK-OA pak0_nkoa.pk3 + IndexedDB cached PK3s
  const updateVfsBadge = () => {
    vfsBadge.textContent = `VFS: ${VFS.getMountedPaksSummary()}`;
    updateMapDropdown();
  };
  VFS.onChange(updateVfsBadge);

  if (window.location.protocol !== 'file:') {
    for (const [url, name, prio] of [
      ['./assets/baseq3/pak1_starter.pk3', 'pak1_starter.pk3', 3],
      ['./assets/baseoa/pak0_nkoa.pk3', 'pak0_nkoa.pk3', 8],
      ['./assets/baseq3/pak0.pk3', 'pak0.pk3', 20],
    ] as const) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          VFS.mountPk3(name, buf, prio, false);
        }
      } catch {
        // fallback below
      }
    }
  }

  if (VFS.listFiles('maps/', '.bsp').length === 0 && EMBEDDED_PAK0_BASE64.length > 0) {
    VFS.mountPk3('pak0.pk3', decodeBase64ToUint8(EMBEDDED_PAK0_BASE64), 10, false);
  }

  await VFS.loadCachedPk3sFromIdb();

  // 2. Verify QVM Bytecode Interpreter on mounted .qvm files
  loadAllQvmModules();

  // 3. Initialize WebGL2 Renderer, Game Arena & 2D/3D HUD + Console
  const renderer = new Q3Renderer(glCanvas);
  const arena = new Q3GameArena(renderer);
  const hud = new CgHudAndConsole(uiCanvas);

  function updateMapDropdown(): void {
    const bspFiles = VFS.listFiles('maps/', '.bsp');
    if (bspFiles.length === 0) return;
    const currentVal = mapSelector.value || 'q3dm17';
    mapSelector.innerHTML = '';
    const mapTitles: Record<string, string> = {
      q3dm17: 'q3dm17 — The Longest Yard (Original 1999)',
      q3dm7: 'q3dm7 — Temple of Retribution (Original 1999)',
      q3dm1: 'q3dm1 — Arena Gate (Original 1999)',
      q3tourney2: 'q3tourney2 — The Proving Grounds (Original 1999)',
      q3dm6: 'q3dm6 — The Campgrounds',
    };
    for (const f of bspFiles) {
      const mName = f.replace(/^maps\//i, '').replace(/\.bsp$/i, '');
      const opt = document.createElement('option');
      opt.value = mName;
      opt.textContent = mapTitles[mName] || `${mName} (.BSP)`;
      mapSelector.appendChild(opt);
    }
    if ([...mapSelector.options].some((o) => o.value === currentVal)) {
      mapSelector.value = currentVal;
    }
  }

  updateVfsBadge();

  // 4. Register Console Commands (/map, /devmap, /addbot, /give, /noclip, /god, /kill)
  Cmd.addCommand('map', (args) => {
    if (args.length < 2) {
      Cmd.print(`^3Usage: /map <mapname> (Available: ${VFS.listFiles('maps/', '.bsp').join(', ')})`);
      return;
    }
    arena.loadMap(args[1]);
    mapSelector.value = arena.mapName;
  });

  Cmd.addCommand('devmap', (args) => {
    if (args.length >= 2) {
      arena.loadMap(args[1]);
      mapSelector.value = arena.mapName;
    }
  });

  Cmd.addCommand('addbot', (args) => {
    const botName = args[1];
    const skill = Number.parseInt(args[2] || '3', 10) || 3;
    arena.addBot(botName, undefined, skill);
  });

  Cmd.addCommand('give', (args) => {
    const local = arena.clients[0];
    if (!local) return;
    const what = (args[1] || 'all').toLowerCase();
    if (what === 'all' || what === 'weapons') {
      local.ps.weaponsMask = 0x3fe;
      for (let w = 1; w <= 9; w++) local.ps.ammo[w] = 200;
      local.ps.health = 200;
      local.ps.armor = 200;
    }
    if (what === 'quad' || what === 'all') {
      local.ps.powerups[Powerup.PW_QUAD] = arena.timeMs + 30000;
      Sound.queueAnnouncement('Quad Damage');
    }
    Cmd.print('^2Give: All Weapons, 200 Health, 200 Armor & Quad Damage granted.');
  });

  Cmd.addCommand('noclip', () => {
    const local = arena.clients[0];
    if (!local) return;
    local.ps.pm_type =
      local.ps.pm_type === PmType.PM_NOCLIP ? PmType.PM_NORMAL : PmType.PM_NOCLIP;
    Cmd.print(`^3noclip ${local.ps.pm_type === PmType.PM_NOCLIP ? 'ON' : 'OFF'}`);
  });

  Cmd.addCommand('kill', () => {
    const local = arena.clients[0];
    if (local) {
      arena.applyDamage(local, null, 999, local.ps.origin, [0, 0, 1], 'SELF');
    }
  });

  // Load initial map (q3dm17 — The Longest Yard)
  arena.loadMap('q3dm17');

  // 5. Input Handling (PointerLock Mouse + WASD + Weapon Keys 1-9 + Scrollwheel)
  const keysDown = new Set<string>();
  let mouseButtons = 0;
  const viewAngles: Vec3 = [0, 45, 0];
  let desiredWeapon: Weapon = Weapon.WP_ROCKET_LAUNCHER;

  // Give player Rocket Launcher + Railgun + Plasma Gun right at spawn for instant action
  if (arena.clients[0]) {
    arena.clients[0].ps.weaponsMask |=
      (1 << Weapon.WP_ROCKET_LAUNCHER) |
      (1 << Weapon.WP_RAILGUN) |
      (1 << Weapon.WP_PLASMAGUN) |
      (1 << Weapon.WP_LIGHTNING) |
      (1 << Weapon.WP_SHOTGUN);
    arena.clients[0].ps.ammo[Weapon.WP_ROCKET_LAUNCHER] = 25;
    arena.clients[0].ps.ammo[Weapon.WP_RAILGUN] = 15;
    arena.clients[0].ps.ammo[Weapon.WP_PLASMAGUN] = 80;
    arena.clients[0].ps.ammo[Weapon.WP_LIGHTNING] = 120;
    arena.clients[0].ps.ammo[Weapon.WP_SHOTGUN] = 20;
    arena.clients[0].ps.weapon = Weapon.WP_ROCKET_LAUNCHER;
    viewAngles[0] = arena.clients[0].ps.viewangles[0];
    viewAngles[1] = arena.clients[0].ps.viewangles[1];
  }

  glCanvas.addEventListener('mousedown', (e) => {
    Sound.initOnUserGesture();
    if (hud.consoleOpen) return;
    if (document.pointerLockElement !== glCanvas) {
      glCanvas.requestPointerLock?.();
    }
    if (e.button === 0) {
      mouseButtons |= BUTTON_ATTACK;
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
      mouseButtons &= ~BUTTON_ATTACK;
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== glCanvas || hud.consoleOpen) return;
    const sens = Cvars.variableValue('sensitivity') || 3.5;
    const mYaw = Cvars.variableValue('m_yaw') || 0.022;
    const mPitch = Cvars.variableValue('m_pitch') || 0.022;

    viewAngles[1] = (viewAngles[1] - e.movementX * sens * mYaw) % 360;
    viewAngles[0] = Math.max(
      -89,
      Math.min(89, viewAngles[0] + e.movementY * sens * mPitch)
    );
  });

  window.addEventListener('wheel', (e) => {
    if (hud.consoleOpen) return;
    const local = arena.clients[0];
    if (!local) return;
    const dir = e.deltaY > 0 ? 1 : -1;
    let cur = local.ps.weapon;
    for (let i = 1; i <= 9; i++) {
      cur = (((cur - 1 + dir * i) % 9) + 9) % 9 + 1;
      if (local.ps.weaponsMask & (1 << cur)) {
        desiredWeapon = cur as Weapon;
        break;
      }
    }
  });

  window.addEventListener('keydown', (e) => {
    if (hud.handleConsoleKeyDown(e)) return;

    if (e.code === 'Tab') {
      e.preventDefault();
      hud.scoreboardOpen = true;
      return;
    }

    keysDown.add(e.code);

    if (e.code.startsWith('Digit')) {
      const num = Number.parseInt(e.code.replace('Digit', ''), 10);
      if (num >= 1 && num <= 9) {
        desiredWeapon = num as Weapon;
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Tab') {
      hud.scoreboardOpen = false;
    }
    keysDown.delete(e.code);
  });

  // 6. Toolbar & Drag-and-Drop .PK3 / .BSP / .MD3 File Mounting
  mapSelector.addEventListener('change', () => {
    arena.loadMap(mapSelector.value);
    if (arena.clients[0]) {
      viewAngles[1] = arena.clients[0].ps.viewangles[1];
    }
    glCanvas.focus();
  });

  btnAddBot.addEventListener('click', () => {
    arena.addBot();
  });

  btnToggleConsole.addEventListener('click', () => {
    hud.consoleOpen = !hud.consoleOpen;
  });

  btnLoadPk3.addEventListener('click', () => {
    fileInput.click();
  });

  btnFetchOa.addEventListener('click', async () => {
    btnFetchOa.textContent = '⏳ Loading NK-OA...';
    await VFS.fetchNeonKnightOAAssets((st) => {
      vfsBadge.textContent = st;
    });
    Shaders.loadAllFromVFS();
    updateVfsBadge();
    btnFetchOa.textContent = '✓ NK-OA Loaded';
  });

  const handleUploadedFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    let bspToLoad: string | null = null;

    for (const file of Array.from(fileList)) {
      const buf = new Uint8Array(await file.arrayBuffer());
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.pk3') || lower.endsWith('.zip')) {
        VFS.mountPk3(file.name, buf, 25, true);
        const mapsInPak = VFS.listFiles('maps/', '.bsp');
        if (mapsInPak.length > 0) {
          bspToLoad = mapsInPak[0];
        }
      } else if (lower.endsWith('.bsp')) {
        const path = `maps/${lower}`;
        VFS.writeFile(path, buf);
        bspToLoad = path;
      } else if (lower.endsWith('.shader')) {
        VFS.writeFile(`scripts/${lower}`, buf);
      } else if (lower.endsWith('.md3')) {
        VFS.writeFile(`models/${lower}`, buf);
      }
    }

    Shaders.loadAllFromVFS();
    updateVfsBadge();
    if (bspToLoad) {
      arena.loadMap(bspToLoad);
      mapSelector.value = arena.mapName;
    }
  };

  fileInput.addEventListener('change', () => {
    handleUploadedFiles(fileInput.files);
  });

  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropOverlay.classList.add('active');
  });
  window.addEventListener('dragleave', (e) => {
    if (e.relatedTarget === null) {
      dropOverlay.classList.remove('active');
    }
  });
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    dropOverlay.classList.remove('active');
    handleUploadedFiles(e.dataTransfer?.files || null);
  });

  // 7. High-Precision 125 Hz Fixed-Timestep Pmove + WebGL2 Render Loop
  let lastFrameTime = performance.now();
  let accumulatorMs = 0;
  const FIXED_STEP_MS = 8; // 125 Hz Quake 3 pmove_msec 8!

  const frameLoop = (now: number) => {
    const dtMs = Math.min(100, Math.max(1, now - lastFrameTime));
    lastFrameTime = now;
    accumulatorMs += dtMs;

    // Build UserCmd from current keyboard + mouse state
    let forwardmove = 0;
    let rightmove = 0;
    let upmove = 0;
    let buttons = mouseButtons;

    if (!hud.consoleOpen) {
      if (keysDown.has('KeyW') || keysDown.has('ArrowUp')) forwardmove += 127;
      if (keysDown.has('KeyS') || keysDown.has('ArrowDown')) forwardmove -= 127;
      if (keysDown.has('KeyD') || keysDown.has('ArrowRight')) rightmove += 127;
      if (keysDown.has('KeyA') || keysDown.has('ArrowLeft')) rightmove -= 127;
      if (keysDown.has('Space')) upmove += 127;
      if (keysDown.has('ControlLeft') || keysDown.has('KeyC')) upmove -= 127;
      if (keysDown.has('ShiftLeft')) buttons |= BUTTON_WALKING;
    }

    const userCmd: UserCmd = {
      serverTime: arena.timeMs,
      angles: [viewAngles[0], viewAngles[1], viewAngles[2]],
      buttons,
      weapon: desiredWeapon,
      forwardmove,
      rightmove,
      upmove,
    };

    while (accumulatorMs >= FIXED_STEP_MS) {
      arena.stepArena(FIXED_STEP_MS, userCmd);
      accumulatorMs -= FIXED_STEP_MS;
    }

    const local = arena.clients[0];
    if (local) {
      const eyeOrigin: Vec3 = [
        local.ps.origin[0],
        local.ps.origin[1],
        local.ps.origin[2] + local.ps.viewheight,
      ];
      Sound.updateListener(eyeOrigin, local.ps.viewangles);
      arena.buildRenderScene();
      renderer.renderScene(eyeOrigin, local.ps.viewangles, arena.timeMs * 0.001);
    }

    hud.render(arena);
    requestAnimationFrame(frameLoop);
  };

  requestAnimationFrame(frameLoop);
}

bootstrapQuake3Arena().catch((err) => {
  console.error('Fatal Quake 3 Engine Error:', err);
});
