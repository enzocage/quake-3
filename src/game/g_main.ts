// ============================================================================
// src/game/g_main.ts
// Quake III Arena Server Game Logic, Entity Spawner, All 9 Weapons,
// Projectiles, Splash Damage, Rocket-Jumping, Items, Movers & Fuzzy-Logic Bots
// ============================================================================

import { Sound } from '../audio/snd_dma';
import { CgPlayerManager } from '../cgame/cg_players';
import { CM } from '../qcommon/cm_trace';
import { Cmd } from '../qcommon/cmd';
import { Cvars } from '../qcommon/cvar';
import {
  AngleVectors,
  AnglesToAxis,
  AnimNumber,
  AxisClear,
  BUTTON_ATTACK,
  CONTENTS_LAVA,
  createDefaultPlayerState,
  Mat3,
  PlayerState,
  PMF_TIME_KNOCKBACK,
  PmType,
  Powerup,
  Q_crandom,
  RefEntity,
  RefEntityType,
  RF_DEPTHHACK,
  UserCmd,
  Vec3,
  vec3Add,
  vec3Clone,
  vec3Dist,
  vec3Dot,
  vec3Length,
  vec3MA,
  vec3Normalize,
  vec3Scale,
  vec3Sub,
  Weapon,
} from '../qcommon/q_shared';
import { BspMap } from '../renderer/tr_bsp';
import { Q3Renderer } from '../renderer/tr_main';
import { ITEM_DEFS, ItemDef, WEAPON_SPECS } from './bg_misc';
import { PmoveSingle } from './bg_pmove';

export interface SpawnPoint {
  origin: Vec3;
  angle: number;
}

export interface JumpPadTrigger {
  origin: Vec3;
  targetOrigin: Vec3;
  velocity: Vec3;
}

export interface TeleporterTrigger {
  origin: Vec3;
  destOrigin: Vec3;
  destAngle: number;
}

export interface MapItemEntity {
  id: number;
  def: ItemDef;
  origin: Vec3;
  active: boolean;
  respawnAtMs: number;
}

export interface ProjectileEntity {
  id: number;
  ownerClientNum: number;
  weapon: Weapon;
  origin: Vec3;
  velocity: Vec3;
  spawnTimeMs: number;
  expireTimeMs: number;
  damage: number;
  splashDamage: number;
  splashRadius: number;
  bounces: boolean;
}

export interface VisualBeamEffect {
  reType: RefEntityType;
  start: Vec3;
  end: Vec3;
  color: [number, number, number, number];
  spawnTimeMs: number;
  durationMs: number;
  shader: string;
  radius: number;
}

export interface GibParticle {
  origin: Vec3;
  velocity: Vec3;
  angles: Vec3;
  spawnTimeMs: number;
  expireTimeMs: number;
  isGibModel: boolean;
}

export interface InlineMover {
  model: string; // '*1', '*2'
  baseOrigin: Vec3;
  currentOrigin: Vec3;
  height: number;
  speed: number;
}

export interface ClientSlot {
  clientNum: number;
  name: string;
  modelSpec: string;
  isBot: boolean;
  skill: number; // 1..5
  ps: PlayerState;
  deadUntilMs: number;
  lastFragTimeMs: number;
  consecutiveRailHits: number;
  lastFireTimeMs: number;
  botTargetPoint: Vec3 | null;
  botNextDecisionMs: number;
  botStrafeDir: number;
}

export interface KillFeedEntry {
  attacker: string;
  victim: string;
  weaponName: string;
  timeMs: number;
}

export class Q3GameArena {
  public renderer: Q3Renderer;
  public playerMgr: CgPlayerManager;
  public mapName = 'q3dm17';
  public mapTitle = 'The Longest Yard';
  public timeMs = 0;

  public clients: ClientSlot[] = [];
  public spawns: SpawnPoint[] = [];
  public jumpPads: JumpPadTrigger[] = [];
  public teleporters: TeleporterTrigger[] = [];
  public items: MapItemEntity[] = [];
  public projectiles: ProjectileEntity[] = [];
  public beams: VisualBeamEffect[] = [];
  public gibs: GibParticle[] = [];
  public movers: InlineMover[] = [];
  public killFeed: KillFeedEntry[] = [];

  public pickupNotice: { name: string; timeMs: number } | null = null;
  public centerBanner: { text: string; subtext: string; timeMs: number } | null = null;
  public activeMedal: { name: string; count: number; timeMs: number } | null = null;

  private nextProjectileId = 1;
  private randSeed = { seed: 1337 };
  private lastMegaDecayMs = 0;

  constructor(renderer: Q3Renderer) {
    this.renderer = renderer;
    this.playerMgr = new CgPlayerManager(renderer);
  }

  public loadMap(mapName: string): void {
    const cleanName = mapName.replace(/^maps\//i, '').replace(/\.bsp$/i, '').toLowerCase();
    const bspPath = `maps/${cleanName}.bsp`;
    const bsp = this.renderer.loadWorldMap(bspPath);
    CM.setBsp(bsp);

    this.mapName = cleanName;
    this.spawns = [];
    this.jumpPads = [];
    this.teleporters = [];
    this.items = [];
    this.projectiles = [];
    this.beams = [];
    this.gibs = [];
    this.movers = [];
    this.killFeed = [];

    this.parseMapEntities(bsp);

    // Initialize local player (client 0) + default bots
    this.clients = [];
    this.spawnClient(0, Cvars.variableString('name') || 'Ranger', Cvars.variableString('model') || 'sarge/default', false, 5);

    if (Cvars.variableIntegerValue('bot_enable')) {
      this.addBot('Visor', 'visor/default', 4);
      this.addBot('Major', 'major/default', 3);
      this.addBot('Grunt', 'grunt/default', 3);
    }

    this.centerBanner = {
      text: this.mapTitle.toUpperCase(),
      subtext: 'PREPARE TO FIGHT!',
      timeMs: this.timeMs,
    };
    Sound.queueAnnouncement('Prepare to fight');
    setTimeout(() => Sound.queueAnnouncement('Fight!'), 1200);

    Cmd.print(`^2Loaded Map: ^3${bspPath}^7 — "${this.mapTitle}" (${bsp.surfaces.length} surfaces, ${this.items.length} items)`);
  }

  private parseVec3(str = '0 0 0'): Vec3 {
    const parts = str.trim().split(/\s+/).map(Number);
    return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
  }

  private getEntityOriginOrModelCenter(bsp: BspMap, ent: Record<string, string>): Vec3 {
    if (ent.origin) {
      return this.parseVec3(ent.origin);
    }
    if (ent.model && ent.model.startsWith('*')) {
      const idx = Number.parseInt(ent.model.slice(1), 10);
      const m = bsp.models[idx];
      if (m) {
        return [
          (m.mins[0] + m.maxs[0]) * 0.5,
          (m.mins[1] + m.maxs[1]) * 0.5,
          (m.mins[2] + m.maxs[2]) * 0.5,
        ];
      }
    }
    return [0, 0, 0];
  }

  private parseMapEntities(bsp: BspMap): void {
    const targetPositions = new Map<string, { origin: Vec3; angle: number }>();

    for (const ent of bsp.entities) {
      const cn = ent.classname || '';
      if (cn === 'worldspawn') {
        this.mapTitle = ent.message || this.mapName.toUpperCase();
      } else if (cn === 'target_position' || cn === 'misc_teleporter_dest' || cn === 'info_notnull') {
        if (ent.targetname && ent.origin) {
          targetPositions.set(ent.targetname, {
            origin: this.parseVec3(ent.origin),
            angle: Number.parseFloat(ent.angle || '0') || 0,
          });
        }
      }
    }

    let itemId = 1;
    for (const ent of bsp.entities) {
      const cn = ent.classname || '';
      const origin = this.getEntityOriginOrModelCenter(bsp, ent);

      if (cn === 'info_player_deathmatch' || cn === 'info_player_start') {
        this.spawns.push({
          origin,
          angle: Number.parseFloat(ent.angle || '0') || 0,
        });
      } else if (cn === 'trigger_push' && ent.target) {
        const dest = targetPositions.get(ent.target);
        if (dest) {
          // Exact Q3 OriginToVelocity jump-pad calculation (g_trigger.c)
          const gravity = Cvars.variableValue('g_gravity') || 800;
          const height = Math.max(32, dest.origin[2] - origin[2]);
          const time = Math.sqrt(height / (0.5 * gravity));
          const vel: Vec3 = [
            (dest.origin[0] - origin[0]) / time,
            (dest.origin[1] - origin[1]) / time,
            time * gravity,
          ];
          this.jumpPads.push({ origin, targetOrigin: dest.origin, velocity: vel });
        }
      } else if (cn === 'trigger_teleport' && ent.target) {
        const dest = targetPositions.get(ent.target);
        if (dest) {
          this.teleporters.push({
            origin,
            destOrigin: dest.origin,
            destAngle: dest.angle,
          });
        }
      } else if ((cn === 'func_bobbing' || cn === 'func_plat') && ent.model) {
        this.movers.push({
          model: ent.model,
          baseOrigin: [0, 0, 0],
          currentOrigin: [0, 0, 0],
          height: Number.parseFloat(ent.height || '32') || 32,
          speed: Number.parseFloat(ent.speed || '4') || 4,
        });
      } else if (ITEM_DEFS[cn]) {
        const def = ITEM_DEFS[cn];
        this.renderer.registerModel(def.modelPath);
        if (def.ringModelPath) {
          this.renderer.registerModel(def.ringModelPath);
        }
        this.items.push({
          id: itemId++,
          def,
          origin,
          active: true,
          respawnAtMs: 0,
        });
      }
    }

    if (this.spawns.length === 0) {
      this.spawns.push({ origin: [0, 0, 64], angle: 0 });
    }
  }

  public spawnClient(
    clientNum: number,
    name: string,
    modelSpec: string,
    isBot: boolean,
    skill = 3
  ): ClientSlot {
    const ps = createDefaultPlayerState(clientNum);
    const slot: ClientSlot = {
      clientNum,
      name,
      modelSpec,
      isBot,
      skill,
      ps,
      deadUntilMs: 0,
      lastFragTimeMs: -9999,
      consecutiveRailHits: 0,
      lastFireTimeMs: 0,
      botTargetPoint: null,
      botNextDecisionMs: 0,
      botStrafeDir: 1,
    };
    this.respawnClient(slot);
    this.clients[clientNum] = slot;
    return slot;
  }

  public addBot(name?: string, modelSpec?: string, skill = 3): void {
    const presets = [
      { name: 'Sarge', model: 'sarge/default' },
      { name: 'Visor', model: 'visor/default' },
      { name: 'Major', model: 'major/default' },
      { name: 'Grunt', model: 'grunt/default' },
      { name: 'Phobos', model: 'sarge/red' },
    ];
    const preset = presets[this.clients.length % presets.length];
    const botName = name || preset.name;
    const botModel = modelSpec || preset.model;
    const id = this.clients.length;
    this.spawnClient(id, botName, botModel, true, skill);
    Cmd.print(`^3Bot "${botName}"^7 entered the arena (Skill ${skill}).`);
  }

  public respawnClient(client: ClientSlot): void {
    const spawn = this.spawns[Math.floor(Math.random() * this.spawns.length)];
    const oldScore = client.ps.persistant;
    client.ps = createDefaultPlayerState(client.clientNum);
    client.ps.persistant = oldScore;
    client.ps.commandTime = this.timeMs;
    client.ps.origin = [spawn.origin[0], spawn.origin[1], spawn.origin[2] + 8];
    client.ps.viewangles = [0, spawn.angle, 0];
    client.ps.velocity = [0, 0, 0];
    client.deadUntilMs = 0;

    Sound.playSoundAtOrigin(
      'sound/world/telein.wav',
      client.ps.origin,
      client.clientNum === 0 ? 0.65 : 0.45
    );
  }

  /**
   * Advances the entire Quake III Arena simulation by `dtMs`
   */
  public stepArena(dtMs: number, localUserCmd: UserCmd): void {
    this.timeMs += dtMs;

    // 1. Update Inline Brush Movers (func_bobbing / func_plat)
    for (const mv of this.movers) {
      const phase = (this.timeMs * 0.001) / Math.max(0.5, mv.speed);
      mv.currentOrigin[2] = Math.sin(phase * Math.PI * 2.0) * mv.height;
    }

    // 2. Respawn Pickups
    for (const item of this.items) {
      if (!item.active && this.timeMs >= item.respawnAtMs) {
        item.active = true;
        Sound.playSoundAtOrigin('sound/items/respawn1.wav', item.origin, 0.55);
      }
    }

    // 3. MegaHealth Decay & Regen Powerup (1 Hz tick)
    if (this.timeMs - this.lastMegaDecayMs >= 1000) {
      this.lastMegaDecayMs = this.timeMs;
      for (const cl of this.clients) {
        if (cl.ps.pm_type === PmType.PM_DEAD) continue;
        if (cl.ps.health > 100) {
          cl.ps.health = Math.max(100, cl.ps.health - 1);
        }
        if ((cl.ps.powerups[Powerup.PW_REGEN] || 0) > this.timeMs && cl.ps.health < 200) {
          cl.ps.health = Math.min(200, cl.ps.health + 15);
        }
      }
    }

    // 4. Step all Clients (Local Player + Fuzzy-Logic Bots)
    for (const cl of this.clients) {
      if (cl.ps.pm_type === PmType.PM_DEAD) {
        if (this.timeMs >= cl.deadUntilMs) {
          this.respawnClient(cl);
        }
        continue;
      }

      const cmd = cl.isBot ? this.generateBotUserCmd(cl) : { ...localUserCmd, serverTime: this.timeMs };
      if (!cl.isBot && cmd.weapon && (cl.ps.weaponsMask & (1 << cmd.weapon))) {
        cl.ps.weapon = cmd.weapon;
      }

      // Run 125 Hz Pmove physics
      PmoveSingle(
        cl.ps,
        cmd,
        (start, end, mins, maxs, mask) => CM.boxTrace(start, end, mins, maxs, mask),
        (pt, mask) => CM.pointContents(pt, mask),
        (snd) => Sound.playSoundAtOrigin(snd, cl.ps.origin, 0.5)
      );

      // Check Ring-Out / Void / Lava Hazard
      if (cl.ps.origin[2] < -780) {
        this.applyDamage(cl, null, 999, cl.ps.origin, [0, 0, 1], 'VOID');
        continue;
      }
      const footCont = CM.pointContents([cl.ps.origin[0], cl.ps.origin[1], cl.ps.origin[2] - 20], CONTENTS_LAVA);
      if (footCont & CONTENTS_LAVA) {
        if (Math.floor(this.timeMs / 200) !== Math.floor((this.timeMs - dtMs) / 200)) {
          this.applyDamage(cl, null, 15, cl.ps.origin, [0, 0, 1], 'LAVA');
        }
      }

      // Check Jump Pads (trigger_push)
      for (const jp of this.jumpPads) {
        if (
          Math.abs(cl.ps.origin[0] - jp.origin[0]) < 46 &&
          Math.abs(cl.ps.origin[1] - jp.origin[1]) < 46 &&
          Math.abs(cl.ps.origin[2] - jp.origin[2]) < 42
        ) {
          cl.ps.velocity = vec3Clone(jp.velocity);
          cl.ps.groundEntityNum = 1023;
          Sound.playSoundAtOrigin('sound/world/jumppad.wav', jp.origin, 0.85);
        }
      }

      // Check Teleporters (trigger_teleport)
      for (const tp of this.teleporters) {
        if (vec3Dist(cl.ps.origin, tp.origin) < 48) {
          cl.ps.origin = [tp.destOrigin[0], tp.destOrigin[1], tp.destOrigin[2] + 12];
          cl.ps.viewangles[1] = tp.destAngle;
          const fwd: Vec3 = [0, 0, 0];
          AngleVectors([0, tp.destAngle, 0], fwd);
          vec3Scale(fwd, 400, cl.ps.velocity);
          Sound.playSoundAtOrigin('sound/world/telein.wav', tp.destOrigin, 0.85);
        }
      }

      // Check Item Pickups
      for (const item of this.items) {
        if (!item.active) continue;
        if (vec3Dist(cl.ps.origin, item.origin) < 42) {
          if (this.pickupItem(cl, item)) {
            item.active = false;
            item.respawnAtMs = this.timeMs + item.def.respawnSec * 1000;
          }
        }
      }

      // Handle Weapon Firing
      if (cmd.buttons & BUTTON_ATTACK) {
        this.tryFireWeapon(cl);
      }
    }

    // 5. Update Projectiles (Rockets, Plasma, Grenades, BFG)
    this.stepProjectiles(dtMs * 0.001);

    // 6. Update Gibs & Expire Old Beams
    this.stepGibs(dtMs * 0.001);
    this.beams = this.beams.filter((b) => this.timeMs - b.spawnTimeMs < b.durationMs);
  }

  private pickupItem(cl: ClientSlot, item: MapItemEntity): boolean {
    const def = item.def;
    const ps = cl.ps;

    if (def.type === 'weapon' && def.weapon) {
      ps.weaponsMask |= 1 << def.weapon;
      ps.ammo[def.weapon] = Math.min(
        def.maxLimit,
        Math.max(ps.ammo[def.weapon], def.quantity)
      );
      if (Cvars.variableIntegerValue('cg_autoswitch') && def.weapon > ps.weapon) {
        ps.weapon = def.weapon;
      }
    } else if (def.type === 'ammo' && def.weapon) {
      if (ps.ammo[def.weapon] >= def.maxLimit) return false;
      ps.ammo[def.weapon] = Math.min(def.maxLimit, ps.ammo[def.weapon] + def.quantity);
    } else if (def.type === 'armor') {
      if (ps.armor >= def.maxLimit) return false;
      ps.armor = Math.min(def.maxLimit, ps.armor + def.quantity);
    } else if (def.type === 'health') {
      if (ps.health >= def.maxLimit) return false;
      ps.health = Math.min(def.maxLimit, ps.health + def.quantity);
    } else if (def.type === 'powerup' && def.powerup) {
      ps.powerups[def.powerup] = Math.max(this.timeMs, ps.powerups[def.powerup] || 0) + def.quantity;
      if (def.powerup === Powerup.PW_QUAD && cl.clientNum === 0) {
        Sound.queueAnnouncement('Quad Damage');
      }
    }

    Sound.playSoundAtOrigin(def.pickupSound || 'sound/misc/w_pkup.wav', item.origin, 0.7);
    if (cl.clientNum === 0) {
      this.pickupNotice = { name: def.pickupName, timeMs: this.timeMs };
    }
    return true;
  }

  private tryFireWeapon(cl: ClientSlot): void {
    const ps = cl.ps;
    const spec = WEAPON_SPECS[ps.weapon];
    if (!spec) return;

    const hasHaste = (ps.powerups[Powerup.PW_HASTE] || 0) > this.timeMs;
    const fireInterval = hasHaste ? spec.fireTimeMs * 0.75 : spec.fireTimeMs;
    if (this.timeMs - cl.lastFireTimeMs < fireInterval) return;

    // Check Ammo
    if (spec.startingAmmo !== -1) {
      if ((ps.ammo[ps.weapon] || 0) <= 0) {
        this.switchToBestAvailableWeapon(cl);
        return;
      }
      ps.ammo[ps.weapon]--;
    }

    cl.lastFireTimeMs = this.timeMs;
    ps.torsoAnim = ps.weapon === Weapon.WP_GAUNTLET ? AnimNumber.TORSO_ATTACK2 : AnimNumber.TORSO_ATTACK;
    ps.torsoTimer = Math.max(150, fireInterval);

    const hasQuad = (ps.powerups[Powerup.PW_QUAD] || 0) > this.timeMs;
    const quadMult = hasQuad ? (Cvars.variableValue('g_quadfactor') || 3) : 1;

    const fireSnd =
      ps.weapon === Weapon.WP_MACHINEGUN
        ? `sound/weapons/machinegun/machgf${((Math.random() * 4) | 0) + 1}b.wav`
        : spec.fireSound;
    Sound.playSoundAtOrigin(fireSnd, ps.origin, cl.clientNum === 0 ? 0.65 : 0.25);
    if (hasQuad) {
      Sound.playSoundAtOrigin('sound/items/damage3.wav', ps.origin, cl.clientNum === 0 ? 0.65 : 0.3);
    }

    const forward: Vec3 = [0, 0, 0];
    const right: Vec3 = [0, 0, 0];
    const up: Vec3 = [0, 0, 0];
    AngleVectors(ps.viewangles, forward, right, up);

    const muzzle: Vec3 = [
      ps.origin[0] + forward[0] * 14,
      ps.origin[1] + forward[1] * 14,
      ps.origin[2] + ps.viewheight - 2,
    ];

    if (spec.isHitscan) {
      const range =
        ps.weapon === Weapon.WP_GAUNTLET
          ? 48
          : ps.weapon === Weapon.WP_LIGHTNING
          ? 768
          : 8192;

      let anyHitPlayer = false;

      for (let p = 0; p < spec.pellets; p++) {
        const end: Vec3 = [
          muzzle[0] + forward[0] * range,
          muzzle[1] + forward[1] * range,
          muzzle[2] + forward[2] * range,
        ];

        if (spec.spread > 0) {
          const r = Q_crandom(this.randSeed) * spec.spread * (range / 8192);
          const u = Q_crandom(this.randSeed) * spec.spread * (range / 8192);
          vec3MA(end, r, right, end);
          vec3MA(end, u, up, end);
        }

        const worldTrace = CM.boxTrace(muzzle, end, [0, 0, 0], [0, 0, 0]);
        const hitResult = this.tracePlayersAlongSegment(cl.clientNum, muzzle, worldTrace.endpos);

        const finalEnd = hitResult ? hitResult.hitPoint : worldTrace.endpos;

        if (ps.weapon === Weapon.WP_RAILGUN) {
          this.beams.push({
            reType: RefEntityType.RT_RAIL_CORE,
            start: vec3Clone(muzzle),
            end: vec3Clone(finalEnd),
            color: [40, 255, 110, 255],
            spawnTimeMs: this.timeMs,
            durationMs: 750,
            shader: 'railCore',
            radius: 6,
          });
        } else if (ps.weapon === Weapon.WP_LIGHTNING) {
          this.beams.push({
            reType: RefEntityType.RT_LIGHTNING,
            start: vec3Clone(muzzle),
            end: vec3Clone(finalEnd),
            color: [160, 215, 255, 255],
            spawnTimeMs: this.timeMs,
            durationMs: 65,
            shader: 'lightningBolt',
            radius: 7,
          });
        }

        if (hitResult) {
          anyHitPlayer = true;
          this.applyDamage(
            hitResult.target,
            cl,
            spec.damage * quadMult,
            finalEnd,
            forward,
            spec.shortName
          );
        } else if (worldTrace.fraction < 1.0 && ps.weapon !== Weapon.WP_GAUNTLET) {
          this.renderer.addImpactMark(
            worldTrace.endpos,
            worldTrace.plane.normal,
            ps.weapon === Weapon.WP_RAILGUN ? 12 : 6,
            'markShadow',
            [255, 255, 255, 255],
            this.timeMs * 0.001
          );
        }
      }

      // Check Railgun "IMPRESSIVE" award (2 consecutive hits without missing)
      if (ps.weapon === Weapon.WP_RAILGUN) {
        if (anyHitPlayer) {
          cl.consecutiveRailHits++;
          if (cl.consecutiveRailHits >= 2 && cl.clientNum === 0) {
            ps.persistant.impressiveCount++;
            this.activeMedal = {
              name: 'IMPRESSIVE',
              count: ps.persistant.impressiveCount,
              timeMs: this.timeMs,
            };
            Sound.queueAnnouncement('Impressive');
          }
        } else {
          cl.consecutiveRailHits = 0;
        }
      }
    } else {
      // Spawn Projectile (Rocket, Plasma, Grenade, BFG)
      const vel: Vec3 = [
        forward[0] * spec.projectileSpeed,
        forward[1] * spec.projectileSpeed,
        forward[2] * spec.projectileSpeed + (ps.weapon === Weapon.WP_GRENADE_LAUNCHER ? 160 : 0),
      ];

      this.projectiles.push({
        id: this.nextProjectileId++,
        ownerClientNum: cl.clientNum,
        weapon: ps.weapon,
        origin: muzzle,
        velocity: vel,
        spawnTimeMs: this.timeMs,
        expireTimeMs: this.timeMs + (ps.weapon === Weapon.WP_GRENADE_LAUNCHER ? 2500 : 8000),
        damage: spec.damage * quadMult,
        splashDamage: spec.splashDamage * quadMult,
        splashRadius: spec.splashRadius,
        bounces: ps.weapon === Weapon.WP_GRENADE_LAUNCHER,
      });
    }
  }

  private stepProjectiles(dtSec: number): void {
    const remaining: ProjectileEntity[] = [];

    for (const proj of this.projectiles) {
      if (this.timeMs >= proj.expireTimeMs) {
        this.explodeProjectile(proj, proj.origin, [0, 0, 1], null);
        continue;
      }

      if (proj.bounces) {
        proj.velocity[2] -= 800 * dtSec;
      }

      const nextPos: Vec3 = [0, 0, 0];
      vec3MA(proj.origin, dtSec, proj.velocity, nextPos);

      const playerHit = this.tracePlayersAlongSegment(proj.ownerClientNum, proj.origin, nextPos);
      if (playerHit) {
        this.explodeProjectile(proj, playerHit.hitPoint, [0, 0, 1], playerHit.target);
        continue;
      }

      const tr = CM.boxTrace(proj.origin, nextPos, [-2, -2, -2], [2, 2, 2]);
      if (tr.fraction < 1.0) {
        if (proj.bounces) {
          // Bounce grenade off surface (G_BounceMissile)
          const dot = vec3Dot(proj.velocity, tr.plane.normal);
          vec3MA(proj.velocity, -2.0 * dot, tr.plane.normal, proj.velocity);
          vec3Scale(proj.velocity, 0.65, proj.velocity);
          proj.origin = vec3Clone(tr.endpos);
          if (vec3Length(proj.velocity) < 60) {
            proj.velocity = [0, 0, 0];
          }
          remaining.push(proj);
        } else {
          this.explodeProjectile(proj, tr.endpos, tr.plane.normal, null);
        }
        continue;
      }

      proj.origin = nextPos;
      remaining.push(proj);
    }

    this.projectiles = remaining;
  }

  private explodeProjectile(
    proj: ProjectileEntity,
    hitPos: Vec3,
    normal: Vec3,
    directTarget: ClientSlot | null
  ): void {
    const attacker = this.clients[proj.ownerClientNum] || null;
    const spec = WEAPON_SPECS[proj.weapon];

    Sound.playSoundAtOrigin('sound/weapons/rocket/rocklx1a.wav', hitPos, 0.85);
    this.renderer.addImpactMark(
      hitPos,
      normal,
      proj.weapon === Weapon.WP_PLASMAGUN ? 10 : 28,
      'markShadow',
      [255, 255, 255, 255],
      this.timeMs * 0.001
    );

    // Direct Hit
    if (directTarget) {
      const dir = vec3Clone(proj.velocity);
      vec3Normalize(dir);
      this.applyDamage(directTarget, attacker, proj.damage, hitPos, dir, spec.shortName);
    }

    // Radius Splash Damage & Rocket-Jump Knockback (G_RadiusDamage)
    if (proj.splashRadius > 0 && proj.splashDamage > 0) {
      for (const cl of this.clients) {
        if (cl.ps.pm_type === PmType.PM_DEAD) continue;
        if (cl === directTarget) continue;

        const playerCenter: Vec3 = [cl.ps.origin[0], cl.ps.origin[1], cl.ps.origin[2] + 4];
        const dist = vec3Dist(hitPos, playerCenter);
        if (dist >= proj.splashRadius) continue;

        const points = proj.splashDamage * (1.0 - dist / proj.splashRadius);
        const dir: Vec3 = [0, 0, 0];
        vec3Sub(playerCenter, hitPos, dir);
        dir[2] += 24; // Quake 3 upward splash bias for Rocket Jumping!
        vec3Normalize(dir);

        this.applyDamage(cl, attacker, points, hitPos, dir, spec.shortName, true);
      }
    }
  }

  /**
   * Applies Quake III Damage, 66% Armor Absorption, Knockback Impulse,
   * Hit Sounds, Awards ("EXCELLENT", "HUMILIATION") & Gibbing (<= -40 HP)
   */
  public applyDamage(
    target: ClientSlot,
    attacker: ClientSlot | null,
    rawDamage: number,
    point: Vec3,
    dir: Vec3,
    weaponShortName: string,
    isSplash = false
  ): void {
    if (target.ps.pm_type === PmType.PM_DEAD) return;

    const isSelf = attacker !== null && attacker.clientNum === target.clientNum;
    const knockbackPoints = rawDamage;
    // In Quake 3, self-splash damage is halved (0.5x), while knockback stays 100%!
    let damage = isSelf && isSplash ? Math.round(rawDamage * 0.5) : Math.round(rawDamage);
    if (damage < 1) damage = 1;

    // Apply Knockback impulse: dvel = dir * (1000 * knockback / 200)
    const knockback = Math.min(200, knockbackPoints);
    const kvel = (Cvars.variableValue('g_knockback') || 1000) * (knockback / 200.0);
    vec3MA(target.ps.velocity, kvel, dir, target.ps.velocity);
    if (target.ps.pm_time <= 0) {
      target.ps.pm_time = Math.max(50, Math.min(200, knockback * 2));
      target.ps.pm_flags |= PMF_TIME_KNOCKBACK;
    }

    // Play famous Quake 3 hitsound for local attacker
    if (attacker && attacker.clientNum === 0 && !isSelf) {
      Sound.playLocalSound('sound/feedback/hit.wav', 0.85);
      attacker.ps.persistant.hits++;
    }

    // 66% Armor Protection (ARMOR_PROTECTION = 0.66)
    const armorSave = Math.min(Math.ceil(damage * 0.66), target.ps.armor);
    target.ps.armor -= armorSave;
    const take = damage - armorSave;
    target.ps.health -= take;
    target.ps.damageCount = Math.min(100, take);
    target.ps.damageEvent++;

    if (target.ps.health <= 0) {
      // Check Gib threshold (GIB_HEALTH = -40)
      if (target.ps.health <= -40) {
        Sound.playSoundAtOrigin('sound/player/gibsplt1.wav', target.ps.origin, 0.9);
        this.spawnGibShower(target.ps.origin);
      } else {
        Sound.playSoundAtOrigin('sound/player/sarge/death1.wav', target.ps.origin, 0.8);
      }

      target.ps.pm_type = PmType.PM_DEAD;
      target.ps.legsAnim = AnimNumber.BOTH_DEATH1;
      target.ps.torsoAnim = AnimNumber.BOTH_DEATH1;
      target.deadUntilMs = this.timeMs + 1700;

      if (attacker && !isSelf) {
        attacker.ps.persistant.score++;
        attacker.ps.persistant.lastFragTarget = target.name;

        // Check "EXCELLENT" (2 frags within 2000ms)
        if (this.timeMs - attacker.lastFragTimeMs <= 2000 && attacker.clientNum === 0) {
          attacker.ps.persistant.excellentCount++;
          this.activeMedal = {
            name: 'EXCELLENT',
            count: attacker.ps.persistant.excellentCount,
            timeMs: this.timeMs,
          };
          Sound.queueAnnouncement('Excellent');
        }
        // Check "HUMILIATION" (Gauntlet kill)
        if (weaponShortName === 'GAUNTLET' && attacker.clientNum === 0) {
          attacker.ps.persistant.humiliationCount++;
          this.activeMedal = {
            name: 'HUMILIATION',
            count: attacker.ps.persistant.humiliationCount,
            timeMs: this.timeMs,
          };
          Sound.queueAnnouncement('Humiliation');
        }

        attacker.lastFragTimeMs = this.timeMs;
      } else {
        target.ps.persistant.score = Math.max(0, target.ps.persistant.score - 1);
      }

      this.killFeed.unshift({
        attacker: attacker ? attacker.name : 'World',
        victim: target.name,
        weaponName: weaponShortName,
        timeMs: this.timeMs,
      });
      if (this.killFeed.length > 5) this.killFeed.pop();
    }
  }

  private spawnGibShower(origin: Vec3): void {
    for (let i = 0; i < 8; i++) {
      this.gibs.push({
        origin: [origin[0], origin[1], origin[2] + 12],
        velocity: [
          (Math.random() - 0.5) * 420,
          (Math.random() - 0.5) * 420,
          180 + Math.random() * 260,
        ],
        angles: [Math.random() * 360, Math.random() * 360, 0],
        spawnTimeMs: this.timeMs,
        expireTimeMs: this.timeMs + 4000,
        isGibModel: i < 3,
      });
    }
  }

  private stepGibs(dtSec: number): void {
    this.gibs = this.gibs.filter((g) => this.timeMs < g.expireTimeMs);
    for (const g of this.gibs) {
      g.velocity[2] -= 800 * dtSec;
      const next: Vec3 = [0, 0, 0];
      vec3MA(g.origin, dtSec, g.velocity, next);
      const tr = CM.boxTrace(g.origin, next, [-4, -4, -4], [4, 4, 4]);
      if (tr.fraction < 1.0) {
        const dot = vec3Dot(g.velocity, tr.plane.normal);
        vec3MA(g.velocity, -1.6 * dot, tr.plane.normal, g.velocity);
        g.origin = vec3Clone(tr.endpos);
      } else {
        g.origin = next;
      }
      g.angles[0] += 180 * dtSec;
      g.angles[1] += 240 * dtSec;
    }
  }

  private tracePlayersAlongSegment(
    ignoreClientNum: number,
    start: Vec3,
    end: Vec3
  ): { target: ClientSlot; hitPoint: Vec3 } | null {
    let bestFrac = 1.0;
    let bestTarget: ClientSlot | null = null;
    let bestPoint: Vec3 = [0, 0, 0];

    const seg: Vec3 = [0, 0, 0];
    vec3Sub(end, start, seg);
    const segLenSq = seg[0] * seg[0] + seg[1] * seg[1] + seg[2] * seg[2];
    if (segLenSq < 1e-4) return null;

    for (const cl of this.clients) {
      if (cl.clientNum === ignoreClientNum) continue;
      if (cl.ps.pm_type === PmType.PM_DEAD) continue;

      const center: Vec3 = [cl.ps.origin[0], cl.ps.origin[1], cl.ps.origin[2] + 4];
      const toCenter: Vec3 = [0, 0, 0];
      vec3Sub(center, start, toCenter);
      const t = Math.max(0, Math.min(1, vec3Dot(toCenter, seg) / segLenSq));
      const closest: Vec3 = [
        start[0] + seg[0] * t,
        start[1] + seg[1] * t,
        start[2] + seg[2] * t,
      ];

      const dx = Math.abs(closest[0] - center[0]);
      const dy = Math.abs(closest[1] - center[1]);
      const dz = Math.abs(closest[2] - center[2]);
      if (dx <= 20 && dy <= 20 && dz <= 32 && t < bestFrac) {
        bestFrac = t;
        bestTarget = cl;
        bestPoint = closest;
      }
    }

    return bestTarget ? { target: bestTarget, hitPoint: bestPoint } : null;
  }

  private switchToBestAvailableWeapon(cl: ClientSlot): void {
    const priority: Weapon[] = [
      Weapon.WP_ROCKET_LAUNCHER,
      Weapon.WP_RAILGUN,
      Weapon.WP_LIGHTNING,
      Weapon.WP_PLASMAGUN,
      Weapon.WP_BFG,
      Weapon.WP_SHOTGUN,
      Weapon.WP_GRENADE_LAUNCHER,
      Weapon.WP_MACHINEGUN,
      Weapon.WP_GAUNTLET,
    ];
    for (const w of priority) {
      if ((cl.ps.weaponsMask & (1 << w)) && (cl.ps.ammo[w] > 0 || cl.ps.ammo[w] === -1)) {
        cl.ps.weapon = w;
        return;
      }
    }
  }

  /**
   * Fuzzy-Logic Bot AI (Item Navigation, Target Leading, Weapon Choice & Strafe Movement)
   */
  private generateBotUserCmd(bot: ClientSlot): UserCmd {
    const cmd: UserCmd = {
      serverTime: this.timeMs,
      angles: vec3Clone(bot.ps.viewangles),
      buttons: 0,
      weapon: bot.ps.weapon,
      forwardmove: 127,
      rightmove: 0,
      upmove: 0,
    };

    // 1. Find closest visible live enemy
    let bestEnemy: ClientSlot | null = null;
    let bestDist = 99999;
    for (const other of this.clients) {
      if (other.clientNum === bot.clientNum || other.ps.pm_type === PmType.PM_DEAD) continue;
      const d = vec3Dist(bot.ps.origin, other.ps.origin);
      if (d < bestDist) {
        bestDist = d;
        bestEnemy = other;
      }
    }

    // 2. Choose best weapon
    this.switchToBestAvailableWeapon(bot);
    cmd.weapon = bot.ps.weapon;

    // 3. Periodically pick navigation item goal & strafe direction
    if (this.timeMs >= bot.botNextDecisionMs || !bot.botTargetPoint) {
      bot.botNextDecisionMs = this.timeMs + 900 + Math.random() * 700;
      bot.botStrafeDir = Math.random() > 0.5 ? 1 : -1;

      const activeItems = this.items.filter((it) => it.active);
      if (activeItems.length > 0) {
        const chosen = activeItems[Math.floor(Math.random() * activeItems.length)];
        bot.botTargetPoint = vec3Clone(chosen.origin);
      } else if (bestEnemy) {
        bot.botTargetPoint = vec3Clone(bestEnemy.ps.origin);
      }
    }

    // 4. Aim at enemy (with projectile target leading!)
    if (bestEnemy) {
      const spec = WEAPON_SPECS[bot.ps.weapon];
      const leadTime =
        !spec.isHitscan && spec.projectileSpeed > 0
          ? bestDist / spec.projectileSpeed
          : 0;

      const aimPos: Vec3 = [
        bestEnemy.ps.origin[0] + bestEnemy.ps.velocity[0] * leadTime,
        bestEnemy.ps.origin[1] + bestEnemy.ps.velocity[1] * leadTime,
        bestEnemy.ps.origin[2] + (bot.ps.weapon === Weapon.WP_ROCKET_LAUNCHER ? -8 : 8),
      ];

      const delta: Vec3 = [0, 0, 0];
      vec3Sub(aimPos, bot.ps.origin, delta);
      const horiz = Math.hypot(delta[0], delta[1]);
      const targetYaw = (Math.atan2(delta[1], delta[0]) * 180) / Math.PI;
      const targetPitch = -(Math.atan2(delta[2], horiz) * 180) / Math.PI;

      const jitter = (6 - bot.skill) * 1.4;
      cmd.angles[1] = targetYaw + (Math.random() - 0.5) * jitter;
      cmd.angles[0] = Math.max(-75, Math.min(75, targetPitch + (Math.random() - 0.5) * jitter));

      // Check Line of Sight and realistic burst window before firing
      const eye: Vec3 = [bot.ps.origin[0], bot.ps.origin[1], bot.ps.origin[2] + 22];
      const los = CM.boxTrace(eye, bestEnemy.ps.origin);
      const inBurstWindow = (this.timeMs + bot.clientNum * 450) % 1600 < 480;
      if (this.timeMs > 2000 && inBurstWindow && los.fraction > 0.9 && bestDist < 1100) {
        cmd.buttons |= BUTTON_ATTACK;
      }
    }

    // 5. Move toward goal while strafe-dodging and avoiding abyss edges
    if (bot.botTargetPoint) {
      const toGoal: Vec3 = [0, 0, 0];
      vec3Sub(bot.botTargetPoint, bot.ps.origin, toGoal);
      const goalYaw = (Math.atan2(toGoal[1], toGoal[0]) * 180) / Math.PI;
      const diffRad = ((goalYaw - cmd.angles[1]) * Math.PI) / 180;
      cmd.forwardmove = Math.round(Math.cos(diffRad) * 127);
      cmd.rightmove = Math.round(Math.sin(diffRad) * 127 + bot.botStrafeDir * 55);
    }

    // Check floor ahead so bots don't walk off void ledges in q3dm17
    const fwd: Vec3 = [0, 0, 0];
    AngleVectors([0, cmd.angles[1], 0], fwd);
    const probeStart: Vec3 = [
      bot.ps.origin[0] + fwd[0] * 64,
      bot.ps.origin[1] + fwd[1] * 64,
      bot.ps.origin[2],
    ];
    const probeDown: Vec3 = [probeStart[0], probeStart[1], probeStart[2] - 256];
    const floorCheck = CM.boxTrace(probeStart, probeDown);
    if (floorCheck.fraction === 1.0) {
      cmd.forwardmove = -127;
      bot.botStrafeDir = -bot.botStrafeDir;
    }

    if (Math.random() < 0.04) {
      cmd.upmove = 127; // Jump / Strafe-Jump
    }

    return cmd;
  }

  /**
   * Populates the Q3Renderer scene with all players, items, movers, projectiles,
   * beams, gibs, dynamic lights, and the 1st-person view weapon!
   */
  public buildRenderScene(): void {
    this.renderer.clearScene();
    const timeSec = this.timeMs * 0.001;

    // 1. Add Inline Brush Movers (*1, *2)
    for (const mv of this.movers) {
      this.renderer.addRefEntityToScene({
        reType: RefEntityType.RT_MODEL,
        renderfx: 0,
        hModel: mv.model,
        lightingOrigin: mv.currentOrigin,
        axis: AxisClear(),
        nonNormalizedAxes: false,
        origin: mv.currentOrigin,
        oldorigin: mv.currentOrigin,
        frame: 0,
        oldframe: 0,
        backlerp: 0,
        skinNum: 0,
        customSkin: '',
        customShader: '',
        shaderRGBA: [255, 255, 255, 255],
        shaderTexCoord: [0, 0],
        shaderTime: 0,
        radius: 0,
        rotation: 0,
      });
    }

    // 2. Add Rotating & Bobbing Map Pickup Items (CG_Item in cg_ents.c)
    for (const item of this.items) {
      if (!item.active) continue;
      const bob = Math.sin(timeSec * 3.5 + item.id) * 5.0;
      const yaw = (timeSec * 120.0 + item.id * 45) % 360;
      const axis: Mat3 = AxisClear();
      AnglesToAxis([0, yaw, 0], axis);
      const pos: Vec3 = [item.origin[0], item.origin[1], item.origin[2] + bob];

      this.renderer.addRefEntityToScene({
        reType: RefEntityType.RT_MODEL,
        renderfx: 0,
        hModel: item.def.modelPath,
        lightingOrigin: pos,
        axis,
        nonNormalizedAxes: false,
        origin: pos,
        oldorigin: pos,
        frame: 0,
        oldframe: 0,
        backlerp: 0,
        skinNum: 0,
        customSkin: '',
        customShader: '',
        shaderRGBA: [255, 255, 255, 255],
        shaderTexCoord: [0, 0],
        shaderTime: 0,
        radius: 0,
        rotation: 0,
      });

      if (item.def.ringModelPath) {
        const ringAxis: Mat3 = AxisClear();
        AnglesToAxis([0, (360 - yaw) % 360, 0], ringAxis);
        this.renderer.addRefEntityToScene({
          reType: RefEntityType.RT_MODEL,
          renderfx: 0,
          hModel: item.def.ringModelPath,
          lightingOrigin: pos,
          axis: ringAxis,
          nonNormalizedAxes: false,
          origin: pos,
          oldorigin: pos,
          frame: 0,
          oldframe: 0,
          backlerp: 0,
          skinNum: 0,
          customSkin: '',
          customShader: '',
          shaderRGBA: [255, 255, 255, 255],
          shaderTexCoord: [0, 0],
          shaderTime: 0,
          radius: 0,
          rotation: 0,
        });
      }

      if (item.def.type === 'powerup') {
        this.renderer.addLightToScene(pos, 140, 0.25, 0.6, 1.0);
      }
    }

    // 3. Add Multipart MD3 Players (lower.md3 + upper.md3 + head.md3 + weapon.md3)
    for (const cl of this.clients) {
      const muzzleFlash = this.timeMs - cl.lastFireTimeMs < 75;
      this.playerMgr.addPlayerToScene({
        origin: cl.ps.origin,
        velocity: cl.ps.velocity,
        viewangles: cl.ps.viewangles,
        legsAnim: cl.ps.legsAnim,
        torsoAnim: cl.ps.torsoAnim,
        weapon: cl.ps.weapon,
        modelSpec: cl.modelSpec,
        isLocalPlayer: cl.clientNum === 0,
        powerups: cl.ps.powerups,
        timeMs: this.timeMs,
        muzzleFlashActive: muzzleFlash,
      });

      if ((cl.ps.powerups[Powerup.PW_QUAD] || 0) > this.timeMs) {
        this.renderer.addLightToScene(cl.ps.origin, 220, 0.2, 0.55, 1.0);
      }
    }

    // 4. Add Flying Projectiles & Dynamic Lights
    for (const proj of this.projectiles) {
      const spec = WEAPON_SPECS[proj.weapon];
      this.renderer.addRefEntityToScene({
        reType: RefEntityType.RT_SPRITE,
        renderfx: 0,
        hModel: '',
        lightingOrigin: proj.origin,
        axis: AxisClear(),
        nonNormalizedAxes: false,
        origin: proj.origin,
        oldorigin: proj.origin,
        frame: 0,
        oldframe: 0,
        backlerp: 0,
        skinNum: 0,
        customSkin: '',
        customShader: 'flareShader',
        shaderRGBA: [
          (spec.color[0] * 255) | 0,
          (spec.color[1] * 255) | 0,
          (spec.color[2] * 255) | 0,
          255,
        ],
        shaderTexCoord: [0, 0],
        shaderTime: 0,
        radius: proj.weapon === Weapon.WP_BFG ? 18 : 11,
        rotation: 0,
      });
      this.renderer.addLightToScene(
        proj.origin,
        190,
        spec.color[0],
        spec.color[1],
        spec.color[2]
      );
    }

    // 5. Add Railgun Spiral/Core Trails & Lightning Gun Shafts
    for (const b of this.beams) {
      const ageFrac = (this.timeMs - b.spawnTimeMs) / b.durationMs;
      const alpha = Math.max(0, Math.round((1.0 - ageFrac) * 255));
      this.renderer.addRefEntityToScene({
        reType: b.reType,
        renderfx: 0,
        hModel: '',
        lightingOrigin: b.start,
        axis: AxisClear(),
        nonNormalizedAxes: false,
        origin: b.start,
        oldorigin: b.end,
        frame: 0,
        oldframe: 0,
        backlerp: 0,
        skinNum: 0,
        customSkin: '',
        customShader: b.shader,
        shaderRGBA: [b.color[0], b.color[1], b.color[2], alpha],
        shaderTexCoord: [0, 0],
        shaderTime: 0,
        radius: b.radius,
        rotation: 0,
      });
    }

    // 6. Add Gibs
    for (const g of this.gibs) {
      const axis: Mat3 = AxisClear();
      AnglesToAxis(g.angles, axis);
      this.renderer.addRefEntityToScene({
        reType: g.isGibModel ? RefEntityType.RT_MODEL : RefEntityType.RT_SPRITE,
        renderfx: 0,
        hModel: 'models/gibs/skull.md3',
        lightingOrigin: g.origin,
        axis,
        nonNormalizedAxes: false,
        origin: g.origin,
        oldorigin: g.origin,
        frame: 0,
        oldframe: 0,
        backlerp: 0,
        skinNum: 0,
        customSkin: '',
        customShader: g.isGibModel ? '' : 'flareShader',
        shaderRGBA: [220, 20, 20, 255],
        shaderTexCoord: [0, 0],
        shaderTime: 0,
        radius: 8,
        rotation: 0,
      });
    }

    // 7. Add First-Person View Weapon (CG_AddPlayerWeapon with RF_DEPTHHACK)
    const local = this.clients[0];
    if (local && local.ps.pm_type !== PmType.PM_DEAD) {
      this.addFirstPersonViewWeapon(local, timeSec);
    }
  }

  private addFirstPersonViewWeapon(local: ClientSlot, timeSec: number): void {
    const ps = local.ps;
    const spec = WEAPON_SPECS[ps.weapon];
    if (!spec || !spec.modelPath) return;

    const fwd: Vec3 = [0, 0, 0];
    const right: Vec3 = [0, 0, 0];
    const up: Vec3 = [0, 0, 0];
    AngleVectors(ps.viewangles, fwd, right, up);

    const speed = Math.hypot(ps.velocity[0], ps.velocity[1]);
    const bob = Math.sin(timeSec * 9.0) * Math.min(1.2, speed * 0.003);
    const sinceFire = this.timeMs - local.lastFireTimeMs;
    const recoil = sinceFire < 140 ? -Math.sin((sinceFire / 140) * Math.PI) * 2.8 : 0;

    const eye: Vec3 = [ps.origin[0], ps.origin[1], ps.origin[2] + ps.viewheight];
    const gunOrigin: Vec3 = [eye[0], eye[1], eye[2]];
    vec3MA(gunOrigin, 12 + recoil, fwd, gunOrigin);
    vec3MA(gunOrigin, 6.5, right, gunOrigin);
    vec3MA(gunOrigin, -6.5 + bob, up, gunOrigin);

    const axis: Mat3 = AxisClear();
    AnglesToAxis(ps.viewangles, axis);

    const gunEnt: RefEntity = {
      reType: RefEntityType.RT_MODEL,
      renderfx: RF_DEPTHHACK,
      hModel: spec.modelPath,
      lightingOrigin: ps.origin,
      axis,
      nonNormalizedAxes: false,
      origin: gunOrigin,
      oldorigin: gunOrigin,
      frame: 0,
      oldframe: 0,
      backlerp: 0,
      skinNum: 0,
      customSkin: '',
      customShader: '',
      shaderRGBA: [255, 255, 255, 255],
      shaderTexCoord: [0, 0],
      shaderTime: 0,
      radius: 0,
      rotation: 0,
    };
    this.renderer.addRefEntityToScene(gunEnt);

    if ((ps.powerups[Powerup.PW_QUAD] || 0) > this.timeMs) {
      this.renderer.addRefEntityToScene({
        ...gunEnt,
        customShader: 'models/powerups/instant/quad_shell',
      });
    }
  }
}
