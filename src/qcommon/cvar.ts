// ============================================================================
// src/qcommon/cvar.ts
// Quake III Arena Cvar (Console Variable) System with Archive Persistence
// ============================================================================

export const CVAR_ARCHIVE    = 0x0001; // set to cause it to be saved to q3config
export const CVAR_USERINFO   = 0x0002; // sent to server on connect or change
export const CVAR_SERVERINFO = 0x0004; // sent in response to front end requests
export const CVAR_SYSTEMINFO = 0x0008; // these cvars will be duplicated on all clients
export const CVAR_INIT       = 0x0010; // don't allow change from console at all
export const CVAR_LATCH      = 0x0020; // will only change when C code next does a Cvar_Get()
export const CVAR_ROM        = 0x0040; // display only, cannot be set by user at all
export const CVAR_CHEAT      = 0x0200; // can not be changed if cheats are disabled

export interface Cvar {
  name: string;
  string: string;
  resetString: string;
  value: number;
  integer: number;
  flags: number;
  modified: boolean;
  modificationCount: number;
}

class CvarRegistry {
  private vars = new Map<string, Cvar>();
  private storageKey = 'q3_webgl2_cvars_v1';

  constructor() {
    this.registerDefaults();
    this.loadArchived();
  }

  private registerDefaults(): void {
    // Renderer Cvars
    this.get('r_overBrightBits', '1', CVAR_ARCHIVE);
    this.get('r_mapOverBrightBits', '2', CVAR_ARCHIVE);
    this.get('r_gamma', '1.15', CVAR_ARCHIVE);
    this.get('r_intensity', '1.2', CVAR_ARCHIVE);
    this.get('r_lightmap', '0', 0);
    this.get('r_fullbright', '0', CVAR_CHEAT);
    this.get('r_showtris', '0', 0);
    this.get('r_fastsky', '0', CVAR_ARCHIVE);
    this.get('r_subdivisions', '4', CVAR_ARCHIVE);
    this.get('r_lodCurveError', '250', CVAR_ARCHIVE);
    this.get('r_dynamiclight', '1', CVAR_ARCHIVE);
    this.get('r_flares', '1', CVAR_ARCHIVE);
    this.get('r_railWidth', '16', CVAR_ARCHIVE);
    this.get('r_railCoreWidth', '6', CVAR_ARCHIVE);
    this.get('r_railSegmentLength', '32', CVAR_ARCHIVE);

    // Client Game Cvars
    this.get('cg_fov', '100', CVAR_ARCHIVE);
    this.get('cg_drawGun', '1', CVAR_ARCHIVE);
    this.get('cg_drawFPS', '1', CVAR_ARCHIVE);
    this.get('cg_drawSpeed', '1', CVAR_ARCHIVE);
    this.get('cg_drawTimer', '1', CVAR_ARCHIVE);
    this.get('cg_drawStatus', '1', CVAR_ARCHIVE);
    this.get('cg_draw2D', '1', CVAR_ARCHIVE);
    this.get('cg_drawCrosshair', '4', CVAR_ARCHIVE);
    this.get('cg_crosshairSize', '24', CVAR_ARCHIVE);
    this.get('cg_simpleItems', '0', CVAR_ARCHIVE);
    this.get('cg_brassTime', '2500', CVAR_ARCHIVE);
    this.get('cg_marks', '1', CVAR_ARCHIVE);
    this.get('cg_autoswitch', '1', CVAR_ARCHIVE);
    this.get('cg_bobup', '0.005', CVAR_ARCHIVE);
    this.get('cg_bobpitch', '0.002', CVAR_ARCHIVE);
    this.get('cg_bobroll', '0.002', CVAR_ARCHIVE);
    this.get('cg_runpitch', '0.002', CVAR_ARCHIVE);
    this.get('cg_runroll', '0.005', CVAR_ARCHIVE);
    this.get('cg_thirdPerson', '0', 0);
    this.get('cg_thirdPersonRange', '80', 0);

    // Physics / Server / Game Cvars
    this.get('sv_cheats', '1', CVAR_SYSTEMINFO);
    this.get('sv_fps', '40', CVAR_SYSTEMINFO);
    this.get('pmove_fixed', '1', CVAR_SYSTEMINFO);
    this.get('pmove_msec', '8', CVAR_SYSTEMINFO);
    this.get('g_speed', '320', CVAR_SERVERINFO);
    this.get('g_gravity', '800', CVAR_SERVERINFO);
    this.get('g_knockback', '1000', 0);
    this.get('g_quadfactor', '3', 0);
    this.get('g_gametype', '0', CVAR_SERVERINFO); // 0=FFA, 1=Tourney, 3=TDM, 4=CTF
    this.get('fraglimit', '20', CVAR_SERVERINFO | CVAR_ARCHIVE);
    this.get('timelimit', '15', CVAR_SERVERINFO | CVAR_ARCHIVE);
    this.get('bot_enable', '1', CVAR_ARCHIVE);
    this.get('bot_minplayers', '3', CVAR_ARCHIVE);

    // Sound & Input Cvars
    this.get('s_volume', '0.75', CVAR_ARCHIVE);
    this.get('s_musicvolume', '0.30', CVAR_ARCHIVE);
    this.get('sensitivity', '3.5', CVAR_ARCHIVE);
    this.get('m_pitch', '0.022', CVAR_ARCHIVE);
    this.get('m_yaw', '0.022', CVAR_ARCHIVE);
    this.get('name', 'Ranger', CVAR_USERINFO | CVAR_ARCHIVE);
    this.get('model', 'sarge/default', CVAR_USERINFO | CVAR_ARCHIVE);
    this.get('color1', '4', CVAR_USERINFO | CVAR_ARCHIVE);
  }

  public get(name: string, defaultValue = '', flags = 0): Cvar {
    const key = name.toLowerCase();
    let v = this.vars.get(key);
    if (!v) {
      const num = Number.parseFloat(defaultValue);
      v = {
        name,
        string: defaultValue,
        resetString: defaultValue,
        value: Number.isNaN(num) ? 0 : num,
        integer: Number.isNaN(num) ? 0 : num | 0,
        flags,
        modified: true,
        modificationCount: 1,
      };
      this.vars.set(key, v);
    } else {
      v.flags |= flags;
    }
    return v;
  }

  public set(name: string, value: string | number): Cvar {
    const str = String(value);
    const v = this.get(name, str);
    if (v.string !== str) {
      v.string = str;
      const num = Number.parseFloat(str);
      v.value = Number.isNaN(num) ? 0 : num;
      v.integer = Number.isNaN(num) ? 0 : num | 0;
      v.modified = true;
      v.modificationCount++;
      if (v.flags & CVAR_ARCHIVE) {
        this.saveArchived();
      }
    }
    return v;
  }

  public variableValue(name: string): number {
    const v = this.vars.get(name.toLowerCase());
    return v ? v.value : 0;
  }

  public variableIntegerValue(name: string): number {
    const v = this.vars.get(name.toLowerCase());
    return v ? v.integer : 0;
  }

  public variableString(name: string): string {
    const v = this.vars.get(name.toLowerCase());
    return v ? v.string : '';
  }

  public listAll(): Cvar[] {
    return Array.from(this.vars.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  private loadArchived(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, string>;
      for (const [k, val] of Object.entries(parsed)) {
        this.set(k, val);
      }
    } catch {
      // ignore localStorage errors
    }
  }

  private saveArchived(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const data: Record<string, string> = {};
      for (const v of this.vars.values()) {
        if (v.flags & CVAR_ARCHIVE) {
          data[v.name] = v.string;
        }
      }
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {
      // ignore localStorage errors
    }
  }
}

export const Cvars = new CvarRegistry();
