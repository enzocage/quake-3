// ============================================================================
// src/qcommon/q_shared.ts
// Quake III Arena (id Tech 3) Shared Types, Constants, Vector & Matrix Math
// ============================================================================

export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];
export type Mat3 = [Vec3, Vec3, Vec3]; // 3 axis vectors: [forward, left, up]

// ============================================================================
// Surface Flags (from qfiles.h / surfaceflags.h)
// ============================================================================
export const SURF_NODAMAGE    = 0x00000001; // never give falling damage
export const SURF_SLICK       = 0x00000002; // effects game physics (ice)
export const SURF_SKY         = 0x00000004; // lighting from environment map
export const SURF_LADDER      = 0x00000008; // climbable ladder
export const SURF_NOIMPACT    = 0x00000010; // don't make missile explosions
export const SURF_NOMARKS     = 0x00000020; // don't leave missile marks
export const SURF_FLESH       = 0x00000040; // make flesh sounds and effects
export const SURF_NODRAW      = 0x00000080; // don't generate a drawsurface at all
export const SURF_HINT        = 0x00000100;
export const SURF_SKIP        = 0x00000200;
export const SURF_NOLIGHTMAP  = 0x00000400; // surface doesn't need a lightmap
export const SURF_POINTLIGHT  = 0x00000800; // generate lighting info at vertexes
export const SURF_METALSTEPS  = 0x00001000; // clanking footsteps
export const SURF_NOSTEPS     = 0x00002000; // no footstep sounds
export const SURF_NONSOLID    = 0x00004000; // don't collide against curves with this set
export const SURF_LIGHTFILTER = 0x00008000;
export const SURF_ALPHASHADOW = 0x00010000;
export const SURF_NODLIGHT    = 0x00020000; // don't dlight even if solid
export const SURF_DUST        = 0x00040000;

// ============================================================================
// Content Flags (from surfaceflags.h)
// ============================================================================
export const CONTENTS_SOLID          = 0x00000001;
export const CONTENTS_LAVA           = 0x00000008;
export const CONTENTS_SLIME          = 0x00000010;
export const CONTENTS_WATER          = 0x00000020;
export const CONTENTS_FOG            = 0x00000040;
export const CONTENTS_NOTTEAM1       = 0x00000080;
export const CONTENTS_NOTTEAM2       = 0x00000100;
export const CONTENTS_NOBOTCLIP      = 0x00000200;
export const CONTENTS_AREAPORTAL     = 0x00008000;
export const CONTENTS_PLAYERCLIP     = 0x00010000;
export const CONTENTS_MONSTERCLIP    = 0x00020000;
export const CONTENTS_TELEPORTER     = 0x00040000;
export const CONTENTS_JUMPPAD        = 0x00080000;
export const CONTENTS_CLUSTERPORTAL  = 0x00100000;
export const CONTENTS_DONOTENTER     = 0x00200000;
export const CONTENTS_BOTCLIP        = 0x00400000;
export const CONTENTS_MOVER          = 0x00800000;
export const CONTENTS_ORIGIN         = 0x01000000;
export const CONTENTS_BODY           = 0x02000000;
export const CONTENTS_CORPSE         = 0x04000000;
export const CONTENTS_DETAIL         = 0x08000000;
export const CONTENTS_STRUCTURAL     = 0x10000000;
export const CONTENTS_TRANSLUCENT    = 0x20000000;
export const CONTENTS_TRIGGER        = 0x40000000;
export const CONTENTS_NODROP         = 0x80000000 | 0;

export const MASK_ALL         = -1;
export const MASK_SOLID       = CONTENTS_SOLID;
export const MASK_PLAYERSOLID = CONTENTS_SOLID | CONTENTS_PLAYERCLIP | CONTENTS_BODY;
export const MASK_DEADSOLID   = CONTENTS_SOLID | CONTENTS_PLAYERCLIP;
export const MASK_WATER       = CONTENTS_WATER | CONTENTS_LAVA | CONTENTS_SLIME;
export const MASK_OPAQUE      = CONTENTS_SOLID | CONTENTS_SLIME | CONTENTS_LAVA;
export const MASK_SHOT        = CONTENTS_SOLID | CONTENTS_BODY | CONTENTS_CORPSE;

// ============================================================================
// Weapons (WP_*) — 1999 Quake III Arena
// ============================================================================
export enum Weapon {
  WP_NONE = 0,
  WP_GAUNTLET = 1,
  WP_MACHINEGUN = 2,
  WP_SHOTGUN = 3,
  WP_GRENADE_LAUNCHER = 4,
  WP_ROCKET_LAUNCHER = 5,
  WP_LIGHTNING = 6,
  WP_RAILGUN = 7,
  WP_PLASMAGUN = 8,
  WP_BFG = 9,
  WP_GRAPPLING_HOOK = 10,
  WP_NUM_WEAPONS = 11,
}

// ============================================================================
// Powerups (PW_*)
// ============================================================================
export enum Powerup {
  PW_NONE = 0,
  PW_QUAD = 1,
  PW_BATTLESUIT = 2,
  PW_HASTE = 3,
  PW_INVIS = 4,
  PW_REGEN = 5,
  PW_FLIGHT = 6,
  PW_REDFLAG = 7,
  PW_BLUEFLAG = 8,
  PW_NUM_POWERUPS = 9,
}

// ============================================================================
// Player Animations (bg_public.h — exact 25 animations of animation.cfg)
// ============================================================================
export enum AnimNumber {
  BOTH_DEATH1 = 0,
  BOTH_DEAD1 = 1,
  BOTH_DEATH2 = 2,
  BOTH_DEAD2 = 3,
  BOTH_DEATH3 = 4,
  BOTH_DEAD3 = 5,

  TORSO_GESTURE = 6,
  TORSO_ATTACK = 7,
  TORSO_ATTACK2 = 8,
  TORSO_DROP = 9,
  TORSO_RAISE = 10,
  TORSO_STAND = 11,
  TORSO_STAND2 = 12,

  LEGS_WALKCR = 13,
  LEGS_WALK = 14,
  LEGS_RUN = 15,
  LEGS_BACK = 16,
  LEGS_SWIM = 17,
  LEGS_JUMP = 18,
  LEGS_LAND = 19,
  LEGS_JUMPB = 20,
  LEGS_LANDB = 21,
  LEGS_IDLE = 22,
  LEGS_IDLECR = 23,
  LEGS_TURN = 24,

  MAX_ANIMATIONS = 25,
}

export interface AnimationDef {
  firstFrame: number;
  numFrames: number;
  loopFrames: number;
  frameLerp: number; // msec between frames (1000 / fps)
  initialLerp: number;
  reversed: boolean;
  flipflop: boolean;
}

// ============================================================================
// Pmove Types & Flags (bg_public.h)
// ============================================================================
export enum PmType {
  PM_NORMAL = 0,
  PM_NOCLIP = 1,
  PM_SPECTATOR = 2,
  PM_DEAD = 3,
  PM_FREEZE = 4,
  PM_INTERMISSION = 5,
}

export const PMF_DUCKED         = 0x0001;
export const PMF_JUMP_HELD      = 0x0002;
export const PMF_BACKWARDS_JUMP = 0x0008;
export const PMF_BACKWARDS_RUN  = 0x0010;
export const PMF_TIME_LAND      = 0x0020;
export const PMF_TIME_KNOCKBACK = 0x0040;
export const PMF_TIME_WATERJUMP = 0x0100;
export const PMF_RESPAWNED      = 0x0200;
export const PMF_USE_ITEM_HELD  = 0x0400;
export const PMF_GRAPPLE_PULL   = 0x0800;
export const PMF_FOLLOW         = 0x1000;
export const PMF_SCOREBOARD     = 0x2000;
export const PMF_INVULEXPAND    = 0x4000;

export const BUTTON_ATTACK      = 1;
export const BUTTON_TALK        = 2;
export const BUTTON_USE_HOLDABLE= 4;
export const BUTTON_GESTURE     = 8;
export const BUTTON_WALKING     = 16;

// ============================================================================
// Collision Trace Result (trace_t)
// ============================================================================
export interface Plane {
  normal: Vec3;
  dist: number;
  type: number;
  signbits: number;
}

export interface TraceResult {
  allsolid: boolean;
  startsolid: boolean;
  fraction: number;
  endpos: Vec3;
  plane: Plane;
  surfaceFlags: number;
  contents: number;
  entityNum: number;
}

export function createDefaultTrace(endpos: Vec3 = [0, 0, 0]): TraceResult {
  return {
    allsolid: false,
    startsolid: false,
    fraction: 1.0,
    endpos: [endpos[0], endpos[1], endpos[2]],
    plane: { normal: [0, 0, 1], dist: 0, type: 3, signbits: 0 },
    surfaceFlags: 0,
    contents: 0,
    entityNum: 1023, // ENTITYNUM_NONE
  };
}

// ============================================================================
// UserCmd & PlayerState
// ============================================================================
export interface UserCmd {
  serverTime: number;
  angles: Vec3;       // in degrees or short angles
  buttons: number;
  weapon: Weapon;
  forwardmove: number; // -127 .. 127
  rightmove: number;   // -127 .. 127
  upmove: number;      // -127 .. 127
}

export interface PlayerState {
  commandTime: number;
  pm_type: PmType;
  bobCycle: number;
  pm_flags: number;
  pm_time: number;
  origin: Vec3;
  velocity: Vec3;
  weaponTime: number;
  gravity: number;
  speed: number;
  delta_angles: Vec3;
  groundEntityNum: number;
  legsTimer: number;
  legsAnim: AnimNumber;
  torsoTimer: number;
  torsoAnim: AnimNumber;
  movementDir: number;
  eFlags: number;
  eventSequence: number;
  events: [number, number];
  eventParms: [number, number];
  clientNum: number;
  weapon: Weapon;
  weaponstate: 'WEAPON_READY' | 'WEAPON_RAISING' | 'WEAPON_DROPPING' | 'WEAPON_FIRING';
  viewangles: Vec3;
  viewheight: number;
  damageEvent: number;
  damageYaw: number;
  damagePitch: number;
  damageCount: number;
  health: number;
  armor: number;
  maxHealth: number;
  weaponsMask: number; // bitmask of owned weapons
  ammo: number[];      // indexed by Weapon
  powerups: number[];  // expiration timestamps in ms, indexed by Powerup
  persistant: {
    score: number;
    hits: number;
    rank: number;
    team: number;
    impressiveCount: number;
    excellentCount: number;
    humiliationCount: number;
    defendCount: number;
    assistCount: number;
    captures: number;
    killed: number;
    lastFragTarget: string;
  };
}

export function createDefaultPlayerState(clientNum = 0): PlayerState {
  const ammo = new Array(Weapon.WP_NUM_WEAPONS).fill(0);
  ammo[Weapon.WP_GAUNTLET] = -1;
  ammo[Weapon.WP_MACHINEGUN] = 100;
  const powerups = new Array(Powerup.PW_NUM_POWERUPS).fill(0);
  return {
    commandTime: 0,
    pm_type: PmType.PM_NORMAL,
    bobCycle: 0,
    pm_flags: 0,
    pm_time: 0,
    origin: [0, 0, 32],
    velocity: [0, 0, 0],
    weaponTime: 0,
    gravity: 800,
    speed: 320,
    delta_angles: [0, 0, 0],
    groundEntityNum: 1023,
    legsTimer: 0,
    legsAnim: AnimNumber.LEGS_IDLE,
    torsoTimer: 0,
    torsoAnim: AnimNumber.TORSO_STAND,
    movementDir: 0,
    eFlags: 0,
    eventSequence: 0,
    events: [0, 0],
    eventParms: [0, 0],
    clientNum,
    weapon: Weapon.WP_MACHINEGUN,
    weaponstate: 'WEAPON_READY',
    viewangles: [0, 0, 0],
    viewheight: 26,
    damageEvent: 0,
    damageYaw: 0,
    damagePitch: 0,
    damageCount: 0,
    health: 125,
    armor: 0,
    maxHealth: 100,
    weaponsMask: (1 << Weapon.WP_GAUNTLET) | (1 << Weapon.WP_MACHINEGUN),
    ammo,
    powerups,
    persistant: {
      score: 0,
      hits: 0,
      rank: 0,
      team: 0,
      impressiveCount: 0,
      excellentCount: 0,
      humiliationCount: 0,
      defendCount: 0,
      assistCount: 0,
      captures: 0,
      killed: 0,
      lastFragTarget: '',
    },
  };
}

// ============================================================================
// Renderer Scene Entities (refEntity_t, dlight_t, polyVert_t)
// ============================================================================
export const RF_MINLIGHT     = 0x0001; // always have some light (view weapon)
export const RF_THIRD_PERSON = 0x0002; // don't draw through eyes, only mirrors
export const RF_FIRST_PERSON = 0x0004; // only draw through eyes (view weapon)
export const RF_DEPTHHACK    = 0x0008; // hack depth range [0, 0.3] for view weapon
export const RF_NOSHADOW     = 0x0040;
export const RF_LIGHTING_ORIGIN = 0x0080;

export enum RefEntityType {
  RT_MODEL = 0,
  RT_POLY = 1,
  RT_SPRITE = 2,
  RT_BEAM = 3,
  RT_RAIL_CORE = 4,
  RT_RAIL_RINGS = 5,
  RT_LIGHTNING = 6,
  RT_PORTALSURFACE = 7,
}

export interface RefEntity {
  reType: RefEntityType;
  renderfx: number;
  hModel: string;          // MD3 path or inline model '*1'
  lightingOrigin: Vec3;
  axis: Mat3;              // 3x3 rotation matrix
  nonNormalizedAxes: boolean;
  origin: Vec3;
  frame: number;
  oldorigin: Vec3;
  oldframe: number;
  backlerp: number;        // 0.0 = 100% frame, 1.0 = 100% oldframe
  skinNum: number;
  customSkin: string;      // optional .skin path or map
  customShader: string;    // override shader name
  shaderRGBA: [number, number, number, number]; // 0..255
  shaderTexCoord: Vec2;
  shaderTime: number;
  radius: number;          // for RT_SPRITE
  rotation: number;        // for RT_SPRITE in degrees
}

export interface DynamicLight {
  origin: Vec3;
  color: Vec3; // 0..1 RGB
  radius: number;
}

// ============================================================================
// Vector & Matrix Math Utilities
// ============================================================================
export const DEG2RAD = Math.PI / 180.0;
export const RAD2DEG = 180.0 / Math.PI;

export function vec3Clone(a: Vec3): Vec3 {
  return [a[0], a[1], a[2]];
}

export function vec3Add(a: Vec3, b: Vec3, out: Vec3 = [0, 0, 0]): Vec3 {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  return out;
}

export function vec3Sub(a: Vec3, b: Vec3, out: Vec3 = [0, 0, 0]): Vec3 {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  return out;
}

export function vec3Scale(a: Vec3, s: number, out: Vec3 = [0, 0, 0]): Vec3 {
  out[0] = a[0] * s;
  out[1] = a[1] * s;
  out[2] = a[2] * s;
  return out;
}

export function vec3MA(v: Vec3, s: number, b: Vec3, out: Vec3 = [0, 0, 0]): Vec3 {
  out[0] = v[0] + b[0] * s;
  out[1] = v[1] + b[1] * s;
  out[2] = v[2] + b[2] * s;
  return out;
}

export function vec3Dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function vec3Cross(a: Vec3, b: Vec3, out: Vec3 = [0, 0, 0]): Vec3 {
  const ax = a[0], ay = a[1], az = a[2];
  const bx = b[0], by = b[1], bz = b[2];
  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
}

export function vec3Length(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}

export function vec3LengthSq(a: Vec3): number {
  return a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
}

export function vec3Dist(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export function vec3Lerp(a: Vec3, b: Vec3, t: number, out: Vec3 = [0, 0, 0]): Vec3 {
  out[0] = a[0] + (b[0] - a[0]) * t;
  out[1] = a[1] + (b[1] - a[1]) * t;
  out[2] = a[2] + (b[2] - a[2]) * t;
  return out;
}

export function vec3Normalize(v: Vec3, out: Vec3 = v): number {
  const len = Math.hypot(v[0], v[1], v[2]);
  if (len > 1e-7) {
    const inv = 1.0 / len;
    out[0] = v[0] * inv;
    out[1] = v[1] * inv;
    out[2] = v[2] * inv;
  } else {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }
  return len;
}

/**
 * Quake III AngleVectors (pitch, yaw, roll in degrees)
 * Forward (+X at 0,0), Right (-Y at 0,0), Up (+Z at 0,0)
 */
export function AngleVectors(
  angles: Vec3,
  forward?: Vec3 | null,
  right?: Vec3 | null,
  up?: Vec3 | null
): void {
  const pitch = angles[0] * DEG2RAD;
  const yaw = angles[1] * DEG2RAD;
  const roll = angles[2] * DEG2RAD;

  const sp = Math.sin(pitch);
  const cp = Math.cos(pitch);
  const sy = Math.sin(yaw);
  const cy = Math.cos(yaw);
  const sr = Math.sin(roll);
  const cr = Math.cos(roll);

  if (forward) {
    forward[0] = cp * cy;
    forward[1] = cp * sy;
    forward[2] = -sp;
  }
  if (right) {
    right[0] = -1 * sr * sp * cy + -1 * cr * -sy;
    right[1] = -1 * sr * sp * sy + -1 * cr * cy;
    right[2] = -1 * sr * cp;
  }
  if (up) {
    up[0] = cr * sp * cy + -sr * -sy;
    up[1] = cr * sp * sy + -sr * cy;
    up[2] = cr * cp;
  }
}

export function AnglesToAxis(angles: Vec3, axis: Mat3): void {
  const right: Vec3 = [0, 0, 0];
  AngleVectors(angles, axis[0], right, axis[2]);
  // In Quake 3, axis[1] is LEFT (-right)
  axis[1][0] = -right[0];
  axis[1][1] = -right[1];
  axis[1][2] = -right[2];
}

export function AxisClear(): Mat3 {
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
}

export function AxisCopy(src: Mat3, dst: Mat3): void {
  for (let i = 0; i < 3; i++) {
    dst[i][0] = src[i][0];
    dst[i][1] = src[i][1];
    dst[i][2] = src[i][2];
  }
}

export function MatrixMultiply3x3(in1: Mat3, in2: Mat3, out: Mat3): void {
  for (let i = 0; i < 3; i++) {
    const x = in1[i][0] * in2[0][0] + in1[i][1] * in2[1][0] + in1[i][2] * in2[2][0];
    const y = in1[i][0] * in2[0][1] + in1[i][1] * in2[1][1] + in1[i][2] * in2[2][1];
    const z = in1[i][0] * in2[0][2] + in1[i][1] * in2[1][2] + in1[i][2] * in2[2][2];
    out[i][0] = x;
    out[i][1] = y;
    out[i][2] = z;
  }
}

export function vectoangles(value1: Vec3, angles: Vec3): void {
  let forward: number;
  let yaw: number;
  let pitch: number;

  if (value1[1] === 0 && value1[0] === 0) {
    yaw = 0;
    if (value1[2] > 0) {
      pitch = 90;
    } else {
      pitch = 270;
    }
  } else {
    if (value1[0]) {
      yaw = (Math.atan2(value1[1], value1[0]) * 180) / Math.PI;
    } else if (value1[1] > 0) {
      yaw = 90;
    } else {
      yaw = 270;
    }
    if (yaw < 0) {
      yaw += 360;
    }
    forward = Math.hypot(value1[0], value1[1]);
    pitch = (Math.atan2(value1[2], forward) * 180) / Math.PI;
    if (pitch < 0) {
      pitch += 360;
    }
  }

  angles[0] = -pitch;
  angles[1] = yaw;
  angles[2] = 0;
}

export function AngleNormalize360(angle: number): number {
  return (360.0 / 65536) * (((angle * (65536 / 360.0)) | 0) & 65535);
}

export function AngleNormalize180(angle: number): number {
  let a = AngleNormalize360(angle);
  if (a > 180.0) {
    a -= 360.0;
  }
  return a;
}

export function AngleSubtract(a1: number, a2: number): number {
  return AngleNormalize180(a1 - a2);
}

export function LerpAngle(from: number, to: number, frac: number): number {
  let a = to - from;
  if (a > 180) a -= 360;
  if (a < -180) a += 360;
  return from + frac * a;
}

// Deterministic Q_rand for shotgun spread & effects
export function Q_rand(seedRef: { seed: number }): number {
  seedRef.seed = (69069 * seedRef.seed + 1) | 0;
  return seedRef.seed & 0x7fff;
}

export function Q_crandom(seedRef: { seed: number }): number {
  return 2.0 * ((Q_rand(seedRef) / 0x7fff) - 0.5);
}

// ============================================================================
// 4x4 Column-Major Matrix Helpers for WebGL2
// ============================================================================
export function mat4Identity(out = new Float32Array(16)): Float32Array {
  out.fill(0);
  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}

export function mat4Multiply(a: Float32Array, b: Float32Array, out = new Float32Array(16)): Float32Array {
  const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

  for (let i = 0; i < 4; i++) {
    const b0 = b[i * 4 + 0];
    const b1 = b[i * 4 + 1];
    const b2 = b[i * 4 + 2];
    const b3 = b[i * 4 + 3];
    out[i * 4 + 0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[i * 4 + 1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[i * 4 + 2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[i * 4 + 3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  }
  return out;
}

export function mat4Perspective(fovYRad: number, aspect: number, near: number, far: number, out = new Float32Array(16)): Float32Array {
  const f = 1.0 / Math.tan(fovYRad / 2);
  const nf = 1 / (near - far);
  out.fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = 2 * far * near * nf;
  return out;
}

/**
 * Builds the Quake 3 View Matrix (from Quake Z-up Right-Handed space into WebGL Camera Space)
 * Exactly matches R_RotateForViewer in tr_main.c!
 */
export function buildQuakeViewMatrix(origin: Vec3, viewAxis: Mat3, out = new Float32Array(16)): Float32Array {
  // Viewer matrix in Quake coordinates
  const viewer = new Float32Array(16);
  viewer[0] = viewAxis[0][0];
  viewer[4] = viewAxis[0][1];
  viewer[8] = viewAxis[0][2];
  viewer[12] = -origin[0] * viewer[0] + -origin[1] * viewer[4] + -origin[2] * viewer[8];

  viewer[1] = viewAxis[1][0];
  viewer[5] = viewAxis[1][1];
  viewer[9] = viewAxis[1][2];
  viewer[13] = -origin[0] * viewer[1] + -origin[1] * viewer[5] + -origin[2] * viewer[9];

  viewer[2] = viewAxis[2][0];
  viewer[6] = viewAxis[2][1];
  viewer[10] = viewAxis[2][2];
  viewer[14] = -origin[0] * viewer[2] + -origin[1] * viewer[6] + -origin[2] * viewer[10];

  viewer[3] = 0;
  viewer[7] = 0;
  viewer[11] = 0;
  viewer[15] = 1;

  // s_flipMatrix converts Quake (+X forward, +Y left, +Z up) -> OpenGL (-Z forward, +X right, +Y up)
  const s_flipMatrix = new Float32Array([
     0,  0, -1,  0,
    -1,  0,  0,  0,
     0,  1,  0,  0,
     0,  0,  0,  1,
  ]);

  return mat4Multiply(s_flipMatrix, viewer, out);
}

export function buildEntityModelMatrix(origin: Vec3, axis: Mat3, out = new Float32Array(16)): Float32Array {
  out[0] = axis[0][0];
  out[1] = axis[0][1];
  out[2] = axis[0][2];
  out[3] = 0;

  out[4] = axis[1][0];
  out[5] = axis[1][1];
  out[6] = axis[1][2];
  out[7] = 0;

  out[8] = axis[2][0];
  out[9] = axis[2][1];
  out[10] = axis[2][2];
  out[11] = 0;

  out[12] = origin[0];
  out[13] = origin[1];
  out[14] = origin[2];
  out[15] = 1;
  return out;
}
