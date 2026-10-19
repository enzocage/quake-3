(() => {
  // src/qcommon/cvar.ts
  var CVAR_ARCHIVE = 1;
  var CVAR_USERINFO = 2;
  var CVAR_SERVERINFO = 4;
  var CVAR_SYSTEMINFO = 8;
  var CVAR_CHEAT = 512;
  var CvarRegistry = class {
    vars = /* @__PURE__ */ new Map();
    storageKey = "q3_webgl2_cvars_v1";
    constructor() {
      this.registerDefaults();
      this.loadArchived();
    }
    registerDefaults() {
      this.get("r_overBrightBits", "1", CVAR_ARCHIVE);
      this.get("r_mapOverBrightBits", "2", CVAR_ARCHIVE);
      this.get("r_gamma", "1.15", CVAR_ARCHIVE);
      this.get("r_intensity", "1.2", CVAR_ARCHIVE);
      this.get("r_lightmap", "0", 0);
      this.get("r_fullbright", "0", CVAR_CHEAT);
      this.get("r_showtris", "0", 0);
      this.get("r_fastsky", "0", CVAR_ARCHIVE);
      this.get("r_subdivisions", "4", CVAR_ARCHIVE);
      this.get("r_lodCurveError", "250", CVAR_ARCHIVE);
      this.get("r_dynamiclight", "1", CVAR_ARCHIVE);
      this.get("r_flares", "1", CVAR_ARCHIVE);
      this.get("r_railWidth", "16", CVAR_ARCHIVE);
      this.get("r_railCoreWidth", "6", CVAR_ARCHIVE);
      this.get("r_railSegmentLength", "32", CVAR_ARCHIVE);
      this.get("cg_fov", "100", CVAR_ARCHIVE);
      this.get("cg_drawGun", "1", CVAR_ARCHIVE);
      this.get("cg_drawFPS", "1", CVAR_ARCHIVE);
      this.get("cg_drawSpeed", "1", CVAR_ARCHIVE);
      this.get("cg_drawTimer", "1", CVAR_ARCHIVE);
      this.get("cg_drawStatus", "1", CVAR_ARCHIVE);
      this.get("cg_draw2D", "1", CVAR_ARCHIVE);
      this.get("cg_drawCrosshair", "4", CVAR_ARCHIVE);
      this.get("cg_crosshairSize", "24", CVAR_ARCHIVE);
      this.get("cg_simpleItems", "0", CVAR_ARCHIVE);
      this.get("cg_brassTime", "2500", CVAR_ARCHIVE);
      this.get("cg_marks", "1", CVAR_ARCHIVE);
      this.get("cg_autoswitch", "1", CVAR_ARCHIVE);
      this.get("cg_bobup", "0.005", CVAR_ARCHIVE);
      this.get("cg_bobpitch", "0.002", CVAR_ARCHIVE);
      this.get("cg_bobroll", "0.002", CVAR_ARCHIVE);
      this.get("cg_runpitch", "0.002", CVAR_ARCHIVE);
      this.get("cg_runroll", "0.005", CVAR_ARCHIVE);
      this.get("cg_thirdPerson", "0", 0);
      this.get("cg_thirdPersonRange", "80", 0);
      this.get("sv_cheats", "1", CVAR_SYSTEMINFO);
      this.get("sv_fps", "40", CVAR_SYSTEMINFO);
      this.get("pmove_fixed", "1", CVAR_SYSTEMINFO);
      this.get("pmove_msec", "8", CVAR_SYSTEMINFO);
      this.get("g_speed", "320", CVAR_SERVERINFO);
      this.get("g_gravity", "800", CVAR_SERVERINFO);
      this.get("g_knockback", "1000", 0);
      this.get("g_quadfactor", "3", 0);
      this.get("g_gametype", "0", CVAR_SERVERINFO);
      this.get("fraglimit", "20", CVAR_SERVERINFO | CVAR_ARCHIVE);
      this.get("timelimit", "15", CVAR_SERVERINFO | CVAR_ARCHIVE);
      this.get("bot_enable", "1", CVAR_ARCHIVE);
      this.get("bot_minplayers", "3", CVAR_ARCHIVE);
      this.get("s_volume", "0.75", CVAR_ARCHIVE);
      this.get("s_musicvolume", "0.30", CVAR_ARCHIVE);
      this.get("sensitivity", "3.5", CVAR_ARCHIVE);
      this.get("m_pitch", "0.022", CVAR_ARCHIVE);
      this.get("m_yaw", "0.022", CVAR_ARCHIVE);
      this.get("name", "Ranger", CVAR_USERINFO | CVAR_ARCHIVE);
      this.get("model", "sarge/default", CVAR_USERINFO | CVAR_ARCHIVE);
      this.get("color1", "4", CVAR_USERINFO | CVAR_ARCHIVE);
    }
    get(name, defaultValue = "", flags = 0) {
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
          modificationCount: 1
        };
        this.vars.set(key, v);
      } else {
        v.flags |= flags;
      }
      return v;
    }
    set(name, value) {
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
    variableValue(name) {
      const v = this.vars.get(name.toLowerCase());
      return v ? v.value : 0;
    }
    variableIntegerValue(name) {
      const v = this.vars.get(name.toLowerCase());
      return v ? v.integer : 0;
    }
    variableString(name) {
      const v = this.vars.get(name.toLowerCase());
      return v ? v.string : "";
    }
    listAll() {
      return Array.from(this.vars.values()).sort((a, b) => a.name.localeCompare(b.name));
    }
    loadArchived() {
      try {
        if (typeof localStorage === "undefined") return;
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        for (const [k, val] of Object.entries(parsed)) {
          this.set(k, val);
        }
      } catch {
      }
    }
    saveArchived() {
      try {
        if (typeof localStorage === "undefined") return;
        const data = {};
        for (const v of this.vars.values()) {
          if (v.flags & CVAR_ARCHIVE) {
            data[v.name] = v.string;
          }
        }
        localStorage.setItem(this.storageKey, JSON.stringify(data));
      } catch {
      }
    }
  };
  var Cvars = new CvarRegistry();

  // node_modules/fflate/esm/browser.js
  var u8 = Uint8Array;
  var u16 = Uint16Array;
  var i32 = Int32Array;
  var fleb = new u8([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    4,
    4,
    4,
    4,
    5,
    5,
    5,
    5,
    0,
    /* unused */
    0,
    0,
    /* impossible */
    0
  ]);
  var fdeb = new u8([
    0,
    0,
    0,
    0,
    1,
    1,
    2,
    2,
    3,
    3,
    4,
    4,
    5,
    5,
    6,
    6,
    7,
    7,
    8,
    8,
    9,
    9,
    10,
    10,
    11,
    11,
    12,
    12,
    13,
    13,
    /* unused */
    0,
    0
  ]);
  var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  var freb = function(eb, start) {
    var b = new u16(31);
    for (var i = 0; i < 31; ++i) {
      b[i] = start += 1 << eb[i - 1];
    }
    var r = new i32(b[30]);
    for (var i = 1; i < 30; ++i) {
      for (var j = b[i]; j < b[i + 1]; ++j) {
        r[j] = j - b[i] << 5 | i;
      }
    }
    return { b, r };
  };
  var _a = freb(fleb, 2);
  var fl = _a.b;
  var revfl = _a.r;
  fl[28] = 258, revfl[258] = 28;
  var _b = freb(fdeb, 0);
  var fd = _b.b;
  var revfd = _b.r;
  var rev = new u16(32768);
  for (i = 0; i < 32768; ++i) {
    x = (i & 43690) >> 1 | (i & 21845) << 1;
    x = (x & 52428) >> 2 | (x & 13107) << 2;
    x = (x & 61680) >> 4 | (x & 3855) << 4;
    rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
  }
  var x;
  var i;
  var hMap = function(cd, mb, r) {
    var s = cd.length;
    var i = 0;
    var l = new u16(mb);
    for (; i < s; ++i) {
      if (cd[i])
        ++l[cd[i] - 1];
    }
    var le = new u16(mb);
    for (i = 1; i < mb; ++i) {
      le[i] = le[i - 1] + l[i - 1] << 1;
    }
    var co;
    if (r) {
      co = new u16(1 << mb);
      var rvb = 15 - mb;
      for (i = 0; i < s; ++i) {
        if (cd[i]) {
          var sv = i << 4 | cd[i];
          var r_1 = mb - cd[i];
          var v = le[cd[i] - 1]++ << r_1;
          for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
            co[rev[v] >> rvb] = sv;
          }
        }
      }
    } else {
      co = new u16(s);
      for (i = 0; i < s; ++i) {
        if (cd[i]) {
          co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
        }
      }
    }
    return co;
  };
  var flt = new u8(288);
  for (i = 0; i < 144; ++i)
    flt[i] = 8;
  var i;
  for (i = 144; i < 256; ++i)
    flt[i] = 9;
  var i;
  for (i = 256; i < 280; ++i)
    flt[i] = 7;
  var i;
  for (i = 280; i < 288; ++i)
    flt[i] = 8;
  var i;
  var fdt = new u8(32);
  for (i = 0; i < 32; ++i)
    fdt[i] = 5;
  var i;
  var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
  var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
  var max = function(a) {
    var m = a[0];
    for (var i = 1; i < a.length; ++i) {
      if (a[i] > m)
        m = a[i];
    }
    return m;
  };
  var bits = function(d, p, m) {
    var o = p / 8 | 0;
    return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
  };
  var bits16 = function(d, p) {
    var o = p / 8 | 0;
    return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
  };
  var shft = function(p) {
    return (p + 7) / 8 | 0;
  };
  var slc = function(v, s, e) {
    if (s == null || s < 0)
      s = 0;
    if (e == null || e > v.length)
      e = v.length;
    return new u8(v.subarray(s, e));
  };
  var ec = [
    "unexpected EOF",
    "invalid block type",
    "invalid length/literal",
    "invalid distance",
    "stream finished",
    "no stream handler",
    ,
    // determined by compression function
    "no callback",
    "invalid UTF-8 data",
    "extra field too long",
    "date not in range 1980-2099",
    "filename too long",
    "stream finishing",
    "invalid zip data"
    // determined by unknown compression method
  ];
  var err = function(ind, msg, nt) {
    var e = new Error(msg || ec[ind]);
    e.code = ind;
    if (Error.captureStackTrace)
      Error.captureStackTrace(e, err);
    if (!nt)
      throw e;
    return e;
  };
  var inflt = function(dat, st, buf, dict) {
    var sl = dat.length, dl = dict ? dict.length : 0;
    if (!sl || st.f && !st.l)
      return buf || new u8(0);
    var noBuf = !buf;
    var resize = noBuf || st.i != 2;
    var noSt = st.i;
    if (noBuf)
      buf = new u8(sl * 3);
    var cbuf = function(l2) {
      var bl = buf.length;
      if (l2 > bl) {
        var nbuf = new u8(Math.max(bl * 2, l2));
        nbuf.set(buf);
        buf = nbuf;
      }
    };
    var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
    var tbts = sl * 8;
    do {
      if (!lm) {
        final = bits(dat, pos, 1);
        var type = bits(dat, pos + 1, 3);
        pos += 3;
        if (!type) {
          var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
          if (t > sl) {
            if (noSt)
              err(0);
            break;
          }
          if (resize)
            cbuf(bt + l);
          buf.set(dat.subarray(s, t), bt);
          st.b = bt += l, st.p = pos = t * 8, st.f = final;
          continue;
        } else if (type == 1)
          lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
        else if (type == 2) {
          var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
          var tl = hLit + bits(dat, pos + 5, 31) + 1;
          pos += 14;
          var ldt = new u8(tl);
          var clt = new u8(19);
          for (var i = 0; i < hcLen; ++i) {
            clt[clim[i]] = bits(dat, pos + i * 3, 7);
          }
          pos += hcLen * 3;
          var clb = max(clt), clbmsk = (1 << clb) - 1;
          var clm = hMap(clt, clb, 1);
          for (var i = 0; i < tl; ) {
            var r = clm[bits(dat, pos, clbmsk)];
            pos += r & 15;
            var s = r >> 4;
            if (s < 16) {
              ldt[i++] = s;
            } else {
              var c = 0, n = 0;
              if (s == 16)
                n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
              else if (s == 17)
                n = 3 + bits(dat, pos, 7), pos += 3;
              else if (s == 18)
                n = 11 + bits(dat, pos, 127), pos += 7;
              while (n--)
                ldt[i++] = c;
            }
          }
          var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
          lbt = max(lt);
          dbt = max(dt);
          lm = hMap(lt, lbt, 1);
          dm = hMap(dt, dbt, 1);
        } else
          err(1);
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
      }
      if (resize)
        cbuf(bt + 131072);
      var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
      var lpos = pos;
      for (; ; lpos = pos) {
        var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
        pos += c & 15;
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (!c)
          err(2);
        if (sym < 256)
          buf[bt++] = sym;
        else if (sym == 256) {
          lpos = pos, lm = null;
          break;
        } else {
          var add = sym - 254;
          if (sym > 264) {
            var i = sym - 257, b = fleb[i];
            add = bits(dat, pos, (1 << b) - 1) + fl[i];
            pos += b;
          }
          var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
          if (!d)
            err(3);
          pos += d & 15;
          var dt = fd[dsym];
          if (dsym > 3) {
            var b = fdeb[dsym];
            dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
          }
          if (pos > tbts) {
            if (noSt)
              err(0);
            break;
          }
          if (resize)
            cbuf(bt + 131072);
          var end = bt + add;
          if (bt < dt) {
            var shift = dl - dt, dend = Math.min(dt, end);
            if (shift + bt < 0)
              err(3);
            for (; bt < dend; ++bt)
              buf[bt] = dict[shift + bt];
          }
          for (; bt < end; ++bt)
            buf[bt] = buf[bt - dt];
        }
      }
      st.l = lm, st.p = lpos, st.b = bt, st.f = final;
      if (lm)
        final = 1, st.m = lbt, st.d = dm, st.n = dbt;
    } while (!final);
    return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
  };
  var et = /* @__PURE__ */ new u8(0);
  var b2 = function(d, b) {
    return d[b] | d[b + 1] << 8;
  };
  var b4 = function(d, b) {
    return (d[b] | d[b + 1] << 8 | d[b + 2] << 16 | d[b + 3] << 24) >>> 0;
  };
  var b8 = function(d, b) {
    return b4(d, b) + b4(d, b + 4) * 4294967296;
  };
  function inflateSync(data, opts) {
    return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
  }
  var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
  var tds = 0;
  try {
    td.decode(et, { stream: true });
    tds = 1;
  } catch (e) {
  }
  var dutf8 = function(d) {
    for (var r = "", i = 0; ; ) {
      var c = d[i++];
      var eb = (c > 127) + (c > 223) + (c > 239);
      if (i + eb > d.length)
        return { s: r, r: slc(d, i - 1) };
      if (!eb)
        r += String.fromCharCode(c);
      else if (eb == 3) {
        c = ((c & 15) << 18 | (d[i++] & 63) << 12 | (d[i++] & 63) << 6 | d[i++] & 63) - 65536, r += String.fromCharCode(55296 | c >> 10, 56320 | c & 1023);
      } else if (eb & 1)
        r += String.fromCharCode((c & 31) << 6 | d[i++] & 63);
      else
        r += String.fromCharCode((c & 15) << 12 | (d[i++] & 63) << 6 | d[i++] & 63);
    }
  };
  function strFromU8(dat, latin1) {
    if (latin1) {
      var r = "";
      for (var i = 0; i < dat.length; i += 16384)
        r += String.fromCharCode.apply(null, dat.subarray(i, i + 16384));
      return r;
    } else if (td) {
      return td.decode(dat);
    } else {
      var _a2 = dutf8(dat), s = _a2.s, r = _a2.r;
      if (r.length)
        err(8);
      return s;
    }
  }
  var slzh = function(d, b) {
    return b + 30 + b2(d, b + 26) + b2(d, b + 28);
  };
  var zh = function(d, b, z) {
    var fnl = b2(d, b + 28), efl = b2(d, b + 30), fn = strFromU8(d.subarray(b + 46, b + 46 + fnl), !(b2(d, b + 8) & 2048)), es = b + 46 + fnl;
    var _a2 = z64hs(d, es, efl, z, b4(d, b + 20), b4(d, b + 24), b4(d, b + 42)), sc = _a2[0], su = _a2[1], off = _a2[2];
    return [b2(d, b + 10), sc, su, fn, es + efl + b2(d, b + 32), off];
  };
  var z64hs = function(d, b, l, z, sc, su, off) {
    var nsc = sc == 4294967295, nsu = su == 4294967295, noff = off == 4294967295, e = b + l;
    var nf = nsc + nsu + noff;
    if (z && nf) {
      for (; b + 4 < e; b += 4 + b2(d, b + 2)) {
        if (b2(d, b) == 1) {
          return [
            nsc ? b8(d, b + 4 + 8 * nsu) : sc,
            nsu ? b8(d, b + 4) : su,
            noff ? b8(d, b + 4 + 8 * (nsu + nsc)) : off,
            1
          ];
        }
      }
      if (z < 2)
        err(13);
    }
    return [sc, su, off, 0];
  };
  function unzipSync(data, opts) {
    var files = {};
    var e = data.length - 22;
    for (; b4(data, e) != 101010256; --e) {
      if (!e || data.length - e > 65558)
        err(13);
    }
    ;
    var c = b2(data, e + 8);
    if (!c)
      return {};
    var o = b4(data, e + 16);
    var z = b4(data, e - 20) == 117853008;
    if (z) {
      var ze = b4(data, e - 12);
      z = b4(data, ze) == 101075792;
      if (z) {
        c = b4(data, ze + 32);
        o = b4(data, ze + 48);
      }
    }
    var fltr = opts && opts.filter;
    for (var i = 0; i < c; ++i) {
      var _a2 = zh(data, o, z), c_2 = _a2[0], sc = _a2[1], su = _a2[2], fn = _a2[3], no = _a2[4], off = _a2[5], b = slzh(data, off);
      o = no;
      if (!fltr || fltr({
        name: fn,
        size: sc,
        originalSize: su,
        compression: c_2
      })) {
        if (!c_2)
          files[fn] = slc(data, b, b + sc);
        else if (c_2 == 8)
          files[fn] = inflateSync(data.subarray(b, b + sc), { out: new u8(su) });
        else
          err(14, "unknown compression type " + c_2);
      }
    }
    return files;
  }

  // src/qcommon/cmd.ts
  var Q3Tokenizer = class {
    text;
    pos = 0;
    len;
    constructor(text) {
      this.text = text;
      this.len = text.length;
    }
    eof() {
      return this.pos >= this.len;
    }
    /**
     * Parses the next token.
     * @param allowLineBreaks If false, returns '' if a newline is encountered before a token.
     */
    nextToken(allowLineBreaks = true) {
      while (this.pos < this.len) {
        while (this.pos < this.len) {
          const ch = this.text.charCodeAt(this.pos);
          if (ch > 32) break;
          if (!allowLineBreaks && ch === 10) {
            return "";
          }
          this.pos++;
        }
        if (this.pos >= this.len) return "";
        if (this.text[this.pos] === "/" && this.text[this.pos + 1] === "/") {
          while (this.pos < this.len && this.text.charCodeAt(this.pos) !== 10) {
            this.pos++;
          }
          continue;
        }
        if (this.text[this.pos] === "/" && this.text[this.pos + 1] === "*") {
          this.pos += 2;
          while (this.pos < this.len && !(this.text[this.pos] === "*" && this.text[this.pos + 1] === "/")) {
            this.pos++;
          }
          if (this.pos < this.len) this.pos += 2;
          continue;
        }
        break;
      }
      if (this.pos >= this.len) return "";
      if (this.text[this.pos] === '"') {
        this.pos++;
        const start2 = this.pos;
        while (this.pos < this.len && this.text[this.pos] !== '"') {
          this.pos++;
        }
        const token = this.text.slice(start2, this.pos);
        if (this.pos < this.len) this.pos++;
        return token;
      }
      if (this.text[this.pos] === "{" || this.text[this.pos] === "}") {
        return this.text[this.pos++];
      }
      const start = this.pos;
      while (this.pos < this.len) {
        const ch = this.text.charCodeAt(this.pos);
        if (ch <= 32) break;
        const c = this.text[this.pos];
        if (c === "{" || c === "}" || c === '"') break;
        if (c === "/" && (this.text[this.pos + 1] === "/" || this.text[this.pos + 1] === "*")) {
          break;
        }
        this.pos++;
      }
      return this.text.slice(start, this.pos);
    }
    skipRestOfLine() {
      while (this.pos < this.len && this.text.charCodeAt(this.pos) !== 10) {
        this.pos++;
      }
      if (this.pos < this.len) this.pos++;
    }
    skipBracedSection(initialDepth = 1) {
      let depth = initialDepth;
      while (depth > 0 && !this.eof()) {
        const tok = this.nextToken(true);
        if (!tok) break;
        if (tok === "{") depth++;
        else if (tok === "}") depth--;
      }
    }
  };
  var CommandSystem = class {
    commands = /* @__PURE__ */ new Map();
    logListeners = [];
    logHistory = [];
    constructor() {
      this.addCommand("cvarlist", () => {
        const all = Cvars.listAll();
        for (const c of all) {
          this.print(`  ^5${c.name}^7 = "${c.string}"`);
        }
        this.print(`${all.length} total cvars`);
      });
      this.addCommand("cmdlist", () => {
        const names = this.listCommands();
        this.print(`^3Available commands (${names.length}): ^7${names.join(", ")}`);
      });
      this.addCommand("set", (args) => {
        if (args.length < 3) {
          this.print("usage: set <variable> <value>");
          return;
        }
        Cvars.set(args[1], args.slice(2).join(" "));
        this.print(`^2${args[1]} ^7set to "${Cvars.variableString(args[1])}"`);
      });
      this.addCommand("toggle", (args) => {
        if (args.length < 2) return;
        const cur = Cvars.variableIntegerValue(args[1]);
        Cvars.set(args[1], cur ? "0" : "1");
        this.print(`^2${args[1]} ^7toggled to ${Cvars.variableString(args[1])}`);
      });
    }
    addCommand(name, handler) {
      this.commands.set(name.toLowerCase(), handler);
    }
    executeText(line) {
      const clean = line.trim().replace(/^[\/\\]+/, "");
      if (!clean) return;
      const parts = clean.split(";").map((s) => s.trim()).filter(Boolean);
      for (const part of parts) {
        const tokenizer = new Q3Tokenizer(part);
        const args = [];
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
        const existing = Cvars.listAll().find((c) => c.name.toLowerCase() === cmdName);
        if (existing || args.length === 2) {
          if (args.length === 1) {
            const v = Cvars.get(cmdName);
            this.print(`"${v.name}" is:"${v.string}^7" default:"${v.resetString}^7"`);
          } else {
            Cvars.set(cmdName, args.slice(1).join(" "));
            this.print(`^5${cmdName}^7 = "${Cvars.variableString(cmdName)}"`);
          }
          continue;
        }
        this.print(`^1Unknown command "${args[0]}"`);
      }
    }
    print(msg) {
      this.logHistory.push(msg);
      if (this.logHistory.length > 300) {
        this.logHistory.shift();
      }
      for (const listener of this.logListeners) {
        listener(msg);
      }
    }
    onLog(listener) {
      this.logListeners.push(listener);
    }
    getLogs() {
      return this.logHistory;
    }
    listCommands() {
      return Array.from(this.commands.keys()).sort();
    }
  };
  var Cmd = new CommandSystem();

  // src/qcommon/files.ts
  var IDB_NAME = "q3_arena_vfs_db_v1";
  var IDB_STORE = "pk3_archives";
  var VirtualFileSystem = class {
    mounts = [];
    looseFiles = /* @__PURE__ */ new Map();
    textDecoder = new TextDecoder("utf-8");
    changeListeners = [];
    normalizePath(rawPath) {
      return rawPath.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+/g, "/").trim().toLowerCase();
    }
    stripExtension(path) {
      const norm = this.normalizePath(path);
      const dot = norm.lastIndexOf(".");
      const slash = norm.lastIndexOf("/");
      if (dot > slash) {
        return norm.slice(0, dot);
      }
      return norm;
    }
    /**
     * Mounts a .PK3 (Standard ZIP) archive into the VFS
     */
    mountPk3(name, buffer, priority = 10, saveToIdb = false) {
      const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
      const unzipped = unzipSync(bytes);
      const fileMap = /* @__PURE__ */ new Map();
      let count = 0;
      for (const [entryPath, data] of Object.entries(unzipped)) {
        if (entryPath.endsWith("/") || data.byteLength === 0) continue;
        const norm = this.normalizePath(entryPath);
        fileMap.set(norm, data);
        count++;
      }
      this.mounts = this.mounts.filter((m) => m.name.toLowerCase() !== name.toLowerCase());
      this.mounts.push({
        name,
        priority,
        files: fileMap
      });
      this.mounts.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return b.name.localeCompare(a.name, void 0, { numeric: true });
      });
      Cmd.print(`^2VFS: Mounted ^3${name}^7 (${count} files, priority ${priority})`);
      if (saveToIdb) {
        this.savePk3ToIdb(name, bytes, priority).catch(() => {
        });
      }
      this.notifyChange();
      return count;
    }
    /**
     * Mounts a single loose file (e.g., dropped .bsp, .md3, .shader, .wav, .tga)
     */
    writeFile(path, data) {
      const norm = this.normalizePath(path);
      const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
      this.looseFiles.set(norm, bytes);
    }
    /**
     * Reads a file by exact normalized path (or returns null)
     */
    readFile(path) {
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
    fileExists(path) {
      return this.readFile(path) !== null;
    }
    /**
     * Reads a file as UTF-8 text
     */
    readTextFile(path) {
      const data = this.readFile(path);
      if (!data) return null;
      return this.textDecoder.decode(data);
    }
    /**
     * Quake 3 R_FindImageFile logic:
     * Resolves image path by trying exact path, then .tga, .jpg, .png, .webp
     */
    findImageFile(path) {
      const base = this.stripExtension(path);
      const extensions = [".tga", ".jpg", ".jpeg", ".png", ".webp"];
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
    listFiles(dirPrefix = "", extension = "") {
      const normPrefix = this.normalizePath(dirPrefix);
      const normExt = extension.toLowerCase();
      const results = /* @__PURE__ */ new Set();
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
    getMountedPaksSummary() {
      const totalFiles = this.mounts.reduce((acc, m) => acc + m.files.size, 0) + this.looseFiles.size;
      return `${this.mounts.length} PK3s (${totalFiles} files)`;
    }
    onChange(cb) {
      this.changeListeners.push(cb);
    }
    notifyChange() {
      for (const cb of this.changeListeners) cb();
    }
    /**
     * Loads cached user/downloaded PK3 archives from IndexedDB
     */
    async loadCachedPk3sFromIdb() {
      if (typeof indexedDB === "undefined") return;
      try {
        const db = await this.openIdb();
        const tx = db.transaction(IDB_STORE, "readonly");
        const store = tx.objectStore(IDB_STORE);
        const req = store.getAll();
        const records = await new Promise(
          (resolve, reject) => {
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
          }
        );
        for (const rec of records) {
          this.mountPk3(rec.name, rec.bytes, rec.priority, false);
        }
      } catch {
      }
    }
    async savePk3ToIdb(name, bytes, priority) {
      if (typeof indexedDB === "undefined") return;
      const db = await this.openIdb();
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      store.put({ name, bytes, priority });
    }
    openIdb() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open(IDB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(IDB_STORE)) {
            db.createObjectStore(IDB_STORE, { keyPath: "name" });
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
    async fetchNeonKnightOAAssets(onProgress) {
      const baseUrl = "https://raw.githubusercontent.com/NeonKnightOA/nk-oa-assets/master";
      const assetList = [
        "scripts/common.shader",
        "scripts/gfx.shader",
        "scripts/models.shader",
        "scripts/sfx.shader",
        "scripts/sky.shader",
        "scripts/liquid.shader",
        "scripts/oa_fogs.shader",
        "scripts/weapons.shader",
        "scripts/bots.txt",
        "scripts/arenas.txt"
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
        }
      }
      if (fetched > 0) {
        Cmd.print(`^2NeonKnightOA/nk-oa-assets: ^7${fetched} Original-Skripte/Shader erfolgreich gemountet.`);
        this.notifyChange();
      }
      return fetched;
    }
  };
  var VFS = new VirtualFileSystem();

  // src/qcommon/q_shared.ts
  var SURF_NODAMAGE = 1;
  var SURF_SLICK = 2;
  var SURF_SKY = 4;
  var SURF_LADDER = 8;
  var SURF_NOIMPACT = 16;
  var SURF_NOMARKS = 32;
  var SURF_FLESH = 64;
  var SURF_NODRAW = 128;
  var SURF_NOLIGHTMAP = 1024;
  var SURF_POINTLIGHT = 2048;
  var SURF_METALSTEPS = 4096;
  var SURF_NOSTEPS = 8192;
  var SURF_NONSOLID = 16384;
  var SURF_ALPHASHADOW = 65536;
  var SURF_NODLIGHT = 131072;
  var CONTENTS_SOLID = 1;
  var CONTENTS_LAVA = 8;
  var CONTENTS_SLIME = 16;
  var CONTENTS_WATER = 32;
  var CONTENTS_FOG = 64;
  var CONTENTS_AREAPORTAL = 32768;
  var CONTENTS_PLAYERCLIP = 65536;
  var CONTENTS_CLUSTERPORTAL = 1048576;
  var CONTENTS_DONOTENTER = 2097152;
  var CONTENTS_ORIGIN = 16777216;
  var CONTENTS_BODY = 33554432;
  var CONTENTS_CORPSE = 67108864;
  var CONTENTS_STRUCTURAL = 268435456;
  var CONTENTS_TRANSLUCENT = 536870912;
  var CONTENTS_NODROP = 2147483648 | 0;
  var MASK_PLAYERSOLID = CONTENTS_SOLID | CONTENTS_PLAYERCLIP | CONTENTS_BODY;
  var MASK_DEADSOLID = CONTENTS_SOLID | CONTENTS_PLAYERCLIP;
  var MASK_WATER = CONTENTS_WATER | CONTENTS_LAVA | CONTENTS_SLIME;
  var MASK_OPAQUE = CONTENTS_SOLID | CONTENTS_SLIME | CONTENTS_LAVA;
  var MASK_SHOT = CONTENTS_SOLID | CONTENTS_BODY | CONTENTS_CORPSE;
  var PMF_DUCKED = 1;
  var PMF_JUMP_HELD = 2;
  var PMF_BACKWARDS_JUMP = 8;
  var PMF_TIME_LAND = 32;
  var PMF_TIME_KNOCKBACK = 64;
  var PMF_TIME_WATERJUMP = 256;
  var PMF_RESPAWNED = 512;
  var BUTTON_ATTACK = 1;
  var BUTTON_WALKING = 16;
  function createDefaultTrace(endpos = [0, 0, 0]) {
    return {
      allsolid: false,
      startsolid: false,
      fraction: 1,
      endpos: [endpos[0], endpos[1], endpos[2]],
      plane: { normal: [0, 0, 1], dist: 0, type: 3, signbits: 0 },
      surfaceFlags: 0,
      contents: 0,
      entityNum: 1023
      // ENTITYNUM_NONE
    };
  }
  function createDefaultPlayerState(clientNum = 0) {
    const ammo = new Array(11 /* WP_NUM_WEAPONS */).fill(0);
    ammo[1 /* WP_GAUNTLET */] = -1;
    ammo[2 /* WP_MACHINEGUN */] = 100;
    const powerups = new Array(9 /* PW_NUM_POWERUPS */).fill(0);
    return {
      commandTime: 0,
      pm_type: 0 /* PM_NORMAL */,
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
      legsAnim: 22 /* LEGS_IDLE */,
      torsoTimer: 0,
      torsoAnim: 11 /* TORSO_STAND */,
      movementDir: 0,
      eFlags: 0,
      eventSequence: 0,
      events: [0, 0],
      eventParms: [0, 0],
      clientNum,
      weapon: 2 /* WP_MACHINEGUN */,
      weaponstate: "WEAPON_READY",
      viewangles: [0, 0, 0],
      viewheight: 26,
      damageEvent: 0,
      damageYaw: 0,
      damagePitch: 0,
      damageCount: 0,
      health: 125,
      armor: 0,
      maxHealth: 100,
      weaponsMask: 1 << 1 /* WP_GAUNTLET */ | 1 << 2 /* WP_MACHINEGUN */,
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
        lastFragTarget: ""
      }
    };
  }
  var RF_THIRD_PERSON = 2;
  var RF_DEPTHHACK = 8;
  var DEG2RAD = Math.PI / 180;
  var RAD2DEG = 180 / Math.PI;
  function vec3Clone(a) {
    return [a[0], a[1], a[2]];
  }
  function vec3Add(a, b, out = [0, 0, 0]) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
  }
  function vec3Sub(a, b, out = [0, 0, 0]) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
  }
  function vec3Scale(a, s, out = [0, 0, 0]) {
    out[0] = a[0] * s;
    out[1] = a[1] * s;
    out[2] = a[2] * s;
    return out;
  }
  function vec3MA(v, s, b, out = [0, 0, 0]) {
    out[0] = v[0] + b[0] * s;
    out[1] = v[1] + b[1] * s;
    out[2] = v[2] + b[2] * s;
    return out;
  }
  function vec3Dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function vec3Cross(a, b, out = [0, 0, 0]) {
    const ax = a[0], ay = a[1], az = a[2];
    const bx = b[0], by = b[1], bz = b[2];
    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
  }
  function vec3Length(a) {
    return Math.hypot(a[0], a[1], a[2]);
  }
  function vec3Dist(a, b) {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }
  function vec3Lerp(a, b, t, out = [0, 0, 0]) {
    out[0] = a[0] + (b[0] - a[0]) * t;
    out[1] = a[1] + (b[1] - a[1]) * t;
    out[2] = a[2] + (b[2] - a[2]) * t;
    return out;
  }
  function vec3Normalize(v, out = v) {
    const len = Math.hypot(v[0], v[1], v[2]);
    if (len > 1e-7) {
      const inv = 1 / len;
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
  function AngleVectors(angles, forward, right, up) {
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
  function AnglesToAxis(angles, axis) {
    const right = [0, 0, 0];
    AngleVectors(angles, axis[0], right, axis[2]);
    axis[1][0] = -right[0];
    axis[1][1] = -right[1];
    axis[1][2] = -right[2];
  }
  function AxisClear() {
    return [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ];
  }
  function MatrixMultiply3x3(in1, in2, out) {
    for (let i = 0; i < 3; i++) {
      const x = in1[i][0] * in2[0][0] + in1[i][1] * in2[1][0] + in1[i][2] * in2[2][0];
      const y = in1[i][0] * in2[0][1] + in1[i][1] * in2[1][1] + in1[i][2] * in2[2][1];
      const z = in1[i][0] * in2[0][2] + in1[i][1] * in2[1][2] + in1[i][2] * in2[2][2];
      out[i][0] = x;
      out[i][1] = y;
      out[i][2] = z;
    }
  }
  function LerpAngle(from, to, frac) {
    let a = to - from;
    if (a > 180) a -= 360;
    if (a < -180) a += 360;
    return from + frac * a;
  }
  function Q_rand(seedRef) {
    seedRef.seed = 69069 * seedRef.seed + 1 | 0;
    return seedRef.seed & 32767;
  }
  function Q_crandom(seedRef) {
    return 2 * (Q_rand(seedRef) / 32767 - 0.5);
  }
  function mat4Identity(out = new Float32Array(16)) {
    out.fill(0);
    out[0] = 1;
    out[5] = 1;
    out[10] = 1;
    out[15] = 1;
    return out;
  }
  function mat4Multiply(a, b, out = new Float32Array(16)) {
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    for (let i = 0; i < 4; i++) {
      const b0 = b[i * 4 + 0];
      const b1 = b[i * 4 + 1];
      const b22 = b[i * 4 + 2];
      const b3 = b[i * 4 + 3];
      out[i * 4 + 0] = b0 * a00 + b1 * a10 + b22 * a20 + b3 * a30;
      out[i * 4 + 1] = b0 * a01 + b1 * a11 + b22 * a21 + b3 * a31;
      out[i * 4 + 2] = b0 * a02 + b1 * a12 + b22 * a22 + b3 * a32;
      out[i * 4 + 3] = b0 * a03 + b1 * a13 + b22 * a23 + b3 * a33;
    }
    return out;
  }
  function mat4Perspective(fovYRad, aspect, near, far, out = new Float32Array(16)) {
    const f = 1 / Math.tan(fovYRad / 2);
    const nf = 1 / (near - far);
    out.fill(0);
    out[0] = f / aspect;
    out[5] = f;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[14] = 2 * far * near * nf;
    return out;
  }
  function buildQuakeViewMatrix(origin, viewAxis, out = new Float32Array(16)) {
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
    const s_flipMatrix = new Float32Array([
      0,
      0,
      -1,
      0,
      -1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      0,
      1
    ]);
    return mat4Multiply(s_flipMatrix, viewer, out);
  }
  function buildEntityModelMatrix(origin, axis, out = new Float32Array(16)) {
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

  // src/audio/snd_dma.ts
  var SOUND_FULLVOLUME = 90;
  var SOUND_ATTENUATE = 85e-5;
  var MAX_ACTIVE_VOICES = 10;
  var ANNOUNCER_WAV_MAP = {
    "prepare to fight": "sound/feedback/prepare.wav",
    "three": "sound/feedback/three.wav",
    "two": "sound/feedback/two.wav",
    "one": "sound/feedback/one.wav",
    "fight!": "sound/feedback/fight.wav",
    "fight": "sound/feedback/fight.wav",
    "impressive": "sound/feedback/impressive.wav",
    "excellent": "sound/feedback/excellent.wav",
    "humiliation": "sound/feedback/humiliation.wav",
    "accuracy": "sound/feedback/accuracy.wav",
    "quad damage": "sound/items/quaddamage.wav",
    "taken the lead": "sound/feedback/takenlead.wav",
    "tied for the lead": "sound/feedback/tiedlead.wav",
    "lost the lead": "sound/feedback/lostlead.wav",
    "1 frag left": "sound/feedback/1_frag.wav",
    "2 frags left": "sound/feedback/2_frags.wav",
    "3 frags left": "sound/feedback/3_frags.wav",
    "sudden death": "sound/feedback/sudden_death.wav"
  };
  var Q3SoundEngine = class {
    ctx = null;
    masterCompressor = null;
    masterGain = null;
    bufferCache = /* @__PURE__ */ new Map();
    decodingSet = /* @__PURE__ */ new Set();
    lastPlayTimeMs = /* @__PURE__ */ new Map();
    channelVoices = /* @__PURE__ */ new Map();
    activeVoices = /* @__PURE__ */ new Set();
    announcerQueue = [];
    isAnnouncing = false;
    listenerOrigin = [0, 0, 0];
    listenerRight = [0, 1, 0];
    initOnUserGesture() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.masterCompressor = this.ctx.createDynamicsCompressor();
        this.masterCompressor.threshold.value = -12;
        this.masterCompressor.knee.value = 10;
        this.masterCompressor.ratio.value = 10;
        this.masterCompressor.attack.value = 2e-3;
        this.masterCompressor.release.value = 0.1;
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.65;
        this.masterGain.connect(this.masterCompressor);
        this.masterCompressor.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {
        });
      }
    }
    updateListener(origin, angles) {
      this.listenerOrigin[0] = origin[0];
      this.listenerOrigin[1] = origin[1];
      this.listenerOrigin[2] = origin[2];
      const forward = [0, 0, 0];
      const right = [0, 0, 0];
      AngleVectors(angles, forward, right, null);
      this.listenerRight = right;
    }
    /**
     * Builds a clean standard 44-byte RIFF WAVE ArrayBuffer containing ONLY the
     * `fmt ` and `data` PCM chunks, stripping any trailing 1999 SoundForge
     * `LIST`/`DISP`/`PAD ` metadata chunks that cause clicks/static.
     */
    sanitizeRiffWav(raw) {
      if (raw.byteLength < 44) return null;
      const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
      const isRiff = String.fromCharCode(raw[0], raw[1], raw[2], raw[3]) === "RIFF" && String.fromCharCode(raw[8], raw[9], raw[10], raw[11]) === "WAVE";
      if (!isRiff) return null;
      let fmtOffset = -1;
      let dataOffset = -1;
      let dataSize = 0;
      let pos = 12;
      while (pos + 8 <= raw.byteLength) {
        const id = String.fromCharCode(raw[pos], raw[pos + 1], raw[pos + 2], raw[pos + 3]);
        const sz = view.getUint32(pos + 4, true);
        const body = pos + 8;
        if (id === "fmt " && sz >= 16 && body + 16 <= raw.byteLength) {
          fmtOffset = body;
        } else if (id === "data") {
          dataOffset = body;
          dataSize = Math.min(sz, raw.byteLength - body);
          break;
        }
        pos = body + sz + (sz & 1);
      }
      if (fmtOffset < 0 || dataOffset < 0 || dataSize <= 0) return null;
      const blockAlign = Math.max(1, view.getUint16(fmtOffset + 12, true));
      dataSize -= dataSize % blockAlign;
      if (dataSize <= 0) return null;
      const clean = new Uint8Array(44 + dataSize);
      const cv = new DataView(clean.buffer);
      clean[0] = 82;
      clean[1] = 73;
      clean[2] = 70;
      clean[3] = 70;
      cv.setUint32(4, 36 + dataSize, true);
      clean[8] = 87;
      clean[9] = 65;
      clean[10] = 86;
      clean[11] = 69;
      clean[12] = 102;
      clean[13] = 109;
      clean[14] = 116;
      clean[15] = 32;
      cv.setUint32(16, 16, true);
      clean.set(raw.subarray(fmtOffset, fmtOffset + 16), 20);
      clean[36] = 100;
      clean[37] = 97;
      clean[38] = 116;
      clean[39] = 97;
      cv.setUint32(40, dataSize, true);
      clean.set(raw.subarray(dataOffset, dataOffset + dataSize), 44);
      return clean.buffer;
    }
    /**
     * Applies a smooth de-click envelope at the start and end of a decoded AudioBuffer
     */
    applyDeclickEnvelope(buf) {
      const len = buf.length;
      const fadeIn = Math.min(96, Math.floor(len * 0.05));
      const fadeOut = Math.min(256, Math.floor(len * 0.1));
      for (let ch = 0; ch < buf.numberOfChannels; ch++) {
        const data = buf.getChannelData(ch);
        for (let i = 0; i < fadeIn; i++) {
          data[i] *= i / fadeIn;
        }
        for (let i = 0; i < fadeOut; i++) {
          const idx = len - 1 - i;
          if (idx >= 0) data[idx] *= i / fadeOut;
        }
      }
    }
    playLocalSound(soundPath, volumeScale = 1, onEnded) {
      this.playSoundAtOrigin(soundPath, null, volumeScale, onEnded);
    }
    playSoundAtOrigin(soundPath, origin, volumeScale = 1, onEnded) {
      this.initOnUserGesture();
      if (!this.ctx || !this.masterGain) {
        onEnded?.();
        return;
      }
      const masterVol = Cvars.variableValue("s_volume");
      if (masterVol <= 1e-3) {
        onEnded?.();
        return;
      }
      const norm = VFS.normalizePath(soundPath);
      const nowMs = performance.now();
      const minCooldownMs = norm.includes("lg_fire") || norm.includes("lg_hum") ? 450 : norm.includes("machgf") ? 110 : norm.includes("land1") || norm.includes("jump1") || norm.includes("jumppad") ? 220 : norm.includes("hit.wav") ? 75 : 55;
      const lastMs = this.lastPlayTimeMs.get(norm) || 0;
      if (!onEnded && nowMs - lastMs < minCooldownMs) {
        return;
      }
      this.lastPlayTimeMs.set(norm, nowMs);
      let distAtten = 1;
      let panValue = 0;
      if (origin) {
        const dist = vec3Dist(origin, this.listenerOrigin);
        if (dist > SOUND_FULLVOLUME) {
          distAtten = Math.max(0, 1 - (dist - SOUND_FULLVOLUME) * SOUND_ATTENUATE);
        }
        if (distAtten <= 0.03) {
          onEnded?.();
          return;
        }
        if (dist > 8) {
          const dir = [0, 0, 0];
          vec3Sub(origin, this.listenerOrigin, dir);
          vec3Normalize(dir);
          panValue = Math.max(-0.8, Math.min(0.8, vec3Dot(dir, this.listenerRight)));
        }
      }
      const channelKey = onEnded ? "CHAN_ANNOUNCER" : norm.includes("weapons/") ? `CHAN_WEAPON_${origin ? Math.round(origin[0] / 200) : "LOCAL"}` : norm.includes("player/") ? `CHAN_PLAYER_${origin ? Math.round(origin[0] / 200) : "LOCAL"}` : `CHAN_MISC_${norm}`;
      const finalGain = masterVol * volumeScale * distAtten;
      const cached = this.bufferCache.get(norm);
      if (cached) {
        this.triggerVoice(cached, channelKey, finalGain, panValue, onEnded);
        return;
      }
      if (this.decodingSet.has(norm)) {
        onEnded?.();
        return;
      }
      const raw = VFS.readFile(norm);
      if (!raw) {
        onEnded?.();
        return;
      }
      const cleanAb = this.sanitizeRiffWav(raw);
      if (!cleanAb) {
        onEnded?.();
        return;
      }
      this.decodingSet.add(norm);
      this.ctx.decodeAudioData(cleanAb).then((audioBuf) => {
        this.decodingSet.delete(norm);
        this.applyDeclickEnvelope(audioBuf);
        this.bufferCache.set(norm, audioBuf);
        this.triggerVoice(audioBuf, channelKey, finalGain, panValue, onEnded);
      }).catch(() => {
        this.decodingSet.delete(norm);
        onEnded?.();
      });
    }
    triggerVoice(buf, channelKey, gainValue, panValue, onEnded) {
      if (!this.ctx || !this.masterGain) {
        onEnded?.();
        return;
      }
      const prev = this.channelVoices.get(channelKey);
      if (prev && channelKey !== "CHAN_ANNOUNCER") {
        try {
          const t = this.ctx.currentTime;
          prev.gain.gain.setValueAtTime(prev.gain.gain.value, t);
          prev.gain.gain.linearRampToValueAtTime(1e-4, t + 0.018);
          prev.src.stop(t + 0.02);
        } catch {
        }
        this.activeVoices.delete(prev);
        this.channelVoices.delete(channelKey);
      }
      if (this.activeVoices.size >= MAX_ACTIVE_VOICES) {
        const oldest = this.activeVoices.values().next().value;
        if (oldest) {
          try {
            oldest.src.stop();
          } catch {
          }
          this.activeVoices.delete(oldest);
        }
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const gain = this.ctx.createGain();
      gain.gain.value = Math.max(0, Math.min(0.85, gainValue));
      if (typeof this.ctx.createStereoPanner === "function" && Math.abs(panValue) > 0.01) {
        const panner = this.ctx.createStereoPanner();
        panner.pan.value = panValue;
        src.connect(panner);
        panner.connect(gain);
      } else {
        src.connect(gain);
      }
      gain.connect(this.masterGain);
      const voice = {
        src,
        gain,
        channelKey
      };
      this.activeVoices.add(voice);
      this.channelVoices.set(channelKey, voice);
      src.onended = () => {
        this.activeVoices.delete(voice);
        if (this.channelVoices.get(channelKey) === voice) {
          this.channelVoices.delete(channelKey);
        }
        onEnded?.();
      };
      src.start();
    }
    /**
     * Queues an iconic 1999 Quake III Arena Announcer Callout using the original
     * `sound/feedback/*.wav` voice files from `pak0.pk3`!
     */
    queueAnnouncement(text) {
      this.announcerQueue.push(text);
      this.processAnnouncerQueue();
    }
    processAnnouncerQueue() {
      if (this.isAnnouncing || this.announcerQueue.length === 0) return;
      const next = this.announcerQueue.shift();
      this.isAnnouncing = true;
      const wavPath = ANNOUNCER_WAV_MAP[next.trim().toLowerCase()] || next;
      const norm = VFS.normalizePath(wavPath);
      if (VFS.fileExists(norm)) {
        let finished = false;
        const done = () => {
          if (finished) return;
          finished = true;
          this.isAnnouncing = false;
          this.processAnnouncerQueue();
        };
        this.playLocalSound(norm, 0.95, done);
        setTimeout(done, 2200);
        return;
      }
      setTimeout(() => {
        this.isAnnouncing = false;
        this.processAnnouncerQueue();
      }, 600);
    }
  };
  var Sound = new Q3SoundEngine();

  // src/game/bg_misc.ts
  var WEAPON_SPECS = {
    [0 /* WP_NONE */]: {
      id: 0 /* WP_NONE */,
      classname: "",
      pickupName: "None",
      shortName: "NONE",
      modelPath: "",
      iconPath: "",
      fireSound: "",
      fireTimeMs: 400,
      startingAmmo: 0,
      ammoBoxCount: 0,
      maxAmmo: 0,
      damage: 0,
      splashDamage: 0,
      splashRadius: 0,
      isHitscan: true,
      projectileSpeed: 0,
      pellets: 1,
      spread: 0,
      color: [1, 1, 1]
    },
    [1 /* WP_GAUNTLET */]: {
      id: 1 /* WP_GAUNTLET */,
      classname: "weapon_gauntlet",
      pickupName: "Gauntlet",
      shortName: "GAUNTLET",
      modelPath: "models/weapons2/gauntlet/gauntlet.md3",
      iconPath: "icons/iconw_gauntlet.tga",
      fireSound: "sound/weapons/melee/fstatck.wav",
      fireTimeMs: 400,
      startingAmmo: -1,
      ammoBoxCount: -1,
      maxAmmo: -1,
      damage: 50,
      splashDamage: 0,
      splashRadius: 0,
      isHitscan: true,
      projectileSpeed: 0,
      pellets: 1,
      spread: 0,
      color: [0.4, 0.8, 1]
    },
    [2 /* WP_MACHINEGUN */]: {
      id: 2 /* WP_MACHINEGUN */,
      classname: "weapon_machinegun",
      pickupName: "Machinegun",
      shortName: "MG",
      modelPath: "models/weapons2/machinegun/machinegun.md3",
      iconPath: "icons/iconw_machinegun.tga",
      fireSound: "sound/weapons/machinegun/machgf1b.wav",
      fireTimeMs: 100,
      startingAmmo: 100,
      ammoBoxCount: 50,
      maxAmmo: 200,
      damage: 7,
      splashDamage: 0,
      splashRadius: 0,
      isHitscan: true,
      projectileSpeed: 0,
      pellets: 1,
      spread: 200,
      color: [1, 0.85, 0.3]
    },
    [3 /* WP_SHOTGUN */]: {
      id: 3 /* WP_SHOTGUN */,
      classname: "weapon_shotgun",
      pickupName: "Shotgun",
      shortName: "SG",
      modelPath: "models/weapons2/shotgun/shotgun.md3",
      iconPath: "icons/iconw_shotgun.tga",
      fireSound: "sound/weapons/shotgun/sshotf1b.wav",
      fireTimeMs: 1e3,
      startingAmmo: 10,
      ammoBoxCount: 10,
      maxAmmo: 200,
      damage: 10,
      // x11 pellets = 110 max damage!
      splashDamage: 0,
      splashRadius: 0,
      isHitscan: true,
      projectileSpeed: 0,
      pellets: 11,
      spread: 700,
      color: [1, 0.65, 0.25]
    },
    [4 /* WP_GRENADE_LAUNCHER */]: {
      id: 4 /* WP_GRENADE_LAUNCHER */,
      classname: "weapon_grenadelauncher",
      pickupName: "Grenade Launcher",
      shortName: "GL",
      modelPath: "models/weapons2/grenadel/grenadel.md3",
      iconPath: "icons/iconw_grenade.tga",
      fireSound: "sound/weapons/rocket/rocklf1a.wav",
      fireTimeMs: 800,
      startingAmmo: 10,
      ammoBoxCount: 5,
      maxAmmo: 200,
      damage: 100,
      splashDamage: 100,
      splashRadius: 150,
      isHitscan: false,
      projectileSpeed: 700,
      pellets: 1,
      spread: 0,
      color: [0.3, 0.85, 0.35]
    },
    [5 /* WP_ROCKET_LAUNCHER */]: {
      id: 5 /* WP_ROCKET_LAUNCHER */,
      classname: "weapon_rocketlauncher",
      pickupName: "Rocket Launcher",
      shortName: "RL",
      modelPath: "models/weapons2/rocketl/rocketl.md3",
      iconPath: "icons/iconw_rocket.tga",
      fireSound: "sound/weapons/rocket/rocklf1a.wav",
      fireTimeMs: 800,
      startingAmmo: 10,
      ammoBoxCount: 5,
      maxAmmo: 200,
      damage: 100,
      splashDamage: 100,
      splashRadius: 120,
      isHitscan: false,
      projectileSpeed: 900,
      pellets: 1,
      spread: 0,
      color: [1, 0.3, 0.2]
    },
    [6 /* WP_LIGHTNING */]: {
      id: 6 /* WP_LIGHTNING */,
      classname: "weapon_lightning",
      pickupName: "Lightning Gun",
      shortName: "LG",
      modelPath: "models/weapons2/lightning/lightning.md3",
      iconPath: "icons/iconw_lightning.tga",
      fireSound: "sound/weapons/lightning/lg_fire.wav",
      fireTimeMs: 50,
      // 20 Hz = 160 DPS!
      startingAmmo: 100,
      ammoBoxCount: 60,
      maxAmmo: 200,
      damage: 8,
      splashDamage: 0,
      splashRadius: 0,
      isHitscan: true,
      projectileSpeed: 0,
      pellets: 1,
      spread: 0,
      color: [0.55, 0.8, 1]
    },
    [7 /* WP_RAILGUN */]: {
      id: 7 /* WP_RAILGUN */,
      classname: "weapon_railgun",
      pickupName: "Railgun",
      shortName: "RG",
      modelPath: "models/weapons2/railgun/railgun.md3",
      iconPath: "icons/iconw_railgun.tga",
      fireSound: "sound/weapons/railgun/railgf1a.wav",
      fireTimeMs: 1500,
      startingAmmo: 10,
      ammoBoxCount: 10,
      maxAmmo: 200,
      damage: 100,
      splashDamage: 0,
      splashRadius: 0,
      isHitscan: true,
      projectileSpeed: 0,
      pellets: 1,
      spread: 0,
      color: [0.2, 1, 0.45]
    },
    [8 /* WP_PLASMAGUN */]: {
      id: 8 /* WP_PLASMAGUN */,
      classname: "weapon_plasmagun",
      pickupName: "Plasma Gun",
      shortName: "PG",
      modelPath: "models/weapons2/plasma/plasma.md3",
      iconPath: "icons/iconw_plasma.tga",
      fireSound: "sound/weapons/plasma/hyprbf1a.wav",
      fireTimeMs: 100,
      // 10 Hz = 200 DPS
      startingAmmo: 50,
      ammoBoxCount: 30,
      maxAmmo: 200,
      damage: 20,
      splashDamage: 15,
      splashRadius: 20,
      isHitscan: false,
      projectileSpeed: 2e3,
      pellets: 1,
      spread: 0,
      color: [0.3, 0.65, 1]
    },
    [9 /* WP_BFG */]: {
      id: 9 /* WP_BFG */,
      classname: "weapon_bfg",
      pickupName: "BFG10K",
      shortName: "BFG",
      modelPath: "models/weapons2/bfg/bfg.md3",
      iconPath: "icons/iconw_bfg.tga",
      fireSound: "sound/weapons/plasma/hyprbf1a.wav",
      fireTimeMs: 200,
      startingAmmo: 20,
      ammoBoxCount: 15,
      maxAmmo: 200,
      damage: 100,
      splashDamage: 100,
      splashRadius: 120,
      isHitscan: false,
      projectileSpeed: 2e3,
      pellets: 1,
      spread: 0,
      color: [0.3, 1, 0.4]
    },
    [10 /* WP_GRAPPLING_HOOK */]: {
      id: 10 /* WP_GRAPPLING_HOOK */,
      classname: "weapon_grapplinghook",
      pickupName: "Grappling Hook",
      shortName: "HOOK",
      modelPath: "models/weapons2/gauntlet/gauntlet.md3",
      iconPath: "icons/iconw_grapple.tga",
      fireSound: "sound/weapons/melee/fstatck.wav",
      fireTimeMs: 400,
      startingAmmo: -1,
      ammoBoxCount: -1,
      maxAmmo: -1,
      damage: 20,
      splashDamage: 0,
      splashRadius: 0,
      isHitscan: false,
      projectileSpeed: 800,
      pellets: 1,
      spread: 0,
      color: [0.7, 0.7, 0.7]
    }
  };
  var ITEM_DEFS = {
    weapon_machinegun: {
      classname: "weapon_machinegun",
      pickupName: "Machinegun",
      type: "weapon",
      modelPath: "models/weapons2/machinegun/machinegun.md3",
      iconPath: "icons/iconw_machinegun.tga",
      pickupSound: "sound/misc/w_pkup.wav",
      quantity: 40,
      maxLimit: 200,
      respawnSec: 5,
      weapon: 2 /* WP_MACHINEGUN */
    },
    weapon_shotgun: {
      classname: "weapon_shotgun",
      pickupName: "Shotgun",
      type: "weapon",
      modelPath: "models/weapons2/shotgun/shotgun.md3",
      iconPath: "icons/iconw_shotgun.tga",
      pickupSound: "sound/misc/w_pkup.wav",
      quantity: 10,
      maxLimit: 200,
      respawnSec: 5,
      weapon: 3 /* WP_SHOTGUN */
    },
    weapon_grenadelauncher: {
      classname: "weapon_grenadelauncher",
      pickupName: "Grenade Launcher",
      type: "weapon",
      modelPath: "models/weapons2/grenadel/grenadel.md3",
      iconPath: "icons/iconw_grenade.tga",
      pickupSound: "sound/misc/w_pkup.wav",
      quantity: 10,
      maxLimit: 200,
      respawnSec: 5,
      weapon: 4 /* WP_GRENADE_LAUNCHER */
    },
    weapon_rocketlauncher: {
      classname: "weapon_rocketlauncher",
      pickupName: "Rocket Launcher",
      type: "weapon",
      modelPath: "models/weapons2/rocketl/rocketl.md3",
      iconPath: "icons/iconw_rocket.tga",
      pickupSound: "sound/misc/w_pkup.wav",
      quantity: 10,
      maxLimit: 200,
      respawnSec: 5,
      weapon: 5 /* WP_ROCKET_LAUNCHER */
    },
    weapon_lightning: {
      classname: "weapon_lightning",
      pickupName: "Lightning Gun",
      type: "weapon",
      modelPath: "models/weapons2/lightning/lightning.md3",
      iconPath: "icons/iconw_lightning.tga",
      pickupSound: "sound/misc/w_pkup.wav",
      quantity: 100,
      maxLimit: 200,
      respawnSec: 5,
      weapon: 6 /* WP_LIGHTNING */
    },
    weapon_railgun: {
      classname: "weapon_railgun",
      pickupName: "Railgun",
      type: "weapon",
      modelPath: "models/weapons2/railgun/railgun.md3",
      iconPath: "icons/iconw_railgun.tga",
      pickupSound: "sound/misc/w_pkup.wav",
      quantity: 10,
      maxLimit: 200,
      respawnSec: 5,
      weapon: 7 /* WP_RAILGUN */
    },
    weapon_plasmagun: {
      classname: "weapon_plasmagun",
      pickupName: "Plasma Gun",
      type: "weapon",
      modelPath: "models/weapons2/plasma/plasma.md3",
      iconPath: "icons/iconw_plasma.tga",
      pickupSound: "sound/misc/w_pkup.wav",
      quantity: 50,
      maxLimit: 200,
      respawnSec: 5,
      weapon: 8 /* WP_PLASMAGUN */
    },
    weapon_bfg: {
      classname: "weapon_bfg",
      pickupName: "BFG10K",
      type: "weapon",
      modelPath: "models/weapons2/bfg/bfg.md3",
      iconPath: "icons/iconw_bfg.tga",
      pickupSound: "sound/misc/w_pkup.wav",
      quantity: 20,
      maxLimit: 200,
      respawnSec: 15,
      weapon: 9 /* WP_BFG */
    },
    ammo_bullets: {
      classname: "ammo_bullets",
      pickupName: "Bullets",
      type: "ammo",
      modelPath: "models/powerups/ammo/machinegunam.md3",
      iconPath: "icons/icona_machinegun.tga",
      pickupSound: "sound/misc/am_pkup.wav",
      quantity: 50,
      maxLimit: 200,
      respawnSec: 40,
      weapon: 2 /* WP_MACHINEGUN */
    },
    ammo_shells: {
      classname: "ammo_shells",
      pickupName: "Shells",
      type: "ammo",
      modelPath: "models/powerups/ammo/shotgunam.md3",
      iconPath: "icons/icona_shotgun.tga",
      pickupSound: "sound/misc/am_pkup.wav",
      quantity: 10,
      maxLimit: 200,
      respawnSec: 40,
      weapon: 3 /* WP_SHOTGUN */
    },
    ammo_grenades: {
      classname: "ammo_grenades",
      pickupName: "Grenades",
      type: "ammo",
      modelPath: "models/powerups/ammo/grenadeam.md3",
      iconPath: "icons/icona_grenade.tga",
      pickupSound: "sound/misc/am_pkup.wav",
      quantity: 5,
      maxLimit: 200,
      respawnSec: 40,
      weapon: 4 /* WP_GRENADE_LAUNCHER */
    },
    ammo_rockets: {
      classname: "ammo_rockets",
      pickupName: "Rockets",
      type: "ammo",
      modelPath: "models/powerups/ammo/rocketam.md3",
      iconPath: "icons/icona_rocket.tga",
      pickupSound: "sound/misc/am_pkup.wav",
      quantity: 5,
      maxLimit: 200,
      respawnSec: 40,
      weapon: 5 /* WP_ROCKET_LAUNCHER */
    },
    ammo_lightning: {
      classname: "ammo_lightning",
      pickupName: "Lightning",
      type: "ammo",
      modelPath: "models/powerups/ammo/lightningam.md3",
      iconPath: "icons/icona_lightning.tga",
      pickupSound: "sound/misc/am_pkup.wav",
      quantity: 60,
      maxLimit: 200,
      respawnSec: 40,
      weapon: 6 /* WP_LIGHTNING */
    },
    ammo_slugs: {
      classname: "ammo_slugs",
      pickupName: "Slugs",
      type: "ammo",
      modelPath: "models/powerups/ammo/railgunam.md3",
      iconPath: "icons/icona_railgun.tga",
      pickupSound: "sound/misc/am_pkup.wav",
      quantity: 10,
      maxLimit: 200,
      respawnSec: 40,
      weapon: 7 /* WP_RAILGUN */
    },
    ammo_cells: {
      classname: "ammo_cells",
      pickupName: "Plasma Cells",
      type: "ammo",
      modelPath: "models/powerups/ammo/plasmaam.md3",
      iconPath: "icons/icona_plasma.tga",
      pickupSound: "sound/misc/am_pkup.wav",
      quantity: 30,
      maxLimit: 200,
      respawnSec: 40,
      weapon: 8 /* WP_PLASMAGUN */
    },
    ammo_bfg: {
      classname: "ammo_bfg",
      pickupName: "BFG Ammo",
      type: "ammo",
      modelPath: "models/powerups/ammo/bfgam.md3",
      iconPath: "icons/icona_bfg.tga",
      pickupSound: "sound/misc/am_pkup.wav",
      quantity: 15,
      maxLimit: 200,
      respawnSec: 40,
      weapon: 9 /* WP_BFG */
    },
    item_armor_shard: {
      classname: "item_armor_shard",
      pickupName: "Armor Shard",
      type: "armor",
      modelPath: "models/powerups/armor/shard.md3",
      iconPath: "icons/iconr_shard.tga",
      pickupSound: "sound/misc/ar1_pkup.wav",
      quantity: 5,
      maxLimit: 200,
      respawnSec: 25
    },
    item_armor_combat: {
      classname: "item_armor_combat",
      pickupName: "Yellow Armor",
      type: "armor",
      modelPath: "models/powerups/armor/armor_yel.md3",
      iconPath: "icons/iconr_yellow.tga",
      pickupSound: "sound/misc/ar2_pkup.wav",
      quantity: 50,
      maxLimit: 200,
      respawnSec: 25
    },
    item_armor_body: {
      classname: "item_armor_body",
      pickupName: "Heavy Armor",
      type: "armor",
      modelPath: "models/powerups/armor/armor_red.md3",
      iconPath: "icons/iconr_red.tga",
      pickupSound: "sound/misc/ar2_pkup.wav",
      quantity: 100,
      maxLimit: 200,
      respawnSec: 25
    },
    item_health_small: {
      classname: "item_health_small",
      pickupName: "5 Health",
      type: "health",
      modelPath: "models/powerups/health/small_cross.md3",
      ringModelPath: "models/powerups/health/small_sphere.md3",
      iconPath: "icons/iconh_green.tga",
      pickupSound: "sound/items/s_health.wav",
      quantity: 5,
      maxLimit: 200,
      respawnSec: 35
    },
    item_health: {
      classname: "item_health",
      pickupName: "25 Health",
      type: "health",
      modelPath: "models/powerups/health/medium_cross.md3",
      ringModelPath: "models/powerups/health/medium_sphere.md3",
      iconPath: "icons/iconh_yellow.tga",
      pickupSound: "sound/items/n_health.wav",
      quantity: 25,
      maxLimit: 100,
      respawnSec: 35
    },
    item_health_large: {
      classname: "item_health_large",
      pickupName: "50 Health",
      type: "health",
      modelPath: "models/powerups/health/large_cross.md3",
      ringModelPath: "models/powerups/health/large_sphere.md3",
      iconPath: "icons/iconh_red.tga",
      pickupSound: "sound/items/l_health.wav",
      quantity: 50,
      maxLimit: 100,
      respawnSec: 35
    },
    item_health_mega: {
      classname: "item_health_mega",
      pickupName: "Mega Health",
      type: "health",
      modelPath: "models/powerups/health/mega_cross.md3",
      ringModelPath: "models/powerups/health/mega_sphere.md3",
      iconPath: "icons/iconh_mega.tga",
      pickupSound: "sound/items/m_health.wav",
      quantity: 100,
      maxLimit: 200,
      respawnSec: 35
    },
    item_quad: {
      classname: "item_quad",
      pickupName: "Quad Damage",
      type: "powerup",
      modelPath: "models/powerups/instant/quad.md3",
      ringModelPath: "models/powerups/instant/quad_ring.md3",
      iconPath: "icons/quad.tga",
      pickupSound: "sound/items/quaddamage.wav",
      quantity: 3e4,
      maxLimit: 0,
      respawnSec: 60,
      powerup: 1 /* PW_QUAD */
    },
    item_haste: {
      classname: "item_haste",
      pickupName: "Speed",
      type: "powerup",
      modelPath: "models/powerups/instant/haste.md3",
      ringModelPath: "models/powerups/instant/haste_ring.md3",
      iconPath: "icons/haste.tga",
      pickupSound: "sound/items/haste.wav",
      quantity: 3e4,
      maxLimit: 0,
      respawnSec: 60,
      powerup: 3 /* PW_HASTE */
    },
    item_regen: {
      classname: "item_regen",
      pickupName: "Regeneration",
      type: "powerup",
      modelPath: "models/powerups/instant/regen.md3",
      ringModelPath: "models/powerups/instant/regen_ring.md3",
      iconPath: "icons/regen.tga",
      pickupSound: "sound/items/regeneration.wav",
      quantity: 3e4,
      maxLimit: 0,
      respawnSec: 60,
      powerup: 5 /* PW_REGEN */
    },
    item_invis: {
      classname: "item_invis",
      pickupName: "Invisibility",
      type: "powerup",
      modelPath: "models/powerups/instant/invis.md3",
      ringModelPath: "models/powerups/instant/invis_ring.md3",
      iconPath: "icons/invis.tga",
      pickupSound: "sound/items/invisibility.wav",
      quantity: 3e4,
      maxLimit: 0,
      respawnSec: 60,
      powerup: 4 /* PW_INVIS */
    },
    item_enviro: {
      classname: "item_enviro",
      pickupName: "Battle Suit",
      type: "powerup",
      modelPath: "models/powerups/instant/enviro.md3",
      ringModelPath: "models/powerups/instant/enviro_ring.md3",
      iconPath: "icons/envirosuit.tga",
      pickupSound: "sound/items/protect.wav",
      quantity: 3e4,
      maxLimit: 0,
      respawnSec: 60,
      powerup: 2 /* PW_BATTLESUIT */
    },
    item_flight: {
      classname: "item_flight",
      pickupName: "Flight",
      type: "powerup",
      modelPath: "models/powerups/instant/flight.md3",
      ringModelPath: "models/powerups/instant/flight_ring.md3",
      iconPath: "icons/flight.tga",
      pickupSound: "sound/items/flight.wav",
      quantity: 3e4,
      maxLimit: 0,
      respawnSec: 60,
      powerup: 6 /* PW_FLIGHT */
    }
  };

  // src/renderer/tr_image.ts
  var TextureManager = class {
    gl;
    cache = /* @__PURE__ */ new Map();
    whiteTexture;
    defaultTexture;
    constructor(gl) {
      this.gl = gl;
      this.whiteTexture = this.createSolidTexture(255, 255, 255, 255);
      this.defaultTexture = this.createCheckerTexture();
      this.cache.set("$whiteimage", this.whiteTexture);
      this.cache.set("*white", this.whiteTexture);
      this.cache.set("*default", this.defaultTexture);
    }
    getTexture(rawName, clampToEdge = false) {
      if (!rawName || rawName === "$whiteimage" || rawName === "*white") {
        return this.whiteTexture;
      }
      const key = VFS.stripExtension(rawName) + (clampToEdge ? "|clamp" : "");
      const cached = this.cache.get(key);
      if (cached) return cached;
      const found = VFS.findImageFile(rawName);
      if (found) {
        if (found.ext === ".tga") {
          const decoded = decodeTga(found.data);
          if (decoded) {
            const tex = this.uploadRGBA(decoded.width, decoded.height, decoded.data, clampToEdge);
            this.cache.set(key, tex);
            return tex;
          }
        } else {
          const placeholder = this.createProceduralFallback(rawName, clampToEdge);
          this.cache.set(key, placeholder);
          this.decodeBrowserImageIntoTexture(found.data, found.ext, placeholder, clampToEdge);
          return placeholder;
        }
      }
      const fallback = this.createProceduralFallback(rawName, clampToEdge);
      this.cache.set(key, fallback);
      return fallback;
    }
    uploadRGBA(width, height, rgba, clampToEdge = false) {
      const gl = this.gl;
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA8,
        width,
        height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        rgba
      );
      gl.generateMipmap(gl.TEXTURE_2D);
      const wrap = clampToEdge ? gl.CLAMP_TO_EDGE : gl.REPEAT;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      const ext = gl.getExtension("EXT_texture_filter_anisotropic");
      if (ext) {
        const maxAniso = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
        gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, maxAniso));
      }
      return tex;
    }
    decodeBrowserImageIntoTexture(bytes, ext, targetTex, clampToEdge) {
      const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
      const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)], { type: mime });
      createImageBitmap(blob).then((bmp) => {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, targetTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bmp);
        gl.generateMipmap(gl.TEXTURE_2D);
        const wrap = clampToEdge ? gl.CLAMP_TO_EDGE : gl.REPEAT;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
      }).catch(() => {
      });
    }
    createSolidTexture(r, g, b, a) {
      return this.uploadRGBA(2, 2, new Uint8Array([r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a]), true);
    }
    createCheckerTexture() {
      const w = 64, h = 64;
      const data = new Uint8Array(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const c = (x >> 3 ^ y >> 3) & 1 ? 150 : 65;
          data[i + 0] = c;
          data[i + 1] = c;
          data[i + 2] = c + 10;
          data[i + 3] = 255;
        }
      }
      return this.uploadRGBA(w, h, data, false);
    }
    createProceduralFallback(name, clampToEdge) {
      const lower = name.toLowerCase();
      const w = 64, h = 64;
      const data = new Uint8Array(w * h * 4);
      let br = 110, bg = 105, bb = 100;
      if (lower.includes("lava") || lower.includes("fire") || lower.includes("flame")) {
        br = 235;
        bg = 85;
        bb = 15;
      } else if (lower.includes("water") || lower.includes("slime") || lower.includes("teleport") || lower.includes("quad")) {
        br = 50;
        bg = 140;
        bb = 235;
      } else if (lower.includes("sky") || lower.includes("space")) {
        br = 28;
        bg = 35;
        bb = 72;
      } else if (lower.includes("jumppad") || lower.includes("bounce")) {
        br = 215;
        bg = 140;
        bb = 35;
      } else if (lower.includes("metal") || lower.includes("clang")) {
        br = 95;
        bg = 102;
        bb = 115;
      }
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const border = x < 2 || y < 2 || x > 61 || y > 61 ? 0.65 : 1;
          const pat = 0.88 + 0.12 * Math.sin(x * 0.35) * Math.cos(y * 0.35);
          data[i + 0] = Math.min(255, br * border * pat | 0);
          data[i + 1] = Math.min(255, bg * border * pat | 0);
          data[i + 2] = Math.min(255, bb * border * pat | 0);
          data[i + 3] = 255;
        }
      }
      return this.uploadRGBA(w, h, data, clampToEdge);
    }
  };
  function decodeTga(buffer) {
    if (buffer.byteLength < 18) return null;
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const idLength = view.getUint8(0);
    const colormapType = view.getUint8(1);
    const imageType = view.getUint8(2);
    const width = view.getUint16(12, true);
    const height = view.getUint16(14, true);
    const pixelSize = view.getUint8(16);
    const attributes = view.getUint8(17);
    if (colormapType !== 0 || width <= 0 || height <= 0) return null;
    if (imageType !== 2 && imageType !== 3 && imageType !== 10) return null;
    const topLeftOrigin = (attributes & 32) !== 0;
    const out = new Uint8Array(width * height * 4);
    let srcPtr = 18 + idLength;
    const bytesPerPixel = pixelSize >> 3;
    const writePixel = (pixelIndex, r, g, b, a) => {
      const x = pixelIndex % width;
      const rawY = pixelIndex / width | 0;
      const y = topLeftOrigin ? rawY : height - 1 - rawY;
      const dst = (y * width + x) * 4;
      out[dst + 0] = r;
      out[dst + 1] = g;
      out[dst + 2] = b;
      out[dst + 3] = a;
    };
    const totalPixels = width * height;
    if (imageType === 2 || imageType === 3) {
      for (let p = 0; p < totalPixels && srcPtr + bytesPerPixel <= buffer.byteLength; p++) {
        if (bytesPerPixel === 1) {
          const v = buffer[srcPtr++];
          writePixel(p, v, v, v, 255);
        } else if (bytesPerPixel === 3) {
          const b = buffer[srcPtr++];
          const g = buffer[srcPtr++];
          const r = buffer[srcPtr++];
          writePixel(p, r, g, b, 255);
        } else if (bytesPerPixel === 4) {
          const b = buffer[srcPtr++];
          const g = buffer[srcPtr++];
          const r = buffer[srcPtr++];
          const a = buffer[srcPtr++];
          writePixel(p, r, g, b, a);
        }
      }
    } else if (imageType === 10) {
      let p = 0;
      while (p < totalPixels && srcPtr < buffer.byteLength) {
        const packetHeader = buffer[srcPtr++];
        const packetSize = 1 + (packetHeader & 127);
        if (packetHeader & 128) {
          const b = buffer[srcPtr++];
          const g = bytesPerPixel > 1 ? buffer[srcPtr++] : b;
          const r = bytesPerPixel > 2 ? buffer[srcPtr++] : b;
          const a = bytesPerPixel > 3 ? buffer[srcPtr++] : 255;
          for (let j = 0; j < packetSize && p < totalPixels; j++, p++) {
            writePixel(p, r, g, b, a);
          }
        } else {
          for (let j = 0; j < packetSize && p < totalPixels && srcPtr + bytesPerPixel <= buffer.byteLength; j++, p++) {
            const b = buffer[srcPtr++];
            const g = bytesPerPixel > 1 ? buffer[srcPtr++] : b;
            const r = bytesPerPixel > 2 ? buffer[srcPtr++] : b;
            const a = bytesPerPixel > 3 ? buffer[srcPtr++] : 255;
            writePixel(p, r, g, b, a);
          }
        }
      }
    }
    return { width, height, data: out };
  }

  // src/cgame/cg_draw.ts
  var Q3_COLOR_TABLE = {
    "0": "#222222",
    "1": "#ff3322",
    "2": "#33ff44",
    "3": "#ffee22",
    "4": "#3388ff",
    "5": "#22eeff",
    "6": "#ff44ff",
    "7": "#ffffff"
  };
  var DIGIT_TGA_NAMES = {
    "0": "gfx/2d/numbers/zero_32b.tga",
    "1": "gfx/2d/numbers/one_32b.tga",
    "2": "gfx/2d/numbers/two_32b.tga",
    "3": "gfx/2d/numbers/three_32b.tga",
    "4": "gfx/2d/numbers/four_32b.tga",
    "5": "gfx/2d/numbers/five_32b.tga",
    "6": "gfx/2d/numbers/six_32b.tga",
    "7": "gfx/2d/numbers/seven_32b.tga",
    "8": "gfx/2d/numbers/eight_32b.tga",
    "9": "gfx/2d/numbers/nine_32b.tga",
    "-": "gfx/2d/numbers/minus_32b.tga"
  };
  var MEDAL_TGA_MAP = {
    IMPRESSIVE: "menu/medals/medal_impressive.tga",
    EXCELLENT: "menu/medals/medal_excellent.tga",
    HUMILIATION: "menu/medals/medal_gauntlet.tga",
    ACCURACY: "menu/medals/medal_accuracy.tga"
  };
  var CgHudAndConsole = class {
    ctx;
    consoleOpen = false;
    scoreboardOpen = false;
    consoleInput = "";
    cmdHistory = [];
    historyIndex = -1;
    fps = 60;
    frameCounter = 0;
    lastFpsSampleMs = performance.now();
    // Cache of decoded 1999 .TGA HUD Sprites from pak0.pk3 as Offscreen/HTMLCanvasElement
    hudSpriteCache = /* @__PURE__ */ new Map();
    constructor(canvas) {
      this.ctx = canvas.getContext("2d");
      VFS.onChange(() => {
        this.hudSpriteCache.clear();
      });
    }
    /**
     * Decodes an original 1999 Quake 3 .TGA sprite from VFS into a cached canvas
     */
    getHudSprite(path, tintColor) {
      const cacheKey = tintColor ? `${path}#${tintColor.join(",")}` : path;
      if (this.hudSpriteCache.has(cacheKey)) {
        return this.hudSpriteCache.get(cacheKey);
      }
      const norm = VFS.normalizePath(path);
      const candidates = [norm, norm.replace(/\.(tga|jpg|png)$/i, "") + ".tga"];
      for (const cand of candidates) {
        const bytes = VFS.readFile(cand);
        if (bytes && cand.endsWith(".tga")) {
          try {
            const decoded = decodeTga(bytes);
            if (!decoded) continue;
            const c = document.createElement("canvas");
            c.width = decoded.width;
            c.height = decoded.height;
            const cctx = c.getContext("2d");
            const imgData = cctx.createImageData(decoded.width, decoded.height);
            const src = decoded.data;
            const dst = imgData.data;
            if (tintColor) {
              const [tr, tg, tb] = tintColor;
              for (let i = 0; i < src.length; i += 4) {
                dst[i] = src[i] * tr >> 8;
                dst[i + 1] = src[i + 1] * tg >> 8;
                dst[i + 2] = src[i + 2] * tb >> 8;
                dst[i + 3] = src[i + 3];
              }
            } else {
              dst.set(src);
            }
            cctx.putImageData(imgData, 0, 0);
            this.hudSpriteCache.set(cacheKey, c);
            return c;
          } catch {
          }
        }
      }
      this.hudSpriteCache.set(cacheKey, null);
      return null;
    }
    handleConsoleKeyDown(e) {
      if (e.key === "`" || e.key === "~" || e.key === "^" || e.code === "Backquote") {
        e.preventDefault();
        this.consoleOpen = !this.consoleOpen;
        return true;
      }
      if (!this.consoleOpen) return false;
      e.preventDefault();
      if (e.key === "Escape") {
        this.consoleOpen = false;
      } else if (e.key === "Enter") {
        const cmdText = this.consoleInput.trim();
        if (cmdText) {
          Cmd.print(`^3] ${cmdText}`);
          this.cmdHistory.push(cmdText);
          this.historyIndex = this.cmdHistory.length;
          Cmd.executeText(cmdText);
        }
        this.consoleInput = "";
      } else if (e.key === "Backspace") {
        this.consoleInput = this.consoleInput.slice(0, -1);
      } else if (e.key === "ArrowUp") {
        if (this.cmdHistory.length > 0) {
          this.historyIndex = Math.max(0, this.historyIndex - 1);
          this.consoleInput = this.cmdHistory[this.historyIndex] || "";
        }
      } else if (e.key === "ArrowDown") {
        if (this.historyIndex < this.cmdHistory.length - 1) {
          this.historyIndex++;
          this.consoleInput = this.cmdHistory[this.historyIndex] || "";
        } else {
          this.historyIndex = this.cmdHistory.length;
          this.consoleInput = "";
        }
      } else if (e.key === "Tab") {
        this.autocompleteConsoleInput();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        this.consoleInput += e.key;
      }
      return true;
    }
    autocompleteConsoleInput() {
      const clean = this.consoleInput.trim().replace(/^[\/\\]+/, "").toLowerCase();
      if (!clean) return;
      const candidates = [
        ...Cmd.listCommands(),
        ...Cvars.listAll().map((c) => c.name)
      ];
      const match = candidates.find((c) => c.toLowerCase().startsWith(clean));
      if (match) {
        this.consoleInput = `/${match} `;
      }
    }
    render(arena) {
      const ctx = this.ctx;
      const w = ctx.canvas.width;
      const h = ctx.canvas.height;
      this.frameCounter++;
      const now = performance.now();
      if (now - this.lastFpsSampleMs >= 400) {
        this.fps = Math.round(this.frameCounter * 1e3 / (now - this.lastFpsSampleMs));
        this.frameCounter = 0;
        this.lastFpsSampleMs = now;
      }
      ctx.clearRect(0, 0, w, h);
      const local = arena.clients[0];
      if (!local) return;
      const ps = local.ps;
      if (ps.damageCount > 0) {
        const alpha = Math.min(0.45, ps.damageCount * 8e-3);
        ctx.fillStyle = `rgba(220, 15, 10, ${alpha.toFixed(3)})`;
        ctx.fillRect(0, 0, w, h);
        ps.damageCount = Math.max(0, ps.damageCount - 1.5);
      }
      if ((ps.powerups[1 /* PW_QUAD */] || 0) > arena.timeMs) {
        const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.75);
        grad.addColorStop(0, "rgba(0, 90, 255, 0)");
        grad.addColorStop(1, "rgba(30, 130, 255, 0.22)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }
      if (Cvars.variableIntegerValue("cg_draw2D")) {
        this.drawCrosshair(ctx, w, h);
        this.drawKillFeed(ctx, arena);
        this.drawTopRightTelemetry(ctx, w, arena, ps);
        this.drawCenterBannersAndMedals(ctx, w, h, arena);
        this.drawWeaponBar(ctx, w, h, ps);
        this.drawStatusBar(ctx, w, h, arena, ps, local.modelSpec);
      }
      if (this.scoreboardOpen || ps.pm_type === 3 /* PM_DEAD */) {
        this.drawScoreboard(ctx, w, h, arena);
      }
      if (this.consoleOpen) {
        this.drawDropDownConsole(ctx, w, h);
      }
    }
    drawCrosshair(ctx, w, h) {
      const style = Cvars.variableIntegerValue("cg_drawCrosshair");
      if (style <= 0) return;
      const size = Cvars.variableValue("cg_crosshairSize") || 28;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const letter = String.fromCharCode(97 + (style - 1) % 10);
      const chSprite = this.getHudSprite(`gfx/2d/crosshair${letter}.tga`);
      if (chSprite) {
        ctx.save();
        ctx.drawImage(chSprite, cx - size * 0.5, cy - size * 0.5, size, size);
        ctx.restore();
        return;
      }
      ctx.save();
      ctx.strokeStyle = "rgba(80, 255, 120, 0.92)";
      ctx.fillStyle = "rgba(80, 255, 120, 0.95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.42, 0, Math.PI * 2);
      ctx.stroke();
      const gap = 4;
      const len = size * 0.48;
      ctx.beginPath();
      ctx.moveTo(cx - len, cy);
      ctx.lineTo(cx - gap, cy);
      ctx.moveTo(cx + gap, cy);
      ctx.lineTo(cx + len, cy);
      ctx.moveTo(cx, cy - len);
      ctx.lineTo(cx, cy - gap);
      ctx.moveTo(cx, cy + gap);
      ctx.lineTo(cx, cy + len);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    drawKillFeed(ctx, arena) {
      ctx.save();
      ctx.font = 'bold 14px "Courier New", monospace';
      let y = 26;
      for (const kf of arena.killFeed) {
        const age = arena.timeMs - kf.timeMs;
        if (age > 7e3) continue;
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
    drawTopRightTelemetry(ctx, w, arena, ps) {
      ctx.save();
      ctx.textAlign = "right";
      ctx.font = 'bold 14px "Courier New", monospace';
      let y = 56;
      if (Cvars.variableIntegerValue("cg_drawFPS")) {
        ctx.fillStyle = "#ffee55";
        ctx.fillText(`${this.fps} FPS`, w - 16, y);
        y += 18;
      }
      if (Cvars.variableIntegerValue("cg_drawSpeed")) {
        const ups = Math.round(Math.hypot(ps.velocity[0], ps.velocity[1]));
        ctx.fillStyle = ups >= 450 ? "#33ff66" : "#66ddff";
        ctx.fillText(`${ups} ups`, w - 16, y);
        y += 18;
      }
      if (Cvars.variableIntegerValue("cg_drawTimer")) {
        const totalSec = Math.floor(arena.timeMs / 1e3);
        const mins = Math.floor(totalSec / 60);
        const secs = String(totalSec % 60).padStart(2, "0");
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`${mins}:${secs}`, w - 16, y);
        y += 18;
      }
      ctx.font = '12px "Courier New", monospace';
      ctx.fillStyle = "#bbbbbb";
      ctx.fillText(
        `Draws: ${arena.renderer.stats.drawCalls} | Tris: ${arena.renderer.stats.tris}`,
        w - 16,
        y
      );
      y += 24;
      if ((ps.powerups[1 /* PW_QUAD */] || 0) > arena.timeMs) {
        const rem = Math.ceil((ps.powerups[1 /* PW_QUAD */] - arena.timeMs) / 1e3);
        const quadIcon = this.getHudSprite("icons/quad.tga");
        if (quadIcon) {
          ctx.drawImage(quadIcon, w - 190, y - 22, 28, 28);
        }
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillStyle = "#44aaff";
        ctx.fillText(`QUAD: ${rem}s`, w - 16, y);
        y += 30;
      }
      if ((ps.powerups[3 /* PW_HASTE */] || 0) > arena.timeMs) {
        const rem = Math.ceil((ps.powerups[3 /* PW_HASTE */] - arena.timeMs) / 1e3);
        const hasteIcon = this.getHudSprite("icons/haste.tga");
        if (hasteIcon) {
          ctx.drawImage(hasteIcon, w - 190, y - 22, 28, 28);
        }
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillStyle = "#ffee33";
        ctx.fillText(`HASTE: ${rem}s`, w - 16, y);
      }
      ctx.restore();
    }
    drawCenterBannersAndMedals(ctx, w, h, arena) {
      ctx.save();
      ctx.textAlign = "center";
      if (arena.centerBanner && arena.timeMs - arena.centerBanner.timeMs < 3200) {
        const age = arena.timeMs - arena.centerBanner.timeMs;
        ctx.globalAlpha = age > 2400 ? 1 - (age - 2400) / 800 : 1;
        ctx.font = 'bold 34px "Courier New", monospace';
        ctx.fillStyle = "#ff4500";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 10;
        ctx.fillText(arena.centerBanner.text, w / 2, h * 0.24);
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.fillStyle = "#ffee55";
        ctx.fillText(arena.centerBanner.subtext, w / 2, h * 0.24 + 34);
      }
      if (arena.activeMedal && arena.timeMs - arena.activeMedal.timeMs < 2600) {
        const age = arena.timeMs - arena.activeMedal.timeMs;
        ctx.globalAlpha = age > 2e3 ? 1 - (age - 2e3) / 600 : 1;
        const medalPath = MEDAL_TGA_MAP[arena.activeMedal.name];
        if (medalPath) {
          const medalSprite = this.getHudSprite(medalPath);
          if (medalSprite) {
            ctx.drawImage(medalSprite, w / 2 - 28, h * 0.08, 56, 56);
          }
        }
        ctx.font = 'bold 26px "Courier New", monospace';
        ctx.fillStyle = "#44eeff";
        ctx.shadowColor = "#003366";
        ctx.shadowBlur = 12;
        ctx.fillText(
          `${arena.activeMedal.name} (x${arena.activeMedal.count})`,
          w / 2,
          h * 0.08 + 80
        );
      }
      if (arena.pickupNotice && arena.timeMs - arena.pickupNotice.timeMs < 2e3) {
        ctx.globalAlpha = 1 - (arena.timeMs - arena.pickupNotice.timeMs) / 2e3;
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.fillStyle = "#ffffff";
        ctx.fillText(arena.pickupNotice.name, w / 2, h - 145);
      }
      ctx.restore();
    }
    drawWeaponBar(ctx, w, h, ps) {
      const weapons = [
        1 /* WP_GAUNTLET */,
        2 /* WP_MACHINEGUN */,
        3 /* WP_SHOTGUN */,
        4 /* WP_GRENADE_LAUNCHER */,
        5 /* WP_ROCKET_LAUNCHER */,
        6 /* WP_LIGHTNING */,
        7 /* WP_RAILGUN */,
        8 /* WP_PLASMAGUN */,
        9 /* WP_BFG */
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
        const owned = (ps.weaponsMask & 1 << wp) !== 0;
        const selected = ps.weapon === wp;
        const ammo = ps.ammo[wp];
        ctx.fillStyle = selected ? "rgba(255, 75, 0, 0.42)" : owned ? "rgba(20, 20, 28, 0.78)" : "rgba(10, 10, 14, 0.35)";
        ctx.strokeStyle = selected ? "#ffcc33" : owned ? `rgb(${spec.color[0] * 255 | 0}, ${spec.color[1] * 255 | 0}, ${spec.color[2] * 255 | 0})` : "#333333";
        ctx.lineWidth = selected ? 2.5 : 1;
        ctx.fillRect(x, y, boxW, boxH);
        ctx.strokeRect(x, y, boxW, boxH);
        const iconSprite = spec.iconPath ? this.getHudSprite(spec.iconPath) : null;
        if (iconSprite) {
          ctx.save();
          ctx.globalAlpha = owned ? 1 : 0.25;
          ctx.drawImage(iconSprite, x + 4, y + 3, 24, 24);
          ctx.restore();
        }
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.fillStyle = owned ? "#ffffff" : "#555555";
        ctx.fillText(`${i + 1}`, x + 32, y + 15);
        if (owned) {
          ctx.font = 'bold 11px "Courier New", monospace';
          ctx.fillStyle = ammo === 0 ? "#ff3333" : "#ffeeaa";
          ctx.fillText(ammo === -1 ? "\u221E" : String(ammo), x + 6, y + 37);
        }
        x += boxW + gap;
      }
      ctx.restore();
    }
    /**
     * Draws a multi-digit number using the original 1999 Quake III Arena
     * `gfx/2d/numbers/zero_32b.tga .. nine_32b.tga` sprites!
     */
    drawQ3NumberSprites(ctx, value, rightEdgeX, topY, warnLow) {
      const str = String(value);
      const tint = warnLow ? [255, 45, 30] : [255, 200, 35];
      const digitW = 28;
      const digitH = 38;
      if (!this.getHudSprite(DIGIT_TGA_NAMES["0"], tint)) {
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
    drawStatusBar(ctx, w, h, arena, ps, modelSpec) {
      const barY = h - 68;
      const cx = w * 0.5;
      ctx.save();
      const drawBigNumberBox = (bx, label, value, isInfinite, warnLow, accentColor, iconPath) => {
        ctx.fillStyle = "rgba(12, 8, 8, 0.84)";
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.fillRect(bx - 102, barY, 204, 56);
        ctx.strokeRect(bx - 102, barY, 204, 56);
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
          ctx.textAlign = "right";
          ctx.fillStyle = warnLow ? "#ff2a1a" : "#ffcc22";
          ctx.shadowColor = "#000";
          ctx.shadowBlur = 6;
          ctx.fillText(isInfinite ? "\u221E" : String(value), bx + 44, barY + 42);
        }
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.textAlign = "left";
        ctx.fillStyle = "#dddddd";
        ctx.fillText(label, bx + 50, barY + 38);
      };
      const curAmmo = ps.ammo[ps.weapon];
      const curWeaponSpec = WEAPON_SPECS[ps.weapon];
      drawBigNumberBox(
        cx - 245,
        "AMMO",
        curAmmo,
        curAmmo === -1,
        curAmmo !== -1 && curAmmo <= 5,
        "#ff6600",
        curWeaponSpec?.iconPath || "icons/iconw_rocket.tga"
      );
      const modelName = (modelSpec.split("/")[0] || "sarge").toLowerCase();
      const headIconPath = `models/players/${modelName}/icon_default.tga`;
      drawBigNumberBox(
        cx,
        "HEALTH",
        Math.max(0, ps.health),
        false,
        ps.health <= 25,
        "#ff3300",
        VFS.fileExists(headIconPath) ? headIconPath : "icons/iconh_red.tga"
      );
      drawBigNumberBox(
        cx + 245,
        "ARMOR",
        ps.armor,
        false,
        false,
        "#ffcc00",
        ps.armor >= 100 ? "icons/iconr_red.tga" : "icons/iconr_yellow.tga"
      );
      const sorted = [...arena.clients].sort(
        (a, b) => b.ps.persistant.score - a.ps.persistant.score
      );
      const topScore = sorted[0]?.ps.persistant.score || 0;
      ctx.textAlign = "right";
      ctx.font = 'bold 18px "Courier New", monospace';
      ctx.fillStyle = "#3399ff";
      ctx.fillText(
        `FRAGS: ${ps.persistant.score} / ${Cvars.variableIntegerValue("fraglimit")} (LEAD: ${topScore})`,
        w - 18,
        h - 24
      );
      ctx.restore();
    }
    drawScoreboard(ctx, w, h, arena) {
      const sbW = 580;
      const sbH = 340;
      const x = (w - sbW) * 0.5;
      const y = (h - sbH) * 0.5;
      ctx.save();
      ctx.fillStyle = "rgba(10, 6, 6, 0.90)";
      ctx.strokeStyle = "#ff4500";
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, sbW, sbH);
      ctx.strokeRect(x, y, sbW, sbH);
      ctx.font = 'bold 22px "Courier New", monospace';
      ctx.fillStyle = "#ff5500";
      ctx.textAlign = "center";
      ctx.fillText(`QUAKE III ARENA \u2014 ${arena.mapTitle.toUpperCase()}`, w * 0.5, y + 36);
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillStyle = "#ffcc66";
      ctx.textAlign = "left";
      ctx.fillText("PLAYER", x + 28, y + 72);
      ctx.fillText("MODEL", x + 210, y + 72);
      ctx.fillText("FRAGS", x + 360, y + 72);
      ctx.fillText("HITS", x + 445, y + 72);
      ctx.fillText("PING", x + 510, y + 72);
      const sorted = [...arena.clients].sort(
        (a, b) => b.ps.persistant.score - a.ps.persistant.score
      );
      let rowY = y + 102;
      for (const cl of sorted) {
        if (cl.clientNum === 0) {
          ctx.fillStyle = "rgba(255, 69, 0, 0.22)";
          ctx.fillRect(x + 16, rowY - 16, sbW - 32, 24);
        }
        const mName = (cl.modelSpec.split("/")[0] || "sarge").toLowerCase();
        const iconSp = this.getHudSprite(`models/players/${mName}/icon_default.tga`);
        if (iconSp) {
          ctx.drawImage(iconSp, x + 20, rowY - 15, 20, 20);
        }
        ctx.fillStyle = cl.clientNum === 0 ? "#ffee55" : "#ffffff";
        ctx.fillText(cl.name, x + 46, rowY);
        ctx.fillStyle = "#aaaaaa";
        ctx.fillText(cl.modelSpec, x + 210, rowY);
        ctx.fillStyle = "#44ff66";
        ctx.fillText(String(cl.ps.persistant.score), x + 360, rowY);
        ctx.fillStyle = "#66ccff";
        ctx.fillText(String(cl.ps.persistant.hits), x + 445, rowY);
        ctx.fillStyle = "#cccccc";
        ctx.fillText(cl.isBot ? "BOT" : "0", x + 510, rowY);
        rowY += 28;
      }
      ctx.textAlign = "center";
      ctx.fillStyle = "#88ff88";
      ctx.font = '12px "Courier New", monospace';
      ctx.fillText(
        `VFS: ${VFS.getMountedPaksSummary()} | WASD=Move, Space=Jump/StrafeJump, 1-9=Weapons, ~=Console`,
        w * 0.5,
        y + sbH - 18
      );
      ctx.restore();
    }
    drawDropDownConsole(ctx, w, h) {
      const conH = Math.floor(h * 0.48);
      ctx.save();
      ctx.fillStyle = "rgba(14, 6, 4, 0.93)";
      ctx.fillRect(0, 0, w, conH);
      ctx.strokeStyle = "#ff3b00";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, conH);
      ctx.lineTo(w, conH);
      ctx.stroke();
      ctx.font = 'bold 13px "Courier New", monospace';
      ctx.fillStyle = "#ff5522";
      ctx.fillText(
        "Q3A 1.32c HTML5/WebGL2 Engine Console \u2014 Commands: /map q3dm17, /map q3dm7, /addbot visor 5, /give all, /noclip, /r_lightmap 1",
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
      ctx.fillStyle = "#ffee44";
      ctx.font = 'bold 15px "Courier New", monospace';
      ctx.fillText(`] ${this.consoleInput}_`, 16, conH - 14);
      ctx.restore();
    }
    drawColoredQ3Text(ctx, text, x, y) {
      let curX = x;
      ctx.fillStyle = "#ffffff";
      let i = 0;
      while (i < text.length) {
        if (text[i] === "^" && i + 1 < text.length && Q3_COLOR_TABLE[text[i + 1]]) {
          ctx.fillStyle = Q3_COLOR_TABLE[text[i + 1]];
          i += 2;
          continue;
        }
        let nextCaret = text.indexOf("^", i);
        if (nextCaret === -1) nextCaret = text.length;
        const chunk = text.slice(i, nextCaret);
        ctx.fillText(chunk, curX, y);
        curX += ctx.measureText(chunk).width;
        i = nextCaret;
      }
    }
  };

  // src/renderer/tr_model.ts
  var MD3_VERSION = 15;
  var MD3_XYZ_SCALE = 1 / 64;
  var NORMAL_LUT = new Float32Array(65536 * 3);
  (function initNormalLut() {
    for (let i = 0; i < 65536; i++) {
      const lat = (i >> 8 & 255) * Math.PI * 2 / 255;
      const lng = (i & 255) * Math.PI * 2 / 255;
      NORMAL_LUT[i * 3 + 0] = Math.cos(lat) * Math.sin(lng);
      NORMAL_LUT[i * 3 + 1] = Math.sin(lat) * Math.sin(lng);
      NORMAL_LUT[i * 3 + 2] = Math.cos(lng);
    }
  })();
  var Md3Model = class {
    name;
    numFrames;
    numTags;
    frames = [];
    tagsByFrame = [];
    surfaces = [];
    constructor(gl, buffer, fallbackName = "") {
      const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      const readAscii = (ofs, maxLen) => {
        let s = "";
        for (let i = 0; i < maxLen; i++) {
          const c = view.getUint8(ofs + i);
          if (c === 0) break;
          s += String.fromCharCode(c);
        }
        return s;
      };
      const ident = readAscii(0, 4);
      const version = view.getInt32(4, true);
      if (ident !== "IDP3" || version !== MD3_VERSION) {
        throw new Error(`Invalid MD3 header: ident=${ident}, version=${version}`);
      }
      this.name = readAscii(8, 64) || fallbackName;
      this.numFrames = view.getInt32(76, true);
      this.numTags = view.getInt32(80, true);
      const numSurfaces = view.getInt32(84, true);
      const ofsFrames = view.getInt32(92, true);
      const ofsTags = view.getInt32(96, true);
      let ofsSurfaces = view.getInt32(100, true);
      for (let f = 0; f < this.numFrames; f++) {
        const b = ofsFrames + f * 56;
        this.frames.push({
          bounds: [
            [view.getFloat32(b + 0, true), view.getFloat32(b + 4, true), view.getFloat32(b + 8, true)],
            [view.getFloat32(b + 12, true), view.getFloat32(b + 16, true), view.getFloat32(b + 20, true)]
          ],
          localOrigin: [
            view.getFloat32(b + 24, true),
            view.getFloat32(b + 28, true),
            view.getFloat32(b + 32, true)
          ],
          radius: view.getFloat32(b + 36, true),
          name: readAscii(b + 40, 16)
        });
      }
      for (let f = 0; f < this.numFrames; f++) {
        const frameTags = [];
        for (let t = 0; t < this.numTags; t++) {
          const b = ofsTags + (f * this.numTags + t) * 112;
          const name = readAscii(b, 64).toLowerCase();
          const origin = [
            view.getFloat32(b + 64, true),
            view.getFloat32(b + 68, true),
            view.getFloat32(b + 72, true)
          ];
          const axis = [
            [view.getFloat32(b + 76, true), view.getFloat32(b + 80, true), view.getFloat32(b + 84, true)],
            [view.getFloat32(b + 88, true), view.getFloat32(b + 92, true), view.getFloat32(b + 96, true)],
            [view.getFloat32(b + 100, true), view.getFloat32(b + 104, true), view.getFloat32(b + 108, true)]
          ];
          frameTags.push({ name, origin, axis });
        }
        this.tagsByFrame.push(frameTags);
      }
      for (let s = 0; s < numSurfaces; s++) {
        const sb = ofsSurfaces;
        const surfName = readAscii(sb + 4, 64).toLowerCase();
        const sNumFrames = view.getInt32(sb + 72, true);
        const sNumShaders = view.getInt32(sb + 76, true);
        const sNumVerts = view.getInt32(sb + 80, true);
        const sNumTris = view.getInt32(sb + 84, true);
        const relTris = view.getInt32(sb + 88, true);
        const relShaders = view.getInt32(sb + 92, true);
        const relSt = view.getInt32(sb + 96, true);
        const relXyz = view.getInt32(sb + 100, true);
        const relEnd = view.getInt32(sb + 104, true);
        const shaders = [];
        for (let sh = 0; sh < sNumShaders; sh++) {
          shaders.push(readAscii(sb + relShaders + sh * 68, 64));
        }
        const indexData = new Uint32Array(sNumTris * 3);
        for (let tr = 0; tr < sNumTris; tr++) {
          const tb = sb + relTris + tr * 12;
          indexData[tr * 3 + 0] = view.getInt32(tb + 0, true);
          indexData[tr * 3 + 1] = view.getInt32(tb + 4, true);
          indexData[tr * 3 + 2] = view.getInt32(tb + 8, true);
        }
        const stData = new Float32Array(sNumVerts * 2);
        for (let v = 0; v < sNumVerts; v++) {
          const stb = sb + relSt + v * 8;
          stData[v * 2 + 0] = view.getFloat32(stb + 0, true);
          stData[v * 2 + 1] = view.getFloat32(stb + 4, true);
        }
        const framesPosNorm = [];
        for (let f = 0; f < sNumFrames; f++) {
          const pos = new Float32Array(sNumVerts * 3);
          const norm = new Float32Array(sNumVerts * 3);
          for (let v = 0; v < sNumVerts; v++) {
            const vb = sb + relXyz + (f * sNumVerts + v) * 8;
            pos[v * 3 + 0] = view.getInt16(vb + 0, true) * MD3_XYZ_SCALE;
            pos[v * 3 + 1] = view.getInt16(vb + 2, true) * MD3_XYZ_SCALE;
            pos[v * 3 + 2] = view.getInt16(vb + 4, true) * MD3_XYZ_SCALE;
            const normCode = view.getUint16(vb + 6, true);
            norm[v * 3 + 0] = NORMAL_LUT[normCode * 3 + 0];
            norm[v * 3 + 1] = NORMAL_LUT[normCode * 3 + 1];
            norm[v * 3 + 2] = NORMAL_LUT[normCode * 3 + 2];
          }
          framesPosNorm.push({ pos, norm });
        }
        const vao = gl.createVertexArray();
        const vboDynamic = gl.createBuffer();
        const ibo = gl.createBuffer();
        const interleavedScratch = new Float32Array(sNumVerts * 20);
        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, vboDynamic);
        gl.bufferData(gl.ARRAY_BUFFER, interleavedScratch.byteLength, gl.DYNAMIC_DRAW);
        const stride = 20 * 4;
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 3 * 4);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, 5 * 4);
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 3, gl.FLOAT, false, stride, 7 * 4);
        gl.enableVertexAttribArray(4);
        gl.vertexAttribPointer(4, 4, gl.FLOAT, false, stride, 10 * 4);
        gl.enableVertexAttribArray(5);
        gl.vertexAttribPointer(5, 3, gl.FLOAT, false, stride, 14 * 4);
        gl.enableVertexAttribArray(6);
        gl.vertexAttribPointer(6, 3, gl.FLOAT, false, stride, 17 * 4);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);
        gl.bindVertexArray(null);
        this.surfaces.push({
          name: surfName,
          shaders,
          numFrames: sNumFrames,
          numVerts: sNumVerts,
          numTriangles: sNumTris,
          vao,
          vboDynamic,
          ibo,
          stData,
          framesPosNorm,
          interleavedScratch
        });
        ofsSurfaces += relEnd;
      }
    }
    /**
     * Interpolates a named tag (`tag_torso`, `tag_head`, `tag_weapon`, `tag_flash`)
     * between `startFrame` and `endFrame` by `frac = 1.0 - backlerp` (R_LerpTag in tr_model.c)
     */
    lerpTag(tagName, startFrame, endFrame, frac) {
      if (this.numTags === 0 || this.tagsByFrame.length === 0) return null;
      const f0 = Math.max(0, Math.min(this.numFrames - 1, startFrame));
      const f1 = Math.max(0, Math.min(this.numFrames - 1, endFrame));
      const key = tagName.toLowerCase();
      const startTag = this.tagsByFrame[f0].find((t) => t.name === key);
      const endTag = this.tagsByFrame[f1].find((t) => t.name === key);
      if (!startTag || !endTag) return null;
      const origin = vec3Lerp(startTag.origin, endTag.origin, frac);
      const axis = AxisClear();
      for (let i = 0; i < 3; i++) {
        vec3Lerp(startTag.axis[i], endTag.axis[i], frac, axis[i]);
        vec3Normalize(axis[i]);
      }
      return { name: key, origin, axis };
    }
  };
  function positionRotatedEntityOnTag(entity, parent, parentModel, tagName) {
    const lerped = parentModel.lerpTag(
      tagName,
      parent.oldframe,
      parent.frame,
      1 - parent.backlerp
    );
    if (!lerped) return false;
    entity.origin[0] = parent.origin[0];
    entity.origin[1] = parent.origin[1];
    entity.origin[2] = parent.origin[2];
    for (let i = 0; i < 3; i++) {
      vec3MA(entity.origin, lerped.origin[i], parent.axis[i], entity.origin);
    }
    const tempAxis = AxisClear();
    MatrixMultiply3x3(entity.axis, lerped.axis, tempAxis);
    MatrixMultiply3x3(tempAxis, parent.axis, entity.axis);
    return true;
  }
  function parseSkinFile(skinPath) {
    const map = /* @__PURE__ */ new Map();
    const text = VFS.readTextFile(skinPath);
    if (!text) return map;
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("//")) continue;
      const comma = trimmed.indexOf(",");
      if (comma > 0) {
        const surf = trimmed.slice(0, comma).trim().toLowerCase();
        const shader = trimmed.slice(comma + 1).trim();
        if (surf && shader && !surf.startsWith("tag_")) {
          map.set(surf, shader);
        }
      }
    }
    return map;
  }

  // src/cgame/cg_players.ts
  var CgPlayerManager = class {
    renderer;
    modelCache = /* @__PURE__ */ new Map();
    constructor(renderer) {
      this.renderer = renderer;
    }
    getPlayerModel(modelSpec = "sarge/default") {
      const [rawModel, rawSkin] = modelSpec.toLowerCase().split("/");
      const modelName = rawModel || "sarge";
      const skinName = rawSkin || "default";
      const key = `${modelName}/${skinName}`;
      const cached = this.modelCache.get(key);
      if (cached) return cached;
      const baseDir = `models/players/${modelName}`;
      const animText = VFS.readTextFile(`${baseDir}/animation.cfg`) || VFS.readTextFile("models/players/sarge/animation.cfg") || "";
      const animations = this.parseAnimationCfg(animText);
      const info = {
        modelName,
        lowerPath: `${baseDir}/lower.md3`,
        upperPath: `${baseDir}/upper.md3`,
        headPath: `${baseDir}/head.md3`,
        lowerSkin: `${baseDir}/lower_${skinName}.skin`,
        upperSkin: `${baseDir}/upper_${skinName}.skin`,
        headSkin: `${baseDir}/head_${skinName}.skin`,
        animations
      };
      this.renderer.registerModel(info.lowerPath);
      this.renderer.registerModel(info.upperPath);
      this.renderer.registerModel(info.headPath);
      this.modelCache.set(key, info);
      return info;
    }
    /**
     * Parses Quake III `animation.cfg` (CG_ParseAnimationFile in cg_players.c)
     * Explicitly handles the 3ds Max export offset between TORSO_GESTURE and LEGS_WALKCR!
     */
    parseAnimationCfg(text) {
      const anims = [];
      for (let i = 0; i < 25 /* MAX_ANIMATIONS */; i++) {
        anims.push({
          firstFrame: 0,
          numFrames: 1,
          loopFrames: 1,
          frameLerp: 100,
          initialLerp: 100,
          reversed: false,
          flipflop: false
        });
      }
      const tk = new Q3Tokenizer(text);
      while (!tk.eof()) {
        const tok = tk.nextToken(true);
        if (!tok) break;
        const lower = tok.toLowerCase();
        if (lower === "sex" || lower === "footsteps") {
          tk.nextToken(false);
          continue;
        }
        if (lower === "headoffset") {
          tk.nextToken(false);
          tk.nextToken(false);
          tk.nextToken(false);
          continue;
        }
        const firstNum = Number.parseInt(tok, 10);
        if (!Number.isNaN(firstNum)) {
          this.readAnimEntry(anims, 0, firstNum, tk);
          for (let i = 1; i < 25 /* MAX_ANIMATIONS */; i++) {
            const ff = Number.parseInt(tk.nextToken(true), 10);
            if (Number.isNaN(ff)) break;
            this.readAnimEntry(anims, i, ff, tk);
          }
          break;
        }
      }
      const skip = anims[13 /* LEGS_WALKCR */].firstFrame - anims[6 /* TORSO_GESTURE */].firstFrame;
      if (skip > 0) {
        for (let i = 13 /* LEGS_WALKCR */; i < 25 /* MAX_ANIMATIONS */; i++) {
          anims[i].firstFrame -= skip;
        }
      }
      return anims;
    }
    readAnimEntry(anims, index, firstFrame, tk) {
      let numFrames = Number.parseInt(tk.nextToken(false), 10) || 1;
      const loopFrames = Number.parseInt(tk.nextToken(false), 10) || 0;
      let fps = Number.parseFloat(tk.nextToken(false)) || 15;
      if (fps <= 0) fps = 15;
      let reversed = false;
      if (numFrames < 0) {
        numFrames = -numFrames;
        reversed = true;
      }
      const msec = 1e3 / fps;
      anims[index] = {
        firstFrame,
        numFrames,
        loopFrames,
        frameLerp: msec,
        initialLerp: msec,
        reversed,
        flipflop: false
      };
    }
    computeAnimFrames(anim, timeMs) {
      if (anim.numFrames <= 1) {
        return { oldFrame: anim.firstFrame, frame: anim.firstFrame, backlerp: 0 };
      }
      const exactFrame = timeMs / anim.frameLerp;
      const fInt = Math.floor(exactFrame);
      const frac = exactFrame - fInt;
      const curRel = fInt % anim.numFrames;
      const nextRel = (fInt + 1) % anim.numFrames;
      return {
        oldFrame: Math.max(0, anim.firstFrame + curRel),
        frame: Math.max(0, anim.firstFrame + nextRel),
        backlerp: 1 - frac
      };
    }
    /**
     * Assembles and submits `lower.md3`, `upper.md3`, `head.md3`, and `weapon.md3`
     * connected via `tag_torso`, `tag_head`, and `tag_weapon` (CG_Player in cg_players.c)
     */
    addPlayerToScene(params) {
      const pModel = this.getPlayerModel(params.modelSpec);
      const lowerMd3 = this.renderer.registerModel(pModel.lowerPath);
      const upperMd3 = this.renderer.registerModel(pModel.upperPath);
      const headMd3 = this.renderer.registerModel(pModel.headPath);
      if (!lowerMd3 || !upperMd3 || !headMd3) return;
      const renderfx = params.isLocalPlayer ? RF_THIRD_PERSON : 0;
      const yaw = params.viewangles[1];
      const pitch = params.viewangles[0];
      const horizSpeed = Math.hypot(params.velocity[0], params.velocity[1]);
      let legsYaw = yaw;
      if (horizSpeed > 25) {
        const moveYaw = Math.atan2(params.velocity[1], params.velocity[0]) * 180 / Math.PI;
        legsYaw = LerpAngle(yaw, moveYaw, 0.45);
      }
      const legsAngles = [0, legsYaw, 0];
      const torsoAngles = [pitch * 0.35, AngleNormalize(yaw - legsYaw) * 0.6, 0];
      const headAngles = [pitch * 0.55, AngleNormalize(yaw - legsYaw) * 0.4, 0];
      const legsAxis = AxisClear();
      const torsoAxis = AxisClear();
      const headAxis = AxisClear();
      AnglesToAxis(legsAngles, legsAxis);
      AnglesToAxis(torsoAngles, torsoAxis);
      AnglesToAxis(headAngles, headAxis);
      const legsFrames = this.computeAnimFrames(
        pModel.animations[params.legsAnim] || pModel.animations[22 /* LEGS_IDLE */],
        params.timeMs
      );
      const torsoFrames = this.computeAnimFrames(
        pModel.animations[params.torsoAnim] || pModel.animations[11 /* TORSO_STAND */],
        params.timeMs
      );
      const hasQuad = (params.powerups[1 /* PW_QUAD */] || 0) > params.timeMs;
      const legsEnt = {
        reType: 0 /* RT_MODEL */,
        renderfx,
        hModel: pModel.lowerPath,
        lightingOrigin: vec3Clone(params.origin),
        axis: legsAxis,
        nonNormalizedAxes: false,
        origin: vec3Clone(params.origin),
        oldorigin: vec3Clone(params.origin),
        oldframe: legsFrames.oldFrame,
        frame: legsFrames.frame,
        backlerp: legsFrames.backlerp,
        skinNum: 0,
        customSkin: pModel.lowerSkin,
        customShader: "",
        shaderRGBA: [255, 255, 255, 255],
        shaderTexCoord: [0, 0],
        shaderTime: 0,
        radius: 0,
        rotation: 0
      };
      this.renderer.addRefEntityToScene(legsEnt);
      if (hasQuad) {
        this.renderer.addRefEntityToScene({
          ...legsEnt,
          customShader: "models/powerups/instant/quad_shell"
        });
      }
      const torsoEnt = {
        ...legsEnt,
        hModel: pModel.upperPath,
        axis: torsoAxis,
        oldframe: torsoFrames.oldFrame,
        frame: torsoFrames.frame,
        backlerp: torsoFrames.backlerp,
        customSkin: pModel.upperSkin
      };
      positionRotatedEntityOnTag(torsoEnt, legsEnt, lowerMd3, "tag_torso");
      this.renderer.addRefEntityToScene(torsoEnt);
      if (hasQuad) {
        this.renderer.addRefEntityToScene({
          ...torsoEnt,
          customShader: "models/powerups/instant/quad_shell"
        });
      }
      const headEnt = {
        ...torsoEnt,
        hModel: pModel.headPath,
        axis: headAxis,
        oldframe: 0,
        frame: 0,
        backlerp: 0,
        customSkin: pModel.headSkin
      };
      positionRotatedEntityOnTag(headEnt, torsoEnt, upperMd3, "tag_head");
      this.renderer.addRefEntityToScene(headEnt);
      if (hasQuad) {
        this.renderer.addRefEntityToScene({
          ...headEnt,
          customShader: "models/powerups/instant/quad_shell"
        });
      }
      const wSpec = WEAPON_SPECS[params.weapon];
      if (wSpec && wSpec.modelPath) {
        const gunEnt = {
          ...torsoEnt,
          hModel: wSpec.modelPath,
          axis: AxisClear(),
          oldframe: 0,
          frame: 0,
          backlerp: 0,
          customSkin: ""
        };
        positionRotatedEntityOnTag(gunEnt, torsoEnt, upperMd3, "tag_weapon");
        this.renderer.addRefEntityToScene(gunEnt);
        if (params.muzzleFlashActive) {
          const wMd3 = this.renderer.registerModel(wSpec.modelPath);
          const flashEnt = {
            ...gunEnt,
            reType: 2 /* RT_SPRITE */,
            customShader: "flareShader",
            radius: 14,
            shaderRGBA: [
              wSpec.color[0] * 255 | 0,
              wSpec.color[1] * 255 | 0,
              wSpec.color[2] * 255 | 0,
              255
            ]
          };
          if (wMd3) {
            positionRotatedEntityOnTag(flashEnt, gunEnt, wMd3, "tag_flash");
          }
          this.renderer.addRefEntityToScene(flashEnt);
          this.renderer.addLightToScene(
            flashEnt.origin,
            180,
            wSpec.color[0],
            wSpec.color[1],
            wSpec.color[2]
          );
        }
      }
    }
  };
  function AngleNormalize(a) {
    let r = a % 360;
    if (r > 180) r -= 360;
    if (r < -180) r += 360;
    return r;
  }

  // src/qcommon/cm_trace.ts
  var SURFACE_CLIP_EPSILON = 0.125;
  var CollisionModel = class {
    bsp = null;
    setBsp(bsp) {
      this.bsp = bsp;
    }
    pointContents(p, passContentMask = -1) {
      const bsp = this.bsp;
      if (!bsp) return 0;
      let contents = 0;
      for (let i = 0; i < bsp.brushes.length; i++) {
        const br = bsp.brushes[i];
        const sh = bsp.shaders[br.shaderNum];
        if (!sh || !(sh.contentFlags & passContentMask)) continue;
        let inside = true;
        for (let s = 0; s < br.numSides; s++) {
          const side = bsp.brushSides[br.firstSide + s];
          const plane = bsp.planes[side.planeNum];
          if (vec3Dot(p, plane.normal) - plane.dist > 0) {
            inside = false;
            break;
          }
        }
        if (inside) {
          contents |= sh.contentFlags;
        }
      }
      return contents;
    }
    /**
     * Sweeps an Axis-Aligned Bounding Box [mins, maxs] from `start` to `end`
     * against all matching BSP brushes (CM_BoxTrace in cm_trace.c)
     */
    boxTrace(start, end, mins = [0, 0, 0], maxs = [0, 0, 0], contentMask = CONTENTS_SOLID) {
      const trace = createDefaultTrace(end);
      const bsp = this.bsp;
      if (!bsp) return trace;
      const offset = [
        (mins[0] + maxs[0]) * 0.5,
        (mins[1] + maxs[1]) * 0.5,
        (mins[2] + maxs[2]) * 0.5
      ];
      const sizeMins = [mins[0] - offset[0], mins[1] - offset[1], mins[2] - offset[2]];
      const sizeMaxs = [maxs[0] - offset[0], maxs[1] - offset[1], maxs[2] - offset[2]];
      const startP = [start[0] + offset[0], start[1] + offset[1], start[2] + offset[2]];
      const endP = [end[0] + offset[0], end[1] + offset[1], end[2] + offset[2]];
      const numWorldBrushes = bsp.models.length > 0 ? bsp.models[0].numBrushes : bsp.brushes.length;
      for (let i = 0; i < numWorldBrushes; i++) {
        const brush = bsp.brushes[i];
        const sh = bsp.shaders[brush.shaderNum];
        if (!sh || !(sh.contentFlags & contentMask)) continue;
        this.traceThroughBrush(bsp, brush, startP, endP, sizeMins, sizeMaxs, trace);
        if (trace.allsolid) break;
      }
      if (trace.fraction === 1) {
        trace.endpos[0] = end[0];
        trace.endpos[1] = end[1];
        trace.endpos[2] = end[2];
      } else {
        vec3Lerp(start, end, trace.fraction, trace.endpos);
      }
      return trace;
    }
    /**
     * Traces against a translated Inline Brush Model (*1, *2, ...)
     */
    transformedBoxTrace(start, end, mins, maxs, inlineModelIndex, modelOrigin, contentMask = CONTENTS_SOLID) {
      const trace = createDefaultTrace(end);
      const bsp = this.bsp;
      if (!bsp || inlineModelIndex <= 0 || inlineModelIndex >= bsp.models.length) {
        return trace;
      }
      const model = bsp.models[inlineModelIndex];
      const startL = [
        start[0] - modelOrigin[0],
        start[1] - modelOrigin[1],
        start[2] - modelOrigin[2]
      ];
      const endL = [
        end[0] - modelOrigin[0],
        end[1] - modelOrigin[1],
        end[2] - modelOrigin[2]
      ];
      for (let i = 0; i < model.numBrushes; i++) {
        const brush = bsp.brushes[model.firstBrush + i];
        const sh = bsp.shaders[brush.shaderNum];
        if (!sh || !(sh.contentFlags & contentMask)) continue;
        this.traceThroughBrush(bsp, brush, startL, endL, mins, maxs, trace);
      }
      if (trace.fraction < 1) {
        vec3Lerp(start, end, trace.fraction, trace.endpos);
      }
      return trace;
    }
    traceThroughBrush(bsp, brush, start, end, mins, maxs, trace) {
      if (brush.numSides === 0) return;
      let enterFrac = -1;
      let leaveFrac = 1;
      let clipPlaneNormal = [0, 0, 1];
      let clipPlaneDist = 0;
      let clipSurfaceFlags = 0;
      let getout = false;
      let startout = false;
      for (let i = 0; i < brush.numSides; i++) {
        const side = bsp.brushSides[brush.firstSide + i];
        const plane = bsp.planes[side.planeNum];
        const n = plane.normal;
        const ofsX = n[0] < 0 ? maxs[0] : mins[0];
        const ofsY = n[1] < 0 ? maxs[1] : mins[1];
        const ofsZ = n[2] < 0 ? maxs[2] : mins[2];
        const dist = plane.dist - (ofsX * n[0] + ofsY * n[1] + ofsZ * n[2]);
        const d1 = vec3Dot(start, n) - dist;
        const d2 = vec3Dot(end, n) - dist;
        if (d2 > 0) getout = true;
        if (d1 > 0) startout = true;
        if (d1 > 0 && (d2 >= SURFACE_CLIP_EPSILON || d2 >= d1)) {
          return;
        }
        if (d1 <= 0 && d2 <= 0) {
          continue;
        }
        if (d1 > d2) {
          let f = (d1 - SURFACE_CLIP_EPSILON) / (d1 - d2);
          if (f < 0) f = 0;
          if (f > enterFrac) {
            enterFrac = f;
            clipPlaneNormal = [n[0], n[1], n[2]];
            clipPlaneDist = dist;
            const sideShader = bsp.shaders[side.shaderNum] || bsp.shaders[brush.shaderNum];
            clipSurfaceFlags = sideShader ? sideShader.surfaceFlags : 0;
          }
        } else {
          let f = (d1 + SURFACE_CLIP_EPSILON) / (d1 - d2);
          if (f > 1) f = 1;
          if (f < leaveFrac) {
            leaveFrac = f;
          }
        }
      }
      const brushShader = bsp.shaders[brush.shaderNum];
      const brushContents = brushShader ? brushShader.contentFlags : CONTENTS_SOLID;
      if (!startout) {
        trace.startsolid = true;
        if (!getout) {
          trace.allsolid = true;
          trace.fraction = 0;
          trace.contents = brushContents;
          trace.entityNum = 1022;
        }
        return;
      }
      if (enterFrac < leaveFrac) {
        if (enterFrac > -1 && enterFrac < trace.fraction) {
          if (enterFrac < 0) enterFrac = 0;
          trace.fraction = enterFrac;
          trace.plane.normal = clipPlaneNormal;
          trace.plane.dist = clipPlaneDist;
          trace.surfaceFlags = clipSurfaceFlags;
          trace.contents = brushContents;
          trace.entityNum = 1022;
        }
      }
    }
  };
  var CM = new CollisionModel();

  // src/game/bg_pmove.ts
  var JUMP_VELOCITY = 270;
  var OVERCLIP = 1.001;
  var STEPSIZE = 18;
  var pm_stopspeed = 100;
  var pm_duckScale = 0.25;
  var pm_swimScale = 0.5;
  var pm_accelerate = 10;
  var pm_airaccelerate = 1;
  var pm_wateraccelerate = 4;
  var pm_flyaccelerate = 8;
  var pm_friction = 6;
  var pm_waterfriction = 1;
  var pm_spectatorfriction = 5;
  var PLAYER_MINS = [-15, -15, -24];
  var PLAYER_MAXS_STAND = [15, 15, 32];
  var DEFAULT_VIEWHEIGHT = 26;
  var CROUCH_VIEWHEIGHT = 12;
  var DEAD_VIEWHEIGHT = -16;
  function PM_ClipVelocity(inVel, normal, outVel, overbounce) {
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
  function PM_Friction(pm) {
    const vel = pm.ps.velocity;
    const vec = [vel[0], vel[1], vel[2]];
    if (pm.walking) {
      vec[2] = 0;
    }
    const speed = vec3Length(vec);
    if (speed < 1) {
      vel[0] = 0;
      vel[1] = 0;
      return;
    }
    let drop = 0;
    if (pm.waterlevel <= 1 && pm.walking && pm.groundTrace && !(pm.groundTrace.surfaceFlags & SURF_SLICK) && !(pm.ps.pm_flags & PMF_TIME_KNOCKBACK)) {
      const control = speed < pm_stopspeed ? pm_stopspeed : speed;
      drop += control * pm_friction * pm.frametime;
    }
    if (pm.waterlevel > 0) {
      drop += speed * pm_waterfriction * pm.waterlevel * pm.frametime;
    }
    if (pm.ps.pm_type === 2 /* PM_SPECTATOR */ || pm.ps.pm_type === 1 /* PM_NOCLIP */) {
      drop += speed * pm_spectatorfriction * pm.frametime;
    }
    let newspeed = speed - drop;
    if (newspeed < 0) newspeed = 0;
    newspeed /= speed;
    vel[0] *= newspeed;
    vel[1] *= newspeed;
    vel[2] *= newspeed;
  }
  function PM_Accelerate(pm, wishdir, wishspeed, accel) {
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
  function PM_CmdScale(pm, cmd) {
    let max2 = Math.abs(cmd.forwardmove);
    if (Math.abs(cmd.rightmove) > max2) max2 = Math.abs(cmd.rightmove);
    if (Math.abs(cmd.upmove) > max2) max2 = Math.abs(cmd.upmove);
    if (!max2) return 0;
    const total = Math.hypot(cmd.forwardmove, cmd.rightmove, cmd.upmove);
    const scale = pm.ps.speed * max2 / (127 * total);
    return scale;
  }
  function PM_SlideMove(pm, gravity) {
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
    const planes = [];
    if (pm.groundPlane && pm.groundTrace) {
      planes.push(vec3Clone(pm.groundTrace.plane.normal));
    }
    const velNorm = vec3Clone(pm.ps.velocity);
    vec3Normalize(velNorm);
    planes.push(velNorm);
    let bumpcount = 0;
    for (bumpcount = 0; bumpcount < numbumps; bumpcount++) {
      const end = [0, 0, 0];
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
      if (trace.fraction === 1) {
        break;
      }
      time_left -= time_left * trace.fraction;
      if (planes.length >= 5) {
        pm.ps.velocity = [0, 0, 0];
        return true;
      }
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
      let resolved = false;
      for (let i = 0; i < planes.length; i++) {
        const into = vec3Dot(pm.ps.velocity, planes[i]);
        if (into >= 0.1) continue;
        if (-into > pm.impactSpeed) {
          pm.impactSpeed = -into;
        }
        const clipVel = [0, 0, 0];
        const endClipVel = [0, 0, 0];
        PM_ClipVelocity(pm.ps.velocity, planes[i], clipVel, OVERCLIP);
        PM_ClipVelocity(endVelocity, planes[i], endClipVel, OVERCLIP);
        for (let j = 0; j < planes.length; j++) {
          if (j === i) continue;
          if (vec3Dot(clipVel, planes[j]) >= 0.1) continue;
          PM_ClipVelocity(clipVel, planes[j], clipVel, OVERCLIP);
          PM_ClipVelocity(endClipVel, planes[j], endClipVel, OVERCLIP);
          if (vec3Dot(clipVel, planes[i]) >= 0) continue;
          const dir = [0, 0, 0];
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
  function PM_StepSlideMove(pm, gravity) {
    const start_o = vec3Clone(pm.ps.origin);
    const start_v = vec3Clone(pm.ps.velocity);
    if (!PM_SlideMove(pm, gravity)) {
      return;
    }
    const down_o = vec3Clone(pm.ps.origin);
    const down_v = vec3Clone(pm.ps.velocity);
    const down = [start_o[0], start_o[1], start_o[2] - STEPSIZE];
    let trace = pm.trace(start_o, down, pm.mins, pm.maxs, pm.tracemask);
    const up = [0, 0, 1];
    if (pm.ps.velocity[2] > 0 && (trace.fraction === 1 || vec3Dot(trace.plane.normal, up) < 0.7)) {
      return;
    }
    const upPos = [start_o[0], start_o[1], start_o[2] + STEPSIZE];
    trace = pm.trace(start_o, upPos, pm.mins, pm.maxs, pm.tracemask);
    if (trace.allsolid) return;
    const stepSize = trace.endpos[2] - start_o[2];
    pm.ps.origin = vec3Clone(trace.endpos);
    pm.ps.velocity = vec3Clone(start_v);
    PM_SlideMove(pm, gravity);
    const downEnd = [pm.ps.origin[0], pm.ps.origin[1], pm.ps.origin[2] - stepSize];
    trace = pm.trace(pm.ps.origin, downEnd, pm.mins, pm.maxs, pm.tracemask);
    if (!trace.allsolid) {
      pm.ps.origin = vec3Clone(trace.endpos);
    }
    if (trace.fraction < 1) {
      PM_ClipVelocity(pm.ps.velocity, trace.plane.normal, pm.ps.velocity, OVERCLIP);
    }
    const downDistSq = (down_o[0] - start_o[0]) ** 2 + (down_o[1] - start_o[1]) ** 2;
    const stepDistSq = (pm.ps.origin[0] - start_o[0]) ** 2 + (pm.ps.origin[1] - start_o[1]) ** 2;
    if (downDistSq > stepDistSq) {
      pm.ps.origin = down_o;
      pm.ps.velocity = down_v;
    }
  }
  function PM_CheckJump(pm) {
    if (pm.ps.pm_flags & PMF_RESPAWNED) return false;
    if (pm.cmd.upmove < 10) {
      pm.ps.pm_flags &= ~PMF_JUMP_HELD;
      return false;
    }
    pm.groundPlane = false;
    pm.walking = false;
    pm.ps.pm_flags |= PMF_JUMP_HELD;
    pm.ps.groundEntityNum = 1023;
    pm.ps.velocity[2] = JUMP_VELOCITY;
    pm.onSound?.("sound/player/sarge/jump1.wav");
    if (pm.cmd.forwardmove >= 0) {
      pm.ps.legsAnim = 18 /* LEGS_JUMP */;
      pm.ps.pm_flags &= ~PMF_BACKWARDS_JUMP;
    } else {
      pm.ps.legsAnim = 20 /* LEGS_JUMPB */;
      pm.ps.pm_flags |= PMF_BACKWARDS_JUMP;
    }
    pm.ps.legsTimer = 250;
    return true;
  }
  function PM_AirMove(pm) {
    PM_Friction(pm);
    const fmove = pm.cmd.forwardmove;
    const smove = pm.cmd.rightmove;
    const scale = PM_CmdScale(pm, pm.cmd);
    const forward = [pm.forward[0], pm.forward[1], 0];
    const right = [pm.right[0], pm.right[1], 0];
    vec3Normalize(forward);
    vec3Normalize(right);
    const wishvel = [
      forward[0] * fmove + right[0] * smove,
      forward[1] * fmove + right[1] * smove,
      0
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
  function PM_WalkMove(pm) {
    if (pm.waterlevel > 2 && vec3Dot(pm.forward, pm.groundTrace.plane.normal) > 0) {
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
    const forward = [pm.forward[0], pm.forward[1], 0];
    const right = [pm.right[0], pm.right[1], 0];
    if (pm.groundTrace) {
      PM_ClipVelocity(forward, pm.groundTrace.plane.normal, forward, OVERCLIP);
      PM_ClipVelocity(right, pm.groundTrace.plane.normal, right, OVERCLIP);
    }
    vec3Normalize(forward);
    vec3Normalize(right);
    const wishvel = [
      forward[0] * fmove + right[0] * smove,
      forward[1] * fmove + right[1] * smove,
      forward[2] * fmove + right[2] * smove
    ];
    const wishdir = vec3Clone(wishvel);
    let wishspeed = vec3Normalize(wishdir);
    wishspeed *= scale;
    if (pm.ps.pm_flags & PMF_DUCKED) {
      if (wishspeed > pm.ps.speed * pm_duckScale) {
        wishspeed = pm.ps.speed * pm_duckScale;
      }
    }
    const accelerate = pm.groundTrace && pm.groundTrace.surfaceFlags & SURF_SLICK ? pm_airaccelerate : pm_accelerate;
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
  function PM_WaterMove(pm) {
    PM_Friction(pm);
    const scale = PM_CmdScale(pm, pm.cmd);
    const wishvel = [
      pm.forward[0] * pm.cmd.forwardmove + pm.right[0] * pm.cmd.rightmove,
      pm.forward[1] * pm.cmd.forwardmove + pm.right[1] * pm.cmd.rightmove,
      pm.forward[2] * pm.cmd.forwardmove + pm.right[2] * pm.cmd.rightmove + pm.cmd.upmove
    ];
    const wishdir = vec3Clone(wishvel);
    let wishspeed = vec3Normalize(wishdir) * scale;
    if (wishspeed > pm.ps.speed * pm_swimScale) {
      wishspeed = pm.ps.speed * pm_swimScale;
    }
    PM_Accelerate(pm, wishdir, wishspeed, pm_wateraccelerate);
    PM_StepSlideMove(pm, false);
  }
  function PM_NoclipMove(pm) {
    pm.ps.viewheight = DEFAULT_VIEWHEIGHT;
    PM_Friction(pm);
    const scale = PM_CmdScale(pm, pm.cmd) * 1.5;
    const fmove = pm.cmd.forwardmove;
    const smove = pm.cmd.rightmove;
    const umove = pm.cmd.upmove;
    const wishvel = [
      pm.forward[0] * fmove + pm.right[0] * smove,
      pm.forward[1] * fmove + pm.right[1] * smove,
      pm.forward[2] * fmove + pm.right[2] * smove + umove
    ];
    const wishdir = vec3Clone(wishvel);
    const wishspeed = vec3Normalize(wishdir) * scale;
    PM_Accelerate(pm, wishdir, wishspeed, pm_flyaccelerate);
    vec3MA(pm.ps.origin, pm.frametime, pm.ps.velocity, pm.ps.origin);
  }
  function PM_GroundTrace(pm) {
    const point = [pm.ps.origin[0], pm.ps.origin[1], pm.ps.origin[2] - 0.25];
    const trace = pm.trace(pm.ps.origin, point, pm.mins, pm.maxs, pm.tracemask);
    pm.groundTrace = trace;
    if (trace.fraction === 1 || pm.ps.velocity[2] > 0 && vec3Dot(pm.ps.velocity, trace.plane.normal) > 10) {
      pm.groundPlane = false;
      pm.walking = false;
      pm.ps.groundEntityNum = 1023;
      return;
    }
    if (trace.plane.normal[2] < 0.7) {
      pm.groundPlane = true;
      pm.walking = false;
      pm.ps.groundEntityNum = 1023;
      return;
    }
    pm.groundPlane = true;
    pm.walking = true;
    if (pm.ps.groundEntityNum === 1023) {
      pm.ps.legsAnim = 19 /* LEGS_LAND */;
      pm.ps.legsTimer = 130;
      if (pm.impactSpeed <= -180) {
        pm.onSound?.("sound/player/land1.wav");
      }
    }
    pm.ps.groundEntityNum = trace.entityNum === 1023 ? 1022 : trace.entityNum;
  }
  function PM_CheckDuck(pm) {
    pm.mins[0] = -15;
    pm.mins[1] = -15;
    pm.mins[2] = -24;
    pm.maxs[0] = 15;
    pm.maxs[1] = 15;
    if (pm.ps.pm_type === 3 /* PM_DEAD */) {
      pm.maxs[2] = -8;
      pm.ps.viewheight = DEAD_VIEWHEIGHT;
      return;
    }
    if (pm.cmd.upmove < 0) {
      pm.ps.pm_flags |= PMF_DUCKED;
    } else if (pm.ps.pm_flags & PMF_DUCKED) {
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
  function PM_SetWaterLevel(pm) {
    pm.waterlevel = 0;
    pm.watertype = 0;
    const point = [pm.ps.origin[0], pm.ps.origin[1], pm.ps.origin[2] + pm.mins[2] + 1];
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
  function PM_UpdateAnimations(pm) {
    if (pm.ps.legsTimer > 0) {
      pm.ps.legsTimer = Math.max(0, pm.ps.legsTimer - pm.msec);
    }
    if (pm.ps.torsoTimer > 0) {
      pm.ps.torsoTimer = Math.max(0, pm.ps.torsoTimer - pm.msec);
      if (pm.ps.torsoTimer === 0) {
        pm.ps.torsoAnim = 11 /* TORSO_STAND */;
      }
    }
    if (pm.ps.pm_type === 3 /* PM_DEAD */) {
      pm.ps.legsAnim = 1 /* BOTH_DEAD1 */;
      pm.ps.torsoAnim = 1 /* BOTH_DEAD1 */;
      return;
    }
    if (pm.ps.legsTimer > 0) return;
    const horizSpeed = Math.hypot(pm.ps.velocity[0], pm.ps.velocity[1]);
    if (!pm.walking) {
      pm.ps.legsAnim = 18 /* LEGS_JUMP */;
    } else if (horizSpeed > 15) {
      if (pm.ps.pm_flags & PMF_DUCKED) {
        pm.ps.legsAnim = 13 /* LEGS_WALKCR */;
      } else if (pm.cmd.forwardmove < 0) {
        pm.ps.legsAnim = 16 /* LEGS_BACK */;
      } else if (pm.cmd.buttons & BUTTON_WALKING) {
        pm.ps.legsAnim = 14 /* LEGS_WALK */;
      } else {
        pm.ps.legsAnim = 15 /* LEGS_RUN */;
      }
    } else {
      pm.ps.legsAnim = pm.ps.pm_flags & PMF_DUCKED ? 23 /* LEGS_IDLECR */ : 22 /* LEGS_IDLE */;
    }
  }
  function PmoveSingle(ps, cmd, trace, pointcontents, onSound) {
    let msec = cmd.serverTime - ps.commandTime;
    if (msec < 1) return;
    if (msec > 200) msec = 200;
    ps.commandTime = cmd.serverTime;
    const baseSpeed = 320;
    ps.speed = ps.powerups[3 /* PW_HASTE */] > cmd.serverTime ? baseSpeed * 1.3 : baseSpeed;
    ps.viewangles[0] = cmd.angles[0];
    ps.viewangles[1] = cmd.angles[1];
    ps.viewangles[2] = cmd.angles[2];
    const forward = [0, 0, 0];
    const right = [0, 0, 0];
    const up = [0, 0, 0];
    AngleVectors(ps.viewangles, forward, right, up);
    if (ps.pm_time > 0) {
      if (msec >= ps.pm_time) {
        ps.pm_flags &= ~(PMF_TIME_WATERJUMP | PMF_TIME_LAND | PMF_TIME_KNOCKBACK);
        ps.pm_time = 0;
      } else {
        ps.pm_time -= msec;
      }
    }
    const pm = {
      ps,
      cmd,
      tracemask: MASK_PLAYERSOLID,
      mins: vec3Clone(PLAYER_MINS),
      maxs: vec3Clone(PLAYER_MAXS_STAND),
      watertype: 0,
      waterlevel: 0,
      frametime: msec * 1e-3,
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
      onSound
    };
    if (ps.pm_type === 1 /* PM_NOCLIP */) {
      PM_NoclipMove(pm);
      return;
    }
    if (ps.pm_type === 3 /* PM_DEAD */) {
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

  // src/game/g_main.ts
  var Q3GameArena = class {
    renderer;
    playerMgr;
    mapName = "q3dm17";
    mapTitle = "The Longest Yard";
    timeMs = 0;
    clients = [];
    spawns = [];
    jumpPads = [];
    teleporters = [];
    items = [];
    projectiles = [];
    beams = [];
    gibs = [];
    movers = [];
    killFeed = [];
    pickupNotice = null;
    centerBanner = null;
    activeMedal = null;
    nextProjectileId = 1;
    randSeed = { seed: 1337 };
    lastMegaDecayMs = 0;
    constructor(renderer) {
      this.renderer = renderer;
      this.playerMgr = new CgPlayerManager(renderer);
    }
    loadMap(mapName) {
      const cleanName = mapName.replace(/^maps\//i, "").replace(/\.bsp$/i, "").toLowerCase();
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
      this.clients = [];
      this.spawnClient(0, Cvars.variableString("name") || "Ranger", Cvars.variableString("model") || "sarge/default", false, 5);
      if (Cvars.variableIntegerValue("bot_enable")) {
        this.addBot("Visor", "visor/default", 4);
        this.addBot("Major", "major/default", 3);
        this.addBot("Grunt", "grunt/default", 3);
      }
      this.centerBanner = {
        text: this.mapTitle.toUpperCase(),
        subtext: "PREPARE TO FIGHT!",
        timeMs: this.timeMs
      };
      Sound.queueAnnouncement("Prepare to fight");
      setTimeout(() => Sound.queueAnnouncement("Fight!"), 1200);
      Cmd.print(`^2Loaded Map: ^3${bspPath}^7 \u2014 "${this.mapTitle}" (${bsp.surfaces.length} surfaces, ${this.items.length} items)`);
    }
    parseVec3(str = "0 0 0") {
      const parts = str.trim().split(/\s+/).map(Number);
      return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
    }
    getEntityOriginOrModelCenter(bsp, ent) {
      if (ent.origin) {
        return this.parseVec3(ent.origin);
      }
      if (ent.model && ent.model.startsWith("*")) {
        const idx = Number.parseInt(ent.model.slice(1), 10);
        const m = bsp.models[idx];
        if (m) {
          return [
            (m.mins[0] + m.maxs[0]) * 0.5,
            (m.mins[1] + m.maxs[1]) * 0.5,
            (m.mins[2] + m.maxs[2]) * 0.5
          ];
        }
      }
      return [0, 0, 0];
    }
    parseMapEntities(bsp) {
      const targetPositions = /* @__PURE__ */ new Map();
      for (const ent of bsp.entities) {
        const cn = ent.classname || "";
        if (cn === "worldspawn") {
          this.mapTitle = ent.message || this.mapName.toUpperCase();
        } else if (cn === "target_position" || cn === "misc_teleporter_dest" || cn === "info_notnull") {
          if (ent.targetname && ent.origin) {
            targetPositions.set(ent.targetname, {
              origin: this.parseVec3(ent.origin),
              angle: Number.parseFloat(ent.angle || "0") || 0
            });
          }
        }
      }
      let itemId = 1;
      for (const ent of bsp.entities) {
        const cn = ent.classname || "";
        const origin = this.getEntityOriginOrModelCenter(bsp, ent);
        if (cn === "info_player_deathmatch" || cn === "info_player_start") {
          this.spawns.push({
            origin,
            angle: Number.parseFloat(ent.angle || "0") || 0
          });
        } else if (cn === "trigger_push" && ent.target) {
          const dest = targetPositions.get(ent.target);
          if (dest) {
            const gravity = Cvars.variableValue("g_gravity") || 800;
            const height = Math.max(32, dest.origin[2] - origin[2]);
            const time = Math.sqrt(height / (0.5 * gravity));
            const vel = [
              (dest.origin[0] - origin[0]) / time,
              (dest.origin[1] - origin[1]) / time,
              time * gravity
            ];
            this.jumpPads.push({ origin, targetOrigin: dest.origin, velocity: vel });
          }
        } else if (cn === "trigger_teleport" && ent.target) {
          const dest = targetPositions.get(ent.target);
          if (dest) {
            this.teleporters.push({
              origin,
              destOrigin: dest.origin,
              destAngle: dest.angle
            });
          }
        } else if ((cn === "func_bobbing" || cn === "func_plat") && ent.model) {
          this.movers.push({
            model: ent.model,
            baseOrigin: [0, 0, 0],
            currentOrigin: [0, 0, 0],
            height: Number.parseFloat(ent.height || "32") || 32,
            speed: Number.parseFloat(ent.speed || "4") || 4
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
            respawnAtMs: 0
          });
        }
      }
      if (this.spawns.length === 0) {
        this.spawns.push({ origin: [0, 0, 64], angle: 0 });
      }
    }
    spawnClient(clientNum, name, modelSpec, isBot, skill = 3) {
      const ps = createDefaultPlayerState(clientNum);
      const slot = {
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
        botStrafeDir: 1
      };
      this.respawnClient(slot);
      this.clients[clientNum] = slot;
      return slot;
    }
    addBot(name, modelSpec, skill = 3) {
      const presets = [
        { name: "Sarge", model: "sarge/default" },
        { name: "Visor", model: "visor/default" },
        { name: "Major", model: "major/default" },
        { name: "Grunt", model: "grunt/default" },
        { name: "Phobos", model: "sarge/red" }
      ];
      const preset = presets[this.clients.length % presets.length];
      const botName = name || preset.name;
      const botModel = modelSpec || preset.model;
      const id = this.clients.length;
      this.spawnClient(id, botName, botModel, true, skill);
      Cmd.print(`^3Bot "${botName}"^7 entered the arena (Skill ${skill}).`);
    }
    respawnClient(client) {
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
        "sound/world/telein.wav",
        client.ps.origin,
        client.clientNum === 0 ? 0.65 : 0.45
      );
    }
    /**
     * Advances the entire Quake III Arena simulation by `dtMs`
     */
    stepArena(dtMs, localUserCmd) {
      this.timeMs += dtMs;
      for (const mv of this.movers) {
        const phase = this.timeMs * 1e-3 / Math.max(0.5, mv.speed);
        mv.currentOrigin[2] = Math.sin(phase * Math.PI * 2) * mv.height;
      }
      for (const item of this.items) {
        if (!item.active && this.timeMs >= item.respawnAtMs) {
          item.active = true;
          Sound.playSoundAtOrigin("sound/items/respawn1.wav", item.origin, 0.55);
        }
      }
      if (this.timeMs - this.lastMegaDecayMs >= 1e3) {
        this.lastMegaDecayMs = this.timeMs;
        for (const cl of this.clients) {
          if (cl.ps.pm_type === 3 /* PM_DEAD */) continue;
          if (cl.ps.health > 100) {
            cl.ps.health = Math.max(100, cl.ps.health - 1);
          }
          if ((cl.ps.powerups[5 /* PW_REGEN */] || 0) > this.timeMs && cl.ps.health < 200) {
            cl.ps.health = Math.min(200, cl.ps.health + 15);
          }
        }
      }
      for (const cl of this.clients) {
        if (cl.ps.pm_type === 3 /* PM_DEAD */) {
          if (this.timeMs >= cl.deadUntilMs) {
            this.respawnClient(cl);
          }
          continue;
        }
        const cmd = cl.isBot ? this.generateBotUserCmd(cl) : { ...localUserCmd, serverTime: this.timeMs };
        if (!cl.isBot && cmd.weapon && cl.ps.weaponsMask & 1 << cmd.weapon) {
          cl.ps.weapon = cmd.weapon;
        }
        PmoveSingle(
          cl.ps,
          cmd,
          (start, end, mins, maxs, mask) => CM.boxTrace(start, end, mins, maxs, mask),
          (pt, mask) => CM.pointContents(pt, mask),
          (snd) => Sound.playSoundAtOrigin(snd, cl.ps.origin, 0.5)
        );
        if (cl.ps.origin[2] < -780) {
          this.applyDamage(cl, null, 999, cl.ps.origin, [0, 0, 1], "VOID");
          continue;
        }
        const footCont = CM.pointContents([cl.ps.origin[0], cl.ps.origin[1], cl.ps.origin[2] - 20], CONTENTS_LAVA);
        if (footCont & CONTENTS_LAVA) {
          if (Math.floor(this.timeMs / 200) !== Math.floor((this.timeMs - dtMs) / 200)) {
            this.applyDamage(cl, null, 15, cl.ps.origin, [0, 0, 1], "LAVA");
          }
        }
        for (const jp of this.jumpPads) {
          if (Math.abs(cl.ps.origin[0] - jp.origin[0]) < 46 && Math.abs(cl.ps.origin[1] - jp.origin[1]) < 46 && Math.abs(cl.ps.origin[2] - jp.origin[2]) < 42) {
            cl.ps.velocity = vec3Clone(jp.velocity);
            cl.ps.groundEntityNum = 1023;
            Sound.playSoundAtOrigin("sound/world/jumppad.wav", jp.origin, 0.85);
          }
        }
        for (const tp of this.teleporters) {
          if (vec3Dist(cl.ps.origin, tp.origin) < 48) {
            cl.ps.origin = [tp.destOrigin[0], tp.destOrigin[1], tp.destOrigin[2] + 12];
            cl.ps.viewangles[1] = tp.destAngle;
            const fwd = [0, 0, 0];
            AngleVectors([0, tp.destAngle, 0], fwd);
            vec3Scale(fwd, 400, cl.ps.velocity);
            Sound.playSoundAtOrigin("sound/world/telein.wav", tp.destOrigin, 0.85);
          }
        }
        for (const item of this.items) {
          if (!item.active) continue;
          if (vec3Dist(cl.ps.origin, item.origin) < 42) {
            if (this.pickupItem(cl, item)) {
              item.active = false;
              item.respawnAtMs = this.timeMs + item.def.respawnSec * 1e3;
            }
          }
        }
        if (cmd.buttons & BUTTON_ATTACK) {
          this.tryFireWeapon(cl);
        }
      }
      this.stepProjectiles(dtMs * 1e-3);
      this.stepGibs(dtMs * 1e-3);
      this.beams = this.beams.filter((b) => this.timeMs - b.spawnTimeMs < b.durationMs);
    }
    pickupItem(cl, item) {
      const def = item.def;
      const ps = cl.ps;
      if (def.type === "weapon" && def.weapon) {
        ps.weaponsMask |= 1 << def.weapon;
        ps.ammo[def.weapon] = Math.min(
          def.maxLimit,
          Math.max(ps.ammo[def.weapon], def.quantity)
        );
        if (Cvars.variableIntegerValue("cg_autoswitch") && def.weapon > ps.weapon) {
          ps.weapon = def.weapon;
        }
      } else if (def.type === "ammo" && def.weapon) {
        if (ps.ammo[def.weapon] >= def.maxLimit) return false;
        ps.ammo[def.weapon] = Math.min(def.maxLimit, ps.ammo[def.weapon] + def.quantity);
      } else if (def.type === "armor") {
        if (ps.armor >= def.maxLimit) return false;
        ps.armor = Math.min(def.maxLimit, ps.armor + def.quantity);
      } else if (def.type === "health") {
        if (ps.health >= def.maxLimit) return false;
        ps.health = Math.min(def.maxLimit, ps.health + def.quantity);
      } else if (def.type === "powerup" && def.powerup) {
        ps.powerups[def.powerup] = Math.max(this.timeMs, ps.powerups[def.powerup] || 0) + def.quantity;
        if (def.powerup === 1 /* PW_QUAD */ && cl.clientNum === 0) {
          Sound.queueAnnouncement("Quad Damage");
        }
      }
      Sound.playSoundAtOrigin(def.pickupSound || "sound/misc/w_pkup.wav", item.origin, 0.7);
      if (cl.clientNum === 0) {
        this.pickupNotice = { name: def.pickupName, timeMs: this.timeMs };
      }
      return true;
    }
    tryFireWeapon(cl) {
      const ps = cl.ps;
      const spec = WEAPON_SPECS[ps.weapon];
      if (!spec) return;
      const hasHaste = (ps.powerups[3 /* PW_HASTE */] || 0) > this.timeMs;
      const fireInterval = hasHaste ? spec.fireTimeMs * 0.75 : spec.fireTimeMs;
      if (this.timeMs - cl.lastFireTimeMs < fireInterval) return;
      if (spec.startingAmmo !== -1) {
        if ((ps.ammo[ps.weapon] || 0) <= 0) {
          this.switchToBestAvailableWeapon(cl);
          return;
        }
        ps.ammo[ps.weapon]--;
      }
      cl.lastFireTimeMs = this.timeMs;
      ps.torsoAnim = ps.weapon === 1 /* WP_GAUNTLET */ ? 8 /* TORSO_ATTACK2 */ : 7 /* TORSO_ATTACK */;
      ps.torsoTimer = Math.max(150, fireInterval);
      const hasQuad = (ps.powerups[1 /* PW_QUAD */] || 0) > this.timeMs;
      const quadMult = hasQuad ? Cvars.variableValue("g_quadfactor") || 3 : 1;
      const fireSnd = ps.weapon === 2 /* WP_MACHINEGUN */ ? `sound/weapons/machinegun/machgf${(Math.random() * 4 | 0) + 1}b.wav` : spec.fireSound;
      Sound.playSoundAtOrigin(fireSnd, ps.origin, cl.clientNum === 0 ? 0.65 : 0.25);
      if (hasQuad) {
        Sound.playSoundAtOrigin("sound/items/damage3.wav", ps.origin, cl.clientNum === 0 ? 0.65 : 0.3);
      }
      const forward = [0, 0, 0];
      const right = [0, 0, 0];
      const up = [0, 0, 0];
      AngleVectors(ps.viewangles, forward, right, up);
      const muzzle = [
        ps.origin[0] + forward[0] * 14,
        ps.origin[1] + forward[1] * 14,
        ps.origin[2] + ps.viewheight - 2
      ];
      if (spec.isHitscan) {
        const range = ps.weapon === 1 /* WP_GAUNTLET */ ? 48 : ps.weapon === 6 /* WP_LIGHTNING */ ? 768 : 8192;
        let anyHitPlayer = false;
        for (let p = 0; p < spec.pellets; p++) {
          const end = [
            muzzle[0] + forward[0] * range,
            muzzle[1] + forward[1] * range,
            muzzle[2] + forward[2] * range
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
          if (ps.weapon === 7 /* WP_RAILGUN */) {
            this.beams.push({
              reType: 4 /* RT_RAIL_CORE */,
              start: vec3Clone(muzzle),
              end: vec3Clone(finalEnd),
              color: [40, 255, 110, 255],
              spawnTimeMs: this.timeMs,
              durationMs: 750,
              shader: "railCore",
              radius: 6
            });
          } else if (ps.weapon === 6 /* WP_LIGHTNING */) {
            this.beams.push({
              reType: 6 /* RT_LIGHTNING */,
              start: vec3Clone(muzzle),
              end: vec3Clone(finalEnd),
              color: [160, 215, 255, 255],
              spawnTimeMs: this.timeMs,
              durationMs: 65,
              shader: "lightningBolt",
              radius: 7
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
          } else if (worldTrace.fraction < 1 && ps.weapon !== 1 /* WP_GAUNTLET */) {
            this.renderer.addImpactMark(
              worldTrace.endpos,
              worldTrace.plane.normal,
              ps.weapon === 7 /* WP_RAILGUN */ ? 12 : 6,
              "markShadow",
              [255, 255, 255, 255],
              this.timeMs * 1e-3
            );
          }
        }
        if (ps.weapon === 7 /* WP_RAILGUN */) {
          if (anyHitPlayer) {
            cl.consecutiveRailHits++;
            if (cl.consecutiveRailHits >= 2 && cl.clientNum === 0) {
              ps.persistant.impressiveCount++;
              this.activeMedal = {
                name: "IMPRESSIVE",
                count: ps.persistant.impressiveCount,
                timeMs: this.timeMs
              };
              Sound.queueAnnouncement("Impressive");
            }
          } else {
            cl.consecutiveRailHits = 0;
          }
        }
      } else {
        const vel = [
          forward[0] * spec.projectileSpeed,
          forward[1] * spec.projectileSpeed,
          forward[2] * spec.projectileSpeed + (ps.weapon === 4 /* WP_GRENADE_LAUNCHER */ ? 160 : 0)
        ];
        this.projectiles.push({
          id: this.nextProjectileId++,
          ownerClientNum: cl.clientNum,
          weapon: ps.weapon,
          origin: muzzle,
          velocity: vel,
          spawnTimeMs: this.timeMs,
          expireTimeMs: this.timeMs + (ps.weapon === 4 /* WP_GRENADE_LAUNCHER */ ? 2500 : 8e3),
          damage: spec.damage * quadMult,
          splashDamage: spec.splashDamage * quadMult,
          splashRadius: spec.splashRadius,
          bounces: ps.weapon === 4 /* WP_GRENADE_LAUNCHER */
        });
      }
    }
    stepProjectiles(dtSec) {
      const remaining = [];
      for (const proj of this.projectiles) {
        if (this.timeMs >= proj.expireTimeMs) {
          this.explodeProjectile(proj, proj.origin, [0, 0, 1], null);
          continue;
        }
        if (proj.bounces) {
          proj.velocity[2] -= 800 * dtSec;
        }
        const nextPos = [0, 0, 0];
        vec3MA(proj.origin, dtSec, proj.velocity, nextPos);
        const playerHit = this.tracePlayersAlongSegment(proj.ownerClientNum, proj.origin, nextPos);
        if (playerHit) {
          this.explodeProjectile(proj, playerHit.hitPoint, [0, 0, 1], playerHit.target);
          continue;
        }
        const tr = CM.boxTrace(proj.origin, nextPos, [-2, -2, -2], [2, 2, 2]);
        if (tr.fraction < 1) {
          if (proj.bounces) {
            const dot = vec3Dot(proj.velocity, tr.plane.normal);
            vec3MA(proj.velocity, -2 * dot, tr.plane.normal, proj.velocity);
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
    explodeProjectile(proj, hitPos, normal, directTarget) {
      const attacker = this.clients[proj.ownerClientNum] || null;
      const spec = WEAPON_SPECS[proj.weapon];
      Sound.playSoundAtOrigin("sound/weapons/rocket/rocklx1a.wav", hitPos, 0.85);
      this.renderer.addImpactMark(
        hitPos,
        normal,
        proj.weapon === 8 /* WP_PLASMAGUN */ ? 10 : 28,
        "markShadow",
        [255, 255, 255, 255],
        this.timeMs * 1e-3
      );
      if (directTarget) {
        const dir = vec3Clone(proj.velocity);
        vec3Normalize(dir);
        this.applyDamage(directTarget, attacker, proj.damage, hitPos, dir, spec.shortName);
      }
      if (proj.splashRadius > 0 && proj.splashDamage > 0) {
        for (const cl of this.clients) {
          if (cl.ps.pm_type === 3 /* PM_DEAD */) continue;
          if (cl === directTarget) continue;
          const playerCenter = [cl.ps.origin[0], cl.ps.origin[1], cl.ps.origin[2] + 4];
          const dist = vec3Dist(hitPos, playerCenter);
          if (dist >= proj.splashRadius) continue;
          const points = proj.splashDamage * (1 - dist / proj.splashRadius);
          const dir = [0, 0, 0];
          vec3Sub(playerCenter, hitPos, dir);
          dir[2] += 24;
          vec3Normalize(dir);
          this.applyDamage(cl, attacker, points, hitPos, dir, spec.shortName, true);
        }
      }
    }
    /**
     * Applies Quake III Damage, 66% Armor Absorption, Knockback Impulse,
     * Hit Sounds, Awards ("EXCELLENT", "HUMILIATION") & Gibbing (<= -40 HP)
     */
    applyDamage(target, attacker, rawDamage, point, dir, weaponShortName, isSplash = false) {
      if (target.ps.pm_type === 3 /* PM_DEAD */) return;
      const isSelf = attacker !== null && attacker.clientNum === target.clientNum;
      const knockbackPoints = rawDamage;
      let damage = isSelf && isSplash ? Math.round(rawDamage * 0.5) : Math.round(rawDamage);
      if (damage < 1) damage = 1;
      const knockback = Math.min(200, knockbackPoints);
      const kvel = (Cvars.variableValue("g_knockback") || 1e3) * (knockback / 200);
      vec3MA(target.ps.velocity, kvel, dir, target.ps.velocity);
      if (target.ps.pm_time <= 0) {
        target.ps.pm_time = Math.max(50, Math.min(200, knockback * 2));
        target.ps.pm_flags |= PMF_TIME_KNOCKBACK;
      }
      if (attacker && attacker.clientNum === 0 && !isSelf) {
        Sound.playLocalSound("sound/feedback/hit.wav", 0.85);
        attacker.ps.persistant.hits++;
      }
      const armorSave = Math.min(Math.ceil(damage * 0.66), target.ps.armor);
      target.ps.armor -= armorSave;
      const take = damage - armorSave;
      target.ps.health -= take;
      target.ps.damageCount = Math.min(100, take);
      target.ps.damageEvent++;
      if (target.ps.health <= 0) {
        if (target.ps.health <= -40) {
          Sound.playSoundAtOrigin("sound/player/gibsplt1.wav", target.ps.origin, 0.9);
          this.spawnGibShower(target.ps.origin);
        } else {
          Sound.playSoundAtOrigin("sound/player/sarge/death1.wav", target.ps.origin, 0.8);
        }
        target.ps.pm_type = 3 /* PM_DEAD */;
        target.ps.legsAnim = 0 /* BOTH_DEATH1 */;
        target.ps.torsoAnim = 0 /* BOTH_DEATH1 */;
        target.deadUntilMs = this.timeMs + 1700;
        if (attacker && !isSelf) {
          attacker.ps.persistant.score++;
          attacker.ps.persistant.lastFragTarget = target.name;
          if (this.timeMs - attacker.lastFragTimeMs <= 2e3 && attacker.clientNum === 0) {
            attacker.ps.persistant.excellentCount++;
            this.activeMedal = {
              name: "EXCELLENT",
              count: attacker.ps.persistant.excellentCount,
              timeMs: this.timeMs
            };
            Sound.queueAnnouncement("Excellent");
          }
          if (weaponShortName === "GAUNTLET" && attacker.clientNum === 0) {
            attacker.ps.persistant.humiliationCount++;
            this.activeMedal = {
              name: "HUMILIATION",
              count: attacker.ps.persistant.humiliationCount,
              timeMs: this.timeMs
            };
            Sound.queueAnnouncement("Humiliation");
          }
          attacker.lastFragTimeMs = this.timeMs;
        } else {
          target.ps.persistant.score = Math.max(0, target.ps.persistant.score - 1);
        }
        this.killFeed.unshift({
          attacker: attacker ? attacker.name : "World",
          victim: target.name,
          weaponName: weaponShortName,
          timeMs: this.timeMs
        });
        if (this.killFeed.length > 5) this.killFeed.pop();
      }
    }
    spawnGibShower(origin) {
      for (let i = 0; i < 8; i++) {
        this.gibs.push({
          origin: [origin[0], origin[1], origin[2] + 12],
          velocity: [
            (Math.random() - 0.5) * 420,
            (Math.random() - 0.5) * 420,
            180 + Math.random() * 260
          ],
          angles: [Math.random() * 360, Math.random() * 360, 0],
          spawnTimeMs: this.timeMs,
          expireTimeMs: this.timeMs + 4e3,
          isGibModel: i < 3
        });
      }
    }
    stepGibs(dtSec) {
      this.gibs = this.gibs.filter((g) => this.timeMs < g.expireTimeMs);
      for (const g of this.gibs) {
        g.velocity[2] -= 800 * dtSec;
        const next = [0, 0, 0];
        vec3MA(g.origin, dtSec, g.velocity, next);
        const tr = CM.boxTrace(g.origin, next, [-4, -4, -4], [4, 4, 4]);
        if (tr.fraction < 1) {
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
    tracePlayersAlongSegment(ignoreClientNum, start, end) {
      let bestFrac = 1;
      let bestTarget = null;
      let bestPoint = [0, 0, 0];
      const seg = [0, 0, 0];
      vec3Sub(end, start, seg);
      const segLenSq = seg[0] * seg[0] + seg[1] * seg[1] + seg[2] * seg[2];
      if (segLenSq < 1e-4) return null;
      for (const cl of this.clients) {
        if (cl.clientNum === ignoreClientNum) continue;
        if (cl.ps.pm_type === 3 /* PM_DEAD */) continue;
        const center = [cl.ps.origin[0], cl.ps.origin[1], cl.ps.origin[2] + 4];
        const toCenter = [0, 0, 0];
        vec3Sub(center, start, toCenter);
        const t = Math.max(0, Math.min(1, vec3Dot(toCenter, seg) / segLenSq));
        const closest = [
          start[0] + seg[0] * t,
          start[1] + seg[1] * t,
          start[2] + seg[2] * t
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
    switchToBestAvailableWeapon(cl) {
      const priority = [
        5 /* WP_ROCKET_LAUNCHER */,
        7 /* WP_RAILGUN */,
        6 /* WP_LIGHTNING */,
        8 /* WP_PLASMAGUN */,
        9 /* WP_BFG */,
        3 /* WP_SHOTGUN */,
        4 /* WP_GRENADE_LAUNCHER */,
        2 /* WP_MACHINEGUN */,
        1 /* WP_GAUNTLET */
      ];
      for (const w of priority) {
        if (cl.ps.weaponsMask & 1 << w && (cl.ps.ammo[w] > 0 || cl.ps.ammo[w] === -1)) {
          cl.ps.weapon = w;
          return;
        }
      }
    }
    /**
     * Fuzzy-Logic Bot AI (Item Navigation, Target Leading, Weapon Choice & Strafe Movement)
     */
    generateBotUserCmd(bot) {
      const cmd = {
        serverTime: this.timeMs,
        angles: vec3Clone(bot.ps.viewangles),
        buttons: 0,
        weapon: bot.ps.weapon,
        forwardmove: 127,
        rightmove: 0,
        upmove: 0
      };
      let bestEnemy = null;
      let bestDist = 99999;
      for (const other of this.clients) {
        if (other.clientNum === bot.clientNum || other.ps.pm_type === 3 /* PM_DEAD */) continue;
        const d = vec3Dist(bot.ps.origin, other.ps.origin);
        if (d < bestDist) {
          bestDist = d;
          bestEnemy = other;
        }
      }
      this.switchToBestAvailableWeapon(bot);
      cmd.weapon = bot.ps.weapon;
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
      if (bestEnemy) {
        const spec = WEAPON_SPECS[bot.ps.weapon];
        const leadTime = !spec.isHitscan && spec.projectileSpeed > 0 ? bestDist / spec.projectileSpeed : 0;
        const aimPos = [
          bestEnemy.ps.origin[0] + bestEnemy.ps.velocity[0] * leadTime,
          bestEnemy.ps.origin[1] + bestEnemy.ps.velocity[1] * leadTime,
          bestEnemy.ps.origin[2] + (bot.ps.weapon === 5 /* WP_ROCKET_LAUNCHER */ ? -8 : 8)
        ];
        const delta = [0, 0, 0];
        vec3Sub(aimPos, bot.ps.origin, delta);
        const horiz = Math.hypot(delta[0], delta[1]);
        const targetYaw = Math.atan2(delta[1], delta[0]) * 180 / Math.PI;
        const targetPitch = -(Math.atan2(delta[2], horiz) * 180) / Math.PI;
        const jitter = (6 - bot.skill) * 1.4;
        cmd.angles[1] = targetYaw + (Math.random() - 0.5) * jitter;
        cmd.angles[0] = Math.max(-75, Math.min(75, targetPitch + (Math.random() - 0.5) * jitter));
        const eye = [bot.ps.origin[0], bot.ps.origin[1], bot.ps.origin[2] + 22];
        const los = CM.boxTrace(eye, bestEnemy.ps.origin);
        const inBurstWindow = (this.timeMs + bot.clientNum * 450) % 1600 < 480;
        if (this.timeMs > 2e3 && inBurstWindow && los.fraction > 0.9 && bestDist < 1100) {
          cmd.buttons |= BUTTON_ATTACK;
        }
      }
      if (bot.botTargetPoint) {
        const toGoal = [0, 0, 0];
        vec3Sub(bot.botTargetPoint, bot.ps.origin, toGoal);
        const goalYaw = Math.atan2(toGoal[1], toGoal[0]) * 180 / Math.PI;
        const diffRad = (goalYaw - cmd.angles[1]) * Math.PI / 180;
        cmd.forwardmove = Math.round(Math.cos(diffRad) * 127);
        cmd.rightmove = Math.round(Math.sin(diffRad) * 127 + bot.botStrafeDir * 55);
      }
      const fwd = [0, 0, 0];
      AngleVectors([0, cmd.angles[1], 0], fwd);
      const probeStart = [
        bot.ps.origin[0] + fwd[0] * 64,
        bot.ps.origin[1] + fwd[1] * 64,
        bot.ps.origin[2]
      ];
      const probeDown = [probeStart[0], probeStart[1], probeStart[2] - 256];
      const floorCheck = CM.boxTrace(probeStart, probeDown);
      if (floorCheck.fraction === 1) {
        cmd.forwardmove = -127;
        bot.botStrafeDir = -bot.botStrafeDir;
      }
      if (Math.random() < 0.04) {
        cmd.upmove = 127;
      }
      return cmd;
    }
    /**
     * Populates the Q3Renderer scene with all players, items, movers, projectiles,
     * beams, gibs, dynamic lights, and the 1st-person view weapon!
     */
    buildRenderScene() {
      this.renderer.clearScene();
      const timeSec = this.timeMs * 1e-3;
      for (const mv of this.movers) {
        this.renderer.addRefEntityToScene({
          reType: 0 /* RT_MODEL */,
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
          customSkin: "",
          customShader: "",
          shaderRGBA: [255, 255, 255, 255],
          shaderTexCoord: [0, 0],
          shaderTime: 0,
          radius: 0,
          rotation: 0
        });
      }
      for (const item of this.items) {
        if (!item.active) continue;
        const bob = Math.sin(timeSec * 3.5 + item.id) * 5;
        const yaw = (timeSec * 120 + item.id * 45) % 360;
        const axis = AxisClear();
        AnglesToAxis([0, yaw, 0], axis);
        const pos = [item.origin[0], item.origin[1], item.origin[2] + bob];
        this.renderer.addRefEntityToScene({
          reType: 0 /* RT_MODEL */,
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
          customSkin: "",
          customShader: "",
          shaderRGBA: [255, 255, 255, 255],
          shaderTexCoord: [0, 0],
          shaderTime: 0,
          radius: 0,
          rotation: 0
        });
        if (item.def.ringModelPath) {
          const ringAxis = AxisClear();
          AnglesToAxis([0, (360 - yaw) % 360, 0], ringAxis);
          this.renderer.addRefEntityToScene({
            reType: 0 /* RT_MODEL */,
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
            customSkin: "",
            customShader: "",
            shaderRGBA: [255, 255, 255, 255],
            shaderTexCoord: [0, 0],
            shaderTime: 0,
            radius: 0,
            rotation: 0
          });
        }
        if (item.def.type === "powerup") {
          this.renderer.addLightToScene(pos, 140, 0.25, 0.6, 1);
        }
      }
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
          muzzleFlashActive: muzzleFlash
        });
        if ((cl.ps.powerups[1 /* PW_QUAD */] || 0) > this.timeMs) {
          this.renderer.addLightToScene(cl.ps.origin, 220, 0.2, 0.55, 1);
        }
      }
      for (const proj of this.projectiles) {
        const spec = WEAPON_SPECS[proj.weapon];
        this.renderer.addRefEntityToScene({
          reType: 2 /* RT_SPRITE */,
          renderfx: 0,
          hModel: "",
          lightingOrigin: proj.origin,
          axis: AxisClear(),
          nonNormalizedAxes: false,
          origin: proj.origin,
          oldorigin: proj.origin,
          frame: 0,
          oldframe: 0,
          backlerp: 0,
          skinNum: 0,
          customSkin: "",
          customShader: "flareShader",
          shaderRGBA: [
            spec.color[0] * 255 | 0,
            spec.color[1] * 255 | 0,
            spec.color[2] * 255 | 0,
            255
          ],
          shaderTexCoord: [0, 0],
          shaderTime: 0,
          radius: proj.weapon === 9 /* WP_BFG */ ? 18 : 11,
          rotation: 0
        });
        this.renderer.addLightToScene(
          proj.origin,
          190,
          spec.color[0],
          spec.color[1],
          spec.color[2]
        );
      }
      for (const b of this.beams) {
        const ageFrac = (this.timeMs - b.spawnTimeMs) / b.durationMs;
        const alpha = Math.max(0, Math.round((1 - ageFrac) * 255));
        this.renderer.addRefEntityToScene({
          reType: b.reType,
          renderfx: 0,
          hModel: "",
          lightingOrigin: b.start,
          axis: AxisClear(),
          nonNormalizedAxes: false,
          origin: b.start,
          oldorigin: b.end,
          frame: 0,
          oldframe: 0,
          backlerp: 0,
          skinNum: 0,
          customSkin: "",
          customShader: b.shader,
          shaderRGBA: [b.color[0], b.color[1], b.color[2], alpha],
          shaderTexCoord: [0, 0],
          shaderTime: 0,
          radius: b.radius,
          rotation: 0
        });
      }
      for (const g of this.gibs) {
        const axis = AxisClear();
        AnglesToAxis(g.angles, axis);
        this.renderer.addRefEntityToScene({
          reType: g.isGibModel ? 0 /* RT_MODEL */ : 2 /* RT_SPRITE */,
          renderfx: 0,
          hModel: "models/gibs/skull.md3",
          lightingOrigin: g.origin,
          axis,
          nonNormalizedAxes: false,
          origin: g.origin,
          oldorigin: g.origin,
          frame: 0,
          oldframe: 0,
          backlerp: 0,
          skinNum: 0,
          customSkin: "",
          customShader: g.isGibModel ? "" : "flareShader",
          shaderRGBA: [220, 20, 20, 255],
          shaderTexCoord: [0, 0],
          shaderTime: 0,
          radius: 8,
          rotation: 0
        });
      }
      const local = this.clients[0];
      if (local && local.ps.pm_type !== 3 /* PM_DEAD */) {
        this.addFirstPersonViewWeapon(local, timeSec);
      }
    }
    addFirstPersonViewWeapon(local, timeSec) {
      const ps = local.ps;
      const spec = WEAPON_SPECS[ps.weapon];
      if (!spec || !spec.modelPath) return;
      const fwd = [0, 0, 0];
      const right = [0, 0, 0];
      const up = [0, 0, 0];
      AngleVectors(ps.viewangles, fwd, right, up);
      const speed = Math.hypot(ps.velocity[0], ps.velocity[1]);
      const bob = Math.sin(timeSec * 9) * Math.min(1.2, speed * 3e-3);
      const sinceFire = this.timeMs - local.lastFireTimeMs;
      const recoil = sinceFire < 140 ? -Math.sin(sinceFire / 140 * Math.PI) * 2.8 : 0;
      const eye = [ps.origin[0], ps.origin[1], ps.origin[2] + ps.viewheight];
      const gunOrigin = [eye[0], eye[1], eye[2]];
      vec3MA(gunOrigin, 12 + recoil, fwd, gunOrigin);
      vec3MA(gunOrigin, 6.5, right, gunOrigin);
      vec3MA(gunOrigin, -6.5 + bob, up, gunOrigin);
      const axis = AxisClear();
      AnglesToAxis(ps.viewangles, axis);
      const gunEnt = {
        reType: 0 /* RT_MODEL */,
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
        customSkin: "",
        customShader: "",
        shaderRGBA: [255, 255, 255, 255],
        shaderTexCoord: [0, 0],
        shaderTime: 0,
        radius: 0,
        rotation: 0
      };
      this.renderer.addRefEntityToScene(gunEnt);
      if ((ps.powerups[1 /* PW_QUAD */] || 0) > this.timeMs) {
        this.renderer.addRefEntityToScene({
          ...gunEnt,
          customShader: "models/powerups/instant/quad_shell"
        });
      }
    }
  };

  // src/qcommon/embedded_pak0.ts
  var EMBEDDED_PAK0_BASE64 = "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01Lde1WqOlUbcmdGBqygl176yUv9+/F//19++aevvPH0i9fffnrjnV8/vf72r57fX33z3efXff/z1956ft1x9/t998ob7zx/fvPd3zx/vmPv7153/B1353TMa2/98ulnr775/Lnzu36f7/c75153/L3uc2PrPO/Z2L12977v7/r33jld6z7f9fv9xnnn3fd37n3f/T3vjul8z+v+93dzep+7zv3WXN553aNzO+6ufX83vp6352yMjb2/79VxnXf3uO+6fmPou3tv7u698+5aN/Z79Yz3ffe8vzunNeu7xt9473jH1/o6v81p15Emm4uuEw04p12n6zf3jS26iLYbo898x0ejrndr1bN1v+amezVPPZ/X7O/Gu/drXM5t89Fz3n2kvfak69D89Lvz2nN0nea3+Wnv9uzSgtfo2O7vHmmvNy+OvXF6/zte2oi+Gmc8qN+b3/ZVxzqmu0/r0/jcb851149u5EldR37X2t5vjaF1fNFelq907Y5zHqON1r/vu370429d435v3eQd8oL+bk+0xo3rjvny2x+f/vrFN09/+/Lbpw8++ePTHz789Om9jz57/nzv9/fHn//l6Zsf/v183B3/4ad/evrtex89H/PVd/98+vbH/zx9/f2/nj767M/Pr865z3fM7z/45OkfX3//9MU3Pzwfe9ftt/v+7n3XvnPe//jz/4/hzrvXfd997hq/e//j5+/vGvf93fu+v3Mbe9e6cd54O+6e44657+46d++/f/Xd8zh6pu5/v99xd6/OvTH0/R135/UMjf3e+3yvO7bz7/1+u/Hdb3feXfN+u+s2L/e68+79xnXj7z53zI3pfrtz77d73XXv++bu7nHXvOPa68qte79j77rNb/PVOjbHN0c3xvut3+/cex1N3O83tjvnrnGvG8Mde2tzx9x1Wvue4f5u/Hd+tNX63DM0P3ed1ue+v3PvmVuDG0NrKw0ebd28N3fNy73u+Pv9rn3n3/XvmPuta7RHotH2RfNwY2ttpbto6MZ217j7d897b56a++avtb/r3Ocb2937rtOc3vud2/iao7t294527vv4k+/HBzqmPXjv0eaNsXW9e9x4oguf7143xo5rfu+4+7v92dr4uuu0j+78G+ud3/5237R2d15re9e8z43z5jLav+vGczq/PRJtt1fuHnf+Hd/ecm3v+q1Nz9Ex9/1dvzWOrqPd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PDV9Q/WdtmN6pn3T39rYujUc21fGj3jW1rJot+mLOl9zXu31bY8u8zutx7KPzObnL24hxis2as3C0qG+49ZNmm9kjMi9sh7bfDPntn/TBxKTV35aJ2etudiCGOjq+mSeGLDP1ocwTmsekTlP5kyog+1F4Xu3x4dxC+OA2ab23zNHdH2k7d21fR/NKRLPMC/OvFCfr0+gvWFvQ2MGxrS6x/qIrRtTz++ZOcojY6Lb53L7C24egXpg6wC3F7hxSHO0zG3Zul/xqN3X7AL1yOotfSDxu839N6awuMzmK3qekTlb7vn2WLX+JN7fWkhzpM0N2Djb1l5Y57u9obQFHLc611iAON2etaWsjp7U1e6HMnJ9DH2WxTi2bsf83HjAPgvGm81F1ocRl9DmNC9SXdyeRivbn1T5tvraemRz75TL5m1sPGp7gm2uoPdYJ2K9wJ41tGee+MzNMRR/33nry2/Onhiheltbw3oWsdP1U7ZX5wfvvff6ub/+99f7//qDt8/9/rN/9W+vX/y7/3r9yj/93+uX/v6/X7/22Wdvn9/44ovXR1/5yuvjDz748eeTDz98/eo////bvXf93X/33L/v5z2r++5z19/PX//887dnfvHpp2/X3vve+5fvv/38hb/9z7dn3c/7911/z/jw/fdfn3700dt99/Oe9fknn7y9457xy//wP693//F/336/Z/W8u/7uvevv9xv3Zx9//Pb7fXf3/fzf/Mfbz7v3nnG/3+eefe/o2hv3jfl+9ry75u65T2vQd/eMG/uN997bvfddv7d+97k5t3Y3/vvb7dG959ahNbv53PPub/eeu/6uvfffffec+9zvvu9+3nzu3vt569Oe3Zjv/hvzPeu+u+vunnvPzbc1v/ffGt710cr9vHW8T8+76++9d8/9vHW4n/e8++7GeOO/e/vcv29MN4abb+O9e24u94x7d3t/194875337vv3fe45vf/GGw3cOjamu+buiWZuPNHT/S3avffe++8Z9909537etXf/jbX3tvb3uXFGs8s7d/+t9a1dtNK6t5d37113n3tW6xDvNf7opmfcXG5s0f7Ntfuiofv9rr8xRwfxwN1/4717vf7e2fjv+XfdjTN+vX/feOK7G/+9u32LbqP7+9wcooN7/81f2uudN/8bx/28udw7otl7b3SULLpr2+/k1313n/t38sH9b+3uWcmI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L3XYT+tNaw6tcUz3znU1f9Y6UvORtJvFoTeXb/PyNt91eyZEa9vfdusDtP+N3Ykv24+xddD/7n3b20gMcHtlPtWNGAcQR7JO1T7HW2dsLzx1k/lEYlDWC9njJexTHjAmv7k/5llvT9PN291eA1svKn0Y1zYWYCzcGLf1cdaMmL+mTSGmuD067eVvz9b9fXtjavesP2j+r/jl9gWQn7Y/pFjbnhGyNXvWaVpvbK3a9kOzVtA4jblnvWP76uov6tcZAzcGEJ089RNrDcVT9tyMp5x/6zONK7qnYgpfFpe2nkW7UXpQXtiXuzVfnWdOk30EzYv/IVBLAwQUAAAACAAzf1NdWbjLQigyAAASAAEAIgAAAHRleHR1cmVzL2Jhc2Vfd2FsbC9nb3RoaWNfd2FsbC50Z2Ht3UeOZccRhWFC+xDAicZairzoTRt6ypuxdl7SecBH/AiUVtBFolDVz9ybNzPMiRORke+997P3/Pef//3//vs//8Uvn15+Xn5eft7tny+//fvTF9/87enj1z8+vfruH0+fvv3z49/7vfd+/eHrx+sfvfrh8frvPvnq6VcfvHq8v/f2vbc//vvx/j73x8+/ffr8678+ffjl94+/f/PRm8d1Pvjiu8e/9/vND//66f773q71+0+/fnx2n9k19/uTN396vL/P7567zz63n/1799iY/vDZN49x7b77zN777Ku//DT+vb+/3WfXdf99du+5xm8/fvv47v7tmXeN/ey9jWXvvf7+n4/P7Xr798a+33vNOPasnmWfMx973/33DHtvn9/1ze/+vWvt/vvMXvferrHX975122v7e6/tPr67Z944du19d+Pu/a39nm/X8Oy75767Odj1Np59d9fY/O0a+/w+s+9sXnatfYYc7DXztGvutV2363/Ht/d2fZ/d3Oy59/o+u3Hs9X1+77k+mduzbMz7976zf++6+/d+ttYbn/ubc+u4eTCHu471IkP77q5rDcj0fu861ntj3d/e22fdf3+7/97f98zvxrPf+z4dpGvm0Wf2997bePbefjZ3e5aNfe8bqznaz8bj/nvPGK3j7rUxWsfK+v7emHad/b05J+d7DjpMZ/Yda7Ox+tv99773dg/z6jedI0t7LutDFjrPnn332Wv7zJ6DDLBHXf99fmMlb7s+nXKf6gjdtq5kfj+7dj9vfc3Rvr97uv8+w16xAfss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fOVzkONBwRsF8yz/a8tpCxYM33HPPel73LKPftTYPOnDp59u/N7u+CuumHbKDTd0n/HDH8788q9+NfvCP/5Rf8698o475l993307fufhhxfc+PjjC29+6qlFtz777KLbnn9+0e0vvLD4By++6DO/x3X3lVNePfXRQQ9d9LWjPe1qHx/4yecg+MMnfot/sOngcw/ZdtasYXN23dXcy962PuCEEyYddsYZkz9x0UXGafY549xf/ILdsuV5V91774IbHn104S3PPLPo1ueeW3DjE0/seP0jj8y/5v7753377rv16dzL//OfOd/697/T9uPTd9fdV0559dRHBz10ldeO9rSrfXzgB1/4wyd+8Y3/ZuuwFdExaPBgNjS0e9EisZn5dsJ+xx7buXzNmslHXXghvZu3Z57361/v8I2//U2/6SN2vPCmJ5+cf92DD85de+edcy79xz9mX/znP8/66u9/z35nnP2zn03/4o9+xI5z7q/+47vr7iunvHrqo4MeuujnsxDtaVf7+MjnIPjCHz7xi2/8k4M8zdZpq2DAlsOHy8lsNXuXXdjSuGWrVk085LOf5Z+bg9ld9nuMy8Zo/cJGd/zOQw/NveK//zWHzzz/t7+dfvZPf8qvM15vf+LVVxuzpxx76aVTjvn61/XV5KO+9rX0/33Gd9fdV075nE+iPjrooYu+drSXz1m0jw/85HgQ/OETv/jGPznIQ65m67a/Y+Cw0aOHTJ49m18t/hafT1px2mn8cP0x45yf/1w/zLvqnnvM1f6N1+yUzU4/6yc/6fr8TTexR32pf7c5/Oyz2WXGcwedeCIffsJ+n/pUxv7r/n133f1GvLhmjXrqo5PzTNBFXzva027FA37whT984hffaJODPOQiX7N13F+Rc33E1OJr+RfzqXicTRljZ13whz+wvwXfe+wx9kf/aXtf+c1vjOHbn3zddfqK/dH91h846ST6Z4dj9lyxIvM57zrgAHHbyLfvs8+It+21V+b+4tN3191v5ItWrFBPfXTQQxd97WhPuzkGeQ74CMEX/vCZc0LwjX9ykIdc5Cs+wStBJ1tuP3++OXPse1aunHjwySeLu7c/6ZprjL87XPLXv86/9oEHzL98M36YMTn7PcZqcZm8jXpyeWOXHnbYqF0POmjETnvvLadrDBafaYMdDt5mxgx53cz/+4zvrruf+eIor5766KCHLvra0Z528zkIPvCDL/zhE7/4xj851CMX+bRRnoE+9PX9smX8Z+Ov+XjaKd/9Ll+MbtOfv/npp/ld/G++Wtp7zNnpe2cMtmrV6N0OPpg9y+HLywzeduZMOTr5Wus5YrKOgYMGvSJPE99ddz/Xi+STo576mWcKeuiir52MPaNd7eMDP/jCHz7xm89o8E8O8pCLfOQsz0ADOd/HmNiw+3V9H7YlD8euxGQZk1f65GfFPLzdcZddZn42X/fG3jG+Dp2x0076bNCYSZMGDB0xYrMBm2++SQxGfXTQQxd97fTmIKJ9fOAHX/jre16fegr/5CAPufqegZ4ectfZH+APG3PpM8f8dX3f9fnvf1/+bd6377pLToa/LdbK8fTka6/lr8u/Wa9hj9nvMWbzsQcOHzs27ftNALroa6eRg1y6VPv4wA++8JfzVfCLb/yTgzzk6nsGVq5MfyDkr2NcIB6mR34x38j8mGN+2Emj7+++u5pLxeHi86knrF2b/lSMveZjPps1OfO3fnnLcu/WIDwH0a728YEffDX81bVr8YvvymchD7lyHDAXhLzkJj891C0/ICfCx+Jr84/5SDnfx1iZdq/vw682p/Klja/m2yqe4pulLz164sQ3y95fC9rVfsYswU9vvBp84hff+CdH4xm4666cC0JO8pJbHXqgj2bI0Azwe+TF5Eboi83wk/lK5ktjZtp96E5ORcwlHjfOjtrl/e9v5FO6u3N+7wfAB37whb+cD4JffOM/nwHjQMiV/kDISV5yk58e6KMO/iD/Wl6c/8OPFleLk82Z/CY+k3kzx/ywn0bfr15tzVV8zv/il/e38RI/+MIfPvGLb/znOBDyZN4w5CMneclNfnpIfzD00u5rRsY5ayPy43Kk8mT0I17mM/vnO5k/jaHsKPv+7e99L5+LH95v19iDL/zhE7+NZ2DNmpwLQh5y9coY8ubzHfLTA33QSzvPA9bFrY0a76yRyKfJlcqXGR/FzX22sXZtzvcxlqbdZ993djZbhg0BPvMZCL7xTw7y9I1xTz9NXnKTnx7og17opy33D4Rt2BthfVz8yy6Mf/LlcqaVjyx+FkNVc6P51Jiadt9CyHEg+E5/oPJxQi7yVbENuclPD/RBL/RDT/12jHudsDeKTcib8HvFQHwjayby5nKn6e9FDkUcLZaqfGPzasvpw/MefPfGOCEPuchHztxfEHKTnx7og17oh55yL1nboKMjbT/2SMmZ5XgY62lpC9bxYu0kx/3IoeacH7kU8bSYil/d33y9DUUjx9HdTQ7ykIt85Mx5IOQmPz3QB73QDz3lGNAme0pz3o8ceto+O4j9MunzxdpZtX4rLpZHl0vNOT9yKuLq/hLjvV7gnxzkIRf5yEneav2YHuiDXuiHnuirXfwA46A8l/nNfrnK9nPvRiV/rKNZS5FPl1OVV5NbaTbvbwTIQR5ykY+c5O19/kMPvWNA6Iee6CvnvRZHxvue//CF7Ze1nyLn/YiFcv8M2491dGupfePf0qVyq83K673RIAd5yFXNf+Qld44BoQf6SD8g9ENP9JXjX4vnA6yjOishvs35L/ZW2TuZ66Tm/dhHwxasi1RjX/o/8vltBPL0+r/mwJCX3ORPPyD0QS/0Q0/0RW/012zeNwUNvy+e+8iF2Dcv3uX/yoHIh9lLZT60p0IeLG0/1kNazt9/LYQ85GqMAZH3DHnJTX56oA96oR96oi9lG35ga8LY5bxc5ntib10+85EH4/tW8a/9dHKk1sPMj2LmdrP9CjkGhHzkJC+5yV/lP+iFfuiJvjIfFPpr1TnAega/x7k5Y5o8h7UP++hzzhP7Rjws/2Vvlf019li0y7z/cqQfEPKRk7zkJj890Ae90E/mg8wBobf0g1t0XShz/fz+ODvp/JwzVM7RGOvspxcDpc8bayDiY3usWi3Pt7EgHznJm2tfYiGxYOgj54DQDz3RF73RX2uuCXR08HntdXN+1np3+v1invB3nKmQDzcG2l9rj6WYt9Xj/dcC+TIXEvKSO+eA0AN90Av90BN90Rv90WOr5YK8N0P84vw8f9c6l7OUjfX9555Lvz/OVoh35MftszU2bvJ+vf6OkC/ngJCX3OSnB/qgF/qhJ/rKeCj0R4+N95C0DuyhFe/Ifdvv5iy187RyHc7VWQ9PXzfyYen3R460HfIdGwJykpfc5M+YKPRBL/RDT/RFb/SX8XDos9l8bwzS9xP3xx43+yDMc/a/OVdr7SPjvsiBWPdy1sI6SavHuhuKzImEvOQmPz1kHBh6oR96oi96o7/MA7SYD2gNPP0cOd+IddP3E/fH2erM+YWfK9fRys/468UrxsbQA33QC/1kHiD0RW+ZC06/uDX2PlTgs+YYF+/TsfZt32vGOc7KyXXFOdv0/SIf7syV8xCtGuduLDIvEvKSO9cDQg/00Tg7EushoSf6ojf6o8dWiwG8S03+yppXxrnxbhW+bbUH0hqodZBGniNy3bEPvl3j/peDnOTNNZGQnx7oo9r7mjFA6CvzIqG/zAOGPpvN98ZA3tKexsxzRCyTPm68YyXzfvGuhcxzxZ4H526tjTp/13Y53/VBLjjkJTf56YE+6CXzgKEn+mrEgJEXCz22Wh5YrruK/TPGifXtzPvGu1a8byPXfGI/TMZ+8n4Z49YHmRuRBxQDhh5yLSj0kvqRB7YfQGxc5QCsibQQ7HvJ/q9iXPKFXN63k/Lp/yr2T/m6u5vN81uJdtdPsf9XR7vbf5n/XwU1mP+L/79+1MH/L/H/+lGH+L/k/9aPOuT/Sv5//ahD/r+s/60fdVj/K+v/60FN1v/L/p//j7rs/4Gy/++VqM/+v7L/9+Wo2/7fsv//pajb/n8o53/WoYbnf6Cc/2ugruf/yvnfep//hXL+v77n/6G8/6Pe7/8o7/+p9/t/oLz/q87v/wqU9//V+v1/UN7/WeP3f65Def9vfd//C+X93/V+/zeU9//X9/3/Fcrvf9T39z+g/P5PvX//B8rvf9X3978qlN//q+/v/1Uov/9ZUH7/t6D8/ndB+gNhh/zi3ngqdC9PJlcqX27NJNcN1/32Pv3bR2Mvlf105mHrafrKfgrzs3jc+Gu+trfOudvqt//9++66+8opr5766KCHLvra0V61fptnGoMffOEPn/jFdxWvkodcZb5/bfCH+djGYLkRdihHyv7YlJwKPyttzx6S2D/D/vjb7E8/GJONv85W6A9jtb1V+tKcbT7mr+vf/IzvrruvnPLqqY8Oeuiin3m8aC/3L0X7OQbxS4Mv/OETv/jGfyNf1dVVZz9/YyEelhORFzNnyo9bI2GX+oo9GmPzOYhYi9/F5zL/Zr/EfnpnKtipOJzN8sWcs+Wric+N4b3/8d1195VTXj310UEPXfS1oz3taj/H+uAHX/jDJ37xjX9y1DG+fyOQPkHkxa2NsCX+s/mU722/TI7LYXf2TvK/+WH20We8EDbqTJVzdXwz47V+E5N514L3bSjv03fX3Vcu1+ejnvo5t+vzoKu8drSX9q7fg4+MQYIv/OETv/guc/2mQ0zGhqyNWh/vjb3FYLFfzhhuzM7xOuyY/TpHY1zWp8Zo52qdrTZXy8mwY+9a8b4dn/k9rmeuIcopr5766KCHLvra0Z52td+IPdflIII/fOK3Dms5byWsi9sb0ci9LVlC3+zNfln5N/vmxWXmYGeo2KezlM7Tyr+xW3O4/vSOlbT96j++u+6+csqrpz466KGLvna0p13tN3JPS5bgC3/tvH7fdMi9x94oes68TPjV4jbzrTVXPnw+C3F+TtzND3eW2jitD+XhvFuFX2fezrnfZ3x33f3s6yivnvrooJd9HvS1oz3tah8f2e/2bPXXvQlth46OHA8iRyemdlZCfG3udW7O2UnnZ43NjXhu9Wp5G/E4/1yfpu+/7t93191XTvmMF6M+Ouihi752tKdd7TfsvX32arYazLOZrzUmxHk5a3LsUm7H+flGPmf5cmO19+lYr5HL068Z//v0Pa67r5zymS+K+uighy762tFemd/7H/JZCJ+b/yWvy0Yznxv2Kocvp8t+xWaZ++v97+lx3X3llFdPfXTQQ7f0eSuho8N7M3I9xzMR+zL1o3epsWE5mcz/x6fvrruvnPLqNd67Ucb2goKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoL+gf8BUEsDBBQAAAAIADN/U13o0Gsg6B4AABIAAQAdAAAAdGV4dHVyZXMvc2Z4L2p1bXBwYWRfZ2xvdy50Z2HtXWewZFXVZSLzJmcm5wGGNAw55wwDQ85hYMg5pyEPIEmSYAAVRQVBECNimQiWiGKZMJSUlhiqwLLUKq2y/OO31jp773vu7e4ZP4WZ9+hz9NTQfc+93e+tvddae5/b/dZaq/9aPq7H/2bNiodllFFGGWWUUUYZZZRRRhlllFFGGWWUUUYZZZRRRhlllNHrR79++D9m//5r9RswYK3+nAMHrnpiHdfrPJzP65TRB4Zh7TgPGDSo34DBg/sNXHvtfgOHDOk3iLOnZ9UT67ie5+F8XqeKC1y/xEPvGYF3hrXjPHjo0H6Dhw3rt/bw4f01R4zoP4Rz5MjOE8e5Dut5ns7ndSIuLCbwelU8lLFaBzmZv3vm90Bi7ng71oZxz6hR/XtGj+4/dMyYNMeO7T9s7NgBw8aN6zR5XOv8HJ7P6/B6uG7EBF9PHOH8wFgovPCODuX6wIEpzyvMa3gbzgnP8eMHDJ8wQXPExIkDRqyzjubISZM6Tl/D9X4ur8PY8LjI4yGPBfECdKJwwts7HHdxe+J18bkwT/ktvIcb3oHx5MkDR02Zojl66tSBo6dN0xzDOX1667Tjmlhv5/I6ERuKCY8H4wfFAnnBdALvs8TB2zBacLdc9zx3zJmrI4m54U3sHOOxM2YMHDtz5qBxs2alOXu25vg5c1qmH7O1PE/nR2ykmEjx4BwxfjzfR/BCjRNKHPxXQ/pO3MHzjjt9meGect3znJhbbo/JsXaM584dNGHevEET5s8fNHH+/MET1103zfXWG7xONvnYjnGd1vM8nh+xYTHB1+Hr4XUVC84LeRzg/VZx4LpQ/MEqB+tu6ju9di3fqeme65MmpTzPMTe8DWthKWzXX3/wpAULBk/aYIPBkzk33LCaG21Uzfx5rON6nsfzFR+Ii4iJFA/1WCAvUCPw/vA+5RVqfDBkCH8u/XxltI7IeXK96XvkewN3cjF4WXnumDO3A2/DecpGG609ZeON1566ySZpLly49rRNN63PRYtanuM6Pwfn8zq6Hq9r8ZA4wmOBvECdaBcHrgvwB/i5Kk0oXBCD+shaznPefF3i+Rx36rnnOnndMJ8ETJTbGd6O7fTNNhsyY/PN09xiiyEzObfcsvPEca6zc3h+xIjHg/iC/GCxQF7g+wlOwPv0OOD7py6YT6y4ADVj8QX4QMKAAaHzkfPgetP34Pkcd8918jPyMmFuue14O86zttpqyKyttx4ye5tthszedtueOZzbbdd5brst12k9z+P5ERceD8YRigXyAnXCOCGPA9cF8weuCeohhC/oVj3I+J71nPyd5by4Hr5OPt553nE3fie3e54H5oY3sOsR1sBz7vbb98zdYYeeeTvu2DNvp5005++8s8+h2X9r+hqu53k8n9eJmLB4qMXCJptII0wfqjiALsgfuE/MuYC+INODruopO/YZ31PnVctZzoNDBzHnpe+e721wZ1465oG3YS18d9ll6Lq77jp0vd12G7re7rtrrr/HHh2nr+F6nofzIy54XYuHKha22KJ9HLgu4P3nmiAuMF/geoDfQ9fEAH1PTeszvqfOR86D6+Gv5OOd5w33KtfJ68zzCvMKb8d5zz2HLdhrr2EL9t572Aac++yjueG++7ZMP8Z1XI/zeH7EhceDxwJeV1rB9+Gc4HHguqC6AT6RmhBcQF9geoCfv+4J3sUxkGPvWs9+vDwe+d50PnI++Trpe+R7wl38zlwET5PDc8yFt7AmrvvtN2yj/fcfttEBBwzfmHPx4jQPPHD4Jtnk4zh2wAFcr/N4Pq+jmGA85LFAXjBOyOIg+ED+wDTBuMB9gfQAP7f2G8ITvJtjoB32SesHjgL2qJ0GjXWd95w3rp++aJE8uXg+x525Dp7OMWceB97AktguPOig4QuXLBm+6cEHD9/0kEM4R2x66KGai+xfTD+mdVzP8xQbixdX8dCIBb6+OCHFQeIDvE+8X77vxAXUhAUL+HPp58PPmWrF5AnUP2zGwLtKC0zvM+zd54XW0+NNmDtXfTjoZ0vOS98z3KnPgTv5nHlOzJnPxDthLXwXHXbYiM0OP3zEZkccMWLzI4+s5lFHVTN7nuu4nufhfMUEr8fr4vqKBfECXjc4IYsD6QL8QZML6Avw8/HnTN7QPYH7wiwG3k1+IPd6tbzPsYfW0+OR76cm7KXzyKXE9fDizvM57sjJlOc55oY3sdziqKNGbnH00SO3POaYkVsee+zIrTiPOy7N44+vpj+H41zH9TiP56eYSPFQjwXyAjghjwO8P/lFvt/gAvcFrgeMAXqCegwED9Q8YR8fqu9Z45nXo97XsDefJ+zN45Hv5euh8/T0kfPQ3QXwc8J9v/0Cd/C18jwwN7yFNbDd+oQTRm5z4omjtjnpJM1tly5N8+STq2nP2Rqu13mKjRQPvG4VC+SFPA4SH/D96X0GF6BWkC/I9QDeMGKAvjCPgcwTqjbsw/0B9LfU21F9zxoveb2k93ne0+c59hnfS+fh6SPnqe/EHTxfw528jjx3zLcGZo43sd3ulFNGbbds2ajtTz2Vc/QOp53Wafoared5PD/iIYsFagZftxYHpgt4n8EFqhUaehAxQF+Y84B5QtUFrA3ZH+CeQR/sE4bX7+lRb0f1PWs883o1zm9in/G9dN5znlxPP7dkSZXvjju4G/law9yx3vH000fveMYZo3c688zRO5111uidzz674+RxruN6nucxkceCeAGvF3FgfEDPKH+QNEG1I96/64G8YUsM5FrgdQFrQ/YH0CPC769P1gQ1v4e+Hns7qu/N59PrrQR753vpvDy957zpO3i4hju5u4Y58U5Yj9n5nHPG7HLuuWN2Pe+8Mbuef/6YXS+4YMxubSaf13Gs43qcFzHB69ViYenSehxAF9wf4H0mj4j3TV/gerDSGLC6QLUh+wPoEeH3VveDfWRgjzM0P7w++nrs7ai+N58vr7cq7E3nI+fBudJ38rzle+COfGXuEvPAm9heeOGY3S+6aOzuF188do9LLtHc89JLW6Yfwzqu13mKiRQPKRZwfbxOxIHzAd6P/IFrgrgAvkB6sKoYsLoAv5fUH0CPiH3Cmh+EF+gLe8fife7nZJoffg99PfZ2VN+bz5fXa4e9az2xp87nOX/88aOo7+TjGu7M8wrzwHvPyy4bu9fll4/d64orxu195ZVpXnXVuH2yycd2jOu0nud5PHgs4Pp8nVocSBfgD+gVcy5gnRAxAE/QNgboCVNtmPoD6BGxT+h+0L0Afp/p/oFergPG+2n/nrzvmu9eH3099EK8vpfPl9drhz21Psfect64PvG85ztwJ4czzwNzw5v47rt8+bh9r7lm3H6c1147br/rruMcv3/6N00+j+Ncx/WKC4sHi4XECx4H4AO+PnUh1wRyQS0G4AnaxgA9IeqC6A+gR8Q+odUE4QW4X9QXdCD8fivvay8nvD76elHfo8ajz5fXyzkf2NPf01uxhg/sLefpzaDLiecz3Jm3OebAlBiP3//668cfcMMN4w+48cbxi2+6afziFStaJ57nca7jesUGYsJigdfV9T0OxAfQBfmDigsqPUjeUPVBxEDSguQJURewNrT+gPqEXhN01IFeXA8o9+H3ec+W/H6d97WXk2s+ezuq71HjwSfX9T7DnjUX+X47xx5ejDlPXSbPW76nXL/6auavMCeOi4k3sD3w5psnHHTLLRMOuvXWCUve8540b7utmvYcj2Md16eY8HhALJAXeH3GgfOBdMG54Iwzki9ADEgPshioaQFjAHUBa0P1B7baqu4FGjqgmhD1AO8lYz3QGzlAuZ97vszvq9bLeN80X3099nZU36PGg1+u6X0De/E9dFd+nj6dOU/fRp5Xvue4r1gxQZgTb+B78O23TzjkjjsmHnLnnRMPveuuNN/73mraczjOdVrP83i+x0ItDsAH0oVLL01cgPcTvoB60IiBmh/Yd1/VhuoPoEeUe4GaDmT1AO8lq3nBXsYBnvuq9TPP537faz3xfkPz2dtRfY8aTz4/0/sm9uR76O/YPeDtPOfF8xnuzHPmsjA3vA+7++6Jh91zz8TD77134uH33bfOEZz331/N++7j8zrOdVyP83h+igVyA3jB4kB+ga8bXECP6HrQiIGaH1iyRLWh+gPoEeVegHtG0gGrCb0eqHnBXsgBnXLfPR/v25Hfz3k/13z4PfZ2UDerxsu9Xlvsk85XOQ+thnYr3w135flhyOvDgaVjfeQDD6xz1IMPah79/ven+YEPxH/7Ma7Dep6n83mdPA7EB/AKeN2KC8wXtIuBmidEbaj+AHpE5gflBbhnlOuA6oHcC/ZiDmjqfkvuw/Pxvh35fav1nPfZzw+/h94O6mfVeLnXa4s9dJjeLnIePB24I3eRxxXmCedJx3zwg5OO/dCHJh370EOTjnv44ZbJ53kc6xQXPM9jQbyA63oc4PUqLoBHxPtpFwN1T4jaED+fekTmB7VfYDoQNSE5gPcR0Qu2cEAv8wGoR/V5PPb43fMr96n79dzP/X7O++rnO++zt8P6njWeeT3pfSfsI+eh7dRx5KtwPwq4IacT5sT7wx+edPxHPjL5+I9+dPIJjzwy+YSPfWzyidnkYz6P41yn9TxPsUBu8DgAH+B1+Hp8XfnETjFAP+CekLUhfi71iEwHtF9Q04GsHmjhAPcBXgtgb6A39AO0v2f1vvX4U+7T85vuZ7kfns/9PvfxGryv3g7re9Z48vnnny+9r2EPX+7YR86D54983/sS7sxz5DQxJ67E+KRHH5180ic+MXnpJz85ZemnPqV5sv2Lyed1nOsUE488oljgdXA9xQGuL5+A15M3iBi48cZ6DMAP4H2nugC1oXqFuRdwHcjrgcwLBge4D/BawPYG2A/QHvEa7gnGHg96fVHvNzx/6H673Ifftzo/5/2k+ajvWePJ58PrUe9reX/bbc73Keep6+B55m3g/vGPE9OE9eOPTznl05+esuyJJ6Yse/LJ1onneZzrGA+MBZ4fcfDQQ0kX8DrkAtcDvI86D8AP4P2mugC1IfsD9AI1HfC+AOqBNhxQ+YBGLYDfr+4TUE/Q9obW1Kj1e3yPh70+q/dzz68+n+u+537u+VjrHXec+vnifdd81PeosZLPh9fLOD9h73z/4IPieui4OJ64LQXuJz/2WML8ySennvqZz0w97emnp57+2c+m+cwz1bTneBzrFA+Khcce43V0PWoDfQI1IWIAelDjAcQAPaHqAtSG7A/QC+DnkQ5wvwA/p/YNa14QHIDfS+UDmrVA6geknqDtDa3pflBwf+77bI+HvT58PibV+5Xn172aLbmfeT71dZ33XfNR36PWSj4fXi/j/Ap78D00WzkP/la+O+6nPfWUsD3jc5+bdubnPz/tzC98YdpZX/zitLO+9KVq4jGfx3GuS7Hw1FMRB+ID6AK5gN6AepDxQGgBPaHqguXL1R+gF8DPIR3gfgF+vroXbHJAoxZQPyD1BJMPZE8w84FrUgP4nSvG/cn3Ofeb71Ovb+FC+T7V+8nzR5+vmfvu+eT3m7yP+p41nnw+vF5b7KnxlvPg8qmnOu7AnPie/eUvTzv72WennfOVr0w/97nnpp/71a9W87nn+LyOcx3W8zydj+tIG8gF1AS8TtsYoCdUXXDTTeoP5DrA/YKoB+gFGxzgfUHWAvg9pX4AfeDChfw9hg9UP8h6wq4B/C6a1T7c91vN35b7M98XfV7U+7x/Vr2ehu5H7ld+P+d91fes8eTz4fWC83Psod3KefC48t1wF+bA+byvfW36+V//+vQLvvGN6Rd885szMPmvHvN5Hse6FAs4D+eLD3A9cQGuX4+BpAXyhKoLUBs2dcDqAe0btnBA6g2nnpD1A7wv7D5Q+wLtNMB6AawDVve9ot7zafH91T5Pjftz36c+r9X79PzokYbu57lvfl89XeN9aT5rPPl8eD3qvTjfsD8V2EfOg9cdd2BLrGdc+K1vzbjohRdmXPTiizMu5nzpJf3Lx3yexxkPjAWPA1zHuYDXr2KAWvDww/KEqgsyLyAdIAekeqCFA+QDUi1Q9QPYF859YKYBti8UvQCrA3R/yJroBVH7tc/r/V7b5wvfn9X8Te4P32f1Pu6rC8+f636e++zpMved91njwY/L61HvxfkJe2k8clccz3wW7s8/L5wv+fa3Z176ne/MvPTll2dexvnd7+pfPsbzPK51WC9eEB9AG8QFFgPiAWoB/AA9oeoC1IahA+wPoVdsHKB9w5oP8Fog6wfUfGBTA6wXEHVA2hdUP1i9oDXgAaLf79pf9XzSPl/l+1PNvxLuj3ofvZ7w/En3W3MffT30YqT5rPHgy+X1qPfi/Ax75rzy/cUXZwp34v3KKzMv/973Zl3x/e/PuvLVV2PiMZ/Xca5jHJATcH7ighQD4gFpAfwAPSFeX7WhvMADD6hP2MIB5gOiFkBPiBqgfsBKNKBZB3BfsNkLCg+wOnuBdm9n9Pxc+9Hvd+1Xz8f2+aj94fttj68t96d6X/ftuOfPdR99+Cr3jfdZ48Gfy+tR78HVNeyRy8p35HnC/Ac/mHXVD3846+of/Wj21T/+8ezlmPiXj/U8jzMWyAvkA3FBFgPSAvgBekK8rmpD6gDeT8UBTR9gtQDvI7J+QHsNYB2QNCDtCbgHWLSo6gXRA9i9IbEfwHuDVuNnhqLn63V/s+fXSfut14/PVMn3a3+3PffL97HXg/13ef7QfeY+PJ/nfo334fWo9+DsGvaXv/KKchz4zl7+k5/Mvua112Zf+7Ofzb725z+vJh7zeRxPcfDqqzyvFgO4rvwAPWGuA8EB8IJ4f3yfqgdVC1hfsJMGqCfsdYDtCXBvuJMHaPYCvQ+wOnvBq/J+1vOr+v3Y5821H5+ro+bpcznu+9EjTX3+dtyPPh/3cLmPhz0Z6b57PuY+6/vgfXg96j05P7BHTjPfr/npT4n1nOt/+cs51//qV3NueP31mHyM5xULWCc+wHkRA7ie/AA9YeiAcYB7QfoAvD/tG3LvmH3BdhqgfYGsDog9gaYHwL5wbT+AvcBe4AF1f2/W82ffZ2XeL/r9rv3Y66lp/7Jlof3u+73fE9zvvo+eH/Ue+vNJ9y33Wd8z98X7zz8vvSfnM++FPXL7ul/8Ys4NwPnGX/967k2/+c3cFb/9bUw85vM8znVcn2IAPEAtoB+gJ8T1U02QcYB8QKoHVQtkPlA9wegHeR3gHmDZsroHsHsDtC/svcCVeUDvA9lewOq6P7it97eef63v4z3fyvtpry96fo26r6b9me/nfTvs8+bcL8//+OPq6VL3LfdV44n3X35Zek/OZ94L+9dfF+43v/HG3Ft+//t5t/7hD/Nu/eMf+S8f63nGAdalGAAPUAvoB3A96UCNA+gD0CtWPfjoozUNwPvVfUR5HVDzAFkdyD2h6AXWPaB6wbwvpNYHyvYC1kQNkN/ro8/zVX2/Fu/P79sJ/L3n28n7cZ/PtZ/4J+2vfD/6PdifTzWfc//TT6d679lnQ/eV+4n3pffkfOR1wv53vxPmt7355rzb33pr3u1/+pP+5WM8z+MpBsAD1AL6AeoArqfa0H0A+4SsB1kLuAaoFkw9wagD6AG0N5j1grgvuFIPiF5w9IE61ACxF7QG7gn6j2u/pvdv4p96vp29H/q9rPuo/d7vc+3nHi5rPvk+9O2d+9HDSbqPGk+5/9pr0ntyPvI7Yf/WW/Pv+POf59/5l7/Mv+uvf9W/eMznUwy88Ya0gH6AOoDrqDaUD3jhhdAAvG7SgCee0N5xeADvB9IDsA5kP7iTB/RecAP/lhqgF9WAbfG32k+f6+mAv/X99H0L7fBnz1d7fd7vt7ofv0fdr8e6T/2+Vu1XzYcebvJ9xv3Uffh6ejvlPjkfeS7s7/rb39a9++9/X/eef/yD//JxioE335QWkANwHs+XD3ANkA9Er1i1YMMDqCfsdWCO/4oV2g/Az5X2BNvjr++gyPqA7fHPa8BeiH+7vn+OP2s/4d+m9nP8Y7/HvX9W9xP/mvd75plU85vvp/ajn0ffpvpe3A/dh8eT3oPrme/C/t5//nO9+//1L/6rGMDz0gL6AayXD6AGsD8gH5g8QNQB7AXg9eseMOsDcD/AaoBqP6iJv9WA3Asi/qoBO+Hf7AH0Zvyr3k/s+Tr+sefXGf967ef4W7+f+PO+nQb+yfu99JL7fvV2aviD+6H35HzmPbFf/8F//1sxgMd8Xn6AGpDjj+t4HaD9gnb44/1U+FsNkOFf1YArwT96AL4P0OgB9Sn8S/53Zf4X/e9S/S/+v/v8f6n/u7P+L/2/ru7/lf5/d/f/y/5fl+//lf3/rt7/L/f/dPf9Pxzl/r8uvv+v3P/b9ff/lvv/u/v+//L5n+7+/A9H+fxfF3/+r3z+t+s//1s+/9/dn//nKN//0b3f/8FRvv+nu7//p3z/V3d//xdH+f6/7v3+P47y/Z/d/f2fHOX7f7v3+385yvd/d/f3f3OU7//v3u//5yh//6O7//4HR/n7P9379384yt//6u6//8VR/v5f9/79Px/l739279//5Ch//7e7//4vR/n739379799aH/QvAD+rn36vKD7Qa8JmjxAT4i6gLWh+gPoEZkeaL9AXGC+oBYH5APwsPyBxQI9GfPV40ExYX/rP/72P6c9Z2sS3szzDHPqO6/v+R64Q+e5j8ecZz/f+Z69HdX3qPHo8+X1mnmfvH74PX2eL9P8Nb2/93YMegHsVbofTPcJ5DGQa4HVBdEfQI8o14PgAviC0ASLA/pt9wcRC+AFjwd6RsUEuFuT2Pr054h1wlufy2ENH5ibvvN1AvfE9dJ5z3nje/X18P69vpfPp9ercX6Ofe73+qDmdxzQrpof9JqgGQNWF7A2tP5ATQ+4ZxRcQF+QxQF5lx6R/qAWC+AFjwfpBLCMSWx9Zs9zneGd8jzHnPpuPJ/jzvcTOd/g+6jvzefT6zWwD69f83t9UPM7DveDVQxUPGCekHUBaqDUH1iwQH1C1wPuGTGXxAVZHOCeqSoO6A9YKyAnFQvkBfpFxgO8GfmaWDIu+B0UnIwP+28/pnVcz/N4vvIcmPO6vD5fJ/I9w1067zmf8z36euztqL43n4+fV3qf571jv7o/y7O6RtQEeQwkT6i6ALVP6g+gR8Q+oXxhGy6gL6jFgekCdTePBXyWKvGCx4PFhCZ5Ipt8HMeItePNPG9gztfh65HnDffE9dT5Rs6L7+nz0Ndjb0f1vft80/sm9n3R6/+nI48B94SqC1gbsj+AHhH7hO4LgwvMG7ovsDgQH1AXcM+0agVxQhULqh0ZD6wdFBPgbOkFY6Mx/Ziwdrzh52qYM9fp6Z3nK9wrnTePx/fNnA+fh74eezuq71njZV6vG7CPYX7APaFqQ/YH0CNin9A9QY0Lki/QfUQWB4kPXBfoD1ArMBctFuQXIx7A08Qw4qLD9DVc73grzw1zXp+envrO15Wvt3wn7rxvh+9THi/lvPZyQuvR12NvR/U9a7zc63UD9j48Blgbsj+AHhH7hOYJkh44F7gvME1oFwfBCRYL4gWPB3hx8jQxtLjwKQ7Pp68Rr+M8w1v8HphbrrfFHVzP+3b4fuXxPOeT1iefh/0c9nZU37PG6zbss6H+APeLenrCE7geOBe4L6AmRByQD0wX6A/wOZl6LIAXPB6kE8BOMWFx0XESZ8ca5znevF4Nc7ye9N14nvkeuIPrTeernDe+D63Hz8vezruhvv9fB/tbNU8APXAukDeELzBNqMVB6ELyiaoXFAvGC/jcfMSDJmPC4qLjJM4J6wpvXMfyPGGOXOfr8XWD5zPcneul83nOG9+H1vfhvt7bPeh7XA+4dxxcAF/Ae8mkCR4H5APXBfoD+CvnBNcH5iU1wuNB0ziiNg3bfHKdn0O8ye3K88Tvket8Xb4+eZ7356umM9zF9abz/DmU8xnfd4XP+y8G9zh1/4BxAe8lc01oxgH5lfoanGCxQF5g3RDxAH5WTFhcxCSuPvPnmduc5PWEd/LxOeae69T3drgnrtc9W5Hz7OUXvl/lCC4wXyBN8DggH1AXkj+QT+RnTmuxAF7weJBOpJgQRzAuNBkb2eRjO5Zy27HG+YZ3yvMcc/d1Sd/F857v8nfE3XW+5Pz/e1AfQxMsDoIP8HtWHDgneCyQF1g3MB7oF/KYsLiI2GhMP2ZrhbV4Hdfh9Xhd5Tkw5+vxdVnL5bhHvhN35/qi8//TaIkD8wfmEytOQCwEL4CLPR48Jpiz4gmLjZZpxzUT1hXe5HbLc75OYJ58nfSd9VzB/Z0bHgf0B+wd5ZygWDBekFdAPNAvCC/GBHKV+EVsdJi+Rrlt5/I6whuaHvxOzPNcx/uhvhfc3/khf0CfiJqRHiGLBfUQ8ngwfvC40H6DYqP9VD/ecfb8zvFWnmeYU9tZy/H9FH1f/UOcgN89v4tGvECN8HgAH0dMeFxYbHScOM51xNmxdl7ndXl95bljXnK99wzkX8QDeJj84DEhjrC4WOUkzhnWym9cL/Aued43BuPBYoJ1t8fFKidxNqzF6QXvMsooo4wyyiijjDLKKKOMMsooo4wyyiijjDLKKKPvjP8DUEsDBBQAAAAIADN/U10tOk3p7TwAABIAAQAbAAAAdGV4dHVyZXMvc2Z4L3BvcnRhbF9zZngudGdh7d1puG1JWR9wBZm6mYfupmmgGRt6YJ6aZp7nRkBAxRFUBMQBEVFRQFFREAUFBRkFB0RR0WhijIlJniRmTjQx0YzmS4YnT5Iv+bisX1X91661ztr7nHv7Nj1wu5967jn77L32WvV/3/87VtUXfdFNvij/vbX8f/HF5Yfp7Dg7bqzji40vPmbkfdeD+z07rhnON8m4ifHFqzH8fRhn5eGGN2ATnG9asM34EuOm/d/h9XGs5eAs9jeMEf1e4FzGzVYjr0cOFthv4X4W7+vtiJ5XzIPxl9xkuvnG8PoC/w3cz2J+wxgwGjEPxre42XLc3Jjx32F/CPfr+tnOjpPhXnHtON/SuHkfI/7BfqXzsfFnMb9hjOAeXa+YV7xvOt1qGH73+hb2Dfem86eD+zpW3IoVDsYOZ23KGcK9YH2Lm07nDMPvwT/Ys/drrj8p7iPWm3HE2o88MJaxxVmbc9JhrsLzOB2+wfvcW7Yx4r/EftD5E87zmCMYcR59ytG3CP9sj5UfsrZD+3yQ68G8X9fDPLDTme/gfu4tv2S69TD8vol9t/Mz158C5qM/GYx339/v4VZt3CbjnGEMr9f3re6zcdROJsJRs1/yBS4L4fojuG/Oa/v7iP1a5w/hvsC88MXIM+eW6/oO33fbc2423e7cm023v/XNpjvc+ubTHW9z8+lOxm2NW0x3HkZ7rb3H8H6f83nXISPuf5YJ8jBwxFoWvlDkIHa+YlD0Y437bQf9Ws/fJvYnxH3GvH+f6wdr+MH0Lre7xXTe7W85nX+HW04X3PGW013veKvpwju1cbfVyOvec9fy3gvKZ84vnz2vXOPOZUQ2IhORh1EWTtd+3VCH5/Os0Xl6XXEvc0NnxlHxX2EfDsX3+3R+xH3kF98VzOkqfT7v9reouF1YMLzbnW813f0u50z3OO+c6eLzz53uZVxw7nTvu956us/G8Lq/G95/z/POne5RPn/Rnc+p8kEuXJs8kSvy4HsbP+ye7RCn3ZjkAGbBw3OvOXceI3eusT+G77dxb9/RML95xZy+whtesLv3Bbee7nvhraf73e020yUX3WZ6wN1vOz3wHredLr3H7abL7rk9/M17Hlje6/33L5/zedchG00mzqky1eSh8UOVhW4v6rNWjjvAb3ue9YY0dnzf7DhsR1tbR8c/ug+3EftDfF/9uoHnfY58uRYONud0EQ70m87CCWbwg+cVF99uevC9bz895D53mB563ztMDyvj4fe7Yx2PGEZe83fv836fe9C9bj9dXq7hWuSiykTkocjXPYs8RBbYFnLI5tyh3F+1Dys5GGPaGyoXuOdgH10c7S4dyJjtZLAvcnIS7Ged7/IVfQ/u9O6iruewoN9094qLC9YFNzg+4v53nB51yZ2mxzzgTtOVD7zz9NhL7zxdZVx2l+lxw/D7VZe1v19plPf6jM8+slyDfLgemXhQuTZ5uLTIwygLZA8vsBNsBE7gL7jf+fm7XZDzxGU3RC5YYx99pOfxrRe+c9f92MXjsI+djz/hM+bOtYI7fTPfeJlO0nHY0F+YwQ+mj7/8LtMTrzhvetKDzpue/ODzp6c85PzpqRvD608pf/ce731iGU+4on3edcjFY8o1Iw++56GdH6oslHu45KLb1vthI8IJ/I8qB/ig+wjxFeMnHuf3XJ8GbBLX0+PwfXztOabq+Ffd77zffKL+zB37vbnC4jtH580Znw7P03e40zm6TheDOYzgBT94Pu2hF0zPeNgF0zMfftfpWY+46/TsR2Zc2Ef73d8M73vGwy+Ynl4+47PkYpaHIkOujSuaLDRuwC+VF8p9XFHsBBuBE0Y5CB/wF82NOTFnCzt4grjnuh4Lve/Yx+eu2I8x9KD7fD7PWnkv8n4A+1w/Os+esq143rzCnd7hZDjABEZPfej5FT9YPudRF07Pe/SF0/Mfc7fpBcaVd5uu7sPPXvM343mPvtv03PJ+nyEXa1lwXfJEFhovnDc9rshCtRWFEx5d7AROiH04Igd8hGIX+KVkGIfFJoQLTmIPr6/Yk2l2znMZ8A/3h/fJOZsX7I9w/orvfc51zRdfXlzGn+OLwd2800ecDSN6DG+4vvCxF01fetVF04sed/fpxavhtReVv31peY/3VXkgB0UGfH6fDBzPB802hA/IJ5vU7MLOP6g2ocgym0BfcEHTj4Eb98zRdTkW9j7Yd51vuZU2Rvzj88zyHTu3uvZo68P3rmOe6DyuZ2PNK5+s4l6wgA+9hR884ftlj7/H9NIn3GN62RN346VGec3fXvL4JgPkA/64oHHAhfVae7EfOOBJD45/sJMBPuXMBZfs/APyWuOG0SaUfMLIBdGT2IPrmwzU+H7w9eBzJK8mP9bxX9q4JtfseeKdQ9j7nOtcVObHXJk3uvTIolvm2fwH96uv7JgXbF/+xHtOX/6ke05f8WTj4v5ve+1l5W/wh733w95nyc1O5wvmBfe1vgfz0S8M9vEP2YL4iJGBygU9ZlhzwX0KF5BrXND8gsEeXM9kwPfT29kXk2/p2Ltv+dSMxL2jbcuzbGE/cr7npgfkyLzgS3pTdb7MqTmHS3B/ScGRbsP4FU+5ePqqpxr3quMV5eevLK/528sL/sH+RVfdvX6Wvjddb3q+tPFH8Y2OL2PFXcxI92Ef/Pkkswzs8Qvue+Ftqj1g2/BcfMN53gpnHrKXn48x4kOPk2sL9vgro+I/6D6bFt7f8vdSH4zeV+y7rceT+J7+mF+44GRcTX/pM3y/6mn3mr7m6feavraOe9efv7q8Bn8cAHvcgO+vLlzPxj+n8DvMn1Ywd106DeeRw4Pfowt+MNw36nv2jf6exIpz7mDDN5S34t82n6D5zFsycF34e3P8XfDcYd8wF4fXXLj858qvjb+P99c2f7z2AvsyD2w9PWFD6R0epqs4mx2HO4y/7hn3nr7+mbvhd/jjAXqPG3AEG8+/p+v0HOb0G97yPPHdR4zwdfJ+65G/1VziKp9Y84jlWq6X4ffkFmtOsV93HSfOMlDmofqFowwciJmurTH6e3w4Op0ce+oqqZO1nOcuxxGfbx/vkwd/8x7PSe6DvbmhN/iXLcbVuPvLC6bB/ZXPus/0Dc9u41XlZ/jTf9h7H50nLz4Ld7rOZ2On6TdfYh2zJ6/LPrsPuNRReDo/e11eWZ7He9lzn8VVriMX4ZqjXKxH5GszV7BPBg7Y0GvX5je7XPMvRa9n7Fe10lYLW+l+/P0Nf8/r5Np7fY69Nwewp4/0ky/GVrPd7PvXFtxh/Y3Pue/0Tc8to/zrZ7Lgb7DH92RFTIfn6Tt+Z0PIlPmH0Tjv4sqWt2222L3UOl/xPzP4ol6rNcQyvDe1JZ8nI+RilAn+XvgC5uMIt1Sf8BhbsPYJr20ZSH5vjMPHOkvFvs+Jf4N/4hi6H86q97rhT7AL6qRyBuaVr0cfYAR7th5vs/N0nn7D+tXPu+/0zc+7Xx1k4FVF//EBe4/v+Xe4Hm/w4+BO1805HaW3viu+d+o1qd2l92PMX485zTHeafav6YBrkQlyVOWh1xpxyoIfBvtR8e91pTl3HJ+wyMCcI1jY0xZH4c/PR6wX3vfcOMk9wd3z1vkrP6fOEVmN7m/Zq9h88mxeXc98mQM4BXuxPF1mz2H86oL1a55/v+m1L7j/9NryL/xxf7DnF5AXOi9m4zeQJbibf3gk98JnwTljzX7s5xn7EZd9imMfy67W4TpkwvyYC/NT65BFxnay0GrOsyzU0fR/rCtu5YnCq4ml9/nTZ97fT94d7++eLRy4w3/H/e5xYffXvF9kt9r8IlP0xxyRff4RHxznw17Mzp7Tebi/ruD+LVe34XfcjxMq9sU+4HufxfXsO54P7nSdjtb4apWTGuvyR9YVrcain3DoaxtrX+HJna40XkgPwtpGLHsOdnVlcrPLDwzc2mOqGhNcC3YgPt/o76feNvbQGMEfjngcpvQDR63lM/6+v5kr1yRD9IKfxBfH2XS4Yl/0Gsb0/fUvvGT61i8to/xLDnABm8/ew14OR42H/NB5vEqPgvtol8Y8+1Y/zqF+s62+4lEm0nuWWtiRfpTemyD3A+PKCV0WMvzu3pe1oz7HPVe89gfPdP9WfD7yHN4fbZx78m/sZ/NVm14d0n2vmx864nP0gS9GX8V4YnucX7EvGMP62wru3/6iB5RxSZUDuo/3+QSw59/z8ciP+Ioe0R16Z+7hPs7XnEs5Q3qzrw8x9erkSecelZUcjD1JGeRi7CfY8gcP2dgzofvx+cyhOC/Y06n0w63tU/X7xPsbuh+fz72TF9eAFX2VV5WDhSd7T+/xPMzf8OIH1EEOyIO/eQ9fj96TGz4eDqE7rkvf8Px8P8f4zOs9BQ6u8zihLMw9akOdbNGzUuQg/uLYm5aRfrOlHVj6ArEDa127RrrffbPofq23d5mtfZO9JzK9De7JM1VeKp+rvslqrqP7/k5+6abngxk/jb8npyeXx97D/juKzn/nSx44vfHLHljxx/18PjaffRAX0nv5OrG2OXOPbLx7P5R72NLZcY1AHSdYi3SwP3klB+ED9xZ/Knq17lGsOYaeb5j7y4qszHZgsLVNvq85B4x1XXFZ0/3mw4z3mL7Ydj/nzHZp5P4xNtnZ/ab73u86/F45ffrL5svp8fPpOOzh/qaXXlr/9bvX/d375HWeUfK3cu+wJ0vukRzSC98Fo61aw9xLlj5Vujn2rgxrAY70sIz9a3Mf32FZWPSyzPF0z6Ou+hbrHJf5rXIg51TG2G+6qBvzY1fxwOlywNrnX+p+4f0hzzHmSsgjLq/cX54p3L/WffPtutF9uspWi/XkdXH51xW9ZtvZ+u8qmH/3yy6tA/64n8+H9+V25PPwBh/ftcyL+4WNZ1j7RFt9BbNNHvxaz5m+8LH3GzZ6jsY8x6K+NdY49tiZyq8b9fM1F9R76DkE/kEdK51bxAODjTtdDljH+2p71e4P/bTugSzW3vjOR4mp4mNl7kc5TLxvzsmta9F9Ph+fXb6GLwdfOMP+zS+/dPqel19W8X/DS5ru8/f5hvw9eVw5db5SsPf9lXs2Yo6xrpyeAvfveVyDHyJmGHuDa/+vXN2999drtmLz5Dy3bHLuJzYh9bRRFkdbG74N5x7hgMEXPF0OCD9FNyKT0f01J8Ue5fmr7e/3sI5H4ve5LpkiL7ja3NJ9eTq2XE6XzafrcP++r7hs+t4vv6zyPz4gG3wDvM/m6/+AB13x/VvYh3dSX0iOmT6Js2CtNqNeK27kg8obsUe19j/Ug2utKHWD8hly0XKJLUZzXfPFbqzx2NLJ+Fp8t7GvNZw7x1r7uKjnXNb51tPhgEXM13N9VUcKH4299Kl/jPjz/diw2P61HzL7feW6rul54AY/c6wmi9PxPh+P3r/lKy6f3vKVl1f8ccHri1zQfTZCjwYc5E7NO9vDlprrxfd2eTYv5rTll0tNUY6x4OcasGVHxJw4SL3Id5BHA9f4Xb9Q6xlo/QItr3x+jTeTX9SLaF7anDS9PJIH2+OLjPag+YYl3h78LvWgxFzjmpO9HHAK+YB1Px8bjotcl030fclf0tsak5R5rPj3vFSe1TOsfa7q95V7it9H98wX220uzTGfjm9P12H/A6+4Yvr+V1w+fU/BH/eTDfZBTpB+4n165/nNl+tb07/4ziLL+U7yS+a2csuuS7bkGtY5Rj97Dfckz5z6ErnVR0AW1vlGcgAfsonzWj7saEy8sAd9bcNcZ1vkW1uureZd6titOTpScznFWGCL++nL2FtPb1LvnPNSBf9wXuJ+OIw2b+R+78FZ7Cf9gyMMzL85FufR97cW7N/2VVcUGbi8coH4Xzxozuk+fx/vmgdz5NqjvUmcgcPIh3vF1eTt2asYE6/43jcXH4O98Z1vLd+d4Xc8RA7JJn6SfxKDsleugx/ELmSKT0IOfJ88vjmCUeXHAznxGot2n2C/DBzNuzYbMPSNDbHASXOCR2L+lX9E98WhY15qrKPE9x99v1G2yCJeMgeud3nRD3NkvuR66B7d5+eZ77d/9YPq8LPXYETv4Iav6b7vJ3dkjt5kLj2L5/AMuGuUNRjpCYMdHMnaD37Ng6YffeVDpnd940On97z6YdNPffPDp/e+pg0/e+3d5W8/9qqHTj/y9Q+u729yeVmVGxyRXJS+Q/kIPUV6FtgFdT33iifxqfuqPtKGj7xXBrofPubeM/BCtQGrvPC+2He/31/q8N3vD/eTrXE9lbxaeiOCv3jIe3FPfL8t28+meB97zW7ztfh9erNwKzzoH9x/6GsfVOf5+4vesf24Aefy+emwOcV/7tNz5vs8q+8yZ+bEfeohgAc5w9/fUb7HdX/06x8y/WTB9v2ve+T0wW971PTh73j09NE3PGb62He24eePlNd+/tsfPX3wWx81feBbHjn99GsfUT7z8Old39Bkwb26Z/4qTsAnuIwP4dnIKr8SF7gXc8m3r7rS7fTaJ5hloK95WfJAl4FeT2pjWXdf196OswGj7V/32pMv/BXdT20itamKf82vN7luvt+2D+YZ8BS5EfPr1aeP9IaNxa1s/jsK9j/8dQ+efqjgj3fpGLuM+/EFPMmieai6X2Q830Xeyb579x7v9Rk9YGSIzsKNbn+oYP7xN145/eJ3P3b6le+5avrV73vcPD79vY+bfrm89otvfuz0yTc9dvrEd11ZZYKMkIX3F1lwjXd/48OqHJEDXOJeE6OSa7aN7JFZdU39HebTPKz5ci0D8QeWPmFswa73In0Xcy176BE4iQ1Y9l5229/9fjqG+9tayl2dEgcs8W+xX8V/w/fzDPghfIwX+f1yOOZKvB8uho+BA/iBcn7srPficP6VOcR1rhtZ86/fve6e2QhzDwccTefhBb9PvunKivNnf+AJ02+97YnT597exm+97QnTb5TXfv37Hz99psvBL735qulTRUZ+ocjAx9/YeAEn/Fy5zs+87hHVRuADMkt+2SvPQ2ZxgfvWi8Dn5HuyfTgQZrDaly9Zr6sc+y8WMjDvT9F6V9Y2YI3Hob0aYvv17maNFb8vuZH0J5AFviAcgj+5qbHn6vtG3w+f+Dzbzw+j0ziTfw+fd5Q5fGexxQb8cau5ZPtxhXU2uN91fJ+5yff4Xr6Pv6klkhX2GPb8ODjR4U8XXGH+u+940vTXf/jJdfj5d37wSRX/z/5Awf4tj6uc8EtF/z9V9L9h3zgA/ngAf5CBcMFPfFPhgnLf4QL27DXFz9C7wPaIc/QhkX3zSEbhdsQW7IkN1323sGZLau9l35skfbdZQ3ISGzD29JOZ9N3DNWsr6Xt6VVqPUs95BP8e+8N/zD3F98cr7lnc7xpi5ueWOp8cPl7G/fx9XPrjRZd+7FUPKXbgwXUe+YVsBNuvvudePKt7DbeZJzri2cml98kRvbrMP18NPjCk77/3jidPf/DOp0x/68eeWv/9Gz/y5Omv/dCTpt986xMq7vTde2Ed+w9rPgLugHnGz77+kdUvwAORAbKLx8gue6BHifyKEdQ25QwiA7EF4sPZd1rx9XJNTO+7t+ZCb8mi93q77/qQDVjbmfh+s+0P9w89jOlVTc5rgX98zuH6ZMt9uC/y1Hy/82rNFj++ruinGM+cwZ2vTQZwAfzpL9+P/sgXkUd8Q9Yi157BvbtneQU2X++A6/Lx4Enn/+aPPmX6o3c9bfq7737a9Ld//KnT75fff/sHnzj92lseX/0Auj3y+nsKnmyGe/IvfF0vMcL7ij/IJzTe95r2mVEG2K8qA8UnIAN608i9XIGYxDyaE/O985/298mO/uDcX9RlIOsu5jVXvSaRHpzj9mhq9b7mY5Al8SWOGvPi6VVMDnzGP/y/B3/37D3kHT6eH5/jRvpNV9jPGoPVOW/2NPjr+ZWjYz/dk9wYuc73uH/zIU7hb7O5rguHjxY9xuv0/e+/5+nTP/jJZxT8n15lgc3n532k4A5z3+97cVFyj+J+/35fwVI+6m1ffUW1TXyUHy8xoXsVI4oLDD+7Dluw5gEyKTaQw2DL+MFiKjFxncM9+bNNX6D7g5GBuu6q70s1ryUd+jC2fIC1ffH9Le+zq4uE+2vvcu9X9Tv8YUHn9uLfY39y6D3eLxbCgfhZDV9uJ/FY1a+uQ+bX3MGfnaDTfDr6AuvYft9FL/hE5FLenlzBCzfz5WD/D3/qGdMfv++ZFX+/kwm+Pfv9zsI77uGNPZ5Pro/fafjZa699wf1q/1nNFxVu8Zn4rLgL7o0rCof1fMHbi7zEH5B3+JrCefIYnkf+eaxbr2uXW/3Su9pls9W7Nbe7Paiy9sJ7DvkAM/5j3m9Ya9vW15f9NFITq3WwZgPIRXKcvnfT/i/wL3lf+Bf/Xewnd8r3F4/zm2GAW/Gqf+kuHZT7of/mi76oy3o2Nivf4d7ds/sTd/MpfB6+7Dvs/9nPPGv6xwX/PyrcT+8/Ufw538M/4GO6F+tF3BfblD0A5jXF1hwV3SWLatTkAceI/eGLM/gs9J4sGH72Gv+TvNS4oPi7elXFhmIgvjBOjT/YfIHtGo789pYd2PWi79Zc79YR788Frtf04RSf5/ubZ7Y23J91LFnHTC7EBuwE7kn8t8n/A/7iN7U0OmDO6YX5YfPfW3SfLfWvfBts6Bv7L16I/jf82/OYI3NBDvlVrvudJZ5gm/l7f+8nnj79iw88e/qXZZCD3yv+Pn+AjvI73YPPJE6XM8j6LGPcT4TdyjokPD7mkNdyQPdxGnsy57Je2upYOEVtyXVwIbvGp6ZzOHzBpaMd2NgTI73GkYH1mvu5P3AD/yPrrYN/idPNMx8P/jh/XLfk9/RUsxN8D5is4/8j9n/g/xn/ghWbKoaGmXwcGYCP18X//H96CAc+xKj/Ff8yD+6DLokp4cBvF9v9k59+1vSnH3xuxZ/vJ6Zno32v3AA8XTf9orXHsudUkmvN3kJZg0wWyLB7Uhfkx4r36XetXxWsxYFyWfxY/gIZr3ag17KqL1A+mx4Wskbf+FPs+lzL3ogHKgd0zOY977oMtD0pl30pyQUfi/+43r7Mszw/W4/7x33SsoaG3Uqf5Y63jsb/o//vs+JgtdToP5zhDXcxFZuMm80bveIn4GB9YmyOZ53tf9d/+MMFP7MndJyP/69/7jnTn334edM/f/+za+zHv4eReMy8s2Oet9Uv+95svedv7gvr9VjPKYalF/pB5n7lcm/0+ZXlPuX/xjoWOaD/nhEHJD+EN9g1frBriG0SE9Z4YLSn+zjgyP4bTQaybmlcd7/lA+7Hv8V+fDxxH52ta1r7+lWyygfwd5jOuayN/H/yP+6LrOAOuTDPDVf2H2fCnw+euPp9xQ9gP9lNusUuw8t3kiXyH45xfXpKPuDveuI5/j7s//wjz6+2X06PTLG/ZCW2hH7sq81vzRF7Rw747uZFPGuvEPps/Tk/z3PFR3Q/qWeKJ5In9vw1Jiw84hquRefGXqYt2300J9Dua16fll7F3qeYnpDTwp/t73vnWYedvY3gSHdwJp4cfdcR/5r/7fk/3Eqe4Kjfgp+urwc3wp/ey7UYfvaamItPjtdxrs/Ld8E8z0MW6CbZpNc+I3fP3v/Fx54//YePvaD6/eI89hf/4AvPPN7r2Pu91eO9W7vQnofc4yNzQZ74EOQ0fWyejb6LRWBviGnwzz5f0PMtOOA4P2DkgGG/vXm/rWH99VZe4Tj8+Xrwhnv2OjDPWU+XGGDuuV3JK59VDsL9uK5ckrmSC+M/8aHhxf7DnN1OnUU+hb6yEXwAOua76Z5YNd/jGXAe/iRX5pd/D///9IkXlHF19QNdj76xW+Ykc1lz3z2/nj0qx9hpq5fRc271MtZ+pmLbPFuTgeYTsAf8ArKg18AzJTcorhBr4ID0ss5+wJwX3JMT6hwgN5x1iGzBvJ5xxP8gjxzGf9zjIhxQfYDqA+5igMjr+B21/lfmit7it7EuhwfphHgJ/9c6bK+1id/FBebOXNItMbP5IW+uO/sA5TndM47gX32g2BCx3n8u2P+3T72w4s8X58O7z+SNXIe+1Tin57fSx3VIrlNrNr/ew7aZj9rPWnxK/i0eYAvwABlILkkdMjVjuQU2iz1ULzY3akRkypzCcK7l7zlTYb33YvZaXe+5ddiONPnZwj8xEB+FjbWfidf8LT5A9QH3xQA9B0BXzKvP8nnIPVzZSbES/w/uai1qbbhAPoD/JA4QB+JY/ghsPFueyTy4d7aKDeB7y+3+xUefP/2PT7+o2n9+IZxrvaDcJ9klD2J7sT95zDpCWKS/FLbpLx3taMtvNO7w3ZUHypzgN/ItD8nPJ4/unwzA3vOKBXFDzQn1fvaaEyq1Edwq3hCH4/KtfMC6Z6zuuVs4YNxr+Tj817XfMf6jEyP+MCfb2QsXB6TnMT4AH3mrB3fLB8y8iwHk3fA8rGGOu9VoP154gD/ID8Cb5so+LnpH+F5yCp49azJ9Bx8Dj5IrNkT8979+9cXVD9BTILfpfvgzdI9/LuecOq7f9ZzwOckReSP7eIu9N6c19zzIQHiAvpqLsbfRvgX8vLqepXA+GeATwN/vagPihtrTXnJXfBP35vk8Czz2rWdY74u72G+777N9HP6L/O+Y/ymyvMC/YD7va9X3yokNSH8THTiRD1BkJj4AjpTj4QPK+6qzwZ//ru6uDicngB/Mmbk0T77fXI+5YPPheXGX+q/rusafFw74f5/9snoteuKZyFRyg//ovc+s9sHvakE4iN2Bk1wNboYnLnD/5nYtA+lxYeP4F/wUeQ79wvidrPE92X3yZfiZb+tviQVrX/vKDzxRPmjkgC4D2WP9xPj3/D85b/mf5v+P+GefMzxATuny2NsUG7DOA6cHzPOQF5/1rHSMXrONfAA2n96rw9YenF6XkxvCEXiUzMibjPnAMR+QeND9khccQgb+56dfXJ9Xrf///PpLpv9bZOJ/f+Yl03//lRdN//WTL5z+XYkV8YW6sD4B/ii5dH/sOV4hA7jO3PrOPGP6XGqcM/Q5xBfA8fYsIZNyQDgvvaRjr8ip2oC5X3DFARnjnrL78K/130X9r+X/+Vkj/tZY8r+y363X2Nvkzg7agPI97sPfXZsOms/kAeRsYwPU3eEOA306YrmPvKH5Am8vHP7tyQnXmuAdaz95+oGiH57LfZg/MmqdoO/hA8gv6POh8/JD//HjL5j+sviIf1lkQKz4r372OdV31AtCduRuyAC/HjbknRy7/ujrpv8suW4YekY8h9/ZOjUksR/s8X/Ws6ZHgM2QHzHn63VNNbY+YAOqHzictzGeRbOJ/yA/Y/2/5rlKfDzutVrxL3o/7oEYDoAlzhMHpBaUnMqROGDVmznGAerlamjmPD1a6nc4GRdUHih19sSE5ky85174zOZK7ONZ1jEbGefT/f/Pvaw+p3uACZ7/jdL7wQb8259/XsX/35d8kZrB3yn5Yt+NB8Ru1iioL/EH4AuXsf80z8j3YifkRzzjGBOOa9rFBfDnH2Y9M99TDJOcNF0xp2096+EeocVZOzlba9hnfxP/1bof85f998acd/Dne6ld+5ctqBxQ/cDWD5CeJrZozAXveoGWvSBkXf6DDyQvBltcD2s9WPDXm6OWI3fPN2Aj1PesETN35Cdrgtoa8BaTyBOIN9RX5FvlgNgAeTr35T74d/xx1/3DUheG+58VOfg3H3putQV6RPSB8RHFbOy02IXMwxguR3pQe70jHGC+wgFwds94Hw8Ef35G4sA5F1S+w5wezAWNccDqzJ31GRtbNcDtHMBu31X5GnNKHhv+7fwEuOEBdgAHuFd8Uf3AfbmgFQfAyXVhYG7Mg/hY7RxHq99+puifWv1v9x5N8sA3YCPYAzE9OaBT5pYsZG9f1xQHyCPr92Dr2fjXv/D+1Q6ZO3KuDud7ycAfvPOptVb8J8UukAU24nOld0hcIg7V0wcj+NAPMrTuQ42vO/Y7sj/JCZBFfEcG3EvFnw9YbBqeMB90i37AoNaFE1tv9Qf1uvC490zONAz+WW9wbA/IGAPac9kayXIfFf+6RrLgX2KU7H9P5xYcUHxWPvDss2z0gy76AYvckCMY8JHoBJ9Lje7DZc5hzVbz2fRpGuJ6tplN4NOTlfQMqL3iEJjjEZ+HIfsuDtT7Y97xg/uhK3SUP6Fmi3Pw/j8tMgB/duH3fwQHXFXvKRwgvnDv/At6NvoBMKq+brGj6Xc3X2wV+XzlM+9Tbf64j5UYwNoUMnK0JtjqU1vrK9brSMczFrOH2aE9grZ7wHoMUPBJDLhbI7s7O6XKQPmdXPh79QNwQPUDsgfDUQ5wn/6G18h3egLSEzLbgaLf7ADe17+nfoeP6bJ/1fLJBfvwa4UXau9+GX4mI+p/MPwvv3B19fHZddfCtb43+36wsfYMY4/ZFjyjdoT/9Qz9YbkO3iFncviwwueeucYfRdbHfjTXhcFo5+CpDzx72+AA+d+sL8xeRmxT7Rfv9aDRBzy4r8Hq7K3sU5ez5/biv+ovHHtA4wOKRd0LHhvXSOcMBK+Nax/H3uYtmd23JsA+AObH3MiT4HY5QToOW7iI0fVv0VE++jj0dcKNzlY7Xrhe/pfui//IA54wx3DJumz+TmJFeQb2nowlN6BvgA1QP3JPdJae4mh+77ofdcsGiOnFgvgdz5NBHAD77GGYtUNiADa25oEKp855oL7GeZ8PGB9gfZZ223t5fx/4cT7AvPd6P2+h4l986ZyFIGfFDsAw+QDcvq4JbPWF4zXPFzspHtC3z25HBqo/qHe/6G5kgE7idT7dHxeM6Koav9jtT4vvxs7L+cn//knp/yAf8sribvdNPlPzpVvkm7/Az5f/wR8+4/rwxzPWAckRij346ubBfYuX2ZG5H73no3d+zm0qV+A4+SC5Zj1kYgHYe1b2P3uZtT7x1iPMpprLNZ9u4r86Z3c+S7nvT7MP/y0fQB8J28aey0WykfBt5y6cN++PkP3y69668QXLfpbsXuono9yu6yfZEyD1k+TO5U3xAHvL79IXygeTCxAL8APkaeg8jOT3+W30ngyI60f7rR9ELyb7S5ZxU+q9ZNDz0Wk5RvFe7RstviAZwzXWCFgLwgcgl2I5z07et+IAP+PS0ca1vS7aPjdsAJ2v+xfDv/DBEv9lDJi+sK11nWMcvz5PfzxT6uBZqsO600UeoOeB6lk7BVsYw7qep1X4rJ6N0mWAzYodqGvdVmtc9q4N7fWTsYbmuniaP8Au66PQE/j+UiPEBXw/fiFc+AJit2oDCl7p79f/xRfQTyCv71rm1X3hnvij5A/+6hF0W/8hrsEzsMc1vkdOSp1AvKiuQ049q7wHnhvXIyXWTd9bfAA1bPEJf9P9kPHsXU2m2trRJf5jLXBfDDj7gP285exflj3LjtsT5qQ2oPkA5XytwmU5X8vws9f4AuyE+ZzzwmN/4Ko/LDFh6qh8DrLj2clU1myzk3Lm+mjkbPgFtVZU9PqXi2/OP5CrMfxMVz9U/m7dhviQbSdT5Au3xV/33eQc/9N/+PMR+Pu/WzDPOiH2QC0B/q6Hv2Hpc56x5qA3fEDf5e9iBfEzP5OfW/uI7WPe9653f2RiH/6HcgCLGGDew253Nn3O2NuH/ZYNwGdjLaDagNLz5p5y5lLwr+fndRnwevZcJvO4A6Z17fueNYLj/jC+k8z5HHlrOtO4QL9Q9omQKxQjqBmkfpc1++P6Ef41zg9Xe57aO9SfmazTX3KtN4R/AH+6DnPcggfEH2yIv6nhwp+frs6TNQljTSh9T2xL3fNg2Ouq7mtc7kmvGL036v7VRSZwQ1sruAf/jZ7AffiP+xUeuw54vdf/EAfMZ3EUu84GpBfanOZ8vZybFBngJyxiwq11IhsykN4qPhXeNG/mwfeZbzpqnswZWaj1lKKz/ATYyamnpqa/N3sGyA/zZ8Z1g57Vd/HhXZ9fruZHhuDP12RDxJ18Dj0JapTeg/89b12TsIE/e+o59eLFv8WL7KY9IrLvTM4sIQs4QX27+v99regp4d9jgOxLbYxnrR3Cf996EJyc87f4ovI8nqPagMLP4/mK9fysglH2RhIfkYHsgbFYK7TBA1mPYN6yN3TOBKj7wvc9m8yh72Qb6At/SsxQz3npZz6kn18OxV5Fc72mz4P5Imv4AC/gLzLF/2db+JlZJ/w7hQf0jooL+CBkDXa+A0eF/7fwTz2QTZMnM2fyQO6VXSNHdN/18BTbYA7HNYLV/ztg/5fnIzf83Mt4zvhJ9gLa5wfKY/ED6UlyQbCFsbxmw7+foelcpfK7ubHOx/vWMcG4N+tWXDraofSkpCd9qyehnsXVz11zXpO/yVnA3ec8w7hHkOc0N7jZe1zDvLMVYg15Hj7Fb5a8M+zll/yuLsWu8EdxCznk59Bv/tJWPTj6P+NfuNE81bNMCt/kzCqygBP4oHSKL23e6Nxx60LWZ+LHBoz4n3Sf63Vv8W7+23pQvRt0qp7DVu7R/njtvM3duapZP1VlYLAFc42g9wvOe8acYO17zUv22pScUd1LP/sRDnvSZU+i7Em1jjsSm3su9wE/fGX++RX8CX6lPDDc1R7EEGw/XuB/khP4iYPJtbmBTdakjP7fmN8Y8efn5fyqek5Z+Tn7SIW7lutDC/571odu4W9O2z7FbQ/Kk2C/rCcta8KVA+QDBw6Aaz17s8irdc3wd/85S5U9IMvjORzNJzy6P3fi2iN7o23sm5v91LPuZdyfNz1POXdmsQfxsD8QXwAm4hU+hb0CcL88Q90nosR/bL46A1nA/Ww/n1K8Rk9xTtuP4GgNIP0Otc5R5m2Bf9EV/iy+b2cVtjPqyIQ5zD72bAu+S/7v0J7GR/Dvo+1FezLs175E5YCNmtDoB+AA98tm5bzdeqZuP1N1PnercCWfIbWiujdaXT8+7h16+EyTmq/pOfstnsvzbq3lyH6Avgf29Io/Tkbxr/4T3C73Q9drPNlrCn5XF1AfwhHej988C96hm3hs1LOx1p28hvli/+Gfc8zoPR6QTySHeNRcsUm4aV4b3PNoWcu3D/86N30uskf5SWz/IT9gHQt4ZvY1ZzLmHFZz2fDfnbHczlfd7ZnJr/FsuG3XP965oOhK9i0Z5eBQ3uKke1vVfaf7HjRkDxat96TvD1TqOvQb94vz6b9akjiA7sv7qf3gfnaa3aOf7A3+GWvArec5ea2+z3nhzKwXm8+xK9fJ2aTtzKpyblGZJ34TPwbP8k/Gvqqt/P9R/JsM7Nt/+FT2hNyXD8BLuDz5AM8lD5C10p4PxxlVDjoXjPZAT3HrIS7riOybOu+fuzw3csdjTe737rU/c8TKh+lrtsb8Yq0z6A8ovG89hnqx9Qe4H+bZ/8vvXqf7csNjP6hrHeoHrTXOIteeLWuEyE3w9/04IGeTigur71d0ZN8+QfvOeVjg30fm7HR159D6kOoLDjnBrI2m5+YnZzHnzG0/e80z7vbP7eey9T7Sup5s3j93d17PfG58r2XszmDozyrmGfIe2Sup7mOY/IU1m0XW2GxyKl5Uf5FT1BfO7ssTj73H6kXpP5d/HveigA/ucv11H6A539p/lE1nK+lIO7u2xK19f2G/kwv5oXm/uOJr19i/99WS5a11POtzLIK930+V+/f2h65qw1t2AG+ZG8+BA+h+nnHeR7mfwcvPwXU5l5FuRA7I1fKctra/fNa1Z21DelzT7z7ujZX9y+KvstXuz73hWzUXtjxrj9l3PabyyXW/r6L3etHJBfnwXvkBz+V+3aeYmE1Jv+F6vUPsDa5k7+AqXg7+OZvePLkuveAf1LNMuu+X3Om+vbW38M84E+fB7LUDc49wi8djB8b9tPOM67PYcw73KAfkPvtpZ21B1mLlnPR29sFu39vdmZzttXo+Rd+rlr9N33OGqHsa12TJ4WTfCXEd3ddrkj3+YC+fjPfVe+QaPcdyD8qhD3zg/vW6MPJMtrPvdOaGLoQXvZb9g/km5MtznOg8kw38r6nuH7QDq3VCqQ+bF/HUOj+Ha2HP15XzyJnsbB/b4Pnb2cwtXvR5OkYW+EHjmuN6TmbOyeujnrHa96dKXiixKdzpVu276ucLZL85sT6M5Xv4ffo7+Ho43+v6yaw70i9Gbuit5yOXcKUHda3DYq3LsNc521/k0b25J/LtfvjDntncGO7Ps+NC1/e8sf14jD+U3p8t3388i87fjTN5NuwyHuh9woVrcfIuL3Q0JowvQMbpTj2b3znt/ax2cyr2TfyDE+Ij5JzuWlt2NnvRC/Fj8nxZi8TuwLr1pbW6dGyQa8FdfrWuyS95O7U7tWDYy/OL9+i6WiEOsG7U67Bn8+X65OfnvaeLfLFN4hU6uV7vvt7rnA7TDffqOcTJng/3uaZYie7zScir95F1vtBYOx3P1Vhz+voswtPV/UO2Yp8vwP8Za8RzbpA/WLAj19k7ib7Du+Y8e947Yz6vf4iH6pkLnRvMkbhZnin1puzPRFboVHwOspQ9/eGefVngqWaov9hebfx6eGfPCb+L8/SAea9akjqSe5fj8lz4xvMmp7zQ/aGWzU9mu+GIk1K3cL8V/3KvsA/v8YfNGZ4I9481s3258n34n47uz2dbnsAXyP5Dsz+40SewJQM151WwUculVzDKPmuG32s9LGf4k4nOET6bcznq6Gt2yQy8cy64fipxes6Qyr5M8jvsvRqudSTw1k9S9+/sdWP79eB8XAH7euZA0U0cg/f5IDDx7KPdj+6bF/rKN6jc3+uXOLHGR2Uu4C8ernLd82O4xXfgl3k9lXMD9H3K++zJj27hf01zJodkIN+zPiNuLQNjjSC2wDOzBTBbn98/n+U+jt4bY8xn/Pd/x8/Qcb20bDtd56u/qcT02YOH/06n9e6NvQLpF8ienewC++Aavgf2bW+Wth7Ps+H91oe10dfc/T65uvQw+BxdqDmywiF0AVdd3TltzIuZr62+mXEf1y3fb8Rf7uOa2P1c71CeZTzDbDxHLfvG1nUj6kR7fMLK0dUW7GSgnunesWzne7fe6Hn0XnnDmgnrZnImbOr/dY+Fem5UOz9GLY/Oy+3Qe/oNaxzvX2vNstd09mfLOpKsxcueHPiYPur13trnLrovNiUj2VOCPtNrtp9fUutkReeNsT4y18h63TJ+/4L795wllj1rYH9NdP8I/sfJQM/BZz/K0R/AX2xfcoTsH/+mxj/dN6NfuD19MO1c/4Z/XR9TsNjhfEnlZFjnPFB46cUQn2V/FbjXPVqDfdF7GKvbkwG2316TdY/5+SyPS+u1x70Y1mcLZj+Wtq5tyfv0buxh8/zkxbM3+W8cyMdLnbz5t83nZyfpfuoidU+tYj92tbFjaiKrfYtOF/vxmieWgZU/0M4MbGeHjPX6sW8I31WfoHBBfIL0wmSv1SoDVdcb/hV766Y3cK978wb7YufpPZ22FogMZNS9+OzF1vf3zT489UzRvv4uZ4rSx+zNCvt9ZwvuzrXc2X3Pjf+yV2Drk2g1MvZ/1ydz17lPpvVIjHsp5KyY/WeHbe1ZdU2xX9uUfXthbfoDwx7yOT8o+8jGJ6APNU80cAEfH9+af/pnLSguqHa92AE8sJaB7KOB76vuzzKwO78p+67N5ziV93g/n5DdgPu47qKe2VLui72mu+57xH69/nrm/X6mLb8wueZFTkyNXJ9MwbzGLeVfv/P52EZzwu7Lo8z76dVa2PY52ntxOgPYH+KVfddfrD/p+1DkDDE5EPJc7cGKC/DeXDfqOZFRDtZ8wDazBzkPnB2AZWSBPufMUMPP2WvFe2FOlnJ2F9x93+7MpmXupeGwfa7VmvfhxT/wuXUM5Bn5fmyK4Wev+dtYC43dH89Tmnu3D+CfcaawP+JXnIoMbJyvi8uSjw8X1HM3y94NWU8Q+1j5oMTFY76g+gddFmZ/v5/Rxz7oAcUP8RPyM1nxHrFBXWNTME+fZau39Zzrlu8972l69DzTsUfN39Mf43NjXZTPg989G8x9FzlTA6xrpvh8w5qppe63Xp/5zPrT9NXPBAdsnX9/XK54fZ5lzjSdz5TqewuP56+KFXFi7SfqeZKxhpB+KRjqv07uILHgIk5MHqH31mVvr+Ra953Z6Dyz8Tyjzb33yu9zf6LacpFvHEe26XHWStbnKdxf8bdOpnxnw77Xv7NuWrw/76Xe9u4/7uzYBf7XAvZr+z7nFpJfONUz7/t+9fwCPtJaDuiAWEn+mF5kjVG1m0UW+MzpLeGfp3ZWa+jDaHXGhrX3ybMlzk4/YuY+uM/7WA/9aPvs7nie8K4/epkDT/1Bzpo8Z52c5xnXy6ZPddEDM56hfpzu93FtYb8vtzjnmI7pxViuSWp+wXjOdeQg+2uLffRTmkM+AlngG2fNeeYytjT53/jU2bOfHcG1dW2i2sFQSyJjtcbc968372KtnF8896Bt9Vh1H2feK2u9V1q57nqd/HKdLOwL5/R1kuP+ia6TeP+4PrgR/2sT+y0OSG1pLQfH1Q1GmzDuW17PO1/19I5nTmXvefOVPQjT8529iOjTuC9R9iejhz4n7kgtOeeWtb6C0lPQew/1l8zn88qh7ekjW/dCzftkdd6v/FXug8zhGvKXvRJgnz4He2pk/+TR51ucE3ygfv/5wn6rv2ges004HH+s69M7Puj71hZ7N55vmbPvc+b47vzJdv6Yeipdq2fSOJOkj5xPhENyTiFs0hfORq/Pyw7uJzmf+8gZOWNs29dH5xx5+MPc8HP2yslZ4dXuVP45+Vnh1+WYe2/XMtB7DU7FJizkYNizKPvXsoH1XKN6ttnuHAb8QN9giSfozji8Rrfb+eitd6iej52zMZ2L5Vykvs+/vNpsYzfmer0WYncuduOqej7O4MPinNSiYb7eJwn25ET/Apl2n+Rx1/+89Pk+3zp+EhlY9xiOvYYntQlrvyK93PDI3jXp8Z/3tR/OuMl5Vzn3bDz/bDwDKfugZ03AvBdOXxN3KKc2rznoZ+2sz8Smu3yIsedELNvsUcG975GWffLEeRX7wl84qdr8IteeZ8H710Pd32cH5j7jjNORg+QZ+mfGvv5xHwMY1H3tiu6OfX/z6K9lz8PsfZP9D2q/6NAXtS+fst5Tt+a0a6/L7kxU2LMt497oMOarxg8x+CHyCrhhxD7nZpLjnJuf9Spnqm/r2paBcQ3GeuyTg+P4bF3LHLkm1856j6xvHde5VpyH3uCTyuKM+7CHUnKYWXOWs9ATp4znIvD5sjdu8z93+6PyP3NeTrDPmfmufSbXO3xeZWC11iTzP67FWXPCcfmjQ/mtXY1zGX9s5SZOLG/9vVk3Pa8vW+QqWs4qMSrOr+ehJSYpGCcmyaDzOIFdyFlZI/bLNQ67/VmyvuG6xvZU1tbEjxvXHG/Kwj5O+Dw/7yEfdDxXEzez9eKQxKQ5C7HmJ/qZCPCHd90Xv+QXxvMxxCj8QzHnuC6VL7Nb37Jbo3lDwX6fDMy83PeeaGPHz2tZOBI/dp09k/y3timzPRnXinRfc5eXan2t+H4+/76fg4jL6XXOw8mZKH72Ws5HyxmZWcfgekex3/l713ebf5wMHPHbNkbkYeSG0UaMuaUFj69kY3MM78tnFz5E56i6N1JijH5mTnCveaiu85Xvh7Pvg33NRXX8+fR1dNzZhPF8XHkHMsR3qPZ+T87hhmLzT1kGVvsQjnvS7WTisN+wzjXtG+N7xzXw45qwOa4czkwM7rgeP0fnaw5yxL7gmvNA4Z8x4i7vxEbge9cQJ5Knmm8az+PMmsYbAfbjiE8YmzruQ5j9SJdjWy7WduOIT9HH+vX6mS5XwTt7ocM8uQS5AfHciHtdO1T8MzqL73H3uK6knn88nIFq8AOyJiVnouOM2Hp1Bd/jO9tZvDde7PftQ7XDYrkv9WKP+nFsyIg9CLZ4ZJSpOT+QM3DgPZyJl/NxW06x8XxyivCir2x1yzN37Is+59z7Mc+cc9DnPHP5DL6oOt/5nmyN61fX+cYbI/bHy8ASd/1N41klpzrG/M987lnfB6SehTrkC+WA6TpsjuBedBZnj9jPdYaM1BasPyt/4w9W3LM2seBedX6oL4znL9YYr/v5N2bsM8Yc6toGj3o64mi+6ujnl+Ucu/XIGZfBmU89noEuBxw9r+c4V9zPqfWf4D7uHYTvYY/zs54QxovRX/ce76Xvc12pnxkdnZ/P3rVmfdh/9QsF+70+weB7L7h6wH3U4fk82wHj8ZzzrXrAEvOm6/DBy3w7Np7OB3v6e0nBc8a/jqLf82iv+zs58RmfD+6+w3du15d2e1ckvv9Cwv4oFyztwXhW0cjho27nTPMR7+h36j4V8+Jr5cz2rAevuI81wzX2wb+OhnGG373uPRXz8pnUFvGI72m4t30J1vtUNL7f7b90Q8vtXDtcsNqjeOACvsC4j0N0f8R/S9fVYkd938R+VTOGf5WBYvezd9w49AX5e60pB/O+78BYTw7u4zmLa50/k335N4ax7g1cx+YLLph54KgMVN0/hP9KBsIB4YHaK7Ae5XV/T//AiLnvIXfuAS9t1ZXj451kr6Iv9HEqcjBywc4OrGz+HjkIFzRZaPKwHvl721ekcbtruW7rKdj1E7SzwbdwP6vz11QOxpz8QbvQ/YItf2C2CYM81DHsFzOP/reGdeN119jbQ6K3YDhTZx/uZ3X+mvUW7csbbMnCWh52MtF9hS4bR0Z5Hc7eV7GuvL7De7fHVPpJ+lkq9tM/i/u1Xp+tNfljckjJ840ycSQ/sDHyN/7FiHXrIVqem9kwX/YQzXXLs7hf65yQntNlbWldW1jmf1uP2KHc4ir33HPIa7wXmJ/V9eteFtY1/KH3KH0Hc725Y3m49ni4Hn1d96qcHcfLQ/rB0pc+9yT33tQjvYkDxmON+XR7yM6O68/Y7Bc8Zqx7S67rZ7i2x18BUEsDBBQAAAAIADN/U104y2G/nBMAABJAAAAYAAAAdGV4dHVyZXMvc2Z4L2ZvZ19yZWQudGdhTdvnrR45DIXhi23ADfiHS9lSXcTmHJ1zzjnnVID5AHoB2Rjcb2Yk8vCQSpTm4OCbg/59O/+PHDl0+Lujhw6fnOvFXI/nejfX1bmuz3Vmrr/n+neu79f7U3Odn+vJXB/mujjXlXXvejrXsSXzp7k+rvK35/pt/b401/O5Tsx1fMk9Pdfvc8Hz81z357oz1w9zvZzr2VwX5no01+Wlky54vP9rPSefbjLeLixsovPaXK+X7ltz3V11f1n200fPjbk+z/V+vWcD2+4tPtj963r352YnDGwh7+zS9c/Se3Ph+3FdcNHPPraT7/eX9R4v8OMMHuX9ZQcd6uKefNyq4x0/4fXTwgMb3vBCHiw4/GPhxxNc7IYhjsinB0/4Us5zOpXFA1/hjG716ITh1bLp4eYPnNCHF/f+4pFNdPAnO8QaXWwQh/zrPYz8gSO++X+VheHcwo4j/niwynjHDr4l03u/yVM33XSJJfrYAqv44wP42Ug/LPzzZsnmU1ySrQxd4oAsXCunjmfuxQ+ZnuGRPbDjle3aG7+wUR3yYVOWvTj3nC5c86s289+SDzM8MPMHX/ABPdozuXzqGZ/SSx/54hkW2PBHj9jBK7/xp3bEhvSRQZbf6rpwKCZxqA4+yYFfWWVwTge9/CFeyPQOD+yAh25yxBu/skPM0Mc2WODla1ywWVzhjH/5jE44lKFH+8BR8YhLvOKHbu+9gzud6mtLZHpGDxvUp4t9dHkHN/61W1zQ6zec7tmibH0gfJ65artsUAc3/IBP2JWnU3y5hw1HYoEvceAZruHAI149K47Io0tsanP+urxjo5jjZ5yQq6534kRd2OjmBzr5LP7xhE9l8Cc2tQ12qC/2slvbw4PnbFCPDM/VYT/ZnuEXt9qONlyM+a0d1i+RTzYcfCDeyfNMXXaSpZ3Cjxs+hc8z7U/7Zo/4pFM5nOAdJ8rov2CHgVyxAAs7YCGXneR4px5fKMPf7GM3P4g1vlKWj3BGPv108KV4xznZeIKHr2rf2oF7Fz2ew6IeeeIdBryQA5Nn+K2dif/ksxWX2QYPW3unDhvVI58dYolufsdpfQr8+Bc7/KGNwcVv7PUcrmKEHPbhpTlIY6I6bKObXljq8zwjCx98zk7+I0NdbYvv2VGsNw6IMXrpV9dv+v0Vy2SoDxdZ2gVc+gH1lWsc1nbgoQtWMtmmvrp0qy8+yYUbrzgQ82Thm23itbFDfOhDxESy+QeHMDdnETfah3faLn7YUnvGZX6BjU4y1a+9138pB7d4xVXzPXGMCzLp8tx7tuMA73yV7/Dh8q7xnG185Bm9ftPnwiUbXY3D7FUOX43b3quPPzhxWLtWNgzqe4crdsENP1th9Y58XCuTv9nGD+7VUbd+AGf0slmM4Bhu92KrsYY9zf38xS0/kQ0jeTDDCU9cNSfVdhoDcQkL2XxCL/naKtzK7rFinIBZ/0A2XMrhHh66xQA52k1joHriQxyKWfdiXZujS7vHGxv4wTP3+o/GITbwU32TvgY3YgcmZdgDDwzsZ6/4Zx8u97FbmeYy9U3Na3ChPh/SCQtfsk+51idsaz1CPn80nxYrbKWPX4pJdpPBB8qQ7fIOb2TDpd3Bzz56/FWGreR61tyb3c19jTvkqk8efOQ0h2v+iic+ay4sHvJ5YwD/4IF/yWvc0R6ac8PVGJdeviCveFS+MZrf1HWxhw5x3biWj8nRFzZOwdyY05qqdRLZnpGdHf1lszghz19lm+/Wd/IbHd6LfzFQW+aP+hAcNjeqv2Rf/TMf+I2X5pTqNS9snPTbe5jUaZxX1nv+1d7IZ2dz8uZjzbHw3twXD9oYna0T8Me2xgrtiz3FNRxww0eG2GJfayIYYSLXJWZx0higHZMLlziBk+9aA/EVDGIke+tjlG2NIRb4Vj1xjRP12eDyjP/JEr/8Qzeu8CHuXPQ1dipfvwcb32rz7GieJl7gxx0cZOSj5LS+4CN1xRM58OVTdrCp+aq/8CnXWrX+vvUr/a01+KCcBR18poz3nsGmnLrk4kMfiAtXaxDxXEzTLab4iyy2kVH7g5stuCnvQQ8c9dmeNWchX9y0vuRLOpQhmx+0VbHUeKye5+zWp+CdvOZG+lk80KssOWJUefrI0jeJKTFRu/C+NTZMbFSmfAE7vSvnAxebceveb7y17taOlOcHv/1tHu83efS3Xtc+yjeVK2qu0FqldY0YwlW5I+WbD5Ffn8Revqh/EOPkFiPKt95Rj9xyaM2p4lA9dfiJHeVhWoPCov23XucX9cVOOSh9T3MDur1rnYjX1vC4ZBedcMMGB1+0Vqcbb/qJfCGOyGm+66ot8ZM2iTc+ao6uT8dxfMAPZ7lBOssjtrYiQzzzGWzek0MGTPohtvFJbQMn4hCW1pC48NzfYlJMq0tG8x887vMm9sHDR+zwG3Yc86FyfNiaGD6xCYfy9OOi/JJy4o4csaOc9+JGWbhrZ/yhDvvZho/yXurBX9zzlT4MBvbgzd/aNa7xxe7yj3wDlzr1w81v2FZ/Kz7IgwtufvKXT/BefpjtzdnUqW8iE0YY+BVunNFRn0GPMuyCs1xvObC971EWBrzgrHk1/dqbd/Szj3+a98CCazi8xyVb+RMf5bv09zCzkT3FCMzqeSc2xIB2Uz8Mc3nR8ov+spdcz/mC/2GOD3ECC738UD7As+Y73rGLHPf+ksXvcPNPa659PGYzn5e7Yg/OYBNz5LONPeWy+QTPcPCNeuGgi9/ILh/Jb/SKVTzkV/et6bUJePnEb/6kD3/0F1N0kQGv2OQf75q/8oX4KIfV2MS/nsNRG1eHnfqzcpEwuaez+Sg+1CMLd82jyXBPZ3Gq74G9PF3jVWtZfhK3fovT+h9xyBetcfgehzghozbTPFGd9iK0sebC+MCP8nj1tzUOvOKqnC35rZW8985z9fkAr2xie7kA+sRL817lymW2p9P4hROYYRADxUc5V7LwhGt2qqudqtM8gO10lCfEY2N2NpXjUF5M1k/jmQ6clP8SX/Cxp9xa/Ym2Isbqxz0rx9b+Revb/IcbZWAXj67Gx+ad2oHfrau997w5Fj2tu/mQjXxGJ1vK24o1+MUGmeK4+QNbxZsyrRnFJT17XPNtuQG/6VSm3BT+cSKmGhNgaz2sPF34LH/Nv3yg/2udyzY44MRf8yV+Il8c4A9+/HlWfX5RvrkyXXzoni0wNHchm0/yZfma2mN7LNpN83dttzbDpvKdePaeT7wv904XHPhSt32O9mHEkzLwxUk50Oas8GtfOBaT2UVv8wQ41VO2dXP5MHw0frUn2Lq3Nk823HgpX0QG/zTnro9qPkk3G71nS/kescNH5ZvKiZAnlvwul9j8I0zksnlfQ/KDMsqXLyoHgzP2lvdp36kxt7y0cvwMa3se9REwtOdKrve4qA9vDKrvdBUXzcf5E4b2g8l2r2xrQ/JxoE65Iu9bS8CiX6Ubj9oW/OW/tdViXYzC3b5AeUB2N39vPO5d42fzefrFBPzFGd7xVl/f3h//w9L6UT9bfIpZ8r1nB7z80HxKzIh9NjWPbh8VNraQWTwrRzacZLe2wF99Hdn11fxVjq+5f7HfWEhe4x7flU9q/oDb5hzl8JvnixvP6WhfrvUjzlr/qMO29qL2vkA5nJBZ7DbvZHP7HO1lVY5MmFuj4bH1QDkVtijXXnDjk/r4LQ+lTnaxXdssD4RD9ZXXL+AEb3C3j16b7rwDvHxXDhvX9XlkKc8PsMDYXqf69NRnlHOBl05ymq9qf/Diqz6CzfVXjev0dIZBXHWWoLWhcu15tg5wKVMbEQN4bg2OIzg8pxMn9Ivp8qdsE/N4IselvOfl9MvVu8iGSRumQ0w0N9Rea6Pe0yM+4Ofr9lHak4Kh9Uc+wpH3yuGAL2Brv4js5vXipP3m9vPaCy0vAZPYxJurtkIf7mqbcJCPL/HZHhPdyru06/LidOCoPQgc0lUOCUZcdc6mOXtr+faT4MGRMjD73ZqQ/M74+AubMuwkj4xyNn7TjS88drbG1dmW9hub87WH6V3navSZ2hNeOmtSTogf8e9ePX5qfxC3nc9p74KdsLbOLq9JTv0ivK1fOpdTzlG59sXcF2ts0hboYGf7XOz3rnw8O5ThL+XgINtznIpHfYjydKjPh40JsLV/0lpNDGhL7Q3v6+ly4mQ1p2qPtHw/m3BWjp+MznOQgy82K6NOOtszL5cDg9/K8IV6Yqn1BOxkiD/3rf3ILt9YDrgcLTvzQ3vrOIrj5JdvxWE5eLbTAWNx3H6bOFNGndYz5NDNhvK8zc+0zfa429cnjz3NYcpp4xhHrWvrKzq3471nzb87vwJv6wRyGotq683p4WnPhFzP4MZHeya1h84PkNcZgNZYrYf4uz0qdcUj2eSV90xO/YNnjb/l27RT7a4+oT342nrr3/Yn1MMvbOo2bye/NtFZKty1R9J4FYflUdmEQ1jbn4GhPWG+F7diiN3NCdrrwIvy2dcYQG+5MXaUQ2kcIxue9t4aP/GqHnubX7GndR/s3nUOp/2D1gPtmcOHH/e4am8Rf+UQ2jNIPjnlcDo7UD/fmVCcKu+ebV2wtw8sXst3tBfZfLhzovWtcPvbGariyaV+eVoxSI9+eT9LRmd5OXLpV64cMlz4zt/N2Toz0Nmg+jO/8YCX8jbliTp3qIzn9RV8ivvWpvC0NqS/fC+fK1P+vLNx5NLXHiEsjbXlhJRlW+M1u8lrjsMnMJLfWCwGyrXkr+aA5fLqE2DwrhxNfY6ysOKmvRNxJTbV19aLYzZnW+MYjvhXOVjd08HezivgWbuEWzltDGYy8EY2+4rHcto4KEcIJ5lkKNO5IzaJl/Y8i/fyZPxWHLR/VN8PJ1vgceGqNThscJBfTr5zG7Xp1oHlzzv/g0N1m5e0TuXn8nrtVZQnbZ3ZGoif2V5uRH/eGRDyy6W1R9Mckt7OGXWuujO3xstyod41T++sRnufbGssg60ztuQ21y6/0txXP6t+bR1X5Deet8aGAWfN0einq/Pk5MNT3iX/NHZ1BqczN/EGC/0ufJBPp+fs7TxAc4vsLgfa3KdcaHsj5JBX3rR9ab5srqYsjLhQnl/IbF+iXH1zI5zwq7ZBlt/8oz2V46e781Sd593Pz7d2Ub81Vn1hZ6W1H3Fcnqkz0J2hxUM5suYzfvMfWfTSzwewtYZ08Q+Z7bfAzX52NzdsbUJGfRXblfW3M56dh61faJ7YmRnycdQcvfPFnVvQvvi1XKC/4oxtnTXDNfs7byW22jNjH67FLL+KL38bL8r7tUZp3ud5a5P2vuj2TP1yeu75ozGrc3PFbGNB523aT4St/Q/163/2s0itb+ujazut8Zondt6jvrKzy/uZd3jax6PD8867wtN6Uh/PptbY5JavL7dSu+3MVnuyjQntQ3YOtvOI/OOdcjjEReNJZ1j5hQ2449vyVa1xPK9s85f69uYQeGrfoX7JffvsneWtP1CmnEDzuXJQ6jU3La48L//avkLnld135rK8Kf3lj/JDc1kyWn/RhY/64c4MiZ/mGp1Na39fPCjf/nT50vZ2+K5z/dol3ju/o3y5lfYQyeG79uLd1ze11qrfan1PBnmdHdQ/tEZpjdn3Pp0l6DxuZ/G0jcYE9jb36TuR9gk791huTBnYy3O39qy/Ktcrnt13di586nc+vvmtsvUnnRdQrjUPnsrXwtQ+R2fN2NX6q769swr82ZjM1r7PINNFBsx81bky3MLSXlO+wQW8dFa38aWxpm9iYCSjc6DlljvDVZ43fzaWkIkreNvTKadf7ptc7VMss4eM9u9am4iDzqfgBO5yNeWM6scaB9vP7x2Z/NBv9rWf255eZ7jqs5rj5Ft4+b81JlmdAWkdzp7isW/qOnulTmMjHzWvwl9nKtqnL4/XGgTG9jlh15bKu+o72lunBw/1dXzYNw3ed+6c3Z2f76xW5+o7X618a18ymht0VpCd7c2q055C+5L0KFueqPOyzWk6PwgTO/teCyfw4Y1POi+T/3DnWf1e+18w941WHMAHd2cTvaO3/FjjaftYrSFh3ec2fAtP/bBnrcHpKY/N7s6gloPqO8S+O1S3feK+D2Jz+7qNLfmnNWbrxeaJZIunzmm330CPtl7/21k2zzo3xC+dg2wOXbsg23vyy5H2/VNns5WHuxwMvHTUBvo+gO3lcdr3has5oPLit++UOqvneXN13LCrbyXbC+gMTP2eGMQDTvtuo/OCnY9tvO/svv627yA7H9/6pLMz5efhJqPzk8Vh3080v23u1X4a3vDJl7iDFw9989QY0v5l3+PhvX6gM+F9f1GOHj51amv8ZO5QO2sfHp72Z+DDQ+v6+qPGf3I7E5zNxQC5fcdRP9lZn76lKR/GJ2T0nRYu+o6g/Gi+a58Ff+39wtUZhM6pdC6L/X3j2r5IZ/w7d9K5R/Gdf8hq/6D+NN93hrO9IBx15qG1e/mivgHxHkd9P0VP4zffwkav332/F+7249TrO66+41CuvZe+kW2e1HnA8snt4SrLjvK/7ZW2V1ab90xc7Gdr2itMVmeZGic7P4LX+G7e03lYMvztO8RsbPwRW62Zawf1RfvZwOZw8LW2b9xnEz81Dqrrr7jqDFrnzZsL4YNuz/HWNxT44r/ONMAoVltvd+6xdUJros509s1gubriq+9ZmlvhqrOW5Us6D9b8r3wzv7cmaJ6Uf+gtR0oPnX0n3nd4nu154XJbb49+BVBLAwQUAAAACAAzf1NdwrM5UWAZAAASQAAAGQAAAHRleHR1cmVzL3NmeC9xdWFkX2Vudi50Z2Hd23vc//V4B/BKTiklh5zKL4V3DqVE5FCklJxSSogcIhIlIlKKlEgppUROYczGbMaYjR1sxmyMMZvN2MzGbMaYbfbe6/n+fq7vPr9v9/2bR/tv9fg8vvf9ve/ffV3X63pdh/d1vb+bbbbFZvXf/vl/w4b3n9z6b5ze+ufOaf0vLmz9229o/V/e3PpP3t76T69u/b/e2fp/5vXHb2v9n65s/W9f3/pXXtP6p1/e+kdPa/29z2n9jU9r/dWPa/2Mw1p/3kNbf+aDW3/K/q0/6QF57p+v92v9+ANaP/mQ1k9/VOuvOrr1y5/a+s+d2PpHXtj6753V+p++uvVvXtL69yLjR29dyCTb8+/R5QdXtf730e1rF7X+R+e2/omXtv6BU1p/2/Gtv+6Jrb/8Ma2/8OGtP/ug1o97YOvHTrK9+v7EvO/nr8jvXfyk/Ltntv5L+fe/EPs//pLW/zD2//lrW/+7y1r//pta/7fYS4efRv5/vGOhE92+Gfu/HF1//+zWf+1Frb8n9l8RW86P/afHfjay9cmx+YmR7/H1M/LeSQe3/pLYf95jW3/DU1p/97Nb/3Ds/1Ts/9L5rX8j9v/jG1v/17csZMLf85Powid8w0efe2Xrvxmfvf95rb/lGa1fdEzrZx/R+gse1voJB7b+tNgL+2Mi26vv4XJqfn527IfXW4PbB/Lv+Y8f+fPL8evfxL7SAQdgDwv4f+fy1r9+cet/8qrWf/dlrX/o1NbfeULrlz259XOPav20R7b+nIcs5LH78fdt/XF56PHU8IEOL3pE6+cc2frrj2396me1/svPb/23z2z9C+e1/leva/0fIoOtZJJNB7oM7l3a+p9d0PpnXtH6r7+49fed1Pqbjmv9gse3fuajF9yDPZ8/gex983q/Bf7Hh5On5OdnHt76a5/Q+pufHt/n39P/Qy9o/XcmHf4y/IIzeT+MzWSz/XvB5FuRjyPw/0Twhx8cLwqeZwX/5x+6kAPzoyP7MfssnsfeZ4EHDtDxZdHhwuhwVXz3i+Iv/Pts+Me2wh8GZNPhn8NH3P968PlisP9UsMcb/MEjfIL9icEeznA/8t4L2Ufl1ffe9/MX5/f8/uX5d+LvquBABzEAVxz46/gYBvRg93evWMQFbL4YnorXOffFs7/r78OavY++Z+uPuMfiOSxf04NfTggHTgsHzl2JAXz6QmwT33D+TmSSTQe2iw34iFPcX2If7p8VPOH69Act/H7EvVp/JNl7LV6PCA544OenxEd8JQbkjkvDXRz4lXDgt85IbolvyYE1X+CcvMR2OQpG8iX5lXv8PfLx/ujYTuYhe7R+0N0Wj6+9d1R+xg8nJUfgKw6I38L/DxKD8gAMyCSbDmLuq9Hpj5P38PRXE3fleziKqWcl7o+JjYfH9kP3bP0hu7d+YGR7fVi+9z4O+j34Dw7Ed/L2lYmhn3/uwqf8AAO2fjVcx3d48PtnY/sng5F4eVfJT9zLq+JOrLOTzfvt1vr97rR4fE0X/hAX/CBXyQPwvzr4ywNyOnzlFzLJ9si3bJcn5SpxL34vCH4vTc6Vc3CLjbB+0J1bv3/k3veOeW35/i6tP/TuC17g53OTh88I/vJAcQGX+MHfhzE9yPx8cgI8+AY/cFXOlHdek7wj58trctyj9m79wXddyL3n7Vvfc8Pi2Ttf75v3Doge4gFH+UHMqBvqp1iUT2Hw6dQWOYZsOsCdX+Q8vHt7atclqWFqHj7jnVhnO6z32bX1vXZeyL5HXn3v/UOCgbzg9+UqtVBNeGV8yA/vSD5WU/CAHmTKNfAQcx+OfrDH2eK9egdT8c7H97lD63e/Xet3vk3rd7zV4tktX++R9+4dPQ4IPocFJ/7iB/n4wsQwf743HISBfKgmkE2HT0YXflGvxWrlPLzHOzHHvw+Ir/eOvXe9bet3IvuWrbdb5/sdFz7wc7GBg3oUcaBeqsn8IB5wEQ/EGJkfywMP+eF90U/foHbB7NTwHpfltoMTZ3y8+06t3yFyb3ez1m+7feu3ybNTvt51h9bvFj3gIz74a+mHxAF/4iAMxMJHIpNsOtCFX8QcruAd3su3Yl5c8S9f7xZ7d7556zuSfZPF6863WPgANvvn93BQLhA3fMeHapJ48PfVZfmATJjrEeV6tsP+/OR7mOG9vCq/iDN+Zye5N9um9ZvcaPH4+tZ5b5foAR/xwV/qc8UBf+IgDN6TWOAD/R2+4xy/y1O4oteRb+VSMY9T4o3tsN5h29a333oh26vv+QMG99plEaP+nX/Pd+oyX/IDXsNAjMFbniWbXvgh58CKfD0u3otr2OI628m90fVbv8F1W79+nq3y9XZ571bbLbixV+LygclR8sWxwb/qAb/CV3yRSTYd6CLf6FvxDu/xF4/F/L7hFM6z8ebBepsbtH5DsrfM6/Vav/EN8/6NW9+Qn4sFPC385Wt9Mi7ozfmBHBjoDegiNvULaq2cXfXGv/d3+JP8nW66wJvM62zR+mabLZ4tNl9gARcxITeIg4Oju15BDA/8k49wEAbsJVuPRJdLEnN4J2/DC2/lETjCc5fwjp/Zft3r/I/szfP43vt+jp9yo5rAdxvpoD8Ot/hBPNKDzy/LK17oc8gv7qknuCS38Ku/v3XkzG2fY4ATt4gf6Ern0oEtbBLT8NdP6qnJhrt8o8etMw7fF/Z8eZdgv2Ow326r1q8Xn6/K9uAC/P0eX/GZXEh/drBHHqCDnoIfYED2xdEHJuKj+jz5A3fkHbl9Q3LOTeN7ctaS76EbHfBULlSjH57cJYfpC/GKjWTBm2w6iHm4FPbOc0cmf8qj4lnc3TKxtXXw3Tw4ryUb/nwjBtUG/+6g5Gz8qXokBtjHTjrgOz3Ixz3cgD/uV97T37AF9+E/597qgxfbJhbFAJ/N45BP8U8vi2fwJxsX6HJO4l584om8M/Je+CPn4zReibv1ZHu2ys/9nt+Xr/h+mYdW7NcXsnvYH13opN6X/c4UZb+cUvzbcg3uz+2Xi9REOUDeKvudm/SEcut5k/1s54Nhf3RSc/QM5gmVd9kvnuQ3OW9T9sOn7Pfv1I15DPrbMJZjxRvb5UJ6wAM3cXT0e1Pd1VOoaTiN2+vFnwc3YFQxCDsYwhKmsMUxvQi7yaYDLPTZYlOMjtwT/q/mHnVmU/bLP35PX6Re6tfEkJ7wuOlsBH++Jlc9lofEIS7QQb8Lp5F/g5tee+Tf1HY+wLH15KsBegH9iV5BL4J7zsu4x7+wZy+ZZNOBLvDHPxxRr+VsuVtPqe6ru7i1Hv+2DPZir7in/qid8BfL+kBnaHHGVrn/ytQddUj9oQdO1JyFDs5zzldzHbZdJwfzPf3m+Qf++kD5TB8o9tnJ9ism2XoeuuAg/GFU+Vcfh397hH/yL2zhL9et5j7v6w1gL1/L2+NsPOV+sxHy2Uieuqvv0Avq++hCL3lwnLnCAX1D1QD+xAH8Yqe+hy88aoL6K/bIFy/6xcr94qnmYvI9m52tnUc8+gC1EC/Mr+CPr/MaoM+XV8UgW+FNtlffbz/1HvzkPCT3433JF/dswzm9nt5LD2xGpCfXj+mD6IejdeYtHuKTmOYHGIhzNnt8zXY5AveG/Cnu6ixcvSecnUGcMfW9zhzOhvDgl5qzruLvrCcP6LPVYT4g26vvcbN6T3E3+r7EXfW+bOLfcQaJbH2/s5gzn/O+s8C7owcMxsxl6sGXuTi5iB/Yx8f0gIPH13CBvXw1rznqWZ09+F2/q/d33nLu8XwwuvAFHorDOvuNHjj4i2P9jDiQ2+VX/QDZXn3Pdj+Xc9WcOgPKp2wRX3hGDnudtZ2BnT2dfZ3DPphzGQzkheUZbFYL9o9d8ioekHf7xIPH1+q9mstXlfPnZ09zNLbD3XmTTLLp8PHoAgd84B91oc7+1YfiEw6yUSyIRX5QG30vPtVbvJ+fPeVztsDeGY8cs00zPjMQc0mzD+dwMyoYvGutM3jw1E/i1j7hAXn6Io+vcUOugr0zF97PZw/yDNvhbt5AJtl0MGuHhdkL/+AgvugHRxyER3o49VBPpb+XY/QlXtV678u3atZy9pB/X3NI2OMcvMk2CzYDMw81kzOHoQcMagbDD/KR3AlP8Xxo7MNvfFQXxDrZuIGnsBczdebGOz51xmY73M2byCSbDuaicDB/4h/5oOauatboR6fZGxvlVlwg2yvcvS/m1Lrl7Gmq8+KKTeaa5JBtz2AGahZsLm8WCBP6mUssZ3BTHNQMjn34TZ7eSn9wYPwCFz2rnFX5fsweE0vyDc6b95h5mf2RSbbZ59eiCxzMwfgHB9UFZ0JxgMf4hIMwUJP1hvzg1WzG+/rMeb6V79R2+f2jkc+/5utmvWav5s72EWbh5rFmkTWDlRtxRr2oeiCfqMswUJvFA7vlBjEqT4iVufzagdTs2ZzXrJtMsj3m4fDgF3uaj812H5WHRl+cXKAeiQU+EGtefS9PyhU1+zTH4D88hqf4slfjd7abu9uD2UPYP5jHw8DuD0fEgd1ZxaJYwukxg4+dYoG/1QZ4yHdixA6MvvSmv3jGJzFnzvuN+JvNZJL9/Tx0sX/AA/wwGxSr6iQMnQ3qXIKDMIA32V7ZPnYPU4+tx6u5/3wH+aVJvn2Hnc+Ps/Ozh7L7gwU+4EbpwG/8N9cBt/kBBuR62C7m6Sfn4azcMbBPzoM9XrHv27GT7T/K7odse1e6wAD+csJau1eYqqXwx0Fch4NXMef9Ot9Xvoc9Hsk7fCrucI18tttB2oHaw9lF0QE3xSK84AY/vZlcJKb5V08Bb3z3+Jp8uVrekXPFjfiRz9QW+wXxDvsfRhaZZNMBDvDHATFoB2RGrE/Qp+rXa/8GY/jDgA+84r33xd2o9fl9tV5PU/u32v/Cf839d/CwE7SPWe6/kzNWfbDR/tv+dbb/5p//df8djMf+O3aTbf+87v572oHV/lsfh3/iDOZsr/239/FzcG/K+ertWvaLOTvn9ewfHJztv1ftd5Yv+zfaf8/tt/uL/Wr6Ju23/479fDLsT4zIk/8X+2v3x3799Zz/ch876TD4n6f4/92J//IwnVd3sDWfwPWxgw7/PPoT5xU1Ur12jqv8o47gv52XWifP2vmymWw6wF5Mrsn/Kf/qJQb/YR+8xZ2ewF6KL/B/nDHDf/FSe8fygd1axaA9P7xhIP+wnXw1Cf8+H/6pV/LfqMPJZeoZ/OVY8uU8+cfjaxwQF2LQGXruA77kU7WHjfAnk2w6/CC6yAuVeza6exHujbsXE/ZwZrNewPncKx54f/AvHMXVUfftNGY62Lnpc3CcPDbLO/RRk9QG3FerVu8fOJP5+7jHXjVPr+kxq7EblYfkQLouddB7JJeziW04gOfumpBNB7rgJXzUiWtgP52J4Svm9Ndqn7qvBsMBB8eMcdpzVO+hj4SjPIQDek1yYCAX0IVPYK834SfyV+uvuibH4TuZzvb2jTVjoQ9cxAYertbAgX94/ZXIwMFvTbJxji54pzeDE7zULjUMjvCsuwds1+vpfcjWf43de97387HnmPUfakH133oaeU0s4oFarwf2KuePHXRiFff4reTXLgz2bCfbeVjP7zykB6ULDMTl2MEnD8iDA/8pBvWV8CWLvWTr+8S82MQ7PTq+yt/yeO3C8E6swd1ZUO9Ltlff60H9XC50bnRugf98B68PdO6EAVvJlOvgITbwQ+8Jq8q7Zkb6CjGP5+wk17nDmc/ja+defTl85ucvuUgNN2fhV7lQfiOTbDrIN2zHEbxb3j1Izl3ePUicsx3Wzl7OoM7izkDO/PwBA3EoDpxb5ezVHby/L7fSQ40nF+f0e/pU2IsbmI0dcHhfO+DaQZPr3OnM7/G1s799h1nRRrvf+ME5RhzoR2Agvsgk24Nz/KJWiFW8q7sHNX/AcectZ849c942gzCLcQY2G+ID2DgDyofipc4N8x28vy+30APXyBUX9tHqrbN/3XfDe/m+dgH7xXZnbXLNHcx87BzNIsx+zJ5gMJ+/1F0U/oQrDMQCmWR74M4v8jWu1H2rk2fzJ2d/tps3mG+bfZi3efU9H/i5sygOqom1S6rzmHjw9/GAHmSaBcFDrWS782rVW/kel2Eqzsy2zFrINec1D/eYQdkPmfuaTazu4J3H+FMtE4diQSySTQe484uYq7sHeD9m0NPdA/5lO6zN+swbzXt3yKuZN3/4uRnQfOdZc6jawfv7MGArvOVZsvlGvhTzo9ZPvHfOM1OCLb/bv7PZrN2+wWMGaTZtDgefMfu2d5zFgXyEg+JQXeMDsukg3vUrzgxmFpXv8V7Mjxm4+XNshLsZsF0f2Wagvve+n5tF+X25AP64gwtymDjgB7EtFvQG4hLuYk6trT5vyDeDL/nhF67BnWw7APsus3czaLrAQDzww3z3U/jrC2v3TibZ8jxdxIc+A+/rzk/tgOQb3DJnNWu2ZzH7JturvZj38WJ192BGUfsnOZFv8RsG9MB38Y4XsKlz1tL30/y95PP1WjtQ+xe+EAu1fxq754kDYhH+8gqcnY/IpgO/4wbew6n2b3wvn+wePMWcOTdbV3fAvrf783M5SS4oDsx3MON+aGJRXdYXsBkO8jNMyK8eX9zX/QP51ZyXfze1g+WX0gFfagdT+Zht6rHZDAzIvjSyxRzeV48/6s20e1LfxBTstwn2a909GPhPu1e/JxeLV3lgdf/JPjrUDn7sP4PFfP+Jr0v8g+PYf0/7z03tv+lgP+ZO0vwOAv5Vb4pfbOXv2n/CA/Yb7T9X7l6Iu03tHsf+e9p/+v2x//wZ9t9qDd9vcv89u39xbfbfamHNBcf+e7p/sd7+u+7b8d1y/41712L/Pe4/mImv4X/yl/cfgkfdf+B/fX7F3896/2H4f3b/Yfh/9f5DZMC67h7QQd7j/2vcf4j+1+b+A//jDf5UDhr3XxL/ajH8yV/ef8krDsIFP/DEeQpv1HI1Re4X22J8Pfn2oPaQctU8B9UOUi9Ud0/IHPdf8uAATOQmuX/sPqe6W7lXfVN3Vne/S+7lffnX78kX8ob84YxWvVjNR+BNthws96s99MEBObr2HfKmGBJLcrrcTsZaMYD77ufUHazBv/C3ejFxDfu6e0Am2XSQA8UDbOrumfiTO+Z3z+Sf9e4f8Qvs5al5/a3Yx335Re5hu9qj51CH9UN0oRceOruNGJjlAH+TX8cOPnbCwN0zj6/HDjr8oOe4+zO7+1LnEfziazab65BNB70HDOSkmrPX3cPKATgNf/lF71E88AqTunswuD/D3ny65LONn/V5ejCzIWdTMy59CAzq/uWyB5nyMA7UDl4cjDuIsdmDl2zXf7irRd+qO9WHy3tijO36Lj0f2fpAvefYvQcDZz4xuOTAdP8Q/tV/yTHwlg/5Qs3Bu7p7wF9Vd0p+zcXYrvfVgzvr6cP133pRmNCvdi7ywLiHMd2/1QeIA/WNHnDw+Bouu+ZncoWaOe6dRH7twvAO5/V8el4yya4ZLR/AoGad+oDqAfUwzrtqit4CD/AQ5l753ft4V3cPquepcyCb9FpwJ9sZzIzLOcz5y5zevgcG+rHl7jfccZaQR+DKPvlo3EEO1z1k87uexy7UeaXuPszvHuCYmZpzj/OnvTcdzKbggAv8U/smMVt3INQxHGSjeijOyfbqe+/7Od4t7x7k39ccAPbmseSw1xncjNc53Pnb7MEZmC/wc37/vu5jyae46JwrJ4kHD9m4Ieb56vCp36q7B3wqztkOd/t38wey6WD2AIdx/yD+Gefv6TM34x7ulIfUIvUAx911Jtur771vHqVmV7/v37OBLXjH7+SY85jB2Peaw5i/mI/Tw+yrdr/LHfxUD8UzbukJ8FGce8jGjdpBOzfVnZuaw+E82+H+mcw8zJ/IpoPZExxwseYvNXesu0DOwXIBG52F1XeyvfoeP8Q8ri4/f+Ke37QHZRPOkUO2GZw5qDmc+ZvZLD1gUDt4ucBdRXW77oQ6E+ABeeq7WKeTWo2nsNfrqbV4726xmMN5tsPd3ItMuw460AUO+MA/OIgv8pV6PHqi8KnOc/oi+Yhsr/Kz98WcfFd3btSa+gwWm8wf2W72OWawmTmb/frMpzmk2Tf9xg4+ftjoDsR0LlHPYMAXcPCoc/yuz6izXsmvzyHW3QM4k2XmSzYdzJ7hAQOxKB+oDfM7EO4PywUwwHFnG7K9+t77OIp3dffBvKX2gOTXZ/DIM++3izL7t/c0hzaP5ZuaQZsB1+4Ll8WBXMBOtZXNfC4u8E7Mm9eRv9YO0Hyb7ewmk2x7ALr43Kn5+/jsYfCvGbDcoR6rB+ZBesmxe5hke3VPru4e1KylZu/zHax4I9/c3d7BDsb+xT6KLvTCRzNqO+u5DvJI7SDkVjzANw88YE9+ff5uvoM148MrvLPngLt9J9l0sI+EAU7W7m1191x9OX6JQ+djsuHue+/bvai187n7/P6BOMM7mJNr72f/ZhcHA3sYOphJ4yHcxh2QaRY9dJh2ULgo1j16BPLV2uqzxv5l+tzh+OzphD072W7nTTYd4AB/sYAD7sGojXqU5f2LqS+HP56xmWx+r91b3e/1+/W5z9X97/j88/T52+X+d/b557X2vzUPrvM5P8tH1/j8c35W+M8/+znuXsw+/+zuA9tX979j/1j735XP34oB58fa/+Ib2Rt9/nm2/x15p/bf/08+/1777/r8+3z/vd7n3/8bUEsDBBQAAAAIADN/U13s8qpTlFwAABIAAQAdAAAAdGV4dHVyZXMvbGlxdWlkcy9sYXZhaGVsbC50Z2GcnenbbdlV1Xn8mL5PpamkklQqfrLFFhVFxRYVRUVFUbFFRVFRscUWFUVFRVGxRUVRUVFUbP4NQhJIQiAhHekIhPY4fr89xq6dl3vr3krVc55z7nnP2WevueaaazZjzPVJn/RjPmn/fUn+f+yxl33Re2+P/o0P3V73777/9vh/+oHbG/7vj9ye+G8/5PMb/k8e/+uHbz/2/91ub/im4/lhHo//hx+4ve7ffOz26r/7kdvr/8sP3l71FR++vervfPj2yB99z+1lf+K9t0e+8N23l/3x995e+JvecXvBr3n77UW/9Ttvz/ulb709+2e9+fbMn/TG2zN/8htvz/tlb7099xd92+0ZP+6bb8//1W/3wb9f8Ou/3dcv/A3vuL3k932X3335n37/7SW/9123l//Z999e+Zc+cHv0r33w9sov/eDt9f/1B2+v+eff6z098T8e/v6f6Jg3lo0duTz2Tz56e+3XfMwxvfrvf8QxPvKH3u19vPh3vPP2yB9+z+05P/9bb8/7jLfeXvzbv/P27J/zZsf2nE97y+1ZP+1bbs/66W9yzM/4iW/0b8/5Bd96e87Pe8vx+d/5zttL/+C7by/8nO+4veyPvff2ir/w3bdXffmHbo/+9Q/eXvW3P3x7/D/+wO21/+L7HBf38/r//IPO04PGc/0McmA8r/1X33d73b///ttjX/U9/g7zz7+f+J8/fHviG3/ooWXlNfOdyYfn135Nrp3rPfHff+iQ01d+j/f/ir/43beX/J53HbKKbJiz5/7ib7s9/1e9TV1ANi/6zd+hDjz7U958e8FnvV1dYN6V4y9/q3LiMy/63Dx+y3f4vUf+yHtuL/68dzr/vH70r35QWb3672V+/sH3qNfcy9MZ0/Xx2n/5feoRusxYeM08PJZro8evzO+94s+9P3r4vmOuf+G3em8v+m3fqa4ynuf/yrepF8/6GW/y9Qt/4ztuz/sVb7s9+1Pf4lhe+NnvuD3/M9/uvL/wc97hWF7y+e9Sl3m86ssPOXIPzLtrLPPFv53jrNX7zn/1Gb15wzdlfUcWyOcN//tHbi/74vfdXv0VH7m97ms/ppx4/57XyPfu995VX/ZbrH+u99g/+ujtVX/zQ7eX/6n3qQvI66W//7tuL/nd7/I1usAcbo0zz8/8Kd9ye/bPfvPtuZHj1g86wLw/61PepN6gMy/4tYcteGnsADqM7F7+J9+nTvPbj37Zh26Pf/0xntf+64+d+vmgNXK1F3wHebFmWO+ux8wHOvHyP/N+9Zq5Yu0zj9zX9PkFn/3tjo95V4czpmf9zDc5JmzB82MHsAu8z1jQd+4f3WGd8EB+/K76lteMjdfoIPP/dHUZ3cF++fobsj7/1oeVE/OFTWC9nDbzKdbM1vzd+T/lGX18fWSHzqJbr/nq7/V3WJ8v/YLMf+aMvQA5MU7suXtAZMH8877/zvp47qd/mzaSBzaS9TGby/d4bzaffebR6NtjX/XR22v+WdZsxrv5fN2/Pcb9UHLqukJGPF7z1R/1Ws5F7Bvjeewff9SxvOLPH3YNG7R1zT7F/bOmsVvowHN+7lsOPc97/N01H13hu9Nl5t+1n/UxXWN9om/OT16zjh//usNe329tPtWY9h2uh81Ch/kdxsTvTPdf97UPr1/MN9/jgX6hp8hM2xj5uJdlXrA3PrJW3e++4N3qAjLCLrIGeLBOkAn2knWE7JCv6yJ2EVvA91h3r/wrHzj2S34newy/iU/zmn/6va7/67yzL133qt377Ofev+q3ss+YsJesDXwM1j7jw66x5/O81y/9A7mvjI37ZE4Zy9Y/usxY8XXQZ/2a7IHoCu+z/3N97WPkxJphn2EdqXf5/cf+Yexb5n+2+olv/OHb67/+ybn9uDmP7u71Ps93WdvoL3P/yr/8AV/Pr+E1a2eywqZrA3m+yMW/RSb6jZEf+oisHsevyD36OvJ3TjJHPPBlmCvG6V4QWTGPjBdbiN/nesl84we9+PNiP+MjsZfy4HPowEuz/tUj9t+se67LusFGMh5+C5uPHfDeostXWdxvX5vuc9/YNX0ifKaMHXuGDNGt+WT6nOhf7oW1pO3GL82z+xZzG3vwovg73L92AFuW8b3oc+P35m/YAHziR77o0KMX/674kdjJjHE+BnaH3+SZtcU9Mkfbb895eoo9DrvBmt868FrMe/YT97bYTtYKc8rcXa87/brrZ5w+AD5F/Sz2En1+dOtLP6DOuldmr+FZeSXuwA/AfmNDWce8xu4z3+z9z//MyCbrw/3zl8RPxG7GNiBHPutz7C3z/bLYTeZFOdVmYge277N2XMsd/10bcO4Td/Y87h05O7Z8HvkwLmTFvMzu8PoVX/L+Q5+jn9gyxqefEluPzz/b/5LPP/T90O93qid8j7G9MHYNncKfxP6rYxkb84UuvCbxB3aN+9DHvu7Dec0cbwz6io0V8Bdd9/08cmJe+R2ux3WxMep65p+1gl5cfTp0n2sbH2bekQl6gW/EvfCeNpIYqXEK+sX8ECcx98yNNjzjZ70wf8hHX4D9kL0zdn97KTqAHH3EZvjd+H/Ijve4BvLSHmQu3MuyzzhnGe/iJu5p+8AZr1zmGv9PGc1GZv3zWjuWsaDPm/9Hvyx7WmwaY0LH2MNY/6xn1jHj4R65H/YD/03cExvAGNi7sHHoPOPk+9qOvM98YAfU6egUc8+65z7QReZNv5o9IPerP3dZq/MJ1IXu9+4P+P7MK75DxvX6bzhiGf1lfMzoFnPI+liM4RzmNbaTNT25LXbca2yC18y1kYn3Gnkbu7APx69gPrBp2AP02nFn/tjrsHfIin1emeTfrBt1gFg4cphfzd/w+/C1X/El333Yk1wDmbE+WJc8uHd9mug2fgd6sNjNODr2ALnMpilL8gX5/GyEvl/Gz9/Up4yZ8fA7XJt8Bn6Nc535NwZFH/EF8jydxcbzWeIUbQG+Hnbh1z2p93yOMWALGRO+A/Li+vq2sZnMj/s/cQDzNX3OmkXGi7u2Vn1Ej/Vdqwu8ZoysW3wL9E27mXkjbnaukFnkhT/gHp51hOy41vYefhs9nJ/AOucZmaEvXIvvoMdc07VQefFbjBubzTiZX2SI/iMj9nxt6xdH/5PbQUe5T/3F2En2Vv2srBue0QN0wFiTfad+M3GHesD4kgvQtmWut5aQhXaL/W62Dl+B92Lz+L5xUeSATPAzuA7vGWtkP2NMzBf3wHwZC0YPuB/Gg76qC5lf7pf9jc+/PONBj5EDtpDrsC9wDXMYuX++wxxhz7Q10QH9anIR0VVtdPY3HtgFbVxk7xgzH9g3cxd5n9fGMfku1+N9bTJxOddnXKxz/ILMGzJTjvl9dIH51rfP2iAHxmfRQdcRvxMZzWbwXf39yIfvIW/35fwO88g4FnciBz6vHYjc2NNd4+RP8lA+sZ3Ee8gcGelrsUaiM/wO10O27MOMlfe4H+bCvZq1T64OH6evtWfx75AD92d8mPnmvoyxMy7WD/9GPuZIM2Z95eiZORmuFRnia7AfoAOu14zL2AQ9aGzCHKO/fA6dda/IsznR6Lrznr0DmaPjzAFzYizDHESv9TuZF2LcPLMumVPm2rg9Y9cXj+7yb+aDcXF/5gty/9gyYwlseOZG+1mbjMz4Lb7LOJADn2GdOF/9TcbtHo9tIM/GOm/MpYzwu5of0Y/hfrOHbZ7xyd0/qxNcDxkgZ/6+POFihr2ev8113PuJtyozfuvqz6Ir0wVtEzYJnx0fl/gkc4g9Vy7Ref6GLeMZ2fBa3yVj4X61JdEJdJ/fNc9cvWAekaFrtHuRa4fx6h/kXrELmX9tHfqMrYhdQ9fdB9nvyV9lHOoEeYD8jnMRveJ3uY/FteivtpR1yxxxv9VL7VvHsv3vSftw2Aq+w71hm7z3rY1cz3HnPf2c+of8XVuOr5hrMx/Km9+Kfedvy0vxe+gOsuZ6rHGux3W5njEbepB/M15igeXStBvoA3UJYrrcH/qlTUQ3uU/yiXkf+8MY+Kx2IK/9G7E5+2TGO73ZGjE2MS6JnJrr8jq5n+V0HVvmUt3A/se+sgYWI2kTeq+Ma/OA/4+dwmYt77E4kdfLG2C/eI3M+I52ijw5+eo89DFyv/oZ2NLazMW3i9d43/usPjAPixn0F6Lf/K4xC3YNGeTzrE3tFPaEWCnXQobOC3Oc+T31CZud9YiuTj95GGejI91b9ftaS5hs+Aw67Nqu/eCzx977pF/GbxuvVb+cA/Xv+Ds65v0iy+XEohP+BrmR/Dbz4rpkj+w4kZe2uf7B5gr58WA8rInZDm1odXvjO3Uo96//zThzfe6Beeb7zKf55/0bv515zvWVITYiNoF7YcyM0XiRmkHu2TxZ7o/P+5v4d+Rm+pvI1WtmPHzX+IZ1drEx87UY12TuHtU1yG+7n3StH/raGKbvGQPm2TXn+9FhfGx8MPKE0VH92Oy1fMf7bU6H+8Bm+Vu9Pvfh2sCfIPeHfOa/IsPMr3FC/U7zG/medhY9x+9CDzP/W7f6OtUhx9o9ns+5N+Sa8w/cqxvX8tp5RldyL+wbxj+sIexL/m3eKA/HGZuO/XOeov/aoq4BfQpqGRnP9G/rnzlj/9AWYoPxQ2dz0MHIizGbn6rvYVzMOquO8x11ltwJ/nqu414ZGSNT10fjw+0/k911D+Ea5hDzt+WoGMu+r1+GTmCL81odZK02J2jermtGO5R/u0fnb1xTPSBX2Vh3NUvuB9nMh+Dazmd9Tv2KzKPruPuXdhW9Zi9h38c+s+dhB/PdxZDaNWwd/nh+ez6MudG8x5pyXSGDrDnu6Ulf+vAfN4/su6whX5O3IeeOHYmu81qbxPjx7fJQtvirtT+raVKbU7d4L6+d5zzMRbA+mwMzj8B79UNYt/pRkcX8JsZz7CvRPearuSVtZ66PD7A5WrxB7oO5MJce34Lvm5fM7/r3jI05wSc9feXazvmS2vWMG73ZXmtMk+8Zk8d3UT+I2fBt68u41+VejcXIYaJ37HvYA2RffZ591S8kv5XPzJZyD6tnupYz18QUy3WqP9hmbER0hFiWNTYfQh8n6/HM/W9fqV02tq6stkeYf4hc3Ffxgfoeuk1t2jlgjSUGVTfnG3EvmYPlhbQn7G1d5+6d+EvUbPCxqas3d8cY9SWImYmLcu/475PRNa80fIH+XGTA9baOzRFlPOioPkVxD8ZO1B2af3bfZi+IHPQpyVHk7/gojH3jYi5YB5u/5diRA2vEeIxrRw/4bXIYfI5r8Rm+Z14uv4us9fnx1RtbGuexPio/fk/b17kzRol8eNZ/p871lR9pDeqoSxLXmJ8iJ5XchT79fDNyovV3F2MwHuyx9i8ynP/N+id3rI2ILjMO8wnIkzoyOdyMgbE6FtYSa6MyVnfzGf2uSyzAvSymmO+oTeqeakxJPaJ4BOsR5GrJ3eQz2zcY7/yX08eJzNBDxjIZL6585AvfY06BvzsvrPPM33Jk2oTYZ+ZnMfNq7/rQua/ZI9Yyrxm7ugJGI/kZPk+uivy1uUzqb9Q3ktdCN/a7yNO6TnOW7gvY2vrn5hmrx0/mDZI/BHNE7ZDccnOyj3/dMd/kHM1bty6D/FbLQMfIyS5GRgf4vfnq8zvJuzr/5BkzLuRl7oW4O/Lj/ed9xtuOPF30wL0MfziP1fWxseZxsm60I3l9xoxZt9bjWlc7MQPUFTM265Dk4rBxmfcnx5jX+aw5ybwmj76c1Hwk7WVjHXNd0VvzHuxJ5B6pJUQnnPfMC/fLXDs2fDXyZbn/5VRcr+SsLrZw9Utz88xZ9GC1LHMVyWORl+e3rN3nM6yl5bW5tnV5avHUY8nlYCuwP8R1sWX+HnPTPdy9Hn+6vtxZo4wcVlc0xxiZXfFn6MtR1zt8CPFlxGN5zIedb82+dNjwI5Y2vwRmKPeJLltPzliwhzyo0ZKLpQZpHhK9yf1j+7x/fIroh34j9gz/oHlZYxX2sazt5Uyv9dH7YSmsM7TGaK5Wf/+wgfoC5LTqE3Gv+jLUzZIXJ1/O2lytiXvjtXOdOafGYN0pDzE2qT1hDxw3OcfMrfYYvzVzxBzOZjjurBHm+wWfdeSsvWZqVWJVYg/EboDFyXUP/UtujlwXeph70Ddq/Oa6zNxjl5drEDPQmoJr/VKP27zffZhjbg3DvAd7f+R+xAvJPbIH5OHaAGOCb4dv0j1PuxUMmbqaexRTyHjyEF9GXSb5Z8aJjPUVi1NBD/TNifWiY8yz+3bj0sU26OCZgy+m8oovWm15dZrrWMnZmZ9tTveMf8mJsc6z16LL2mSwkJlv5tf8IrYq94j+ikOJTaP+zOvtZ9aW2fPYH/JZ1obxjPv0YfuJ97guskJmyOi5n54abB6ruWIrn/NpB84NObGexOWJxzzW2pHDz9pj7psv5Lecv+7n1le0fU+NYWEdnTqAn0UOgVxB9xT9weYuDpzWUQdg7vTtWeeRHbpKLRl5gcfArqEPJx6H+mz+Zr2ZdUN9uhgF1pd+BT45sU5jKeZzPsp01P3gKfBZjJexk6vd98SaRk/wg83TkGvHR6/vuZop88j6ZA2KL4jOMifcP/JnXDzmA2DHwJ2oH8wpdamMybgW37/7tna8nznWNTb/2P+5Blic/R66pcw699qarCHsprVtfCx876w99Mp8QmNKY+Pip666PzlcMQ33tAHUvqMD2A/9iKwh5YUvSG6F/Bq/ld83bmP9ghdgH0vdDXwBtXaxmuBMijkAf0r9nfWjT5C/zydebGteCn+SfS12x/wadbmM5y6+jPriXbt/1fMTc3T5jBga/cDEg81/49sZp2TdD/PK/XGvyJ85EhfbNS2eMLqLDqsLwRsyftYxc4pOmJtvThIfiDW/HAFr132kdhCZed1glsBfcl3WPp9BJ7gnsUz5txgmYoZcw+uTnyX+SCy+2tBqEczVxjycwl3Z3Au/OFswn/C6B+jPUh+gXtT89nwV49josThCsNlgDT/5jY4JPWA9MR731tZpkRu6YnxNHB19YFyrO4tzB0vBPg9+gDpycUYPg82+4lDEV6DLWevWXJvX5Prsr9bN65tzP+z/YmLyLJ4sOBl0gmfw0zw/86cGS5u/oQ+MmTGKVwB/n3Git/q04E7Z77tnolP8nXUuPh07OXxm8MzIRz0Avx7Z8Xv6VfkdsT3ETvErDlzmEbOaN6IWEXt9F0uqv/wQ8roX1nS6tJyQ9rkYQ/RAHHZ0ePhx7WXGJgY38nvGT/hmcabIivE+K8/D5mkryjng2vhD+oDF5Jqvz5isjWZ/G+75oTCTl/EaD14wp1xj9nI1FOS5GHQ+3PZ2sZPFkKIPz/jx33zENJ0/5wnsWR7YAHFUWbdeL3PPHKHb6AjyYr/Qx4uclAVYrMiKdc/12QfEakdWyGsYxq2z+dxiPsmTksNITL8YXvzqOCeXtf5UOPaP85vrU+tvYU+aT8F2Dl+IPs/XMS6KbqOfcgewnbGjyEm8KTjTyI/x8MDX4X2xiXBL6nPpU4KZJ5fBmMhXg5lpbf3u3vUg3szH4bdqB4wHiRUzJvIiq0lZW8KW5nk5GeWe/YoxaeejD+BNsWk8izPJmHnNOkUPWMsHXjn+H7E6MQU45uiYcsOH7H4yv4LrISvkBE6TNeP6B5unb8iecNhVeQzkFyqz5dBZl8Zt+H1wGOb3FHP1oLk/uCnwV+I7UdvuvonclD81AGJl6ozZqxmHuBFyfZEZunzuibGJjiH3DccEnpE2Lg8+hyzn9xhnZd5Zd+b/y2Pgt8QGYwdaUzenc8UWP8CXuY57+YPlg3wmz0tOtmuT+V++Rd8/D/1Y9vvoAuN4ZrhFrnNsHnFM5pBxykHJHC1PzPusTXN/zScyZ9qU+j9iMfNdZCJGH14WayO2wTgDv+JiK+Y7ITPzKPXFzMvlefkP8aKNkT/Rh9i0Yo7kGrXWhT0WQy9O8NiTNib9/sw97zk+9kg4Rt3LxKGDNSOeaaw4/NYw3sNMDQs+rIB6WG7ONV55Oj6AHDPqMs0vsj+7Lpt3QY/1R6KPs/3yYti78NUyx+zP+LKLCxgPusH35FsVi8r6QGbzbYbBxS4sR8bD72RN7zrwM/SXsJd5jW1xb83ci2EtptP8Erk58tbURKh3FEvgXplc54+yl+UdPhUn78S2Jg88foZ1BHILzccfeKEjt2Wcgs/MPgkGl3XBvggnD98v+xu+sbodPdDmsWaIE8HssVfiM8dHFncW/xY7Zh6r9fbVuBjTU/GKnnJPS87TvHiufayPYOepA+L7g4FbPj+2x9wF95d1fPAKjv1qfiw6zpjknmXuxM9nDOCqmUP9x8iFvUVfufESr835wcmM3o+Dxdrgd5Dj3mPd4DfpX0YXjJmLd3buc83VAuW1xGc235V1Pz4F6wX/fzyth+EvLWYQswsGOTZ3uKjVbcTcFF8jzyxrGbmg28Y1xKtwTbjvjMe9sXrA/SMr46rmB/QXsjbE41mreXL9m4cGS0bd94LFveYu0PN76cJp+7sXwjEwrm0MSEw7XLs1VWo/1OSo47Smx31zb/qtHQfzMA6N8W3eP/W7nCtz9a3hWxccxhrbwl4ZWWAvtYF5nJwc/ObaArlutfuuk8hpeQFrhK2tWs8oBo+1OwzmOZfFnD+Ip+vega8duSzXYh6wOC5zGq1dWtOrP3v6/81fMudyL7I2FhvvsX8TS+lXNxY0lwKGD1+8uW3GsfqJOPg7OYDF+1c/8F4+wRWDeuIsqY9lXIyFubE2wx5Gfl+8eWQdmXNPcgpj89EBbJo+AbEANiF73Hx6bCDrQOwxuT/sf+tczNPmHzvgnDKXxHXkA2MT+B6/a6wZGylvJ6/NMUVm5iWwtdTa8rfVLLdfrl6H3OQQlJfwVFzGs15CfFz90M9iTcFnzXti8TLvrL9j/R/2n3Hhv5qzxF+BVxg9WAyADlsXiY9ojav5IfkYjfuMA8Agpp4wTLZYs8hu9T18APkB5KWuOZ7M+4N8wO1txo7leK8ejJ00jo78xEiTm4tc5dDiw8GDIEfbfCVxmmOFY0ZcHvvseDN3rlXyGcWdIyN9ZXAi1BKpkbfuY7zH9Vg3xAvEPvl99kzzvqyF5gr57WF38ZPEsy9fCpYmz/r9zdsud489vHIS7xc3myNt7Wx+lfxF8OnJ/w0bc8V9Wa+NHqz2pQ7XhxnPAJu2mo9+QWNo/VlqW41dmH97FrQWwPo/arLh5VD3lTt3cATlEEQXFsevtjnbf/ZTgB87TkZkMC6C9cDi+Jafm59hPh3OHPEftRr8M3iQ1FtayxrXzDVJ3ou1nvt37PV9rCG0jijmj7xfx6aPSQzIfkldBB4rnDxqJnCa8x789vGX5iNpG7AV0T2xAc0lD+Njrj4ys9aQsei75aEtiN+krMYzqi+w2PjMCyNLcPnYfPbG4k3RDfFUsZnij8jRxT5zD9oC8TGHPoK7tq5LfIN/k/vXN869j2c0rIPybb3U71L/ATtWfL64HrCXuR+xaeXOGqNOT6kBX2z/ODtXXb/GCvxNLBaYvGJBmSPfi80Rx7ZaJnzIYq9mp61VRB+cl/xNDnrG7GvsG/nfjm/x5LgU1v2I2curvfZpMN5Ed/LMHOtPYlOyZo4a21FntkZMPpHcT7H3Yh+LERUDBS+AnHlxO8ub3eUqjn+Mb3Xykcop0/dj36jN1P8bLjK/qR/bvL3YvuKyHUveN4ambwR2gDWD7eLfGa89JYpvGRdr638xjflY6s65/2E5zEnVD9x+pe9HLTv3aV4PX5c4H5tWXINjLa9Q3xg/kho3+Oj8pvh26vPZD8zVgFMhnwKWOvNnLRs/F5sO1qkYTcbkPkG9nvpffX7mbxgXMfKtkYDDZP4OH/mwJ+OjDiOz3gTaeWoq0S19vfpZw5ssByvGprgFcTPks8CGM+/Nmy2PNh2YP8d8I09rK+XvjuM6npm2BTzVuFlcq5wM12l0wlp38T3u9cUxDQNBXGeeuP0EeF6NT1sJhi7jUq+os2c8jEOeWew+YxkWejrqnFLTRh+yL9zlHJqvpGZN3RB+WXAfw4iI5Wz9j8dw2uPNyqMrvlxeIXLHd8N+If+sf2Mf8l6r62V+mFf0WexyryMOF7kVh2os0FhwNRzxgvERxrnUVsxOFmvA/Qw3tvqIuNb4ZMNyj2u4WoB5IXpPUM/L/BofJI/GemH+xNgVEyWGJuvrxN+DW0QmxaLKayh3wXwWmJbMq3zz8gus22Pv0GN4tsU4iJeqD2hMlM8zJtaDY6XeWmyxY8LW1N6PL+LeRg0K3g0+QPmm3JNcMvhGcKPbF8e8NXmj9vMwf1ke7nBsxn74z8WEo2fMs+9xb8WosHatu7d3yLhyzAMxjPWc+mPDw7AuGBd6LK4FDDF6UZy5mJhiAXkW7wuGlnpxMbDqCvWWcrD4DfER4D97rXFjtGWZj+kbchhOdj1uTn5d53I9T7hX1vd4CdpJsJT5OzIWL0iNJL7rOGDqAvwD8OHlB8kZGl+0mJ9hpMQ+keMF34rfVwwYei8mGFsLnrXcf3GA5TKOP7l64PKBs+fuEfiJzeuh6/KtyuMQQw5Hq9xTc6X4fPwuawa8OOuFXFr9qWGLxYXAoRxfpnjfcYrc57F3rElsXXnycovgw+KXBW80/JRc4+gkn+NejQ3gZ4CRj6zE2VJXBxsMz6n8uK1pZGp9vNh/5DY8+XA566c0/PPwW8oMnhv3QOwL5ntYefz8yml+xPqhuAbhc4D3LVfGPD3yI2ffnmPGN+NG1C5Q+x4++vRZwLiTO1zOt1wC+Re5J+pY+q3wc8g1lMsm/qj2DNshdqP5QeXLvOHXRwbiYcozG17WGJY5LJZc3hd5xfoByiTfE7dV3IuyL6dwsc+BuSimu/1kTjw091q+wziM8ugyl+In8QPwcTN2Mfj8TvXNWj69KLr38hljFeaP+IQ6YntvmINlrwH7Af8CTg17DDYZmY1/VLzW5CNHhHWOHweuupzA9RGT/9o6L/LYnItfAo8JvxVudntpiCdfbRieTPNQ9lUp9hy/ZP2jhq1fjUceUO/de6tOLochB4Vx45vD7SBf07WwniDqOT0weA1Hh33DfTHyLDaK+0M2YoqLRz+w5kfddLwmeY3lC/E8W6sf1FhK/yqyk98EX6jcgXHJ5JbCVeheOv7mwV099jPtAxwzanblcdnHAT5irqHdhadTbu/kO51WDuXErhYo7xt/Ft1gLTaXyf3OzxoXVl4L+1U5KfucuXDybviRzA2+eHMy48uZl4GzWp0fr08+EX4lOfZyB41HghUTN4ZthqsTXd56H99OTCa80vbKWa7h7G1Ef8P6ufbQ4V7RgeYLxn3e+LWF6/EBZ4Tfo3Y5fgH7PfYLv6X8I+0guaH6BOIEO6Zh3MefWo1l+PVx7dSdXofXckpZN/grjB1eCvsYfNntQ+VPynEAmwbervdhzaM56u3n6sslN6rcyhd1XeJfxO7yQLeXsx+XSZkh1+qO89t8q75t63DrjSL3Ciye9uWQoXw19ljyjeXK+Tl4J/UN8CGmM74uR1QsYXPi7t3wUjoXzmu5xchh/sT2Y32m+BHiHjrX8ozKKWOc5t4TLxtPtHcdslkPE+15+VuLlRgvcjz23uoEtpX9T67+EYOMC2cvL2ILcETsm6yX8pmd9+4r7oP4g+Rny5eeT3Pyu/NvYi7GQjwzLo/9MNqbYDmZg4d66ITrsHzFcTmHOXeM0YVjj4gvSoyR94Ydwx7ow2BXWeP53PKuZ8+lCzdv+9r4e+Zny59cfmF9E4y12rvCvhDk3KhL0v/GPgnHZ/TH4MSPv4Q9BNNMHyN0kPUcH2L21nseRqw5+/kd4q7LozKvAj4W/wPfutjb07dEt1vLGu9/GOBx6OZrnn08y4+aHtvPAGxauf/UEp0DcMr2MD10XAxD+fJc31i6eCpjMnpOto+AtXuesQHYmcyx2Fd6UIDDREfaM8I1hm9X/RhvX3uOX43tx8cw53DEq9adkos9e4Ug3+YkyTOIXa6fZr8EPiP/rn0F6hOdmGbGin9bnOnsG/PFHC9OQ4/Nx4JFpucPMVw5Zqstos/DGBmT1O+z3wu12axJ+3WSpy8/zrzh+EWr2aELzdEc3ClykkcOf9ws+bb1z42Xo0vzbbY3qd/dZ9bH1bkv/lxuDeuf3kfoeX0n6ovrycuaZV6GX5GP1r4w6x9zrWfY1zUyWA1WmRa373pCluQ3cw1jM+zDsL/1j5ZvNEZv7wvr2fTObb6OmNW6e3KXcA/Ib60/zPrlyHfLOpJ7GJnpx+CbsG80BpQvWG6Q+aPmXcUMkHtvDm59ctTz2DdrcRmr/SubhzEH1Vz/OMkn9691ueU9rcuUk2XupXqLLSCfDB6LXOziTevSeX98Q+Po+sWLhVxv9RutM2QOFy+u/xJj5p7FoTXnuHyqOCXWa/t/KJPM3XBM2unZuawh++Aw9+QvyWGDb0Uf2icYnbj2H9qz/mo5brvXxf+LT8VRdP2ulmmOkl5o1GTJx1LbRC7YS/oCRbbicstDc68k39l83NnDsn65tos4pX4U792rD7R1JHhE0Vl5OMvP1Sasz5oxa/tc6FsTd8CNb2+i+frWZ9rjy7woWCjwOqzv9vqQL0kukro0ddX2NuQzYr27j5szxb8nVihf21wXc0Dem35MGZ/9nO1ndax562rgpNvXanOo/jfHuP58136yi0n1j8tlRJ+Wr1wefjXN2ZLtD9bj6LfXnLZ7CX1KiDnws9in4ZriE9HzD85Y1jLykHPV3tfLya3GrF7A0WDdtA5vjZocZOsT5u3oKVXcqX5pc8LLx1s3aI1pOIKz5lQs2moOBz7p8Gn0DRrrr369OsBqHMyZNbDYLPZ6+7pSp8045RRlrNZJqw/ijej5Sb87bEH72sk9xy4Un7++0u6x7eWEvIeXX11R7Fn5JI7tTp/Oa2+w5daXSzGmbT/h8c6uuGznvVzVsw9ka+9XTsbWk58Dm9c+O9Z+iDmbM7d+ADef2iq8q8z98ItySdo3c3WFo4Z1rP3VGeVBRDdYg7y3PivLba6X7eL/B/XGvIs32DiHS5/dt8dA+zwZz5Qrb66ofGJtFNhM6jJwpMHVwc0pnsT9rPwta6rRB/vhwjckb9b+R+ubuhyLcXZeX/v6jV92FyM1nPxZdy4PUR0p5sj8Gb77bBz7+/T/0ifzQbK64rLGg13MvV405gPay2D9j+StxWeSx1Cs/epJ45OBaxGr0d7aq3EPoykmuvj1rRnzmu39bM2IvpTYK+zfHczpXZzmlYdyrdWMrybHM9cwNoU3Ve6Efl1rItgkcRbFEnjv4HTB5LU3/PrCDmNjjT5jMkdNHj/XOXNmzcWefbs6V/eqm96LL4G9Xr15vdpmz898Dv4t6z/zpu9QfNW91vq9cKt3H+QV9CnbB1hONvmScpatsVJ3xuYPVwAXy97+WePtA23/7NpIMS6Ro3YUbAM4DvwmagitiejPticePqa6eBnL9PTJ2vz98ZlyMyu31fbX24hrbn+2bwaxbP3Z2TDmm7m35z9nVoArh2cS3OSwdHLoayPETJVbvbGcfeba2wz9Wx3pYXGl117Q+gK1Z6v5raf02d8T3/0e138YLPv1oQ3oeRnWg+AtRb+X2xkmSy5pMWqsG/gXngUQWYFXQI7iz3vug5/NMzZT/As+JHs/WPb2ftc/ij6vz58Ym2GsH4Ax1F6Mm3cZs/4tOIz24lpdYHV38XD0/q3dZyxizYsr4u/P/OSDj6UN6xiHm13dZn0qHBf5oDOneOAB53OJJ7gPT/phsPPDys2OsOetD4N9r4dVqv/4IP4C+jN7enJziZFa/zl6XB49S4ZFEIMDBgueUey/WFKwa+GTsT/wGflsxR4jL+zE8GizIdbn2/NjdRbrb93zznG3d/GD+uYbI15shfYRTnZ7clgHpiaK/ae2WN7MeBnrWS7GDM5J7hvc7IGfO858QB/UbfDm4O6bDzjyg+1n3B6D9iEsHvQutvw6vvvNzV3c/NbysEXrKT8c4901/3Rw7LMdw7XYo6k5u/HNiN/EpZPXie1DJvIvWfvFMSI3zwKJDyDemJ7geQbXKKaRHqH1F5Cbtdpi8dfTlPEsJnqYtTJ5Lebd2SHaD3oql5tnHgYb3f4vw07Z/3m48nKl5ZeAMStP0x4TxDP1Z4fF2rkoxoLNEZlbbM+74Z1OH/8+fv7DPI4eNMcZTesHuXr79byA4RLv5SvdyyZc9w33fOpMzV+vfkOMqwzOXt/h4mZ9sA4OPlkweZl790d6GGTed17SOC3rl37gkY8eROQVnZf2CBu3cHhMecaXNf0w+6W5reROtwYWT67PyHpyrK/O0S/miFmwXde9DJ8AGzDcvH4vewPc3PbDtv8MOTEwK9Tqe3bOek0sjyEHrjmshxnL9GVYxDPPSz+W9mgWUwEv4+5ZOA9xHtTVb0Y+fIffm7xWoxkWwx7f7TFhHFyMKXYAztb2Tt5nzxyPydgwXBfzBMW2XHHr6z02/IVcGjFY7e/c8d+PnyX/6M6+IH6nMZJ5RbAL5eTod+CHZM2KqwY7BFeefapj0QZkDM/4CTnbLPZs+i1vB04+8WDPBFj/pBOr0ZzWbNswz6c//yBfZvmByzq+ztP69J182tbXl/d5uo/lWeczk59dH9LlesczHOeQ+Ru/YNwi7XzPSMFX1nfGJ6AvAfEVe+bygnleDchcfdb++sTM9i/eedp7GTj1ng+zHh/my5oHIPZf7lr7HR0cL3b9WeyPAH+KcbHe4UrCk2ku6+i5c+QxeR9Zic8ozsz+KeT+4/uP94ps1wfnE5onYtrkD4f1M08KLrvYxTOXU5ndPTvlXjJcL5ud/8b15PmQP2tN0dpG1r8cpPbDH454vuDJXQK7XhnqM0UfzAelJrAeJfu+89/zAPQ1qO0TI4MhHTefnC575wPs2d1eFMttLd8vRhNbHJltzneWxc4ocTzktTjfh70s98l6l4uPD1jOjJwp64E9P7DY3aP35oFv3L2bf6LuTB9j9rLOyXqN3S9eO8+04YyGnRdHr7HWZu0DC5aIPu+X/Vus8hWnfplzc8x35HSetQY2i9pxz6lYTcr6bvGU5syLr7XfCLzr5kyUHXsBMopcxOjDy5O7n/xKe88tF2gvttSZ5PvQW7D9V3dewvqMPOzZb3f9G2MuYqPojbUY8A/gfsvRWN9G+0zFpu3edr4bfCx1Iu/D0WJvWG7Is1+iQ+ulJyY1NmD9voZf3Hk9wz6y1vBL77kO72O7jfl6Hs7OiRF/hv0nVm5tb/ime8VH7Jsf17Ogfcv2N+sonCMIprl97ezP2hrjenRaD83c7iwn86HkxSOTZ39q1jn8hvYuWr8CZKmPBZ8H+x8bwmM5Bc+BIv4n929PtqMvlz577eRw2Xfju3Of7DkJ85Fn64d7MJ6gdl5833By2p7M1eK48cvNbXDuW+yCeZ72bSCG8RwY+Pntmzfu3PC7s2ViW+hrA96n9syzn+DPVfbjHiz3fvIPqHFu7B3vaofD6awHNNcQf9u+HKsZ7JyJ/c6utd8ed2/x1WpvO4dHjEjmfhyz4cd3/pfrpmefzG9er43ZUD6DrOSmle9gvbw4RutKYPbif7H+zQO1778xP3qLL98zfqyN3aP/gGd+FVM8+3bmXIt5Mv/Hb6wPBPF/zwAyl1v+sHgQ4lxyO+A/4G42v7e+asPnGgeR/8f3a798uT/0TumZBp6r13rKYpLl62cTrmcYzX5dfbnVgdEd+yvXt9zesrrd4gD1jfOzyk39OD9v+w85o+XW0MH24xJzJY71wPV5tkXPtzNmpiZK/Y5aXntYYuO1oYn7VueTb4S/RKzXONmaMD4//mP74p313p4t4jja690YHtsWmySnhL+R08FXZC9tvWdY/HMfo1cNde/2Z+b1cNhyZ8uX33l23N/6Ruqf4OOVO2M8Gx22p9qwLvB46VMjX6HnSrQfC7q8nu7ogzntns83Tt3O3dIv7Dln5xlv5VjuTDfXMbgG8B/NjR398ZP/bw+z9eiSZ5W9e5yl9VvTdvSMoHHwmW9zCeT7i3lez/P1l7R3NrWtYvrk6bUP6XoaMa+rhZwYGvBT6EXsgjKlHw+18/gB4sOKJRN3pS0+OCXrA7Ua1OrTBy7ksAuuDXiI7Amtp2sv24/MmJj6QXEXO39tfFzjzOibNgisBpyK6qb7GfUJ6r2Zd3371jyQw3pyHljInv0HfqA9ftFhbRrxP/WfYmzXP32x4HoN65vsXEBqhMW5LefhXta5X2/6YV7F0aJ37JfDTRXnzNxOhuZSwJZE3zwPqrYGGWlr8R84IxnuDniPYvCGyRmWmjUz3LJxbvm663Ex7tV6iIqholdl1sPO2lrefXWX8TJdG2Bfm3NYHcD9GtuALpgHOc55uuIjdvbtefZb/YjNP3/fGR72fi2ncJj9k9MEzrq44PHg3A/gHcHT6fmu4/LaQ90+fIcejXc3PNvqfvOf1vfa+LDcidn1cefss0D8S90qOj2/z5pYfTPPlSDPBC+HPus9s8WzUDgLlHiAGKB1fPluPd9zNV7PQsZmeq5w+Q/Dhbbft73Leg7QHnIJivOT+wOfiTx+/YL17dv5Esux79yc5Ud2xrdjgbsAxrF8hOF3xfiCm4nc+C05tmD84B9TJ+Yc5OKDec+aOLIsr/fUJ+TfM13E3pffsnNnxhfZuX/rp23vAM5J6Nnn4sT7XezhzkNcLkluDTya4grGF5HfBJamfeG1r5f+Z2LwivvVP2mtWkwU2D4wGXyO9dAzCeZjrGe9PISe22SMS52wvcvlYqDfvN8zJE4se3t7ea/0LIJL0N5vO3dP39/zn475sqf2zmjhb+13J1461xUznr+tT7+1cWqi+b316Qb3bA+TXNez+DkHsDlz9YSzTHpWzvjTxgn1D07+Y/HgO+8Kua1fkee9sefz/fYx2pjHrRBvDocp+i4ecRwieA3oLtgu1nv7UuzsSs9bKf9OLk9xJeMPicerjR8/cOfhrD8kc+P4iQ+r+8O0j5vEbzpf8CZj593LuF57Fo+ftTNZ1jv1wLYe87Z8l/tD9w73xZ6hY62q/ZHPPjnFM59nC/VsQXWpZ8jIKwNT1xruftfaCufsgVVDtj0L/eBKPHn2urFXeVrDmZxchPbPswdR+REntyhyMHdQe828a0fBWJcXoN/VusjOCTr5rcWdjAu1Xuf8hnyscrh2jsjWjnkd7B9ro72K5aTtfCs4dowJnS23QD3p/e9MAH5f7mnv7bDbT/YOsa83OTg4dNX9nR948ACO2GxnP42PsvNAjDlrg4ZDXy9/56FcYXRVjn9twuR+8kOxcz0jS5sFx7UYcfmB6E3rnNtTxv06zyEsBn7ni+3cptOXyVjcM9tj4uzP2x7NzO3O7hkX2LlDP5BlOSXwUYavH4dR3ljP9xlX6+Se9+wJ9zqwNGDo2+NMewgeqb1C5UP0LORxL/dbO1dNO9qeLNrgrjdkNl7M5sc9rtxgcyqpgW6fHl5sfvb23/XkPs5nP+z01p54dXgW9JujP3TxLauxyGepvizX7hmd67dSDtnOl/Ga5bzsPAOx+dbpW6eBd0Tfpp5TNi6/talylcad3bl2w+AsBzuuxGRyPaPMtbj+Zu2fatyYGMzYDf+RPlrtDz47t7OKtWf23zvqu/Np1l/WuatObG/2d8E7FrOz2v32k3E2phPj4m2+5jOPY73cv/a7Nm8cnPmX8xcOvOiBGUU3hiU1lmztfXbMemn1ZLWyxU3Ds3keSs/2EZfYnORir51vKn8jfsyB83nyPLftVcqnPoKyIe6oX7aeQLy2Lo3PTh0BObWOu5iXfXlnXe07W1/Klli5NkcscP0F5tp10/NbxGBnLMzJ+NFiydozSjxh5OiejRyoXZYDNlmJnSgnmeviV+3M05PXDX+g3BhtG1x2/PfyeM6663oJsP/gvxHbVdfGYfE8+OKP9JvhmsD9Jn5ovni93Xd+lDFla3zrxzW88mI994Ce5WQNmnxsz+E9zxZK/LLeGHIb2Ks98/zAcp29RlqDZU/b+Vrar+L/j14NB19lePT1ydh5DvbTJh6Dm9Wcu2dCkfMuPn08t5PXhz1pzCH3uXlT6xrwtYrV9Byc+go7Q15uCc/t97ozeIfvWB8T9/3G62Ib6kuMX6Jvk98yZ5IYUi4hdYj1p853iMUWm60ev54VOxtsfigxiPaAv5VHpR/Q86X1I9vHf71s7PdBLxbOx6Y/SMa0syNmt/Wds0Zdl9T/d65Rbb18POIw9IG+ueDairG3t2dxFzvn3JxN/j2fcX79ajxy5MqX1a8ff4lYtGeeGHu1d+q4COYXOCvj0ht8eVzz3I3bdi3XEH5l44bVnHeGrHn15t/lGFxqD9zjcHv2rt25w8Rx+EfGGsfZvOubZq1hPaDt/9XcPLmTPMQRcv7P5ex5c6SryzVnqi2zB8yRbzp4h4c9m17s/AF768CdA+9C3w/0tjbenq3Uktnf1ueIMxk4L4aefPR/Ke/s9GEbU+LfDcMi7rC9RJQL57vQO4m8JedCgGWl9tLec8OsgGFAdjujRN5T86PL0e/cLzm11FKLq17/3HHKrv1APSOKeS/3UPxqYwF0Zj7UgTc4cjLjq9vnGixmexLOBqy3k5hExp2xWbNJ3XF9iz0LoefNu3bYk1fLYO+MzMahth9Ze/mQC/VeibXBUFFTuoPRk3uyM43IzcS27cza7Yc7W3TYydXOtUnMT3uYgxm49gRdznE9OO1f3TO0mWvyztqK8pI9M7PrfvZ9fcXmJ9nTj95C8HLaQ9zeiD0HaP2SPbM/dtVzStZTrDjmrRFtHPm1+nPXejE6cK1pnrXr1ifNx/O6PcQnYznv4Mt7ZqU2qDmicY1WN6bGoB7zjC60Jyb6a52usjHfVF0+axZ5bzHEeoCMQziu7bgHO0P8fvi41RhOPgaYDnqjRp9mB4xrGvcZu196EvEQR7bzi6ihg0Fov+vVRz0fCpxMMVTGwq1ZGYte/MLzbBm5lwfPTn2gp1xwV8Ps0QNwNU17qYF7BP/UXrvuH+SyOUez3On5cMYenmd99IJfL4mzXnVZK6s1i1vtmffDZ1/r4OuBYe4A/7R9r5bLMv9O/3J6+WL/ezY/41i9bvh7dGL4Q/0aag7RDcZlPb65KfsENI9mnpT7aS3sLt506/0uX+Z6XpBjK+dQvml75Mn3b/8e+z3BkcX2dj+WX9TzqcRSgjGFU0G9rPi69fK1Tx/2rHuH/XWwk/7tmGtzlOOsl68+vC0YJrEY9hI8uBknjo9zCNpDbefOrVfcfAP7DHTNWyukZyr1qQuO8S6u5O5jdYbhGMeNGZ9ZXA77eu26dZiMg/vTrwVTAC47+sz87/yf8fTA6Fhnyr1bc6b2QE665yStBrNzp/j36mVnHfQBnJnp9b1wO+PM7Eyb9WJZvG9NmV6eyJ+etsXOi6dvX2vGBNaEueL+wU4w3uHstndMl5e3FrdCvR2fQe7lk3wsOXntjQx+ATzL9WwRcS/l5fHQV278f+S3jj1g8fyJXXia5wCsxmw+G3xCe0Jqx+j/0Z5h9r+Cc1s7vp6IYm8yBs9IiK30DKD2zxdzmtrzzlEdHkGbxv5JXwfi4Yxrfqv2q32/r1yjuzgcbcBlvs9exu0Te8Vdy/Xtuf3rV+R+TIxCr2LuqRjCk0PMGV3BFzP/9myHP9sYx3r6zuxs79ATN0PexjiuNZZislzPYOzz4Lr2e2XN9KwndYzfwxaAzaKW376w2pfGUubAiPWLXznPAEiMe2JXHoBjPXE6F1y+ayyP8Vd3Bt9RRz38tYNTfdTYtfU9t2J9ceVmwSmTb3qcmTcMH7rvOOUXHL09dvbSzohffXXYArHC8QXv18/+R3E1L7ZuvUKXzzBf3jPnsZvDCI0/qV2OHZNDxNh6LuN5Lhz93vMMpmrn2+zcn9nn1ZzF5MU+j2+9swSHtRXLxHlCPQ9MLkttJnZm9kGsS3soep08rlxm5LK669nb9bLf3xPHeK/zIOYXjGcOPqN5VGtFxZksnpdzWWypZ9VkbcAp4L7tm86ZOfS1rx87rqGcHs7c4Nws+gjj/7XmpQ9YLMQwUlf+9NM5B+LqF6ID611kb1b4pe35vPOXNzeez0IPc852wL4zHnQa3hz9v3t2g34Pn8lnxdugy7Enqyfs3HjzSfQTFp949JAGs+7egq5xdk5w2PjQnC0x+4/8vDbxAjFy++CId+hZ7OtRs32N2Onq7z0Ml+XjsIfw0+GcFZciJnNn1zfvLY4AfCnnOsYfEIMNP5PzC7MW0AHwed5/z4ARr81ZWfS5trf2wecwTwgOv724tWc9o1EuRvf7h+FLPOhsMzkmrZkul7J+jtha43juy7MWYuPt2f5kD3O5k/BO8NfKNd6ZIeYH2jt+2CxrcbHZ69s/3dr5iOgU+rS53nmJ+h2cBzYew3ImPXtjPV/ELZPvJKfBGe74QJ8Ax+B6VqI8E7BH+BM9x3rnGC+/sR7+rB852OWTo8ue+8Q5abFh6LpnZrl2jjMhJjM5mdhB5NX6tDm79pc68GHFWH2CvAmxds1tmtdqjnncj/V7Xk5PDlTPABAbz5rk3JdgZz2nDc5kdV1/wDNijphmcQNxzWoMzhn9GIgZ8Bd2Fm70gXlGVv+/snNH0yPXtqOv0cjT/EehAcjREGTIuIjACnSyLrsP26iP3WSx+GcC2NiP9dBb6ORJvLN4ePxZ3rnhttOOZx5VjzLMQjgD6+Px6n7WQ3+UA4zPX73tTGEaOfbpp5EuR4eaVP+LfDBuDmN9fPoa5H9yTc57hKcjZ59a55whsXvE3vVU4zFzv4kNQLd7mlJyJ3+c/a/e/9/eYT+4FfWSnPvuzMQxCEeSf7G6GeMX6O1ynsdcYFxDYnceYPldyVVdn/D1foezYk/ZL5CfeT0gzJPPPvK8nHgpR3ucxuetMS19c+edGXnx0/npPuuZwqqZK/3L/P/xU/LVOV/hDr969mnBVIeqIzKOuWvPr+fz62N1nit/EP1B6wlx1ua3qib6+TnNgZq1p6XS50pPSi7Zb3hmv/METK8p33P5Hsx9PjO+MFKtv88yrzr5Bdz95DHzr7QewxtsXBr1R8Y1lGfKfk6HdBz2uHnX1+3WD57t6bP0b5lz8ufn/ek3ezg5vs/hdPWBnw7snb1e399m/GKw0S0arviXnt+XczoP/f9WS+2chc2PG+/6D3OT7rX9EmYY9ALw/aVGnqaMXAxqgvkbVcN6b544kB5hP0s81/k5zWfFyA4/Gu42rax/vMemkZQH1jcHTAu9nFaPRvA003tWR2w6/Pp55ceLT+/mdOSy+f6mqUSeUL2YB4J6wpxPZurss/UGv37+zUvk53Lv4wMNTwMOw/Jq9kI8luetz7xxGCDxEvRK55GbVntY/JcD7n7/7bnZDMBzD38pLDfa8Oqa3TlA/P/4Bc7Gmn1Mh0n/J2o9NAaIcfGyznvUK2t+dvUy2SN53KdTak94mKr0Flv39uvf8XOrd1/OuP5gnhF6HID7PDEzDVTvtPXzrVPgPW9+leee9d88P+LK6t843x9jO/1w6sizj7mz0nf3rj4x4NvzUK9u3ATzofllqMVljXx9IpszhfmIExtPlvMZHij/t3RMftfvE5e9c/HN+ewVzA9IvTY4DyfWiimhVkKXbfoiaptSO02DU28S7je0g+QUnvrmvIfnnznvLz2i0Oah50m/aHyUu/5Xo0vsC7xMOHTMM9a/tRe8nlSxvlr3l1o//TQ45mcPp73wvAPEv1ysiLnNuV+cVexuta+P19N0pcjl6MelKUUe2N3WHMD9MS/T6+fwf+Y1c/FWzorP7+cVkadHM4TuAPvm5P3z/OTfdlbI3Gz6jO2pMLD1sPMADY/+zXl+4Vt/vJ46K80IirXy16y9j2Yl2Inz5w+vOO/Bh9/hndHznwfk1d26n7/aLv86tejmm5JWl5jts3/STE2b23222UPr/72fvr0AtUjGN0gfTS3HDy+r3L99JaYtLN16v84uqNPoT6///vQFmfNMX6I6PI7xt7ZL8z6MYlj85qMv76H/zx4gvtADWTx19rT3aKxnNry/4x6af0z++c/7m3x2mhzigOmZTytADAh8lnQ34CtsJiKHa7HU2fg5G/Z5542YHnMazO03+wDn8zqTQHOG+4959vx0nRHgEztPI/ZydZ/vAT8c5kj0stMlP3/X+0we6M3V4mpzFxT/7XWND98z6fnzo0aIS8VzENvkz5ADpKELbm94m+4C3zXn++zd92ybxZrn7RnTykg/L90EuZd5Mw9L3Cw0DGezZc8G/d383dBd4HNMr7pc0ne2mpL+K1/OfzeDE/8B/mlc1ueZtLuzXE6eCVgZ4iNaNeM3hV9Ptysu1PPGAFMKFouYjzcF+trjZdUTfB423Ombm1Kn/uXxemaW9LD43vkbhTVsDlxdwyw2LLG4I/LBc8/Zk8iXGP4M2HvOPBytzS3aE2oPnzuCZ0mXV4wUmglgh8HZfvIMtXKJy9SlYRfgFagddPv21YXmwcNxqFM0jI/5K32sYRns/w/jKM5ld8Hd/9M0IRdIp3Qapvok4SM3fyW/4LBsLawtxsFQA3o6c/Gz0iZPUz49m6fNO+xPGOf0i7078MeaP1D5pDjK6QqHRU0X8Poh/eVl9rSYiXfzVbwx/sawYqAxeL03fk3vyf/fr/JPiEWu//x/hkVMs/Phlriz6FnAKR8mME7x02WlZsILh3e2/rwY63HHnk46/qrD1bsfOO9g86ZDya9xTqoj0qmMX6xvDDj4YWc503oZbF728ufxGusdh/PPM9Lca/441UZX33++MfMwqx7M2/ZqWl5+a7rKabb7DqdZzDlxjTdzTQvLvTZM49NKATcNR4R/fx4NdxZ8ORjPQ3H3pdwrODkfLfm8EfMH8n3GTZjPEPEt//fmda93A7YJXMg4cj1XzyYuFF0H8A/wjObDEa/oeT6ALxgXz1xtfkv26cMGzWOJ55djPl8/9w5rsr0j5hX84/gmYjvX93VdxqGxF3Ce2X3AWYKDNT6HWIr5SOWxaZ5x3qdcNfmki1vD5eUjFCY/zsvTtuA+ON+jrgaYcOrEvTM1Y8fl8ufPo+h5btMfAZef1hQ92eVOb3bKe5yHn3Ou4QLNd/BhAB8KrgM+N7i/s0+qhfOEEW83DGBeZu8+OL/KteQOG54iz6owvNU8YhXW00tDP6+EeBXP/304ie865yfjvD6+zDyP9D0A68g+B7M4TE9YnzD3Yd7lHhJb5tFWjWlONf+1uNTi3fJzHPbYv5+X0u7Y6/O188G+mvZX5y5fhbhlcQF7L8WDp32wmkHt7d2DF1/8lyd291c8qeZa5YLyacY9yzMiPKVnfxq+xvrhB24NOV4We4p8c1jP9t3Vs5l/TzgttRQujjvvE9cXjia13Dha9QyNBfu1nFis+fqk8ozHlcmP6Pnc8lnhivBZ4blMbzGeQ+8vXqdrQe063GozmbhA3mX0UMg15p3gOwcTr5cP8WJ69GDd2J/zq5fLNGxX/J96Vulyxn/S94ccnT2yfZW/jP8/3y75Ivu5Xx7U81aZRrqcEs4usY55xmJkZywfiWKL+RxniL5aXnvDJcqfGw77ctcv7kqfvHm+cV/mrcQ7cA+Mg5TnSflKHh+e32HKv/5x8Swff4T8lXVd3IvXlX+CeKB5uNmr46xNvykPDzkj4Lqnu5+HAe89Lx7XmvgIB8v4dXk18aTz/hGrr7/x5Rg+LfxxR8u74kjyDF/+Z/iSOC31/VizzlK4czk84xEZC86fp+3pu1s/OWxn/lB563w9LNNOi6f9xVKrGQDfiB4LZ2B9tvRqfJ5h9v358uF35sZRj1OrRuO8WR63Yj6dPL/cvv13vp75iD4uL3j76b61z4uNxsxpc/gczLq2F//6bDuHrNO0SuKSpMF+48iNR2kXpM8VziTuURpXPUucneo2PbE2++B70oQorqUBlgdU/bI0YPLs8q4dX6ScS1145mvUOfMByl/y6UYsb788R+rxYQy6v4gxi3PF2e6Py3+9OcmXW0MuHje9urvZSDMYfn37c/ob7rfFxzxm48V0p6ZlYR8fHM+pQ/TSHL8s35dmZc2v0y91L7CXyBHG/+M96E8wrRo/O2sxzbv0PKwrpxPnunHPsHZbD70f4RDvPcW7y4MszkZ5SdouaqDOwzcM3BezJieZnBR+F+9p/j/m5ONJfnm6xjLqks3Zn87TsFf0LKxjxsFOI6Fc2fUBL7+7Py8oPldY3Wqz/Fet0dHDP72EfBXE3Q5nno7C1dqYhxRxNU3+8e/7HGm2NqeTH7e5cfofalaeeGBPBhzu5nr10NKTL/blXUscMZYtFzdXPue5evJ6EZ9a6cSvvOXbP+qZnGfLd1vtjrN+cdq+Os3lpM5VhtEWm7BeXN4g4hQ+fS172PkPsWeJObvrjDn2A8brHa+6+w9eQ332enXOW4ZB5p1Zu9CfXqyg3k131ft/ul+v58CzDGeQrwU9Bd/RtC7TBDdu/tDSTwfLnH3eSeUE1q3TgikG1iewvpg3qtrE9BXnv/58L86axp/RNwqs8XCd7pvpKng/kMd+dAHiOPGcrDFnMCxBa9M8TU7N9P/5njgzciiHw/YuJJbAo1jMT+M4DwAxjnhjMeMYRyvNr77EPuxclR/Ws47HnP5rXNZ8S9NDEn+O/vf8f4wDzGyZv6DxpEbY5T01o+z+yGtaTN7y0rxu1P5hXqD2N7yxaWjOPzjflO/s6eFw1399fmp52LPm5JDTHkyP3DMdjno9WHu08zhgPxDrm63ZH5/nl3X7cObxDMJ+G1vRZmDeQf9wcevNSzc/b/5gn/SDM2i2bK4DD4f+2XJ177BxlPOe/2q9/U7/2djJLOPjRaJGKnFzfGhnGcv7yzPSSSj2izkAo3PembrfaPye9a+/lddHsw7nH+CLzp6Qvz3eY7hctZm4P8nRqNnme5hm8z/p2IfHeR4ocBQ2ozTfnTfy5Yjf2rCelxijafu4xvMv5LPfffx/L57ufKUNGh/H55gGlLwV8AbU5cSW1fTF4mrR/H7CQN31/u/Y8hef5wtW36wcoZqtuzxfyO9s+vtzjQPDNn/nsk9fNEzD8LD2EFZLqo+Fzu1mL8bB5kpga8/7cjYPnglMBlrf5y5QJx48InqgcF3O74npOL9y/s0HNp8lxzJmOpO9Z1+MEJ5uw2ek//Rzj38x23mchU+Jo12f8nK3T/5v7+D6vxELmCOIF2Z/wpej/wqe9OALxGzAnwM3MR6C/fWzz+OelgfVb2oWUzwTZ3j2cH3y1iAuTbj474ypWP30DOdllpd3Me1icg63cjyWeBY/59dhHNMUb4/Y44qzP2+ytCluLXTrL/f3dCjyfxK3lj8W/LL5J1y85p07hMv3fFE/MNs4f/bL+5qnL+dfLbJz/v2c3P3/4Gn03eM/sYacvXg59em+Gl+sKWdULi7rvXmpGv9gJ86e5dnEnYI1hZMz/plcDjBJ6AKOb+JMZTp39ebSr0qHTV+Txavf4ablmn0wU+mDPnwac8jzXuq5efef2PJ37+EX7MLfxFB1X4djMCbhIUw9sJ6GvdTpAPae4mVyPjgzYHCLmWKY8E+B6wRuH0w+83iwDsP0hmGMZ5oPtPuQPG2135eL9588f8Kc/dTOrf+XxlWaT3EnzF3lyV4eqRhcdODRAh/ejC8wpqx/+13c5Hg5zefth9T7nI+edQ3aZB+shPPy4WF/93z9/lcD93tHqFGwnDLO4ffv/8wB/tH/5bPfuifitcvLWT+a80C+U87HWc8jzRn1cGZiWMAhHqyWmKxznsQiDuceHkaez/T/q9fS4FDv+6N//acY0++ZejNI+vjzjLY3szXKozaumbPk4aaMV/KmLh9HbCZeJ2c/uOeH24yTREzkmetNx89X0/GsYRo55aiPT/gvOAdypj4xLW2OasOvV+C//Xqctnkqm//l/UrdO59Gde+mhev5SCsbrPnhlYhdPr+Gb5HHNB3wsKndm1+vhPQLH75Qv9ebJ/1rnPF4XeQR5g87J3/5mGz+g2/9+E7qJIxbYSzjzgKLfTBmYLHF5cI9mC+Iz8LdAIZr+ULaQ5yRMAbGtOnY0pv5rpF7/Dd3wG+fh3PJXbB6Mb20PCEvbuHPsfi/9RgaL1+PYeah5+eGx/VdUR9N21ueCe/k7H/OOzFfPCFchrMHHo/l8Bt4f/J0Hpf55sphdOUxnbzi3WnoAuzOj5/5r57rk/+KzYbTjdbptKj0zqfWmB9kmHJxY2fd86pib4snPXtZzsR5hv/xP/+3fyamGl8AtM3pf67/4QwPLPP5/7yZ6z/Zq8hv8/l7/Pn5D3OYp6UYpuFVWsvnL/KHP/fLezHX+uid5VfPfq7fUy1cTtS70uNnfnCcf7DG+QLp/UbMBId47gSxSPAVqaOXC6TVqf/giQH2QvLy/EOO6e++Nx8r9pTPdd5bujBhJMPKx728fhDjG4KbPnubZ5JzVm4gN+96xep7TK8L/RJmtswINkd5c8J5azxs7H8499+z+c1pxCqm4TjNIfMktTR+H/v/pHbu3wn3FC6jOaRaYcSAeb+KSwNHfO5OzoWY9fim2wdyS8ZFCKetRvR6Ltb95ADysy//3/7uauJ0In7yr/9kD8TNMXaefZSGMHvY2c3mcGklPMzsyWVYe/nw48sUv/IyE5sNb+58nxjE83fS8DKWDffffZAGfX40fxTDVv+39vn1m0tMXyK9EnN3MCrLA//yyPznPWa92b0/jFs46LST1cqcfl25mjoBaNSM0yj3btziNBnkmYHPntZMPBb9IME6caectcg7URzCsGV5XNor+Q2W/E+/xPGA5ZRnONzRfLnSRDUXXT/v8kuvlgAxjbserLnr/7/O/UU+C9fs/H99gFf/o4dKDkFNuTmo/l/goMC9qQ134/9/is0/a5hw1cb/rVf6r/nMi0fMAw/+0h/ss86J/Yl5hqfJkP6fmrv06+nTTFOHfhnrJs9w/qfyMsYn8N4/ay9PAx7+7ovwiOZZ0yUKwy42ZHNsPTI+/oU/ufZ/d1a+MfIb38TonVzw6c8NP6FuJrM7epP1KeDgj4dnDZBuxsljjHPsaeIDWF34COcr/p1YbriLw/rUb7b+JK+hzqbXhnbKejt5df/Rfs6jidk+tQzzPTjMwyC/u1+/w3/Hy+xX9pS90/Nv6Mm5eb6YVXr25Evp77GO5yzLKZrnm+d76335ZTfeWyce3gLvq7mpc9ZpFoopm1d6WHLne3CF5lNAvPonz8y+vhhe+1ns52nY55v35r30gcY1s6af1gCfnX0u/3Z9TX0/eabp58njAEdPzXj+XC3NeCbD3Vn7N3tv9jZvh7/ra+TlGmeq369Hz9kQkzD8RnNT1/2Dt/+l57dfq41+7itnhev7Pt1WMErkMcNHdG+T39rrWZ5kXOfehKfNuUdb4tRQ5sncl/vi99VkWv8gj1yxjMP1EQe+d50Y0w/f5He8228cqFZ8XA3iL/6b532Lk0CTDxzp9lyYBufU8+9Mk0n9nbxtpztgzht/Dv2G9QzjI4i/nE5nmrGeebTrz/tsxvd6sz80NPLh/7mf7R1vDY1f6RqnSzu/ZM8vs8PhsH/hqH085592WTzO1cnx8tJuvtrTd1aelqbnnrWfJlE8DPum64vI3VV77Nb95Q6Pl8Msifn/+MtXV+KeTbm5wyc4u9xzpzH4i9d7ekzUeOjLLa7yPOn8xMkWV4bmO/jPYWurBcQrgLWVg3xynGkzeV/Bk5ovWDxZ77r5muUhTO+INUkfXhzSB1MvPoEzxnz3nG/uJOf+8/j/uzs6Xlr+FvpBTAP2aa+e58ob2hzx02N4ei3jbXy5Om8uvN6/s0pwSaeWSLuMXpBz3GkUps9jTB9PRW7q+NtpSsjFow+Ehge+KsxNNmsNU5cuH//vmtv3vTMz49L0Ah4/k9i4/Z1v9eNv7+w3025Gxr5Q73564enmNZsOX5oepr4lzC62t+NL+d9wddXsWB9zPV8184YVUONeza+bB+ZxL5f+F13Z22svd5N7/uMueLObaU25p89aiwNrRjt8jGdjGqtp9Xqf0ssBP0Gex9x8/iLp98rpAVMxbIWzC/btuFGtUzoWadiYE7Cu8O25Q+GQMg+Fz0B9wL2IrugwNGpxLt6LuUCLGuwhcYDYDKZlPc18zXgnaoWez/i9G1vvr0dgHlA9BzmQnDPwHuOvg5NND7z5uXrMw6jIn6afjYbiuHbxo+x90OOZVpazILwf4SCAG+M97e8Y38adVz9n6xZOurluXj15HedhJO5l80Lr/WG84qXYZ5yOvljYxRm1GcmV8oJH15Z/g1+neeI+Q68ADgPfs3w0fafwk8R99vb1/bi5QHwEOc3MA4ZzdT9w/qcfIdcMLbFpODyf5ZMfcy7Elc3PQh+T807Sh88fozyA57GPwlxg+oz1BZ933rAvPPfjGAz/2lzZ/Gl4UPUzyT+HY0kvPC3Jx6eEU0DPe7g2znaYJvnY64XKy4IDNB6Q2DPqjWmbxQu2Jt2X+3XamMa08ePT07X2AaPJ39/ahGUJhyPnYLrsai/nezX8ufyG3TtPrxvdXnqg5/3XC7mc1mmb01OehjV/X9zlOBryTIZ3VZeZvgn4vmnRxGlIz8Oe2HSP7SWOp5AHcz3S8o105fOELLflLDfHFfOHDyQ8LHKW9QnuXrlzTOt+uHj4Ls0Dju8NZ50usDnAeBrub+6Dsy9c0/k5xpFQD3Ha9HoDqel6dbzjKaZhHL4o7XFxyuDr6G+iO4nfJpjltGfHO9OPbfrp9QvN9c/3PU7SvFHEME5jtr8XfzbPJ/sD5/uKoeHDxPOBX58Oz/MVmoeH99e8aZr/hr2NYxTWKT4F58P8Gt4AmtsnFxDzD2aAGeJmPeEJrb/hafB34P+DN4uHNs0Mcb9wA4ZF0t8KTxlmOczX0w0fD0XO9XgM4ibxjhp+O88Pce7wA1an52klloVnA7sz7ZP86Z1VTxs3HWF7ouDZ8TBkVh5PbrjYq2dxY1GchrB74vLXV7uY0Ivrc0/M15O9wj3gfbjZ2OUtjI/18arIeyd9fXkYYs/O+q9ecCaF9j6YY3rT1NvDz/NneRDqMzK/gjT3fVfLNb4+EL778/96J9lfvZqE8hTgf4ynFv7K/AqvkmLLOBT5P4o1xx+H3gnrMC9lcw/iXRyW4bx5v2Go5f+c72nm+5dvxLlTxpe/vb9793hffvwNXM95R1xPmcU8ODzgebmz6B/ubn/ePOuVqZk5DOnV5b69M3Gg8+jJr8Z9OB8ZsQFnn6qzXr6A/6r8lv/3MNji/sdPkVOweik/ovgkfIbwW82j+ff5M/0853kWLlYMAZ9lPkBh6/Mvl8MwjphxYfu2Pduc+PnkMCdAO2Ra+52xdNHTeb26H5cLJ87o0/9LO8m9Rr77wdHHb7vrdb1/nOUNd+Fz4eGRtpT77zwPuFy5mpev6l6aB5ieh/O9fb4X5MH7eXEf20fiLtFGYU/vc/r55v0Uz8O7Bv4hnMzVGvnj+I6nCc/PZ006M/nlxDV4XgLo/vHvyT+5c/Pnq8idRs+umL15ffrg+ZOFgZBHhE8bf4bfBtw8vJEP1t89NK6ceLPx6srd5CzNhyKftjz8rwbS5TfkHy3fvz1EbjRuuHjsaX+a/29GG08oDRJzFT4r/qp733kVhav2PpqG3F2fu2/urOHePfnuxTXVE5oYNv8Rc3Ywp+PuhiHVVy6f8nEu2E/2xtj38xWJ6xSe0TxmvI+0B/m99DXSWfbdyuM7sRRu69fPa7wL8+71FqsJwuTmAZXPl16k8+3N31DMOHUXHGr0ItYDIYaGhXDeT190+BjrVOIBMQdexsdPOe6qNcVmHPrfMY+oV73cU89auB3nHcY7qR/XPNN7mDyAdaUvkybQuGjO0+CvUjdSQy7OpKnivqU/xbNTS8zb3fgHzws+rJqZ9zynNSTXarFAL4rznPUMy8/FozRL3Iya/84np568MQYu53ytwk3Y41qtI/d6Hgt85ry5xNWkFbyetNzKnWPv1dXirlO8dnB5p4apnhGrO32pPCzVyJifYbFVTXnql/Nv8r3xxp7Py+5z30k87nH/9LSev0/6B9Zb9LfG0QFbrsbDZ7bPGvB3w0KkjZ5vXXvQfOL8Wf30fLue7zh123RrWFP1Tg4/S/+cxQXXPK/acef9/IsB3nvwBOilgc+mTl5vrTmkM+jhkMmjbt/u1hjum/VYyrPJrZs16LE2TRP1Csa5v2f54t/pJVUjVI/Ub8zHJA0D77Ll4fK3mS+sVu49ch7MU3lX6aUwf0UvhTlXntXTeC+vcg5m7TMfSPIhfRLvXSoujzgeTwS8nnFvmNH1FK3Hz5ecFmI573o6b/rsOJv6/09/Mf603NzxCdKekafR3p4WPf/vbA4ttdN/jU/vvp9ukn0J7qjlr+xN40B882mOpteYh6j903m8vb7b9Il/Ykt8J/OZlTPx4aC5LvMQM3cZrzHui/yp4sO8YdQEIBfSu+Vqd6gditbBNK3uXXh6VGdPfHO3amt7FvTWwVezzvDvpv2Tp1D8rPRh6m/FdeteCvdlDYZfzrgK+brZs6CHtXvyv81d18+wFzv9FPH7w0DX/4gzX83aZ80rzTiVRha8DPDD9BPpv4FBOv1l8YnoKIFHmTZUval8zvi9fN0eXze/8/PvqtvJff/xAfgVS3Djf/rF8U3s0dFD3X7KH1WPzmmS8E6bcds7oL80DYbXJ5lWSxwZ51FgivBxQZefWEDvjD08T27vR/KGeeHxc9ILU/cNTWm8cs5a64fBzGramO4x3i/+T8Mu/zKXmQfY5RHfGVyeX/Ri2gt5k3+5JOmAugfoYTGPoL8EF2JxVS4jnvyrH/P/y7NNnfPwucR13stZX7HX9JWnaw4Wx5k9GrrnLtDHPa0j9hG9SXgLnq/5cZCnT1Mjzf7niX8+e/rG7IWvzn2zmp4pTZhwBU8Xhz7P+jPpKdwe8c3dmyvkacD+0JsF7AQYI/T45aBd//T063lmsaq7D6pJ0kGyx3LixcOynTVXd3KYDGawaY36HufTr8YumC5+xjwF4vm/taG/fOJYPNW0kX7GxWaUv8Nsy+WbZmLaO+GN0i2JG5oHhXOEaV7KN5h+Yc+H1jvPq54+z8eshlkeMxywucVOOEzTPeNsWq8R1+anL2eM2fkHN/MTl+Hdv+eyjzbt8Lzbm/XGkX36b7uL6y3n4aP+6vlS1xY+zdnPnEH3NPrn07ZsfqIXHrnNuSfqk3E/u5/I9aZ/5jyOOev5t1rz8BnphDObD/cmhoH4wX2BvjSz+WmwWhNNR43nlU/ButFX/vCT1Hr7D/4/X6yhOnmnbvcOnZdZd3Y6Ak/Tk1kr2PxxM/n9q2d8sfhpJqt7Ow8MsWnne4sD1tG8M+pj+6XzVy+2zbf07zwfvs8WLvX5Xm3mlpaR9Sx5lPXy1RJgDd/55f4dXpBnUPd/WOL03uVSgzPhbO7Zn5b9+jyXs3zzuK9/ZF5i/ryDzQ6bqU7ydN7lscBtmC8Ia83naNbB58vvO+2ndA7/Thv3n7BsX5zhuyvmF1yMSeOnPl3ap2Lsliurl372tDgT+cZXL9dYN++D3ld6y9VT3vn088DjEn+YDYOJGNbo32BMvxjDuHbeicxz8QBED+ynLvNwIuGj5MkNS0w8Y73k0k4bPo3TfLrMgzaX+C9QSwMEFAAAAAgAM39TXYViSdtsAgAAEgABAB4AAAB0ZXh0dXJlcy9za2llcy9zcGFjZV9zdGFycy50Z2Ht3TFyE0EQBVAVoYsDEPqonJYbEAsInLhw2SvtzvzuflAvs709v3tWBfKObrdvt7c/P//+fX398f3lzsv91+97iZ/ZXeXMKtdOprSZSqsHnnFknt9/7Wff++hescegr0f296p/n7j3uC+nkbscV2QgHzNHLrPUi37OzDe1rkRHs5ItqSrMZoUaAbjuPbjEtcAqZpHqOs9wp7V1WgszrZjhqfvko3WvzuOZ3xU8s/ZKc1Cp1g7rqFJnhQxkmeOs++nKnn7lWlfXY4ZJUn0ek+pPqgU6qfRsRGpd72tLrpM5zGFmzv++vmpvEupOqIH8nqbPScrzsYnX7ML7ZbXIMiOHt+vvriPV6lzS+3BVfenrRk+TcpEtK5k3ANJ4bWKX1PeYEmtiNjMpGyCPc8Hysq9yFsmuOlLWX/0c4JT6vLfYq/YumeiBbLqZ2rep6+5GH5nM/PfQ9TkD89kjt7Pr2f38blq+zh+iKvMkq+6m9e3oZ1IDtaza0+4d+Tr1qNNaOmWmL0xh1rla6jMn9pE1V3bl2Wh6yzPMD1zD3pI1epmcpazNr3X3VqEvu2vcff1q5CXbI/9fXGVN8BUd5rnDGiavb2c+sq3buy6qZVCtXgDOl3gmldenfM/2aPf37/75aobPObc18zWanibstytrrnxObpWMK9X2v2s9eh42cJx9BfVMeA40VYfcO6yhu2o9qlYv83gmm53MHfRw5l52X8i0+8x6SGdfzKDPcmMNM1Mno5Q6utVKDdU/wx6ow31D7olW5+OzfGrUt/JMyAnPKKB3CTkmPce9axbMIGfzTCfUYV+R5pGZPGuOp+6HP1BLAwQUAAAACAAzf1NdZDHX6VYIAAASAAEAHwAAAHRleHR1cmVzL3NraWVzL3NwYWNlX25lYnVsYS50Z2HtnGlbFEcUhYdtGPZ9GRgiKCLiAogIKiCJmpi4JC4xiZr/kn9euadu11R3zzUR/XiPPv1FZ6qr6q1z6v2ANhr9jfTrH/m9vn5p8nbYmNoPV6bvhqszR+Ha7P1wfe4k3Jh/FG7Ofx9uLzwJe4s/hv2ln8PB0vNwd/lluNf+NRy1X4fjlbfh/urv4eHqe3n+CCedv8Jp50M4W/soz6fwKD5/G8+n+Pf4HD5/Kt876fwZx3gg492XcY9X3sh7fguHy6/CwfKLcEfev7f4U9hdfBpuLfwg8zuXeZ6G7dkHYWvmOGxOH4bL03fC+tRu+G7yZuhM7ISV8WtheWwzLI1uhIWRS2FupBNmWithengpTDYXwnhzNowNTYeRwcnQGhwPwwOjodk/Eob6h8NgXzMM9A2G/r6B0Nfol6cvNOLT+MzTFz+Dz+I7+O5g31AYlLGa/a04dmtgPL4L7xwfmo1zmJK5zLTacW6Y46LMFXPG3DsT1+NasCasDWvciowexLWDEfZid+Fp3BvsEfYKe4a9O5I9xF5iT8EIe4y9LjNS9gfC/l5kvy3sd+bOCvaPZb/B/pnNfuWdjF1j38G4H7+B/bvMvv1K3gn2v4T9xWcF+8cyt3OZI9g/VPYzYH8g+7Qn+3UrrAn7Vdm/9thVYX85LIyC/VqYLbGfaM4Jh5kw2mU/9g3sGz3sBwr2Q59lPy/sF5V9azXMj3xXsL8i7Lcy+0lhX8kn2Gs+wV7zmdg/F/YFoxVlVGZv5RPsN4X91uxx3E9lf16wfxrZY//BATyOhAv4VNnruTorxlb2Fn/98/j+yP5Dif37Lnu841DW0GUvc8A5xJxwLjHH7TlhL+cV5xZr2BD2lyL7G8J+W9mPgf267G1iv1xjPyVMJpT9QMG+H+yHLsResy/sGwPyvcS+Gdk3I/ux+J7RoSlhPyPvL9gPt2Veif16l/2qsMc6qt2s+bxYNxv5rHUzsoMMKXt0ynnMWGQfz1Vmj0xm9jhXmf2X9z7Ya/Yxpyr7t3HuWAPWgjWBPdZYZo89wF5k9vtxr7rsx6/GvcSeKvvVyB57jr0Hg172rRJ7yb6wBNMvZ4/s19mPxPEje3mfsp+L88B8lP1anOeSzBfzxvwz+71aN6d81rsZjF7GzCh7K592Nyv7dJ+Avdwnwt66T3Tc1Clfwz73Pthr9t/H8XrYS5fhXCv7J3HNOPeZ/VHMRWKvd/71mB9lvxFzhT1Gx2b2szGHYIJcIp897CvZ/z/25d5P7OXOL9i3CvboG7BH/yj7lXgn4W5CT6GvlP1O7DGwx51mdXPO55d3c2JU7+a6S/zXfVJ3ia/1vTp7jIvx1feUffI9zEd9D+xP43zBflPYX54q+15iv9llP9eC74E97nxl3/U9uY9xLyv74ciu986/CHv4XsFePCLe+eIV8Au8M7OH74G9+B7Yi5+0Zc7wFTgr/AUeE33P7OZyPgv2lXxerJvp+n5c32JE1/fj+hYjur4f17cY0fX9uL6VT7q+H9e38knX9+P6Pd0sD13fj+tbjOj6flzfYkTX9+P6Vj7p+n5c3+pmur4f18/5zN1M1/fj+j3dLPcIXd+P61vdTNf34/q93fyGru/I9a180vX9uH6ZvebzFV3fketn9q+Lbn5J13fm+vVupuv7cf3EPuUT3UzX9+P6OZ+5m+n6flwf7BOj1M10fT+ub3UzXd+P6+Pc1buZru/H9XM3az535s/o+o5cP7HP+Tyh6zty/V2jm+n6flw/dbPmU7uZru/H9bWbJZ/oZnFUdDNd34/rW91M1/fj+tVu1nzS9f24fspnYr8u3UzX9+P6OLMxn6Vupuv7cX3NZ2J/K3YzXd+P66du1nxqN9P1/bi+dnMpn7JWur4f1++yn9ju5pOu78f1rW6m6/txfWWv+cS6F2T9dH0/rg/2uONiPotupuv7cX2rm+n6fly/2s2aT7q+H9fXbi7yWXQzXd+P62s+czcjn3R9P66v+ax2M13fj+tXuxmMpun6jlzfyidd34/rK6NqN9P1/bh+t5tL+aTr+3F97eZqPun6fly/3s3IEl3fj+vnfOZupuv7cX24cqWbZW/p+n5c38onXd+P61vdTNf34/rlfKZupuv7cX2rm+n6flzfyidd34/rW91M1/fj+plPzidd34/rW91M1/fj+lY+6fp+XN/qZrq+H9e3GNH1/bi+xYau78f1rYeu78f1rYeu78f1LUZ0fT+ub+WTru/H9a180vX9uL7VzXR9P65vdTNd34/rJ/blfNL1/bi+lU+6vh/Xt7qZru/H9ev5xHmi6/tx/cxIu5mu78v16/lEN9P1/bi+1c10fT+un/OZu5mu78f1y92cGNH1/bi+lU+6vh/XV/bIp7JHPun6fly/mk/tZrq+H9cv5zN1M13fj+tb3UzX9+P6+Pm+ejfT9f24vuaz6Gb5uV+cT7q+H9dP3ZzzuUHXd+T6OZ+5m+n6flwf+cTZxBlN+aTr+3H9bjfHfKKbr9H1Hbk+8ol/549u1nzu0PUdub7VzXR9P65f72Ywouv7cf127OZyPvfp+o5cP3ez5hNnm67vx/VTN2s+0c2HdH1Hrq/dXOSz6Ga6vh/Xj+zlXOP/+07dTNf34/o5n7mb6fp+XL/ezfBdur4f18c6cdbL3UzX9+P6VjfT9f24Phy33s10fT+uX+7mlE+6vh/Xt/JJ1/fj+lX2yOdzur4j1+/t5hd0fUeub3UzXd+P61vdTNf34/o5n6mbX9P1Hbk+2NfzSdf34/pWN9P1/bi+1c10fT+uX+1mzSdd34/rW91M1/fj+lY30/X9uL7VzXR9P65vdTNd34/rW91M1/fj+lY30/X9uL6Vz38BUEsDBBQAAAAIADN/U112N30/ai8AABIAAQAeAAAAdGV4dHVyZXMvc2tpZXMvaGVsbF9jbG91ZHMudGdh3Z2Jt3VHUcVZLhkTSICQAQTCTJgSAggOCCoSFESJCEEZRJRZQUAGQUFmEWRwCCqiIuIA+C9ee3f17tpdXX3Oue97SVBYvdaXN9x3unZ1dZ/uql/f734/dj/+71Pl/zfffM3j3n669ub3nh7+xA+cHv6kj5we8ZQ/PT3yaZ8+Xff0L5we9YyvnB71zK+frn/2351ueM4/nG649dunG2/719ONz/330023/8fppuf9d2nfPz36+T8s7X9C+2H53g/sZ27/z/o7N972nfIZ/1w+6x/LZ959uv5Zf13+xl+drrvlL8rf/OzpkU/9s9Mjnvyx8iwfLM/0B6drHv/O08Me+7unhz7mjaeHPvp1p6tvfM3pqutfeXrIo15+evAjf/704Ef87OlB177w9MBrnnd64MNuPT3goc86PeDqp5/uf9VTTvd/yJNKe8Lpxx/8+NIeFxq+dnP9fv25q55afu+W+vsPfNht5fOef3rQw19UPv/F5e/8Qvl7d5yuuuFV5e/fWZ7j9aeH/cSbynO9rTzfu07XPuEPi90+VJ77T8rzf7L043OlP18q/fpq7d/1z/5m6e+3St//pdjg30r7XrWH2e4Hqe1ueh5s9/3yc/9V7Xzjc79b7X7Drf9UPuvvy+f+bdHla+VvfLno9Pnyd/+86PaJ8hwfLs/z/mK795yuedzvl+d8S3neN5yuvum15flfXfrxy6eHXPey0q+XlP79dLHdC8rPben/5YX+3zX98Xx4zvK8F9P/G5eg/4sS/Z8q+t+c+AD1f2JpT75y/Z+4rz/6feNtR/Sn3fb1v+6WvzxL/6uuj/r/pOj/R2v9y9/D38Xfd/3RD+rPfrAvqz5A/29XX4JPPeqZ0P8rpR9fLH/zM+VvH9H/VaL/i5v+z6+6mf63NP2LrkVf158+wH9j7Bf9r4L+Tyu/94zy+88un/Pc8nkvKPb5qfr5D7mO+v9q0/+uHf0/W/0Zfm3631393fT/Toud1F9tR7vFcfM9ixslftxw67fK50H/v0n0/3iu/2N+a9b/kVv6f6J+HvTH5+Pv4O/h7+Lv1zhW/bj1Q3xgbPha7AN9mPp/3fR/uur/0YX+rxf976jjsupfdIJe0A36QUfoOc4B8AFtTfsa+59SY8YDrn5m+f3n1M9BXIR9HvyInyv2+sXy915xQP+PTfrDv/PYybHjPjDZro8bjZvQ/5tN/6/WOGP6f+qA/r9WbPcrpT+/VGz30tK/n6lzp+n/nqb/h0X/zzf9Gcfox96PHsuGvjTdm/bbfeAc9oUacxB7TP8PNP3f0fR/U9P/zqoD9IAu0Id+/MBrbi/aPadoWHRkDOg+AK2hOZtrb2Ofsf/WOpfg82AfjBOMF9P/1eXv/0bT/81B/w9W/eG/8GP4c187DbFTxw7nT7Ubxwy0j+OGcVPXTdD/c6b/k6H/Hzf93x30/82gv8+d1P/aJ1D/j9fPw+fOfqz9QCyjD6AvzQ/as1vD80N7xq/Qh+rDcQ77yEL/u4L+jGPmx7YGwByAGAAfaOuA6gOYC+AHbIj5qr2P/Tr3F7vAPhgnsBfiZtX/Juj/BtH/naL/R5O5k7ETawAdO+oDtJXaDmMGtuOcyXHDub/Fzb5u+mSdf2b9f6frf/WNvy5rJ4+drv/76+8P81j146wf0QeKxtUPrNmz42v2/K491n0Y++yDrf26Dy/0R7yt+hf72zymfmz9QMy2GIB1IH0AcQBzAfxAG3RHzKf2mPex7uPYR+zn2u/l9e9h/CCOTvqX53T9NXZiDRjGTl8HFh+ocWDLdhgzTfs+Z3LcaNyUdVN5D7n2Ce8rz6X6/3Z5bl073dFip42dWX/GMfPjOgeUtWztR9FNfcD7Aj9Af6RV3fE9al/6jrVrsQXHvvUBcz992OYwzEVYk7j+b5Z1LOIY/Bj9gB8zBrR1oPpAXQ+WdR10nhrWe+X7ddxD+9tt3u9jH7Efc39Z+xW7YfxgHGE8zfrz3clip68BdOxg/izrgOoDiAMYP4ntaqw0243ax3HT5v5h3sz1t7UzYyfWgD52XP/3tXVMi2PVjzkHsB9YBxT9qg9gTWN9MT9Af7zZs+N7eH6Me2qPeZ/xS/tAH0YMU/3fJvojjhU/Lu9iPgcwBmAdgHmAPlA07X7QfKE3/Dd0L/N9jfkY96Z9nffLugKf67Efa7/X1HFk+r8l6N/mzh47sQbA2GEMwDqAPoA4wPGzZTvYDWPGta/vy9O40bhZ1s1lPur6Pxb6t7VzjZ1tDVBiWo0BxcdN/3c3/T8ofhz7gfVM84EaB0oswjtB9enSn+rX0uqz4+vQvTx/H/f0X8z7iF/eB/dhzGFB/zqP0Y/bHND78VLxgaJhnQvoB0Xf6gvmD/5v6F6+X+f7EvO79oj7mPex7sPYf6XF/rr2e30dT9D/msf9XtP/vW3txNhpY6fuAxSNLH6qD3D8ND/odoM/qN2a7jXmq/Y273Pc2J4J5n7EzTJvDvq/temPufO1bQ3AsWMxAPrj520dgzhmfuz9wDpAfYBzAf0A/YEv4Flj47NjzOP5MW9R+2IbzPu9D4j99OH32TtM1x/rWMQx82PvR4llkw+UuaCuB17YdKUvoJU1Yvu3jXfqXn6+j3toj7iPeZ9jH7Efc/9d1Z6Iq6P+Ze7ssZNjB/Mn1gEtflYfwPiB7egHajeOk2a3Ol5guzZmOO5rzNRxg9hvcdPmTayb3tX1t7UTYyfHDufPl7n+PY7Bj8d+jD7gfTGfpi+UPg0NX+Ozm+7+/Kp9mffr2GcfzIdH/RnH4MexH8WXuw9gLniJ+EGJB1VbxARp+O/6dazzylxfx3z5vRrzMe6b9sXHbOzfabG/2BHvIoirrj/nTsROHTtYByB+wgcYB8r4qWsp2I52y21n44W6Y8yXMVPHPbXH+5KOG8ZN1b+tnUrsHMZO8WmLn3c0/ct7bPk982P2A7EM69niAz0OlL7UmFY07P2BrugT+4XW/rt+Dz/TdNfnr9rTfxG/2Ifiw1X/EsOK/rAz7F39uPcDsQzrAPoA4oD5c/eDGg/KeK6t6Ftb07o2fB2al5+rupcxX2KixXxqj3d+zPsY+4j9XPu9NeiP2Cljp2gy+gDmAoyf0v9qN4yhZjvaarCb285055hBzP+M6YGY2ccNYz/iJuZN1R+xM46dsg5oPuD6I47BjzEHfMjWAd0HyvtA7QtjAfwA/YEvoE/Q1nyiPy/1xs/gZ+uzY8zz+THuTfs67/exjz7AhzGHUX/EMfgx5gD0o6wDqi83HyjrQfNnxAL4QdGx+UJ9R8D7bvUJtvJeh33d+n0b7/X3ih/ZfF9sU8c9tefYR+zH2o/6v8PWTtPYUR/g+Cn9rmsCjqHMbsF2VXPYDnbTMQPty+d37YteiP09br6z6c/YqWPHfIBxwPU3P7Z+wAeKHvSB3pfmB7U/8AX0Cf6AfrFvaPbf9sxo+Dl79q57f/4y7qv2mPfZB/ow9acfsx/0AcQB9gV+AJ8u+lVfQExo/lAbNKbObGVfr4718n7fdceYL/N9jfnUHvM+1n0l9hd74nlg3xqf6tzJsVNiwOADmAvKGB38wO1m/jDbzsaJ2g3jhbpjzHPMUHsfN67/203/GjsxdhADig93H7DxY/ojjrEf4gP4bPyN7gfen7pHUP0B/YKuWcP3oDeeG7+DZzfd+/Mj1nTttQ9Bf+1H9QHpS/eDMl6rLyC+NX+osSFp9Xumt411aI7fN93ruz5ifh33Je5g3m9jv777df3b2KkxQH0A40f9AGNIbWe22bad2K2OF+iuY4bal3m/jxvMm6a/x87y3HX+RD/G8UP9x37QB9AX+oH1x3wBfYKGzSdqw/Np49ftmU1vPDc+g89e7FTjFp5ftdc+tDhW+0Ef0L6YH9Q9DvpCnRvQ4BP0C238OrQuP1d/h5q38V51L59fYz61t7Hf9Yd/Vtu1sdN8wMcP/GBlO7XPyna0cbQd7Abd25hp2vdxU9dN1B/PSx/g+ME8Crvd1fTXfsAH2Bf4AftDX2j9qvqxb1ut/Vz9HXvuQfP67NCdzw/t0QfX3/oBH2AcsL6YT7f+DP4A/djgG6vGn8HvUG98Dj6TuuPvcNxT+zL3D/rjeaPtzG6j7WgD2G3PdrQbbWe2N81Xtmt26/pz7NAH3HY2ht7Yfo790L5of1qfuk/QL85p7ff4Of1z8TeC7qEPow9If4Y+0SfYoB36uG78mfH3+FkY6+1vNN1H7fFsOnbw7OoHwXbdbufaTn4vtR3spraD3dR2eF4dP7Qd7Ib32NaP6gPaqIP6Rdb491dt9Xvx89uzD8/PRh9wX9DmfhEb+7tqq9+jztr07+uzRdsdtdtl2k7tdp7ttn926/eutG39rWhfsfPkpyu7X0lLPj+17X1hu0u2W4ixeazweDHG2xhzs6Y/y7gaY2sWX7MYuxdnZZ6aYm7S9GeTOWmMrdnclMXYxHap3c61XfuMhe1m/9C4FO3mtsvXWONaIV1n9bUWm665ZE3V11VcW3F9JWurvra2Po1z7NYay9en+RpVW1xPabM16bgu3VubwgcSu03r03Ntp1+PtkvWpX2dEtem49qkv98H2/l7wviO5Zrrmlrfs/iu1d63+jtXa/yavFvZHjrX3breZn/YF/aDfdDn13es7P1U37P0PTVr9jPDu1XbjxjfU+gH+m6q+i/esYLt7J37onYT24k/rN9NYTt9r+fezvh+Orwn9vdrfUfkc/O9Ottn4V6LNn4dP6P7K+wb91fYH/SFPiD92Nxjyfanxn2Wca+Fzb5uP7PaX9G9tWRvqs4BujfBPRaOGWguek92O2a7cV+KtqMvxL0p7k1y7Kz29bg/9ZFpn2h7j5XnBthDs33WmlNc91nnNuyt9j033V9Ff5ofqA8Me2zcl8j213hGsbU/zb3W2Pg97q/qPuXe3jTPpnjGwnGjYwa62x5rtj9tdlvZDnbTfWk7i+pnEsu9afiA6p/t69uY4b7kvE+cnbFQdzw7nxlnrnrOkjV8D2dqer6CPvFsDX5AH7A4MO+x+xnbfMbCs1Y9Y+F5BM5NcM7Cs5bY/Fwqnq/42ZqeTcEH7HzV1oU8Y5EztvSMBWeU4Xxq13b4utqOY2k+m/JzafiAnE3WddP2uR78vevfz9jhv+F8revOszWcseJMDWenOG9H41mrtHqmHs9X2R/ri/tAPGNT/bUP2RmrnEtWvXk+LeesU+O5dDxfpR/4+aTFgdUZWzybnM9YfbyE8+lqu8Ruci5tZ5X0BZxN6/iJZ9OWm2Cxk2dT2+f6pj99mH2I5+shx6I/d8khH/IstOFryKnhmTvzK+gH8AHk1Wp+TTxjh/70YfYB/pvkWLS8hJifYnkWmmuBhtwKza9Y5aYwL43nrMxNwhwA/Tlvcs7kuBlzLGzMtPHS8xFgO9go2o5fo+0sJ6n7QZqbgvjJseP6W15fyE2oeT2YJy2nw/Vnnghy7Jgr2HKs+pi35++a13wazbOy5rlVMb+KeTboC30AcQC+7P0wP1b94cPah+a/Pb+GeRXUveVYDflpsWl+FXPTWr7FlJ+E9UDMTaT+Hjc9P5X5iZaTMucljflpue3K92ueEnOUstw05iWPuYmuP3OT1nl9rr/miaEP9N9VjiVqbphTxzzL0Hp+JfqE/rS+DD6g/ZAcu6D/2AfzX8tPbjUKU44lc22Znxob8iuRc8ccxZibyvxa5Fl5jp3lJlttWtW/z5uaYzvmWHqspO7Qes9ulqto9QgxN5V56YifHDvMTW656YP+Wp8w5vWa/swTzPJE4b+qPXKs2/PX50WONequmGfNxvxqy633vqCuMubXs76Cfgz9cTbR9O+5qVlucsyv1Rxrz08fG/PSLdd2zk3X/HrkK7G+puVZDfpz3sxyk60+wbXnmNH89Nl2qGPLc9OtJpG56VaXhrGDdQBjJ/Qva6eam8S6DqtPzPL6qb/niEmNTa8VajF/yK/ns6PGArU2WmeBf6OuxnLtvS/0AdbXxBx71FfCjxHHqD/nsFhjwz6wzm6nxqI21lZofUVWm9Lqa2pdcsyxp/7IT6H+rLGKtQkYN6q9jhloTbvRdu3ftSYpr02xOKBjp+Wnt9hpcyf119x01CawPtHrekb9tcaStcLsA/Pq5xorq7VDnRVrraS+qtXZmE/TBzAXsL5Sa2xYYxH1Z21K82GtTer1qVmNldanWZ2V/zvWpml9HbkErK/lHNBqk2uOfaY/a+xYm8T61DZuao0yxwy0nu22rk2DDzB+6thpc0CNnZg7R/29rjfWJtm4cf0Zw+jDrBPTPmiNpT4/ailRY9laranH18BVQF/oA6ivjf1gjd0rQ40VaixE/xbD3IdZm8ixv6qx1PpUNtZXxtpUcimy2mSpTR/0j7Vpi9rEOu6pPceM1qfSdma3sTaVPhDHDmuTGTs5d6r+nDc1blpdEt6DVH+vE5zrRNkH899VjbU21tmqD2g/Yo2t1Fim+ofa1LTGPquxJmtB2lBna7Xp5Cs4X2NkEzibBO8Apv9Ym8Z50+NmXpusfALWJSe2S2vTOXaUTTCySTb17zUpznUw/VknGuuElbFCxkbGWABnY+Qs9Dr7GguUr8Iae/qx1VrZGkBrbFljBf1Zm6q16cpYUTaBxfy5vj5nU1jNLfkqziaZ2TRtDdhrLFV/Xzc5m8AZGyObgHwa45PMfIqMT5CzSTqbps2dtnZq705Vf3tvymvTjU2Q6z9zIkbGzhZjhU35SoGxMfgx4xhr7Df072wCZVMw9idskomxYm30gciniGyqL1k+dn8HWOhf90wim0Lj5habJNqOPrBgE/XYWdYAfe7k2mlL/8CmKH4e9c85IZkPH2Vs5YydnLGijAXT3/awoD/XMMomUTZNi/1l3s/ZRFtsqhIDuA5IGStkbJCxkOnPdTPXfmTTaNxcjZs9NlkZOyF2zvpj7ZTpz/emtm6q+yXQ3+ZN1z/jhLC23vSvc38Zw+7DjPs7+lc/zvRHHLtS/QNf5Sw2mXF2BsbSPab/VtycbTfFzjLuZv3L3HlF+t+9o38y/jtbxcb/If3v0fGPPd6ofxz/W/oHxtZ9Pv7vK/234j/mf773Z/E/9kPnsbiOiYwt7gFExs458b/M/2STHWAszow1ew8c+VSY/01/m/+p/2r+z9hUKzbZik0X42ZkU15C/O/zf4z/+fovZ2xGP47rGL4DaB/ow7r+8/dYZyydsf4P67+RsadzALQmWy9jE3L9p3sAkU16kfWfMTb7e3OInePaP1s3x7ip67+2ByTrv/31/8wmG/XH+398/0Mc4/uf+7H3Q99jrG0z1shZ0ve/8P7f9ef7v7KpsIelexh8/xsZe2s23Yqxhvd/ZROSTan68/1/6/1PGYucO+PYGd+dabuRT6d7J5FNuHr/i+//yibK2WT5/g/3/3QPk2uArB+Rr7bHWEMfog9T/9X+X7b/Exl7GgOCDwxti7GmnCVydpRN6vs/8/4f9380dsaxs8em47jP9k6VT8Z589z9v5HruN7/b3FsYOzpHrbu/ZOrBr3ZVnuY2ges/ejDO/u/ff/fzzBSvlbCpvM9YGuRT5cz1oRNODC2Duz/DrGTZz96bmLnPb7vn9lNtZdxM+ybyrzZ2KR7+/+R65jrr34c+8G9TD3HMD8YmzLW9AyDY9/74D68df4TGYuBsRfYdH72R86eti3GmvLJyCZUNuXe+Y+cnfSxgxgQzs762d/KdnYGOJ+b8Qw4sgnJJl3ov+A6uv7KWFTGnvXDzwCzc0xojOfVRt1XZ5ixD/Rh5rHE83+yyRDHeI7FfvgZ4MgnVL4afIFN+XQjY83mfY59YRNWvu7W+S/PzmbGXs6m47l/tB0ZdZoDEHMnNAdEc2eYO6XnvxnX0cdOnv+D/DXP/WIOi+cuaR4D+Wp4VjQ+d5L70XMYFoy1foa5yv+AH0e+Vs6mG/lq8AX6Q/v3wKeLjDWc/bex38/+mP+R5f80NlnPm9OxM+bOjLk/G3ZruR8+7pv2NY+S40bZhMqmDPkfnU0mY6ex6WL+38jYc07YnMfEWEC+WutTz13iszP3a8VYYw6o57DYHBbzvyJjj/0Y+YQ990/4auYLzAWzf+d8OrK2yFjDuZ+wCeu7X8j/G9hkLXeqMkf22HRqt2g7fF35dMwBzHInlU0obMqQ/2V5szp2bB0w6k/GHvuhOazNB+pcEPhqPQ80tM5Za7lrmgM85bG2HPCexxzzPyNjz3NYczadcumgcWzKWVM+XcZYI5+MNQAx/zMy9hgDLAdQc2c9Z3rDbj1ndsz9dO2ZM8dxw7zJLP9TY6eOHcud9fx/csJCPzpbS3P/NQecXDX2y5rnfbMOALozh3nFWGMfWgwb8r+VsSc57EPuvzG1uh901h5zwdna1ypnTfl0UgPQGWst93fgkzH/X9lkW2w6y/3vNRO9XoJ54NFuartYPxHy5qfaiSz/HzVTrP0Yc+e1/mNm7Gkdg3L2vHbF2Wp4Tm3GWnPOmtZ+4Pk57leMtbn+x2q/tB9k023x1VgHMjZnrZGzprUfytpyxprXgGn9hzL2MHZi7YzW/rDuR+22sp3w6QYuodbNMGdex43W/8T6j7l2xuu/6MfKCdviq0ktU++XtIG3JvVLQ+0XWVtaw8T6L6//89rPhE3Xa/9mvppz1VDnFZvWfSV8usYpyxhref1frJvU2jn3A6+f27MdGXWRT8cawKx2UtiEQ/0Xx87Mphvrf4UTtuCrDWy1XgfKhudk49e87tPrWUPt5yZjTfhayzpG+oHVtI1cNcRx+kVr/FrGWYt8upSxltX/KptOa3+1BnRlu5XdYs2s8ulY+znXTk/1nxu1szknLNb+h9r1zlYjTw3PljXlrbGuPXAAWi17rGOf6/8zNl2sAVe2GvyBPrFqkbVGFkDGpzPtrfYz6q81wDp+WPevXDpl0q3sFmzX675XfDpllMX6/8hNGJkJOScs435EthpZEGxkQrDZ151bkHEfAgdkYBio/hmbjtyPwFYbuGrOgxgbv07mg+qtnLUNxtrE/xjZHyP3IzI0jtou4dRl7AdhgIz8D2V/6PhxfsbMf8kYMMqqUaaJck1WjT/H5w3cl4SzlvNfMgZMZKuR22I8GPePuTlHjy3j1K34dDP/Z82lW9ltz3b6c5FTR7tl7Jec/zIz/Yx5NPOrVlw15aZRr3Pbmr+2zVnLGF8zR836p1yoc5r9bs5e2+LTzZyvbQbdPWW3hJvVfWBlOzC2V8ywI422ONKu5O9cpG1x0o5y0+6p9qNmt20fyceUMteOtnG8bY6zdIytOGtxXCmrbqfVGKpzUBxvq/i0sl0Wk+4Juy24dNV2e3Zz2+XzRDa/jnOrz6Xkra1anG8jW23BV+v9iPNrxqfTtWrCWlu2eb7N59lsbTLPsdP8OqxLsvXIvu3GdUq03WJ90sfOFp/ObLdmrPG5dX0d19a+pnbemjLV4no7rrMj+zuusbUPR99NdG0dOXXafK09sNXSNbay6XSNrdpnjLXMduM7SbTbaDt9RxlZ0DMDWn2A+ov2A/vZ7Xb0PXF6vx7erclRiy2+Z0eW+dY7tr9jbTPW1ny6kbU2t/w9W/cndt6xh72JFWMt8OmGfYmV3bZsp+NI/GBg0yn/f2tv4nXCidveJ7LnjvtrYV+tM9XafqrcXZHx1dI9ttX9D0vGWuTT8T6YuLdGphr3U2cuXeSrpXtsfX9K9d/am+RY0Xsfou1WdlPbcX8y3gGhd2eM9z/ouFGun8VH28ebOXH5PvF4B5CetXA/HWco2rJ9dmXtKWdP77DRO4z0/h8/Y0kZa13zsL/ez6q0xX32BV9t2mNXxp7e/8JxExlr2R1A2blEZrv8fGK+A0bYdIv7f3xPX5mOtpfv+p/BWEvP13COqk3P2fSMjXdAZfcYOWPPz1iy+58iYy2eTcZzSZw/a/Nztn4mvTxjUz5hOGPrOTYcNxz3em+W6e53gEU+XW678XyS92et2HR6Nr26/yvj+r1K9Pcci5yxxvsseb6ud9nxXF25ajxnD3y1cMbuPkBfHu9/G+6w4vlqPX/IGGsrPh1zVSJbLeYnrNh0yK+JuSnx/j+Om8W9eZ1Rpve+OaMutV3LT9C7/0Y2HX1Ax07UX8fNnJtg+kdOHPugdxhGxhry7iW/puZbSTucYxP7oTkWev+n5lgpn4y5SRjvkbGmfLrYnK+mbK2cTae5adn9n5pj5Xyy7dwkyUvatF24AzK9O5O5adn9n5rXF7h+Zf6D/s4JdMaacVY8T2xkrOkdwMyvQ26dNuTYtdzKztaK+ZXC1xoYexv3vw45lnoHdGSsBT7d1ISvpjl2E58wY+wl979WPo3mWM53J8+5iZndaDvNTySTStl0zEuPY4e56dn9rxw3npsY739e5YnOfD0+O/NrkVurjfcZjzm2sw9oP8jYW93/HPpQc5PlDvgFY81yrb15nq0yCiXHtnOpYm46axP0/mfNTW1jf7j7N+Ymy93P/d7nxHZ693fKpmN+quamx/u/x/ufx9xkY9SY/gknbsqvjny9ePe7ctY0z36VY693gJOvw/rq1f3vyibU/OotxlrLr++ctVifkOXYa356YOyl97+3uNnZhDJuam3CXJ8y8umi7fQOeI4fZdPNtSlem4TaxOT+98AmJNdv1H/mxMX6ipyxxhobYavV2irU2cQaG+VraX0l1gHwY+bYU3/WJqgPRzYh6xNN+6w2yTlryqZjjY36QKtLTWvTWGPRGJuD/pGxNdYnjtrTdtFutB3rk5xN5z6g9SnKJtPa1KZ/q00Ya1NGNuGoP+srZk6c94FsRWesWZ2l19dZy2rsYj8Yy2KNFWtsgv517h8ZW7HGcslYm1qssSNfS+trlbGntcmi/8Cm1LipbMKt2sRoN61L5fhhXTrr08imI5uMtenGpqjvToP+sTbNx43rn9UJrmqsyVkQxlqvs2ZtNWvrI19r7Mfox6yxHPW3d7+kNnVgbGmNNTkLZBRExlpWY6v1qRmbzBmLuf6r2lQdNxu1yUs23ao2PWMTcO2k+kc25VibavqzTjCrExbGxpKxEBlrWmOf9UMZe8pYlBrbVmNl+uscFn04sAm1vnpiE5Cv1vgKA18rsimyGmutsYT+rE0LbMrAWBrGvvJJOp+CtlM+QcamUzZFYNO0udP0x71e0J+1iZFN6VyPVP+JExAZS5GxMjLWRr4KfWBm7HXGwlBjv6W/swmcTbliE0a+3ppNd4xNxRr7Lf1HNmVd901swpxNkrPpnE0zs4kYO8mnPaL/zKaY9c85ge7DxteIfcgZOxljT/1Y45gyFjL9I5tU2ZSsST/K2IpsMsYAYaxExoYwNnP9lU0R503or3FzzSaKbDKLAVnsjPpj7ZToP7EpqL/Nm67/ihNinMDIV6n697G/xVhTP14xFjmPXUT/yCZi7Fe+zopNhhiwYCx2Psm5+kc2qc6b+2yqYexMsXPU3+bO4/p3Nk1fN73gUvTP+nDf6n+UTamMxSvQv+6bbOt/lE123+n//y3+r9h0/xfjP/S/xPgv702Xs/6zdf+8/st8OFn/1XsWLmv9R67Oik137voP+l90/Zexqc9d/63YtPfU+u+y3/9a7E/XMJGxtff+p3cTnPv+p3zthLGWvv/F9f+R9z9yabL3P+6ZxXenzHbcA1A+2T31/re1/xP3sOL9Csn+z/Ded1/u/6wY+1t3E+j+T2RTxv0fZxON+z96N0W+/2NMspXd7q39nxeduf8b9v6Xd2xwH3PFWIv7vzqHXdn+r+/9R76a3kuydTfJvbn/q/vmyd0kNWZm42aMm5ez/6vnP36/lq8BtB/ZHTvJOcbm+Y8z1o6f//DsPzL2NAbkbLr8/Gd1N9GKTXg55z/uAxc5/1E24WWf/6zOf+P9an7HlvuBnmHqOSbPs1eMNTnHbnkM4/lvy2Eazn8zNt3G+W+/nyzer6Xnv+RSXt757zabLjs3j+e/qv18bjrmTpxx/itMN9d/L/8D+WrMX8n4ajGHgef+BxhrV5z/QTad3ksZ79gjbw9j/cjdhBmb8LLyP9qdlIPdyCM8kv8Rxs2h/I/IptP8D79jzzlhWf4XfCDL/2Lekt+t6fdr6vNHxprmfzGHgYy1I/lfI5tuzVcL92xO+V9yN+nEWGucorPzv2Y2neWBMH8q5s2p7bL8r3g3KceNsgnn/K+RTZbnf3n+Z8xh3cr/JF9Ncxjlbl3JY5zzP5m/pPerah7rKv9vK/8zu2M35n/qvcTKWYt3E5NRxrHP/M/GptzM/0TOfJb/yXxpjJ94PzFtt8r/lLuJa/50lv+pd9Ou8j/JpvP7abv+u/nf2R3bqxxmzWNm/rfmMW8x1lb538LXWrLplK+mbDXN/bZ83/F+7Xso/7vXTMAHYv53ljevtmPuvPDpeu4v6yekBmA3/ztj071iu/6j1q9o3U+s/9iqYYh1DKxr4fNT+3i/+qr+Q9l0R+7YD/Uf1Sda6zUgylmz+g/jbR1krKX1H6z90RoArf/Yq5vR2pktPp1pP7MJ1/UfGZtuv/5La5jUD7SGqdUt1dqW1lZ1TGn9F/xXGWtH6r8Cm65z9lod0MBVi/VfsQZM67+UT7dirG3VfymbjvWSrPfL6r8yu7nter1U59NdRv2Xs+kO13+mfDXWMGr9Yqhl7HWMylljTeuKsbaq/8zYdKz5VUYhawGz2s+kBrRz1pRPR94W64AjY+2c+k+r9e01lMvaz73aWeguY6Zp73WTqJ1d1X96zbTXAN65rP/e5atNNcx4Pm2hjrk+t9auso75IvXfrPkPfLWBSxdrv+EbbFkNuHLWLrf+e79ufst2We281n+r9nv1363uv9V/o5/b/IeLMwxylgE5BufxHzI2Xa9lvxD7IWNAREbdOfwH4X5M/AfaTW13rt1mdsbMp9viPygvZeRmbPNfGp9lyTCJvJLG4FsyYJRjknHWjvBflO+jLBDtV8J+qT7S2pIDE1lrkf+S8Ol2+S/Kzdliv6xtNzNgaLcFO2eL/xK4OeczjCKbiM+xaucwoPb5TzlbbYv9RNZN1iIHKmNAXZz/tM9+OsduarsdBtRhbhbeYy7AKetMuQu0S2OcncN3u9J2SXy3S7fbZdjuKP8xYxke4Rlmv3Mmw3Cw3TYD8nwOZOQ+rph0ylfLxthRduY5HMiL2C3Ybs9uW/zXaZ61uTZnmercG79+lGG64r9m65PVGiVjwNrc6y1+L2O/XpT/eg47N+PArux2lJu74r/G9YnZLl9j2/tCzljb4hiPbWY/b/HV+G51lP+8xVnLGNBZ48+MbLXhvSSsUdf8Zzx3XJNusbP3bMefybh0tN28Rh31j2NmxX/W94SM/648+4xjnrHM+fWZYT6/Xx/lv+s7tr5bRT7dEQY83qtXXDp/v+57K8PexAH++8SnO4edr9z8yH/P3lHP4b+P+xPzPsHIiNO9It9Xafts6R0Q2sY7DGa+2nj/g/vAgfsfqu66t+L7UbbPJnuUaeP9EMqly/hqR+9/0D221f6k3P9Qz672bBfvzSCT7LLuf/jozv0vOGfRe0z0/peNe0yGu1/IV9O91vH+F7/7p52vTPe/6PnkFmNN+XS6z87G8wi2eC7B/XXe/xL3p/fuf4mMtXg+kfDpNm3HcwnYTveocR69d/+LnuvpuQ7Zbn7/S37/k/L1qLuercRzNr3HiP8932GkZ6vj/U+6z37k/idlrG3z6eIdUPzamq+2YtNd1v1PsAfsdtB2zR/8jErHz9H7n5Trx7P9Tx64/03OVwfGGu+z8/vf5rbiq+n9b/CBrB+qv55Nh/vfBsZa5NNpjkJsnpcwnq8zJylj013Z/W+meX533mw33pdIJhn9YM5N8Puz9O6sI/e/fbrpTx/eu//RGWuWW7F1/6PfYTjm18APrC/x/kfPsaAf6/1/mpuyyrFRxpry6eIdkPya5tccvf+R59Ou/8gm1BwbvQOUjDK9OxN227ad3v9orErNT4l3JzJ28v7H/byui93/inxry7Wc7zH1u1/9DtN76/5XyVGV/ESrW/DmeYkhvy5l013k/tcxxy6//1X5dLPteq5aYxTmbLp4/2t2/2e8/1XzOr8o+m/d/6w5tspYY6613mMc7zCO9z/TBxgHpB+H7n9WNuG59z+zIbeW+bU7bLrh/ueWn3bh+58xZvT+5z3b4ef8/uQ5N/my7n/W+98jJ24vx77VWgz3mPO/Y379Jd//HnPsNb+61qgcuP9d86y3ahN6bUp2//tYY+G56cxL5v3v0P7I/e/MU6cfZPe/c+zE+99V/737378i+sc6gewOe9WeNTaorUAtjdXZePP6mt6Xob4q9KP7MXPsqX9kUyL2sz6VtSkZXy/j07Gxvma/NmlmkzHHXvXXGjtlE7LOFvVp1J51KaxJWdkNvhD5hF6bNI4dj52Wn6r6t7rOoa6L4+ZrC/21Tkj7EGvs8PysrVLOGv7N+jpjK831lasaK6+xGfVnbVLG2JK6pISxFvl0c31drE3UGiusAwKbatDfa5M8bpJNmNWmoUbdxsxsN9ouYdNVH8DYAZfCx06vTW21ybZ2cv1t3eR1vcan8No0119iWFInaH2g/wbGWq21R02tNtZaoi/0AdbZhRrL6sdcAyz0H2oTtcaafArwCTLGmtQn96Z1lqxNRn31WF8/1qZrjd2W/rHGOo4b1qfH+uRot63a5IxNxrkTayfVP9YmjrWppr/WCeZ1wt4HY2xlNfZjI2cv8hW8H+7HocZ20l9rU9WHlbE18mlGxprW2SdsuoFNENkUWmM96u9sWtZXCWOlx83Ip+G4J6Mm2i6pT5exo2yKziapa4DXJPprbWrkuljcHPXnHDZzArYYWzNjjZyFjLHAOmusZ7Iae65jWGOn+gc2Qa+t5LyfsSmUrUC+RsYmiWyayCZifSprbIP+de2vbALGTZv3RzaFa+9ciiNsksgm8thp+mPtBP3Lu7Po77XpM5sg6h9j2OzDsQ8ZY2erH/RjZSxiDaiMBdff9jAam6DOYQs2SYn9xxhLkU8Y2VScA5yxYbV2e/pHNoWxSeq6T+LmzKah7ntsIjIKEDu5BlD9sXbK9Oe6WdkUziZx/W0Nm+vPuX/2Ye/DirFV+lG5CxljJzJWLqJ/41J0NhHZGsqmWrHJEAMaY4dzwLAGCIwVYSys9ee6yfiqM5toj01ottOxM8ZOnTsvoP/Aprl7R3/nBGkM8/lLfXhD/+rHRxibF9N/ZFNFNtkWm87mgHtH/6NsynP0L2unC+rPddOx+C/jP43/9+X4R/wf2WTz+F8x1oSx9SMz/jM2IfTX+H9Z41/jf77+y9ewytjUfqwZa/Yu09axE2NZ5/9x/ef6l/VfZ1PpO4yzyey9P+NrOV9tzdhdsSmvbP53NpnO/9naKdoum//b+i+d/7l3dmT9t6d/xljMGMuxH95mxlpcw2SMLWUsHVj/D2wyXf/rHBDZdJGxFvlkkU8V1v+dsbO3/lc2WYydKzadvjflbMKUTdnf//b0n7me8/6P6u9xbGDsaT/63o/y1fYYa+rDR97/s/0fe/9fM9YjnzC0gbFG1lJkEzqb0tm02fs/9n9mNtkYO7Oxs2G7sHc2vjfrvEk26fH3f507VX9nrMoe9nS/ivdjvF8DfZF2mLHGfeyd/d+BsbvF2FvxCbXp/SR7d2xExtbe/q/ylXBm1vb+w90kw97vYLewb1rnTB03Y9y82P4f+bTf2Nj/D4y9mqsQzjD62Y+eAdj+tT//irGGM0DuYXoMszkM+sfzH93/Vz8OdxMNbDrlq0FvNucSuvbOWHO+orIJV/v/8fxHY6ee/WVsumg33fvXc5MtNuHIptzf/x+5jqP+vo+Z37GEfpCtlfHVeA6onLUtxpr1wdZ+9OHs/E8ZiyvGnp4BMQ4oXw3jnC3w6QbGGu/YshwAZxNGNmWmP/m0I2NvPDfXs99oN9qO58B+bmp5ADw71xwAnptYDlB+/jdzHcl0o/56x9bI2GM/eJalPqB8NfRH2xHGWrxjj3ksq/wPxDEy9rQfPAMObLrOV8P5XmzOp7MckJ079pSxNeR/MG9O86Z07PBuQrLpNGcms5vaTvMmeO7DcaNswjZvTuf/yvVk3tQ4dvL8n5kT5nereu6X+wHZauhTy1kQzpo/f9M+Yax5DgPzf2L+l+f/+ByQsekyvlrLA+pNOWu8n3SLseZsws38n4GxN95NqrlflgsQc4DEdsv7Scml5JzpeTM+bzY26ZD/tb6b9H8BUEsDBBQAAAAIADN/U11vgO4jygYAABJAAAASAAAAZ2Z4L21pc2MvZmxhcmUudGdh7du3i21VGwbw+/nlnHO6XzRHxJxFRcygophQQVERFTEWgmihIIpgYSgsFBSxsNBOELGxE7G1sLTzT9DnB+eRxeacmblprnL2c4t991pvXG9aZ+bMjh0H7CjOyL+dO79+nTFjxj7BdyY4YANMafe37buLZb5+dxew7Ez2t0+bYepzffneAt8f8IMlGPfLMz2Pb+pZTP0e/eXbDxf40RZQ2vFMehbjOexvn2GV3/WZPz9e4CfBTwf8bMC4jq48PY+exTfpHOr7Kr/rL/9+vsAvgl9uAPul7bmQs9E5bPcZjHXOhtHvMc6jv78Kfh38JvjtAr8b0DX76NCP5zHmxXgO4xlsxzksi/k03uytz/X398Efgj8u8Kcl6B469D2PnsV4Ds2H7cyFqe9jzEe/xa/x5Qvf/hz8NfjbAn8P/jHAe/fQoceHv/lB7ngOYy7s6zNY5ntjrk7laePNXnGsz/V1Z/Cv4N/Bf5bAun10PZOeBXnkNh/oo7e5sC/PYDPfG/PGu37XZ379N/h/cGBwUHDwAocE/b91++jQ4+tZ9ByaD82F7TgDcpb53nwXE/UqRn8JxI3dYvq/gF/8PCw4PDgyOGoJrNtHhx4ffnLII5d8euijt/Ww7Az2hv+N/Wa+q1Ux+mcgbvX70OCIgH/HBMcGxwXHL3BC0P9bt48OPT78PQdyyaeHvs3OYE9zYDrj9Jox5+u7vNS3GnM5LH7sPzrgE/9ODE4OTg1OC04f4N26fXTo8eEnhzxymwv00TueQWuhc2FP62Dqu367ke9qVqzkr/ixX3z5xL8zg7ODc4Jzg/MGeLduHx16fPjJIY9c8unZ6Aw6F8Yz2Bt5b+bou3pPc76+y089TP3KX7l8UsCPswL+nR9cEFwUXBJcOsC7dfvo0OPDTw555JJPD309g9YCu9jHzj2pg1V5r8bMns43ddi4s0meslHunhKIo5jyh2+XBZcHVwZXBVcP8G7dPjr0+PCTQx655NNDX/OAHZ2P7Gsv2N06mMa+95vmvRmkD+tF6lFONu7yVR2Lnby+MOAP3/h5XXBDcGNw8wDv1u2jQ48PPznkkUt+84Be+tnBHna1Dno/2p0cWBX7zng1Zxbpx3qSumzc2aiGxe7iQDz5c31wU3BLcFtwR3DnAO/W7aNDjw8/OeSRS37zgF762cEedvVusCoHdrfunak76Jj3alBf1pvUpxwVJ7aq5yuCawKxvTXg493BvcH9wQPBg4Gnd+v20aHHh58c8sglnx766KW/vaB1wM7mwK72gd51VtW9M3Yfa96rRf1Zj1KnclW82HxtILfF9a7gvuDh4JHg0eCxAd6t20eHHh9+csgjl3x66KOX/tYBu5oDq/rAZv6PuT/2/Nb9GHt3E/NZTerTepV6lbPixvbbg3sCcebf48GTwVPB08Ezgad36/bRoceHnxzyyCWfHvropZ8dYw60D4yzYCs1sKzvdd7LKXOmdT/G3pxu3utZ6lbuih8fHgrE94mAr88FzwcvBi8Fnt6t20eHHh9+csgjl/zWAb1jDrQPsLM10PvAVmpg9L/3neZ+7zpyzNxp3etFYmFem1n6tt6lfuWwOPJFbJ8NXgheDl4NXgteDzy9W7ePDj0+/OSQRy759NBHL/3tA+xqDbC3NdD70Fb8X9X3x9z3+aw9311VPY6x17/1MHUsl8WTT+L8SvBG8FbwdvBO4Ondun106PHhJ4c8csccoJf+zgJ2jTWwag5sxf9p7eur7lo+n5s55m9z31xyb1Of5rcZpo/rZepZTosr394M+Pxu8H7wQeDp3bp9dOjx4SeHPHLJp4c+elsD7GEX+9jJ3lU9YJX/y3rfOPfIbe37rGoGmcf6UXPfHUa9mmViJ4/VtdwWXz6+F3wYfBR8HHh6t24fHXp8+Mkhj1zyWwP00s8O9rQH1P/pHNysB9b/ZXO/vc+ccfec1r757A6rT8lV81z96ut6m/qW4+LM10+CT4PPAk/v1u2jQ48PPznkkUs+PfRNewC72DftgeM9YFf8b+83T8nr3B/999nVTPYZRm2aVe5z7jTmuhxWz3qcOpfr4s3nz4MvAk/v1u2jQ48PPznkkUs+PfTRS//Uf3ayl92dAXvT//Z+83eV//o2u813M06fl9vqXc6LO9+/DDy9W7ePDj0+/OSQt8p/dnQGbIf/6xL/da3/de3/6z7/5/vffP9f589/6/75f/75z/zzv3X/+e/88//59z/r/vu/Yp1//zv//n/+/sf8/Z/5+1/z9//m73/O3/+dv/89f/9/4zNYx7//GLGuf/8zYp3//muKdfz7v1Wo/ev0958zvh34ClBLAwQUAAAACAAzf1NdwO1BaoQAAAASIAAAFQAAAGdmeC9taXNjL3JhaWxjb3JlLnRnYeXZMRGDQBAF0J2kTJs+JyAKqGixgAU0IAIRmEAFLpABFVh4xX/dtTdzt7t/q15166tVa88x1DvcJ9w33C/cP1wXbgg3hpvCzeGWcGu4Ldwe7gh3htP3r+n3p+n/V9P1V9P9l6b7b03PX5qevzWdv2g6f9N0/qrp/F3T+xdN7980vX/VLlBLAwQUAAAACAAzf1NdqeycEIgNAAASIAAAFgAAAGdmeC9taXNjL2xpZ2h0bmluZy50Z2HtmXlYjXkfxlWyL4kUkshOWrSjjTYtpEhZWrRKomwp7ckWad9JZV8z1rFkHRn7bt4xxjpmMDOYMRhm3udzTqdNJf+8f7yX57qe6+Kcc5+e3/d73/d3OU2aSDeRXKZNVJuoqlb+98v15fpy1XnJyEjLKHZsr9i5Y7vO0lJSVRL6xNW0qUxTxU4CTr5dZympJlKNxcnKysiCU5Bvp/A5z9lMtmkzpU7tlRTk234W7lNX9y4du2sO6KGp2b+HZjdF+W6Nxal06aiiNaCHlkb/HhpdO3fo2lhcj66demgNUBVwKhpdFOS6NBan2k1BVWugqtaQfipDiENjcQ1dHeXadNQboqY32kRztI2xho2uei/dDu1ad/gUTqFDWwV9jd76EpzO4J467du2av8pHBwz0OxjAM56hIb10EE9h7Zr07Ldp3Cc11Crj6Gtiaat9Ygh1sShTasWbRp5zHov9b7d1ceO0hk7zdl0GreD+VCHgb27DWwIIy0tJU0OHC10HL3Hm3l7OZl62Ztr2w9Q6zqgIVxTGemmcGycpe44Mc7Ey85My65fzy79GsKhF87rZKnnBM7TycTT1lTLtq+qUt+GcM2byTZviF9w1nK4umWA26iARdMdF0UEOEb4TxzpP8po8Cj0WR9OWVFemRxMd7OYLsaNjfBzGelnbjDIHC+oD4fO4ErgJMtAcOEBY8N9J5j7mukPNOvUoW2n+nDohbzPmGw5IzJwXGS4/9hw4mCiN8BEvn0b+fpwPZUVemoP6qmNb3wcm6bNhw7uOdTD0dgjLnh8XEa0Z0ZGlGdGzEznmCljhk9Bn7JNZWRr41o0l22BRshB/KwJ8ZnRXpnpUZ7p0UFO0ZMdhk1G0/hpbVyrFs1a6Q9R04djCbMnJIhwkZ7pUTPGRbnZG7nBw7q8t02r5m3QC+ddHOKyGFxapEcacXC1NXQd3Ed5cF1nb9u6RVsjrb5G8Eu1W6eP+iC8xN5M2z7Mb0xYXoJv3s70kJ070kN25MZ75873sZ+PPlW6dlSpjevVvXOvMSOHjiEH+Yt983dmCLi02Tty4rxz5nrbzSW/3ZXku9fG9VZR7I3O4FhBol8BuO1ps7dnx07LnuNlO8dq+BCrboodPvLePj2U+qAXzrsm0W/NrozQXeAyY7wyQzxHh1gMU7fo2lmuhvdKCReacrbSc4Zfhpp9DOEluuXGg4y0+hj5upj7pi5yT92bO29v+Za48vLNseVfZc/9Kjl8ajLxNtDobYDPkRcZaSkZNDFMu+8wNEIO9uXO33d2S9zZM5tjz+zOmrN7VdiUVXgBfgqfeQ4ZaWkZJQU5pRE6/UagFzi2P2/+/rNbxbjSzDmlSQsmJ3mMM/aAV/gxtRQOdeks18VEd4AJeiHvB/IXHAD3zaaYb4jDivmTVriPHeGOh8q3by0PDo8hjqZ6A02DplgFwS98A15S29AuHuRkpecEZ7emzNp6cWfixQfHUh/cL0u9f2HH4gubk2duRp+OFrqO+Bzfp6wkr0ytG2+tPz52pnMsObi0K/GSBHd+e8L5jauCNuIF5Bk+g4ML2gNVtV1sDFziZo2Pg2OXS5dcfnAs7cG9oyn3zm2LP7dh5YwNC/3HLMR74TO+hFdwrom2hhPRC+e9snvplYfH0h6CIw4lKwJLFvg6LIDHg3orD5LgdAb30nGzM3JLDHFJhF/4hqS2cfPvoMlWQdmx3tmnN0af/vl05s/vbxS/f3+j6P1PpzJ+OrE+6gTxDpxkEYjPgdFTF9fImVOtZ+bG++SSg1++yfrlw83iD39fL/r78cn0x8dLIo/jBQGuowLgM88BF/DqWe42s/ITfPPLt8SWPz2T/VSCe3Qi/VFZ0aKy1EUeqfDKcpi6pQRnZ6ZtF+IxOgS9cN5n5dnPwL27XvTu4fG0h0fXRRxNiZiaAo8tjAZbUIOpyQ7m2g6hXraha5f4r4Vf+Aa8dBg51AHt4kG8BmfvHll9l+fg3E9OZT4hDncOrbqDPvE3z3EmnuQFHJpYEjpxyZ7suXvIwbtr6979dFKM47n+c3Dlf/AC/BQ+8xxwwWeCmc+yua7L0BlceXu18C044v7PrZJ/vjuQ9N221Fnb8F53R2N3aik4zrV8ntty9ELe31wpfPP4ZMZjcB9ulny4tX/FrS2rg7dEz3CKnjp2xFQJzm/iSL+kBZOSDhaEHYRf+Aa8JL7+E0f540HE5tz2hHM8C2eB99zw+fXlta/RdcFi34Jwf8HqBBw5RROFSwMK+dy76+ve/Xhk9Y/ndyScv7hz8UXy8eelNX+i6bwEn7yFfmMW8hzg8K6i5dOL0Ascu3t49V30gu4eHU9/9OpiwavTm2JO58Z554b5OoRRS6nJUTOcouA4eiG+PxxO/gHcpZ2Jlx6fSH/88nz+y1Mbok/BcXQADo+JCXKKWZ80Y/3V3Uuvwi98A14SX7SLBx0oWHCA73h6Juspz4zv7cmZuwcffH425zn63Jc3fx8+J8Ghia/XhH395FTGE3KABsS4eXvg52/f5v52vyzl/t6ceXvx1Zgg5xi4kBUzLevw2oWHwcAVNAeOz327Lf7b38/l/U4seS0lwj0FXwLHuY6sCz+CXsg7Z4Wz8Ig4vLyQ/5KY8Nrq8KmrRTjBY6hFZUURZc/Lc57/e6vk3yu7l1yBl+iWGw8iNnCP2OJlxJ73qIPXvlp6jXhf3pV4eXuq+L28eJ88NHFtz7JraIRcwln+Fu/hT9f3LLuOluBD5XsCF3Zlhu66sXf5DTgDd/BcyXulmaGlN/ctv/n22rq3F3YkCO8FV7znm1eaNaf01r4Vt+Ao54XrvIePcGb4jybgePX3iOPtA0m3/7qy9i/y/+xM9rPKHAvapc7hJXAWbaVHelRxQ+iD0A36xN9q5FjQxK9nc39Fw+QgbVEFN4LHx1KPD61deIj8kufTG2OqcrxVnGN0BsdSI+CGUxU3CsMP87f4m9VzzLlenM9/gV54Da+TcCMn1jsH/+Ns8PjkhqiT1bnx6kLBqzuHku/wHW+uFr6BlxKN8/zEhufCW+lDRd7gOspfrHH/Qr6DnIi9IeECOUUTry+veY2HE2dqVnWNr1sWsI7PwQGRN4g0LvaGPy4W/EEs4ViYn6DxChz1uXj59GK4Bq/uHk6u8gYhd3AcvZDb6honDiVJgSXURHj8w6EKbxB4SRxfnM97cXJ91En8H41UeXyG4PFF7/k8nKW2ModIPJ7akBg6MZHccYbaHv/916u+Rz/oTFwbtCtrw9I5rkvhyb2ylHvErobHH1z5HTqDY/TcVbXBXKgNbsvwGryXXEk8Htzt/Um30Qvnpdep9HgXcz/6H7yN+JJPavDPp7OE2lD84ea+FTc3rw7ejIfAKUlt4+bf8CUrxiuL3oo5VNwbqOmKavwUq5nEG0/m+8D8fUOIn3CeEyWRJ/BPciCq8eoVNV6YT4KnWgfjBWitRm8g8PNY8aJjeCkcq1HjTbXsZnvYzKbW4L01eoPjaY+OFkUcRS/knV4XHHMEPQ/9L7UNHj8rzxH3BkK+4OmRwvAjeCL82pISvEXE37KqHg+/gLP01pW9odDjsQdxttJ3Rp94WO0eb1PyzE0R0x1FPd6Qft2rekNhPp1gYzABLyDPlT2ewIVz2xKEHi9oAzMDXKnRGwrzmctoQxd6Dbz3SumSyh6P2kAdQy/kvXpvSK/jamvkSh+Dv+Ln8EDSGxavCCxmjqH/p6bAS3TLjQcRG5/xZj4GmkKPL+yh6PGZDdiD0eOjT3oyyWwg8c/khVOS0Yi+hpp+jR5f2E8MH9pvOJqm1sLn6rPByrDJK5kZq3p8AUePL8znxjr9jek1M6K9MvbnL6g2G4SWwnH0Qt6ZdSU9PnFg/qW3xUOp55LZgDpF30RPxPyHb4jqV+WM55PLa/SlzNa1Zy7mZvSJv+FzEhyamOdtP8/GWNOGHNTGqXXvrCaaDQU/LVhca8abZjeHXhqufDQb9lDszayB91af8TgXfSx6qb1fE5aNUuw/mG3gMf2cCCfUa/oUNMUeA365O45wh5folhsPIjbMJXXO+M1kWxBvelh8jryI+iehn2E3gEbIQW1cyxbNWqJp/DR+drXdgNCfTrIfNolZCo7VxrVu2bw1s6Z4N+BSsRvwSI8KHBflamfkil7q2q+y/2InRn8t2g0INRiPIY7MTcxE8AvfkPSvaBcPYl5Q6iRX7w4RfeJvNXY8giZGGg4ayfxcH4784qfwuXLHI/TxZgYDzRra27JrwHvFOx7HSHCcy1RvgCl6qQ/HHgMeM+uKd0NjRLshY93+xh3ai/eY+IaktnHz70F9lAfV951c6FO9X9Vu0MtZmJ8ETQxUa3g3iBfgp/C5cjcoeHX/Xl37N4SDh/Cqxm5QqA19e3ZpcMfHbgseM8+LdoNCTSaO7E0kn5GXayMv2vEaS3a8arrsCxr6Xi78reaOt5eOXLtWcp/C4af4qmjHa9z4HS/ey65GvOPVsOZc7LE+hWO/wq7L1rRiNyzs7lq3at66+mcktY27Lg+q75L8NsCOv679VH2XStdOFb8NqHzebwPdhN8GhFqq0e8zfxtQrvptoK7dLbxU7NhO/BtPHR5U34XPSX4bQhONxcHn/+VvPOxzRThhX/c5uC/X//f1X1BLAwQUAAAACAAzf1NdVHU0KT8JAAASQAAAGgAAAGdmeC9kYW1hZ2UvaG9sZV9sZ19tcmsudGdh7duHq9THFgfwxFRCSIGENNILKaJiwYK9YseKBSuKXcGGiF0RC3ZFsWEFu6iIvWDBhl3s/8t5+QzMsrwkcPVpfLCrHO7+Zk75njllZn5372uvVXot/2v85//vvvvzQ5SpTGUqU5leDr3++uvx1ltvxbvvvhvvvfdevP/++/HBBx/Ehx9+WCDPxs3jw0/uVWN/XqpUqVK88847yaePPvooPvnkk/jss8/iiy++iK+++iq+/vrr+Oabbwrk2bh5fPjJkaeHvlftU0XozTffTDGE/dNPP40vv/wy+ffDDz/Ezz//HL/++mv8/vvv8ccff0TlypUL5Nm4eXz4yZGnhz566X/VPv4dvfHGGwnfxx9/HJ9//nnC/uOPPyZ/+FetWrWoUaNG1KpVK2rXrh1169aNevXqFcizcfP48JMjTw999NLPDnuv2udM6lV84Pv2229T/MSTD/zhW4MGDaJx48bRrFmzaNGiRbRs2TJatWpVIM/GzePDT448PfTRSz877LH7qmOuPuWn+v3pp58SzurVq0edOnWSD02bNk2+tWnTJtq3bx8dO3aMTp06RZcuXRJ17dq18Nm4eXz4yZGnhz566WeHPXbZfxW5oD/r22Lx/fffx2+//ZbiJIcbNmwYzZs3j9atW0eHDh2ic+fO0b179+jZs2f07t07+vTpE/369UvUv3//wmfj5vHhJ0eeHvropZ8d9thlHw54/i3f33777ZR/epPaVKc1a9aM+vXrp/yFVxy7deuWfOnbt28MGDAgBg0aFEOGDIlhw4bF8OHDY8SIEQXybNw8PvzkyNNDH730s8Meu+zDAQ9c/4bvepC9Sj1WqVIlxaRRo0apjsVLTvfq1SvFlC9Dhw6NkSNHxpgxY2Ls2LExfvz4mDBhQkycOLFAno2bx4efHHl66KOXfnbYY5d9OOCB62WugRyzzmz98ssvUbVq1dSjmjRpkupV/fbo0SPhHTx4cIopX8aNG5d8nDx5ckyZMiWmTZsW06dPjxkzZsTMmTPTT8/GzePDT448PfTRSz877LHLPhzwwAXfy6gFPUadyTXrnX2Xj23btk39S+0OHDgwxW306NEpnpMmTYqpU6cmH2fPnh1z586NefPmxfz582PBggUF8mzcPD785MjTQx+99LPDHrvs5zWACz44X3RP1Gf1GvUm57Lv7dq1S/Wpd8lVtSyHs9+zZs1KPvFx0aJFsWTJkli2bFmsWLEi0cqVKwufjZvHh58c+bwO9NLPDnvssp/XAC744IT3Rflun7XX6Ld6jrqTe9Y/+y4/R40alWIlf8Uv+82n5cuXx6pVq2LNmjWxdu3aWLduXaxfv75Ano2bx4efXF4H+uilnx328hrAAQ9c8MEJ74s4H8gjNWW/tefou3qP+pODxb7rYepX/srlxYsXp7iuXr06+bZhw4bYtGlTbNmyJbZu3Rrbtm2L7du3p5+ejZvHh58ceXroo5d+dorXAA544IIPTnjh/l/rwFlTPjlz2HftPfqvHqQO5WL2XZ7OmTMnxWzp0qUpjvzYuHFj8o2vO3bsiF27dsXu3btjz549BfJs3Dw+/OTI00MfvfSzk9eAfTjggQs+OOGFG/7n9d1dw57izOncJb/Umj1IH9aL1KOcFBfYFi5cmOpY7OT15s2bkz87d+5Mfu7fvz8OHDgQBw8ejEOHDhXIs3Hz+PCTI08PffTSzw577LIPBzxwwQcnvHDD/7x3phx7fdXZ0/nLGcQ+bC/Sj/UkdSk3xQdGNSyH5bR4Zr/5efjw4Thy5EgcPXo0jh07FsePH08/PRs3jy+vA3l66KOXfnbYY5d9OOCBCz444YX7eXPAfVv9uHdZS+dvZ1DnMGcRtWdP0pf1JvUpR8Up+y6Ge/fuTbHlFx9PnDgRp06ditOnT8eZM2cK5Nm4eXz4yZGnJ68B/eywxy77cMADF3xwwgs3/Px41vcH3jnoofYT9eQOYm31W2vtTCL/1KL+rEepU7mafd+3b1+Kpbjyi49nz56Nc+fOxYULFxJdvHix8Nm4eXz4yZGnJ68B/eywxy77cMADF3xwwgs3/Pzgz7Pu984S7t/uoO5h6st5XM9xLrP29mf5qE/rVepVzoob7GJ58uTJFOPz588nfy9duhSXL1+OK1euxNWrV9NPz8bN48NPjjw99NFLPzvsscs+HPDABR+c8MINPz+e5TzgvVvOffups4W7qPuYO4l6czbNsbdPy0v9Ws9St3JX/PggpuLLP75eu3Ytrl+/nujGjRuFz8bN48NPjjw99NFLPzvssZtzAB644IMTXrjhzzVQ0feJzs/ev3kHlXPf/upO6l7mbuJ8rv7EwFlFTOxZ8lTvUr9yWByz72LNz5s3b8atW7fi9u3bBfJs3Dy+vAbk6aGPXvrZYY9d9uGABy744IQ31wA/+FPRe4Fzk3eQ+qd3Ud7HeCdRnPu55zurqke9Kcc+5706lsvFvvPzzp07cffu3bh3716BPBs3X7wG5OnJdZBzgD122c97QXENwAs3/PzgT0XPg/YL72Fz7dtT9VXnDPdze479N+e+fcm5TX0Wx17+qmc5nX3Pft+/fz8ePHhQIM95HfIakCNPT3EOsMMeu7kG4IELPjjhhTv3AP5UdB/UK9wlvY91lvBezvnKWdM7Cv3WXdUeZD/Oue/85gyjXu1l+rkYqmu5Lb7Z94cPH8ajR48K5DmvAT785MjTQx+99LOTa4B9OOCBCz444YUbfn7wp6I90O8inJ/tn7n3OWPnfc/Z033dnVUfdnexNznD6lM599Wvvl4c+2LfHz9+XKDiNSjOAfL05Bqgnx322GUfDnjgyvsgvLkH8oM//KqI/+7Pufd7N+1cnf133izufezbk91hcu07z+W+l3NfjxNbuZ59f/LkSYHyGpjHhz/XQO6D9OYewB67eR/MPRC+7D/c8Oc9gF/P67+zpXeV2X/vbdh1f4ejuPc508KrdvUxe9w/+f/06dN/9J8ceXroo7e4B7LLPhzwZP/hhPdF+l9K8S/1+i/1/l/q+3+pn/9K/fxf6ve/Ur//o1J//1Pq7/9K/f0vKvX3/6X++x9U6r//K/Xf/5Z//1/+/kemUv7+T6ZS/v5X+ft/5e9/lr//+1cq1e9/l7///1cq1b//+G8q1b//+Tsqxb//KlOZyvT/T/8BUEsDBBQAAAAIADN/U128BDpfIA8AAKwPAAAWAAAAc291bmQvZmVlZGJhY2svaGl0Lndhdg2XaVTNiRvHf/vdl7Zbt12rSrQoS2U0EhIm24T4M0NkSUa2GbIzDDFIGTRjKVuRFGNkS0lRSvu+3PZudbv7b/93vm8/zznfzznPi+dZuiA8/K4EAH4MXTk3dkeioxQAAHA8TisBICwLACBACmzckLjhyDgDAJMtn02y+s5hUf2KrOhfVmyO9J5V6LVN9g872t9TPfo+PO/bI9cHsVmr8mM+7KndNFgAqGUnvUQhMRHnlpqt+Bw1Nt81KMaj0lzJeA9IazUf6OfiJ1lZxJOCf5d+/FKvG4oDc2UxniZBOfPWL0mPilh8a+53083dI83CmYSBaXX9xTdfeuVKcuKe4a/cStGmHcMcaLtsuofzDJu5UZGRi4cj9n5/MGDApd3kCf3vQHR9RYl7waT8qGfPnpu9bfzs1FI5kgY5y+QTw6bd+P5/C6wX5s+L/67Jr8nptNSFRgYTG+6VXn8j/feX580v+YXbKlza7FW2cK0F4P5LgP/sM+G8+elhvwf/6NPjOEeSSS0b/KNx12fiXeN/iS87C9qL2isFHdFjKfAJC6XrY/+2kPI5srn3QwtnqL35DiZifypz8GbTlPKwD6dfRxeUvE0pCaxu6jyihhAfi1YXo296kFdo6PdVs2ymPfCaZ6cWfibJwQfN7RW/Ftu+s397odC7bFftJUWqZhPSaF7tvNjnlxm3Z535Th58aepBj+s2PYId5LKhnJbjlTdLrhWWvp9RfP/Ln/V+PTe0b5Gj5l+dciZHT/MLVgYfmuHmF+eOWvfxrcjsoaet1t8elzJFq4o+lmBfUxvf9F7SSVA388oJDt5RAQ0z4mYygbVT4l1PWBl55QRXmd12tzrrc2TJ14/TyyKqTjUH9B/Qr0RLzeodr3vF+KdMA6Zfm3rT+5yzzFLOO0NsUt5td65NKz9R6lV68cue6rWt1waWGlLQ7WYKByfP/b5bAp4ELPI77PVuQoHFPO5iokiZ0pFal/j13ueEz18rTtXatw8N2hnLUZGZ1j5vYsaUJf57/a19DnjwHXebH+PICefho51s/XdVz8vTy/WVR+tLOzyVLUYGzTYV2C917/KO8F3uy3qfdY+zDzYrxZT48eEtXTGNxLecr/lfsepNjRu6Vg9fwD2wRabudoTr5EmrpsybQno9dW22tTC1xYpwxfACxeOmzJq0qn+r2Br/5h7FgZFAYhGmNJlvm+1y1vM37yXeQs9h5/U2tPRX9A4eNuLarWv+vm5HdUZ1d91wy8qeM6PVxHbsnMlOm23OuolPvLZ5+U0McTLKtRIFchrPGKG6/Vur6n1rD9fmNVxue977h2oTeRLzMrlu7ecU7671uO6x3e2W4y0rXLwCScCx0fKe2LaoRkVdeH1Ck3sH2n94bIT8CyuTfpEjE7SuERNb3V+6yBxWWwrFVfA6PHb0Wu/F9g9NJxvIBnnL/c6wgVh1PPUQ2yqF5O0Ov7vkuPm5yZ3T7ZxlXqKV8A/4x9ENfTkdHi2WTelNT1utFLsHQzU91HOML51l9cHew9nVNdXl7IRAW8J8pVABheNuKuf+T53HWv9q9mmZ1r6v+8qQVLucfoM9kiRZ5tjVTXjoLHIWObZbd5qdF+yDZuMnVR39dV0VbeLW3NasjpKee8pq7Su6EIuUfJBl2l50DHG6POFv+1R5jelXvjkUgitUaQMtCklHYptLu2kXpy97+JzOhvmAjYhFsgybFQ5tjhMdQ+3WWdWa2PBfgCH47LHIwcbuuZ1f2n/v2KKY0Z85EqTfw7zH/hTHWGRZu9qfd/hir7bxt1RId/E2gKH4zTFysKJnZ5dlZ2tnTvfagUujnfpPzGssQJxj/koO2M23T7LLtZbJKEkl1wSchxvHMoZe9SYrVnS5KAZ6Egd3qw4ZLNh8rFnENf9m1WsjtZtle1iOWjhKpnNLgCX4UnWE8p++O92nFWu7LfqShhaMSY0x7CPsqGiTmcqyzrrbRmCzygo0/0H8gHMMWI0/Ug8pk/of92R3n+0J6D+otFDfMKaz/2ATRR9NZZaV8iLrbvlsS57ZGZETZw6wGYc1vw8vH8jp/dTzqHfewM7hOrUD3sxewqqEXqZzZNVWT+SlVlNltqblwtsYD9iLr9Y4jjgP3u9r6H3Xt3hw5Uiy5jpuChzDfhOmmOyzaLe8a/WfpZ9FkIlc6IHVsKfwJ5q8EeVgan9rX2l/xJDfaIhWSswFdmHuQtgk11wnu2v5XBZs/rN0p+Bf9A6bhsPasNHHQ4cGGvo/DQQpUZVCe5jYA6zDagR7pFozM9lj2WuLKLOrknL+InQPm4Wv0FaOxinXDJYOFAxOGK5QHdX1Ef8AEdgxgVISbDbDotCiwjzBtEo8ld+PRLLv8HvaaJX9sO/Q08HMIXr4/JhMv4D8BARgfoJYyVnTzeZt5gNmaSYy8W3eGcSNrcP12mZV+TA7dHHolLJyJEx9V59BKgEHTMHvFreZ3DRDzEVmZdKNIkveFARmlXiYbs3Y3pFiZaxy7fC1UbV6koEiRSAXS+HHiqebNJn6mc00RaX/Ca9wm+FuBiH+1DWMyUdPDE8dnjSyWpWmyTIsojxBFbqAPyRKlTqYxpkmmCyQWAktuefgT4wt0aL7Qf1iNHgEHx4bMR0L1Loa/6LmgvUoy9sjoiRbTe6ZPJGmiA8J/uGEwo+ZAMJVX6xeohoeeTHyZLRwrFx7zdhFrQPfoM95oChWUiAdluol/aJBvg+HhFKZJUS8fpqmS5U2umN0o2qbeq0Ow93o3eBddCfvkrBObCGdKQ2ThInW8Yuxl9BxJo7I02dodo0Fq2xVpmNCTa8uHo+lT4NnUQ+eqzBCnCi5IPlLnCls4K3HDkIJzHEC10u1xFiTqlj1cixTE6evwm/TaWAC2sMtEBSJGsWDYr1IKozmAdj30HomnQgx7NMmqXePxY6tUs/Q9ugnE030PXAFepu7UhAqChNHileLjgjauRmoAFrKvCQOG1q0jBpVg2q1ulgbYzhNiJk8cCa6gavhFwnzRHmiIqGBv427BG0Ew5ka4q0hRHdAc0l9VX1CE6krNzQTs5l3oAM6gXuZv1DoKXISBQh382kOjTwAg5hRgjFc16k01hpXjYn2i2660ZOMZ0pBGFVwpvHrBHeFV4WPBHreFU4OchD0Z/hkkNGg+1l7Q/NYk6qdp//buIe8xlSB/Ugmp5W3SeAilAgnCpJ4PpxYZBnoxbiR+4xL9N+01lo/rZWuQA/gr8n3TANYjmzjnOIZ+Q8EyYKHfCGvCpuATAJdmVAy15ihD9Fd1uZoL+smGdbiANXHtIK5iC/Hl3eB7y8wFfjy07l7sXaYAzoyMeSQ0ai/q+PoPHV8faohH59N8dkuMBXBsQ6uB/89/wb/NS+Q64jdgnsAO2Yf6YzPN3D1+3Tput/0tIFPHKK82B7wIFKIXeR+4i3je/CX8L5xKtBYuBiwZi6Rq/Crhi36Lp1Y36dfZ1xNPKci2F5wA3IOC+PG8QZ4Bbwe7m7OEXQKfB+QM9lkMt5pKNZH6A/olxheGTMJJRXL9oHhSDRGcMS8E7xlvMNcK04gSkDnx/kS8j3uabQ3ZOs79LkGc3yEcKCPjPOTEDcsl/OC68Qb4dpz32OjyCdo9zjfSWrwXcZEg8gwx2BijMP9yR/oa+O8KaJFd3B+4hZzz3Pfc+KxLOQatGa8P0m6EPnGEkOc4bZhu/E/fA95iM4Z9zXCRagHx4S7levL3cJxwLYjO6C5gC1jQS0nDEZLY6GBMnwwcoln5H26mFWA7XAKOoAVcsy5DRwzTjU6BZkD+QIOzGTqGDEN3zg+sdwow6OIEbKKbmA7wGJ4M/oQ28t5xznGeY/9gepgG8gecGLmUU+IPfhj4xbjPWMsnka4U0Z6iG0Bs+EgdAfmzUng+HB2Y+HoG1gPigA3Zj3VTDzF9cYXRoPxGd5MxFC2DMk2gFdgKeqH9WHOnC7MA0PRs3A1yLCezH4KJQfxIBzGw3AKtyEvULMYPlADHoR7ERy9gzViV7FO9CMSDT8FR9kpzEVqMulEJOEL8WQ8lIgm31H/Y6yAr+BG+DVSiP6EXcIWYzfRs4gHfAnsYqcy96gfyWjiDf4nXoufIC6TI9QhxhUoBRfBV5HzqDO2CONha9AohIISwVp2JvOWSiLPESReg8uJIqKMlNN/Mb7ABzAQ3omsRntRAfYRtUNtkG9QNFjGzmZqqTvkW2IaYUGsJkASoObQ+UwQ8Bp0hCMQDzQL/YKeRjuRPvgBNAt8x4YzQ9QnUkUkEMuINCKY9KO20hXMXOAFyIfdEBxJRC+gEeh9JB8+DrmCz9lIBqSVpAN5j0gmaohE8mfqIt3LLAZyQC0EI2XILHQFKkF3IafgdZAYfMwuYyxpCRVJthIlhIh8QP5JPaNpZiXwEGyHOuB0hD/evR4JQVbBwZARyGRXM5NoH2o/KSUZIoxsIQuoWtqUXQfcAcugt/AvSD3Sh9xCBMjk8W3oBv5mNzCz6ahx41DSnzxAiqheSke7sRuB62A+9De8ALmH5CHxSDOMwRRYCVxjtzAr6F3UF3IXGUs+IoMpMW3GzGC3AlfA29AReAKyHzk23iYbbofawDfAZTaB2UJfoDRkOnmVbCbjqKm0DxPB7gTOg8nQTzABRyJLERFyDH4JFYLZQDK7jzlIZ1NyqowsJvnUZSqaXsisYROBk+BvUBhcAzsiLkgHHA1fhe6DN4Gz7GEmmS6jZlE6Uk0GUgXUb/QmZiu7H0gCt0AT4RzYABvhPNgHToQugMnAKfYUc4vupX6i7MazgVJQN+gk5gB7ENgLroSE8Hn4K1wB/wHz4eXQPvAIcJxNZp7RIH2CmkuFU2coLv2KTmFOsYeBeDAMUkPb4PtwJvwz3AsFQuvB3cARNoUppm3oDGorFU/lUJPoRvoRc5k9CmwG/aEGaCF8HD4Mh8AfIDm0ENwMJLE3mTo6gC6mLlBXqDpqMa2j3zF/s8eB/4FO0FvIC14Pr4Kt4FsQDQaCa4CDbAbTSy+iu6lc6iWFUztpKVPNPGRPAj+CJlAmJIJnwQGwDjoGKUBnMAr4lc1iDPQmGqKrqRbKlk6mPZleJp89DfwAgtAFSAXZwWZwDfQzVAaOX5LAATaP4TCHaAdaQzFUMP2InsMYmTfs78B8cAzcD1VD9Lh1HhQO5Y6/4SHAfraAkTGX6Zm0Gf1/UEsDBBQAAAAIADN/U12umVb26z4AAKJBAAAhAAAAc291bmQvd2VhcG9ucy9yb2NrZXQvcm9ja2xmMWEud2F2FVtlXBRvF52ubZalGwEVJBQLxW7F7u74Ywc2dnd3t2JhoahgYYEIEgLSubDLdk2+vL/5Mh/mNzPPc++ce865d0YPHjDgfG8AmNB7fP/5S1b7yQEAAFuOgPEA0C8JACBADsydtXpWQss1kxt6f1/VQ+2971/74JnaoWWz+zT6Hht3ZsAKzaaJbnLLsmG+X/EdsxPXFK+oHHySfTLsRJ/1XR565vWwJr7x9/YbIz4gE7YAgfcihS27Y94FLmsT7hM3YvBEYcvUTQ9dFwW8Wb5qlrClR4/LiLDlJwh0lAQWL3wBXR/82OYlLU7wmYUjsyYLwaedwkc2zB0WFSRdT1rzpUNGRK5y+P6Y+nOIarvbgS7yv+czdr9pT6RWzA6/8tCi7t944nPgk7maNpcl9+ZSfyuhR5s+ndh14r5kq+Zr0YlVd72Z068mW82/VLcmFxy/1L0g6leHpE8Xwa2aiitnD34MPn/zRHJW2+0HnkTc92ua/fjBrS0XFPULv6h3vbjZ23i9Ju2q8HjbTfmxQnXS15S6GYaRr5blzXrzWnPs9/rUF5p1+nvmYlHqu9D08y9llH96dEx8UCE3PGK5tn9+XCeDZyfxnJD7wIrAWrxz+0A0vQ9H9Z/sGJpvi/cc6327i3L9q1ZjplYtE7YIWx61Hucev+jxvBFR7bw+xPZWyty3Ln24rv+wTr2ELcblk6dun7106q4IkDTEf4kcLn+XOG1zz6lxyphO8cN+Q/OH5k4o67w1euxEd2PIdKLx1MIR0mka57gqL6WkGFrWqqFvLG7wfq074N4JWZRRmHZAWdRxZ7tvXxdn3Aqb74NRWwLXPZpAyT3mUwlPN1VgWcdfN1t96/Hsc015ex46HpjMr+YeLkvdc+nQw2gr0pRmiyy98XRD9rxbzz5ElH1+TTRtfkEf2/k2IK+PefKzmheqiwcyTt95+2rW48cPVu+9Zr6bfPVgz4IJ0KKG5COD6KxCNG/BJfDLpPo9plGKi17V9tvPdqUMMv/xGYHPYnb5f822ubnIcpw6VsX7bA28FnquiA5tW0NUR6p+9UuA3Duf6JUYc7hDGDfLZdDgHS5Tl5Quz+g8W3jeW9E5fcMcf8MQxTzXtn2ixk151UXnEiDeNjJn4We5Zuq7CZ+8RF3D1t6IHx+1YTzth3kFDrs+j9j0on3Q7DvrrpHa/vUue51Cu+8ccKffyTnAmO5UvGeKWBEVOrNHw4c2Txpd44QRYch0J421k+tHbYYxvusyJMstIueOy4xGd/PedjeABRaqZKYusvLdh3PePZ8INQx7E3QR9TSBlOXX6RO/X6YlK4FH1qPH+9/v8EpnaPOzKHXykwflSzWjNXzmEm3aTvxUJ1Nq9tp9mU8rHk3KDdj5taJqx6kdf5LzNUPuvD/65fD1/XH38y5Nf9+1ubZ8ZHpxvTI7Icvz+29EDP9846yZ9OPWCyEFdXYVHOo1zzAfsV+yU2TldmZbeich3isq6nHHt7o08yU0sm6x75rQvlXNPr3d9sFn640xJXjkUE/8xPThI5PJsbHzbPHQr1BjhxX/zcYP9b3Zq2k50ufU7FLvoU7jqO+ruwxJdy+Ki9u4fr5x+NS+sLvr+vjufwc97VoV57TihbPI/ZXr2OmKvsPafiMHzRZ7j/BHO0pQtWjL+BJxiXLDpH8TWsVNG1gsPt+tt3Vu4MhRobUANcGe2qcVaQzb4b0UG1H1QjyicU77OC9HY9v80pz5XhXoPmKqS47rNheDx/F8wlJbqtDaHxZpAoiK7NeWpLwrD/qcftc8r0qf9fJdjGH/+/OVk/Yv1ee96fe8h/Xmx9oPMc0eRdzPDlcOfTl7suHprj1jT9yvikhtPvv9Kn3k1N3YD7uOdil3yfhr8rjmecsPWFT5ER5X7206m7VZMu3Rrtt2+RkpQfR5AOtLmuuBI+nD08sd/xRnyvBgtFVHdCV3UdJPvbFkXk6UGwhs9RiFfpSltPthnR4wFzoau9+g6h41Wi7VyQs7GHqtnjjPpazr8unz5j/pW+y6edHiBTtlqsFV02pwO570HxNfGjFi3hP5nv51syM75IxUTvkWlTMlsadn191dNCMnhg4KPzHx7uj9qkHjJndNn915aNgiQNRWPB7c4/JyCOXrxuqCr/ZyaUO2vRL0LapO+BQyUyo3Rbs96Zll74+R4gnN/WM7Q4vL9L/DySPIwaAl1b2Ivfp19N68A4WixtF1FPfxTypR/SXsR86T2+aCeube/cILr2oe3wTm5S7Wd7hYW99wPz7pfZLqwo2fp67JKkI/Tnne+9LV2hUVEmvdEY9b0LtzjUmm85mtv+04dqjJmPTCgCY/SslvHFP95Nzj17NuHi4X36nLNtwUGqc0IjnLGeeq3T/b5BjScrGhH8eVLi25KruTObg0IHeXfiCy2JGeixT114+krPmRRp9ITBPm15RTZP3qsVG7rUN4pYvJUn8l4LpbPdrf57zVKu1in+0Y0nf0pOkT/vBvOn9X9YgZPgYEZUT6zFSvpV3Xjrwn3dvpcZeo6SY/bcQR58dL/vrzfVUyOqrLMNBT5X9pSquYdiG6xRPEykllcT4us6bMmbVjDIW3jewWNykmfHIevyJyXccYyYiICZMmeOxgyV5rTBuF/1jvLgliydABA3pFB3n2bv8bT/FrNjmFVpSeKPB3PtR4r/Bbzkyk0LW5JiY/VnzZd+fvWZ+mY3ey67hwfJE99fsmdDC85Fe7DPJhz9KL3yfcesIFph+t/ZUZ9Xeb8TS3/7Yp80yz8yVSQ3y5nFP285v6aCWgu/7+1SW/O2POVb2qzbv5Jjx9ePHXNLbkYRmfzn5c+LMhV3Sn2CbLmlDsn+OS+zT58csz7yo1Fz7izEpqye9lD/uL2dcHGvOlr2xG9ZnsuKptvzWewy1Tcgblyj1dCKn7I1sv15HuJZTEfVv9H+V8xw+f6ZrE8OfBt/qMJXJjfRucewb3v2jqH3q2647g3ciY1sOibrjc6KIYs2vK4T7D3Xp06uIWK6qX7FOMmEn0HNS6V9j8ued97wTopoSNvjOgblpUGz62/fzOU6bPae4kzN84x9/l6pzsuDajPGdws2vlAzsa+/XqOKzb8l65rmvbwKH7Bw/pPakn6WV0Pw6sGuI0fKPHmqAD8hSRoR2ALXRZai9Et/su0uYHrFRWtTW3D7DatcmliXXJ/qe8tpS8L5jPBzrhlaN/qokd0BfZ0nw5cuztFXtGFlD7t+Rvo7zMp/iv8cvfZ09fcG1vLzDMyo0zvNf5N5X8S/xjfhX80yvvxrVG266Po4qPZN+9UfLkSVW798NLM8yl2mF3r96MLHn6W1b8u3n844mF4q8HsuseQi8ian7d/nh7gnFSwc2alfqdLyr0gb+uf9NlMqJu39Jen3w3SfoFmcx58BlNtZU1+d/ZQYjWuVhcXUMGX7K9MFUwOmMYFIYnOS/3crgNtlsUjQFHY5TQivDZho3EfB9RRyS4MMTINtoyoq/7urpqu94a1JffERnfccX4ydLc9lbf9A6fe+WEnuqxKOJhl3jSJdbY+23cBTknujcqpP89scv0+tEz/WzySYELfM6OKZfGznjtv0rxzVfncVQyZAjiyUVOiNrbTSE9jjvFnuKvSv91OenusBVTu3GtV2svs/C012V9WOuUjqK2321GlzdST3uVso9gkhUxbb1KqmKrldUvmdWOhd55Ps9K7oiaUWO+h/v94tXOiYYv5gO1M4rffg4j2tvD+LOEvnQMtUzfM21z9hUusj7we6uiQxl9bHTJ4K8X77/T39Ynly+otmdP0g9+41EX8b3u69wK/YeDzyo0X2v6FJzNefZ6VM7QL6T6u3mGufx+sn7tp8yUi4+6sVx2Yh5dtvDbijfLUpvyt/4JAufqPLUXflx6e9VqzBxcNvRPkrWDLkm7AfhpnowPy9tQNAWlnR/U5OCvgcX5u+kR3CzH/vqZBZhHhZtL61mkSXzXy6bwb1Wu2RqoVK23HPfgg8eFf/TAIrLco3umOj3wvjCA8D0ePGHAttgesv48OORvYEiMqxxX0YMao9+FWMbvG/01JirA7DtG0ti/jBivOBP6t9XY3qfxM62XhJ4lPSZ/aKv0HhaTNehgP3HMKtFQ8afBSRJTkE/o9i47epJBXdwAUD2gXQ8lOaDfgba46HK0lyIn4oSJld3xume90DmBOtfmr0UUWub6E+jjXRSg8utR6dM2UjwMH9WINe5XjeS/NrzyfGcZCpFV7ZWuNsoAO9GWOkVpyc7PV+vifibUjZWEgL3Tz357pnlWL/26HllaceZvWupm+4HMm09nvx9aUME8Trv++mFNY83ut8E/fxmjf1u/DC0o+H06t1fBtgeLUlP+XdYOSD/SrNJ8+uxcUG1uNN+kv79pW1j7qmdVcM2pjMbMtNSFFuVbL2te9oN3rXN6529kbmf10d9uzq+rwjp/vZV1pdTddLEqlEptSGVni9eXfDCfkCch+9lB9bW1672eisI1Zkcr0XL3APF5zzg3L3qH/jmx3C04Kty5ye9w2AKwe0S6Y3OMd5sfbkWRKwLXdZ7TJ9drhOp5u6pQL8EyeJonCkRQBlyrmOsaHeYISA+pGqp3tiPG4LfUPK9OPcraZgyfTM3za+M8SGrzUftsjOwu+xA92Pmi8ll/k5O65/AIMMQ/bnXHuDbp7a5HhvR93a7UIxsv8ApxkwYWRAwIM2Bz0SSfRVJQVRO1wWpzl5temy569ZVeMI+Tenq/dutLh/CH9DfclQ0/sOJyETyslfs/n/rZvtedpnqFOVmgQEuTI62pUnIqz9vcs2FJflOpiT38NY4c8znoy2Lt4PS7DcmGRPjGz5XqqeCAdDfgd4rY/Ott/LduWdXPe/5+kx6bc6voSbkmOealuHT0B7fqs5mj8+2PP1cyvxUv7j0rNn7/d7jkVGlCeU+1kIU1BH7F0pfUX35hNyY2bjVd+UbXnH4vLqx8U67Z4xhof1Ydktk1/3JOX/h1rTR7+UeZYfOXNV+W5DqbhzTvqp5hdi7pp5IS+4onFRvMHrqt5RG6EMsivxrp5gCdcVPlcPiSdHzzRf0h7271J13cbV+1wxC4/QZTvv0M9jlyMV2PsLZtUVddNeFY5BQfCr4VcEb0ufct5wK/gSHVQmA/QW52yupbOVjarn9HR1B0q8C+a8hO4Y/bdJVlhjc7txGv89gQGt9hRevZrezto9r2GdApMjwiwe+Y/w+v1KHfnRa4ESFSXOr0Vl7Q1ylsXO+kPu0V35WI9+k2dqpzWHr0bOlr+3lXFzaho7uTRxsXqI11U0c2bGZQfaszaL3bXX2eGrKMZndZlgEL67qBhf6QdoRdrZPUzoZJNESbwqzGNwnDwM35tZK3Mjv/LXsed53fIS2s31jywFH99dzf101E/pqi1T/LjF1/LbM9yXwLidLKi8c7NF9H/JiqXv5z+KdR1kmfbzQHlCWWZH5ubBqVN8d2Nn9dVVx5jy+3v99926jdbl5ffCp/2u/cr+6FVaV/fvz5VfWttPZqycwPg7M/OTq+ua8fqPX9Mp93Sj9cP/n7fv3U0hOa0oxq8/7fs3Rb4e/mO4Uds7iKy4Ql8zXrbF2MbrA+qBzr3KGstnGeS+/CXjBOfaSOgoIbXndKsgbd1rzS2UU51lPkMsqaLL/cmkX3UE34bSnCRqOR7UYELXWa5Iw6Uf5J9nCfGtVMRzw8JNK3225B63PO6UZ0nV9qdCvnHLdPHvb2s/1WorJuj9r9irkcuirkQfC5yHvds4IfeTta/R3Y3vmk3CXobA8+8GSP61HS9tWKVfI1YqiDk+KAKLb36F6NZDw21OuCYijm6TdTMsB5ccx415syCBJF3Aj4xp30lrAfRFu9X8J/RPXen3xj/NpE1gT0R2/of4PbFZTN0/xX1VqQS7Yotkj7OLeuf2f7ZKkyvNRuaEpwLUTrXCz8PaOYuot2cB2CtG0SlY22BmAPGwOaPIze6vrcc9lJfw+Vr6jWGjYx7YvEWVMr7DmiLF0G8rs0c5PwNKukYeivZ79P8IDNtVBRfF79Odu7cHp5Z/vKL9jv8RnvNF/1B1P5qsF59lSPgqjacaXzNS7V2Ndg2723tV9rcvo1PGuWpYmtaO4R3dtyq2N9TnLDPe3ekrFVXl/ON15WI7/LSh+xg6vrdZfKwk0nCrGixMrcIqo6gS343Y67Z9Xo4yVmyRpAkj++0P1fIELVfGga1ZLgz5nh5FPJzKY0bpST2m2mj833mNFdk8C1hYq8dMEGoJN9YJtLoNYNCM4NGyQIPhkR6z23Kj+6ltHLO6jZcVRMG1LcHN2eX0xd8fol9JKuDlH75QpDPL94nkAzvE+GfW390fuE1yWJuQ3XvXvH8o7ySFPEXnJ7Wy2WjT1RfZedC32gHCTOUNlDbMqkHpsjpdEaeadeW8JGhHQPCUARfLTsatS4zqs8Sty7BPaU7Ai3d4rttEQZHB0t56JG+rUlf9KdOlSKOCfe9UhE17aPrV2tX9Hf3inYOtYVX9OaBrROpKzW0hF1cfK1vfYYWDca0/Iv3T5TJVxHop4grEuaYHqDNYLahk9guwke8LrKtcaJ1B8orNlcvaR6gpGEOKOJO5310nIQs2S3hW7p/XPjmnSO7/y3gsDyzY629NW/x2yza9da/2bsqTEUGNQK6/DcO9pV3yPq0n+k2wbq08pU1Xdyghrk6l81o00ulRJNWuO4z4vqP1hFX7LzJ+m48rHGBeWzDCL2X2mselvROWZ97ZCfRSXzSo6VTaylsy6VnPj+5sdfeJ+hW+31nJLyVOMFoQO86fc4ZJklX/fesknz1NpUwoCbxb3Fb4geFbfUCL5PHqo410DUTKI8mV4qk4vObbrigzAOmI69NewWRzMZ9GXDS1AueozyuiB6gUojXUYPCyh0LSfS5JkqV2+vIJW3OXQ57wjdo0gmgzwc4A3P8vY7vDw8vwqKqL6ouJUmfLX/aa/hbcWuaREfA7fF1MiOupm8tMqBnReRw9BvYW+iOkr/kcny6U7vfbTddD5XZC6oyVkf7e70VvWlraNVn9ZjQpN9tznnoCmuANy3i8qva/gC17qgpUEJlEI1JMJXJfb+jGxCyKBvbtOUj1pXet6VYIhG4uo7kn4pckUfKrvINU43ZJWqdsR+twZTV/itSUHnOXOml6Ya5Wb9wwZfrcZpLGdqJOpfGFh4CD5drjaGa58DHbE/lE36upgp/iyZY79elN+cKQTQuY3m2tV/dbXPuSP8BrY/E4h8rXjyZ2hj0a829UmmPGZCk6WqqMynMqXgV36CudpwMntEvVkd7UAKHQ2v8npaP9kWfVOVJv8oKRieD9ef0OV88/vhXXixocfPftmX83ZUiY0+WpkxJv981c3yBYWB1b5ZuUadudSywDhU/6GqwP7dNKnobf0ufbj6dnabsl5/p1gHwBfMsZrFujt504UAU1fshEVdvYZhLUo8v2S4ZQkTX7665JQJKHtZ6q+Ir51Z0509pvUwlsIaVZy1ue4Bdq5JRZzSOzxs9vjG7pSf3lOeL4HEu10yvSfL+7sNkaeBMdwafpRlvl+BbZvLe5UNu+G7u81YZK3vSvq3YnqbcfKvlMz9hPyB21eFB/JAOQ/IarcuQENFhMRG5UG9Re9a5QU14H1lS8WvOtzqkCE60/Zk4OrAFaQKT1Jta3vDv1vEvqiPgf8ktyJ6tv3hH+Uq8k1VXJHndljh/0faXvKtw3tieMjodkM8M8P8SV9ij0txaxdZQhQmr4SY0Hq/WnRmRNfWezxAbBx8PGSQopV3fWtSkW1/wPmSGq+u1pPiHX5bPJ2wfv4nHBddvrtOca72otgV+Bh5FyHA43qzXS91AvW8ZR3U1yKQbZuC9IjykvmRZbryoG1sZaIVQLZqrzH1jkeiIusq01leTCVW9qifo8mCThR72K6gCsOeqrkW37qJRZHWLWURwnF+rf2C+qAgFJ0SxNU7y0dWKZrzCsb8TWg65Din2ZTfreTir6FMkomu660+VPSrJq025W+m/rr9TOPSIiqvf8X0nLjqP/90ZcH5Mbqf9dGWl/X31ePyRI7JFSNy3zYGZncxtPqjtQfZ9rHLaiT6i8UPGl6Uds5X5r6sP2Y5VTHpn6b2VvP6fwMcp9Tb6r8IO2oCDXmW3Np3amvD1MZVWn39TvJG9c3aWboO1Vn1k5p01qH1U8XjgfU1ndEY4iXyQ5SvXkM1EsH0KMG1cY3LBluhocn5mLizrlkbbfcHQBcP9jC3Dmd8AfS5Y76tL2+1Z0i7KQbY70tsEOT7XLbQT6acjFv8VwN2yXnoWsAu9CRxXPyDcCG14CTvSz4podmkv8tS/13wHlCp8PQYRbhjHUX/iNZ+B1y3t0ZDmci5ikjlFLfHbunIItc0l0RscPstRKUqR3Wl7ZKouT45bXWuA6gc6oykOrxr2JeQ985r4T2ScOdRoUm+7bzSgrPgNaGR6PWQcz7DoLet4sM6IKjLRXSzayB+gZrsYwlp47LCC+NvBZMiGigW13v9IXspg2RT8F2ex/1HOCWKfXw/mo/RV7k+IqNigFhu36hbrihUzGtOcz7tFudMSUobn2BXnZfIBO1YW1lDBPScmYrVWONlB9R+zCfxD4tNm6L+DK7AfBx3oGHa43VlWBvd2tLBwj5tut5ift4gNebWV9nO1GwFZMZaNa9zNyuMF213G4rpE42LNYu0cbr0/D22WnW9lvvT016i2acJqM/QJdT4WV79q62zVw7Q2vL2FcN/sxoVDKdB/wQYdfpptYcrkqvkjX3srxyTquc2byrPrUmreFz6Je+kZkRxbAlj/csRVd+LZ5Ztsen113glW1g0qcRL51wjCNL61po+5kNViwxiY4KlD6hTlwhS+oFlpGNl80DLnrKTdZ2JJWhyTb66i9lOjCTO21eLfA2XSb6phh5qOyCe0CAyt7L4MO241cI59QzHJaEvG6r51vSB+U/8Ez/n/JtVWzq6JoozdHvICXwpN9Se7Jruec3linkNx/D5nh+F9x63qYceZW75qoFMjsPPnYbEchHYSyES9Vf2kunRT151YlnwVPKl91+XELze2UqeDt7msUz81fuKz3/4BXdWEqo85ycSt1H1CUprJZESwVP9MNf1rZ3a3g0b5rZDuSYkRNJV0dkjsXU/j/8CDvq2wm45Rfve93rrn+wXg/u4xbj4BG8OWBVyuG2XEMJ1hNMZZYyHd+AINMyX8dvrUSFPgf9grbAcv8/Ca2mAPyu/4T0GuyE95fTOxe5z1Xt84DQl5d2dnEtfEyk8Mr2cXdcoJsLPnZLxwbZUuzu/QRHsniButJKqU6jd9kM6Fhaz3kJ3567WfOU4mxMwRzJbfFCZYohu+sCHWW/oG5sfSUG1f2M94UqJJNOhN+SjuoP2BVqddQNQYPcxDLZi5g7Nm+3fjdNqz8PbufcGJbrAgOgzIQOXBs0pp5vbaAaZJzfUcK6NE4DUZmXDztoJhkvNJdZr+mjDjVov9XSHZ5mXYZ8ptdS5vqHmgjGRDqlfxASZ5ltiDN3Uh/MDzG4l/5luNq4x1ur7VW/L/1o8Rr2q/LZtvH647VBB74bPRn9HjiOl8n39t38nLQdKMqqnl2/6l2PwarJUri26WfG3tIheY+0jFJgeaxXVJ/RvTYeARaWLKrvZBSaaG182x6hnrtd5W1w0J+2v2bhKq3Gjo7o2T92eGWM5pQkDFvHZ+sWGHqZ9pm7mi8wL88QWDE8zXdJOYpZJ90AvmlOwGWZ58zEuELIgAZgH90AWSA+QJUjG4THwYD0tKrJIJS9l5ZJ5SoTKRCGx4BjulEq3g5Yoo5xwZSowA3viCKQOAr/oeNIP8XMtQlsR8/H7Yn9pkd8xaDTGCqSyhm/2HuTGwtOlyVK70z+vaF8FOlPVhzSopM4SqRw2+kHenO9Vnzs+tOKcz0MvSUg01s9pv/s9n5Wu6fJoLAgVB19HJgS181gqfSie4D/POUClw2d6F/qZqVneNwkBaXQtRR753fP64OLvNNEtLXCFyxDJSu9PqmLn6+4pLl9dRxNrlEe8WdVIRbgbjsxDl5EuTklIJtlVjgUMEplkccgKl59ce7/LpB7LEX64TFVmSiv5/S7/eYz2pDleNEo4JTluf4Y5oWZmheQ+8B0tg+Yrljv8oFRlLc3zydRW639UHwYyflJusV0UzuiqsGpSS4h0OBBOrpRmcXdtEqrYqMU0QKX5taEruclhpe7BAzVvIQO6CesurGiGiUMagt+m8WCe1a5odEMCsR/a7vRAXeua6bUDal5Ct9i/7CvHEVNZzS9wfVWbuhl6zmF1xABXtXPqu1cEGCprO1UtUu/XO9X+taSqT1WdLdVz2ebt9cfMfENv9fky1BymP1rscBQ0nir/oS7QT684om+urqlZUhFFa6r6VpfSLsafTVb1ppptDW+0H0uMDTVsTN0ZDWb6Xe1cfqi+V/llTS5zrda1ycdwvsq3/r7eXGWzHzWu1PwnxDTqbO8cOxwvuMvlo6xG7U37ySZ97ebqerUcmOzYbkmzLDN1Ul/gWzn0pkD6ib4n6qbbZXtZ94L7alxj24YHWRcKGB/RvJWLZCj2nVkJjOc3aLYYj+mzUDvzUPdW+0u3GtQxGdRSnQS/INsN/ZZNNi7CE7hljEUcDKyw5HGFUBl2jnjk7C7OImeTbWT/wYstE2y7xN5wtUtvfKd9DJ/BFNIfxCL0l9Ndt21cCHcbviE67bESOarYpwoi6rw6I5vkuDTXC3H6Lex0H+D2CLig2gPMcVvvvMr1Dh4BXYIixKtljUSjbC6hcfsMzvBc4XqT7Ch7RG31KnfHfY64zfUw+7z0ot0LXdf5RiuPyMf6w4FzSFuABfJGnktA5XWngyqjaEbABveLomPuiKoZfYV1E3nIh/r2Eo/3Heg1QSxWLqWu+S3xw52mePwkT8mk6CVYju6Tf3Ka4uQh2qV8K78n0rg7RNVwMKCU9JPtJQchHQktskW82Jl0TUFOeOQ4k1yyGwCdBypbKnkU9VXZEf9EYHx7LNadl++B5sDJxA9xnvQWNNi2UxqI3VcZ2AvcJDsht3CvFNPgXSICSuRqFWOgvo4VioWQkdtrTRba0ZcgkW0mp+LvAFckmSadfgXcDlITL80Ky0U8CrnZ3KX5FjaH6WRoYz/DKYmt+ilCM7tGF2TZbG209GyxhSgzoN4E77HdFV4CEgfX9KbpEOBvCuKsNZ2BAsNG9QP7lppedXvUM7WJTDkbr1sqPK4+0rip6pfpuiapbrMV4PY1LuDO15+vStMlm720S5qqrClcGP/eklMu4j2qf9sOlxsaCxuYhna6KEbVHNJw1fBD87j5QJ3OnGrxqXhnn9Nw0GJgUhuG1WoaztaF6pY33ihPVD8xbK40qEMr42uuNNTTo5v+6NdUYcZwuqnqWN2BBq8qmbUHd7vqbb3KMUDQ1OTU9GUmVqutSxr9bS+bi9TG5pl1uU3P66qZj5pp9tnaVQJli+G8jKcbHtemABmW7fSxhn/Wfrpx6lh7Z3gZdF57Q32PX6vONa6xjrJVMH7MR22efqjDoAvSAXQZ9hurt0zRxzHj7RctffjD+hyLDdHC/6zh5l7wI/4Nt5bdDYl4najGWsTeJoIZDeBNx8jmYv3JH8AC+rllHT8YkNvz0FQJxTTJhvFv8OFYungReJhmsZ5Us5MbOgzpKXssn6Z86XQX3qvylMeAzxVHyJXOLyhCNdMtCBcL12Upkh0uSYpE/rzwU/7QfTD1Gfw/fqvEzu6QipRliZfiaxTRlB2eA9QhZaK+qkLPH+gIyTxFkkcX7D5xB12o2AsvVfwSeWB+nrmiQM910FrpOdKTmqe8hSaIatxc8FKyvfMe9zS4t3yuYiy+VwS5bBSneFaJvd0Geuvcl1DPvFKgGpf22C/isvy6YjJxVrXMdZJLZ8VwOAjRiXK9eJWX/CJ6wqtA5SE/4HbfhXQ5TnaHHsnuy3Z5FmApCt4lExruvgiMcvWXX1L5CqH4bpd2EgpSq0pEdc4b3QRwmQvQsmYPbDV2SZrNvSQ/o2JkIw4o3qBXxN+kmXwOGI6K5QnkM6RR3lt4D51pYVDhpM2uEf4yGeQNeSglFdqxj6m/4lTRdlghZog/yAJ8l80kuHPdkUhJF8ktW2881NrMTmN0QIbxNdEsIOYKJsN6Cj5nXExtgqaxWl2zvqvuO+vETMfu6RqMwcZi42KsPbNMV2r+p+mBVOtShbvIPGaqsb9GYwq1fNds0R/TLmDV/C/bhqYF5sO6uXQtf9c0w3HP4s0Y2VDzFG6Rcb79ECNRZ/BHmq82eDKv9HE2VXN23VlDa+C9sUS9RLfC0EtzrqXKPFZP1STwT4xKLs/qqV1dO7BOY4nR69Xp1uMmf+sHppv2XePHmt8NhPm8fR13rqGwvpfBzexe17qhXc0u5kpDovkaPVfTqiatQVT7w3G1/oimf2Oc+XFTQOMRzcmaf43vbN9tefVyC22q5Iz0TuPMlq+lp/qRerT2rT7COsi4l52qW6nvaVjZZHYssc6tKzE9rNOawxpC+BvMNW2i5Qc9s7ErM9JyzbDKXGl7butBVzQGM+lqEWAHZpqa6CQDB4B8VKMBUNK79WLtejrXfFWjEW413TVV205BYbpY42HzZANpEdtqkJPgH2ER0s7SStvG/AXYBtJgqeBjQ8zr7ZetCRZMpwKHWg/i4ba3IEdEGRnbDmE74c/nczMQX+AnMsFYQHyk2lG1xnlgPL0J6w/kIDSbCGppG7kc8kDy2UESL3ADOhP5wjwQztljwFsSmXATF6BOQhEwFt+JFIsTkCL5REoteSM6LqoFuyhutaCsQt4sXcrtYJ7gk5weUHfQ79L1onuCkcglH5CNsJU3gQ+AZdR7RRMwVL4PigdUIgv6AduoqgVcnZeQw1RhTmuwBsUTcB6ZhJ0EVxE0ZgFfww/l4103q9IVzyRPXX84P4fcJF0pObHZNVI+Aq+RLcYapWOUKsVwrA9er/RX7lMeUxpl0fAa7J60i+oZsgz5iieKLsoXu4qRSuU011vinVgh6XCtRU34O+VwpMULgAZTK90jWpygJKQIEiH9RfGyKy4FaAdSrnzu/EW53ynZ9ag0iDyIv3ONw4dTRsSFui56p4jD1uMsqCNkCh6RKX66rKLioIHivshoBUz9kTSrBrrqlBPkz+VZzm3AKYiPtFJmV2iE4+gu0RZyDHUeGaT6pgwFT+HXFXuoZegHaSa61fmLUOa0hZwDV3JbxGplqMxNshi+IfwQRSi7ChfFV+VfAXdqFFQg8IQaFsuKJQHiSKiOeoT6yvyZkWCPFvYYIVbDP7krIoUE5HsDi8G55CgghrlgHyV6JnFGE4GOtjnUQ+ogPx+OFz+zrmN+WcP4VrAruARZ4JiHpvAWdC64FI5H9/LroAhEgWv4cdZ0tou5jvGCdgoqy1nYhW1ntsO+lgJgERBhvmn8Z/nPds8gWC+Ar5AO6EhTuYXg5fATvVjg7afoFcZEpC/8ixsPW/WR9FjdK+5Ks4+1huvPK41uOsTRU19ES+mLunl0e2GoYyjvpJ+ri9dUghs0I22J+lFMqtFP99kx2/Sd7yFUGB1WnX6P9bvQ2/FJE8DMbM7XXHKcNe5p/t48v3kWu96YynfQXtOm6RiLXLPS+NYG2p86IhxS24WWWZIN7BbbPjtJw00hli9MN67WsqCpg6YVO5feqh7CWm2xTVa9f9Mg2+HG6w1HmazmQM1K0zEHZ+hvBfTzG5MMGpPBetFY13iIvWKRqn80+VmfavqanBs3a85ocVuVaQn9T9vd1I5+YmbVJewf+iu9y5pLO9P97Bf1k5u7aZPMiTazVa+laIfhqn6+tonLMf1oTOSd+ddcFZtqiGja2Ug1Q3Si7qr1lybafswSZdpklFpLbPPoOdwV20H7RLsrXWd8pd/IjG2Zwphp+mWPEe4aOugG6r1taUAd16Tfa4TtiTZAv7oZBdvah0HPdJ3tqwFY/wTcpstnih2rbITtlmBnwwCb/aRtkElpYq0W5h/9BiozWYWPzGVhvOmnTcEY7IWO08B7eDL8yPAOzAROwMmmHOML83O7t3AADXIg6DrBF0k0x7MuzC3hADiKbQDaCcvx28Iy4QtwmUkGFDQJpaET+S78eaZcOI8l2HYKk9BX1m/oLgZGh6E2cBH/CdpBPucLkB6AG7+EHMe0g5dzbakTTDObzrA8yH525PITgXwxzXZmTY69yGTkF+cg24geczfhOyIf0UGojn4jes6rkZVSH3gstYIaCx0Co6VL2UuChE8Qf8duQ6VwIeGAIykMOiHqyj9Du4CdoLfydkSaBJC10HTpP7la2hlQoUMlWnAX7IteI+eKvMUqmURYBg0T3wHuUnfEVSIBoQA/WSxmI/6IBgBTZFKnb6RGNJPYq7hDzZCWip6hnHyadAdmdRLLM4FeSL1slGgdlk6VynaJ7GAf9ILisUQkv0RelLcWeTp1Qx7BKuQOuFh8DKp1alBWK02iGPk8/AXpo6wHVyKgk0ixT1Iv9cAPEm5KHnoDXhI/kxwWf5fdU0xRxIjaOV/Dt0rmkilQmuw6dhh5T3GiYVg/8SnnDGg1sVzqgYjEMuQhdFRMorWUVgqTn51KoXLZDfkixVTnw9RBoot0MOIvTYOcyKvwM9gsqYOeg/+cOhDd5NWkK/EQOkH9lXwnCiU1VBQ6SATI/5MVII2So/hWaSjaGZOA8/DZUFfpb/E/xRFJAXRHrsDHSR8Cc8k1+H9SUHRIukPRJFdTq5DecK7oC1hIvAP+SR9BOvEWdBs6jfIQLcTWE+mytZIJ4EKRj9SMbcTbgNMkfSX95MegvhSHfIebwcPAGOgscFv6DU8k/YgEcAAYKKNkBDlZeh+ZDhRB2cBeoY/kACBB5vAtelT4SLpxGBTM7pJkCZCIwATIAL8RzwJS+HXgcHQcXIv156Yw0+AabigyW5Aiq6Fb1FSWFsWIPMGzUF9uBRVL/yBGgzCyihyKzMXDMQ2WBLrRNUA3Lps/z5nxf+RaeiHt7djFHeMmcp72NOgd8sl+EYLA1S2K4jTbD4gAyvA64QTYxj4G2Y/Ww5xtE1AsbLUCdCLjabsImYUfbDTWwd5ggYB0sAgZQy+n1eg1x1rkjy2FzYK/g+eth8Ae4E+4mBGx83lfOoEfai2BBccqaAb/Eq5nHwDBfDAss/xh75gj2N5QI3zcMg5MoOPtLWY1dANkhAB7HbzelmtMAjMZzvgFHOx4xnaydDLPsZLMWuMvYywoZx7YtXQy/Z4toN86ppk2mqAWh4myvbKNo5eaLwL/TCbDeovcssGQYiGYNXyT/Qt3gHXnHKw/l227CrTlYtnXfBIdbH3GTbcrmAVCqVBvZc2FjmJ6t6NXC962YvJtBpvdssPga91iLub9DJn8NeaF7YGRMDYbWzEqppvFyrka5hremN0s4fbrdIyhie1mSNcl65dZDjIGXSc6zhzm8DNV8ze5Y4YR1jHGq8xeejMz35TOE+Yy/Ria4E3mR4bLFolDbi3iDjp4+ljzM/1U/Vf9Fscj5rDlP/t+poN9mWOWDTR3seOW64bpTB2zz+puma/PYzW6nuaVzddN04xHzEX27wazbRI9zjya729Mprs1G5knpjHWQscc83TWg+7jaKdHeLvuhW0Ac6z5vH2SaTCt0euNrx2EGWL+MQfM5uZYwxvbYctJu8Q80j5c56ObaKf0sewJfr1uIw9x+/URzHed0bbYvIRJpMX8I8te+pcpyPbZcZNrbm6la+KWmk5aljEPrZh9pnWn47h+KN9s2G2l+QPGecxb/T/2PKu3Heej7KGmDeZ/+mnmx4aXfJ5pETtI6GTdZ+tr32yIZ4OFx8ap5gRLV7YdPca421BtTBd6M8mGG/pN+nPCNWG5fRZ7hvPgRrCj7UOtURxkuc05MWWmQvMOG8zDQgfTH8tuyy3zaPs44CTtYb5vJuypXFbL/gzkfjAf7MWOkfQHa2vLGuaPdbPxtXUWGGHcyu5h+9Jd2EO83NYodBEuMbH0XMdb7imQbEwxhwkbuH/cBEe58Nt6y9ST+c+x0LGsJeeX2eqACusT+wd6pqWrpczebH9l6ynUOQ4LwZCP4zxnEPqbTzkcYA/6nPCHHsSOdnSyv3PcEI5DOF1kG2KT8yfYccBj83HGzWazj3F8EpoYlm4HQ0IXWzZMwEdtzzmOPQBeA/9AFFfBZLZo5edCF/AWcpPtiExC6vjRwh5mBtzVpuLXw85ADyTX8Y2NZcPtTo4oNAG4Qu9nxfAr22vuMHKajmPnCCy/Au6MhIMerIw+Bq3jdzsEbgE8mw2EqgEMfixcoNtCE8F98HFIAkrgYnQoWAz3wLK4pfA2vie2hN6DTqQnMCNYT8QFaAMMoHejjyEHv5XrgfbEXgF96ef0Oaa94zf9HU/EzUw6lNDS8AhCItjD4H9oJ/wVfpaup9ciB/GPmA90Brgh/EFdOVc0Hr0HxtI5rC/cAP6ElqAz+GzsILZe6IIfRp8Ax1mWiUaM4G+gDjiFdcT2gNVMIfYIo9B8MAILZWuAZhbDvzJhbDo8CO3FbuZTkB7QbmAs9B80CqnB/4BniVZgO0xASoEBYAw2HB1BhLDVYG80iBsJ/ONvkBv5M7wP4SBVQgO+BbgAvoEWEDg1hxxLTcH7CB6ClQ/AelH94OvkCtgdnY2eQALJVuAZiBOSQJ5fhlQKKohFtqFLuQyhDJpGvCHW46PAp/giIhk8SN6hLmE/qGLgHrQU9Udl2GWwCNuDjYGThBjIixyLcUhJywRJMaAA3wsZwmBCQjbydVgGvkAAxTnUHriZeMAvwDToIrya6iaMFqqx1+Qd4iI0lTgAfgL/YFfQQ7iMfABbBS3em/RCSQojL6Bewku8lFoJDCDD0YkUCTGEAu+NdgHSgI3CB+R5y2pfgV3xDnAezIEHwBQ8AZomuiRuDZ8C7wouyC5gIUnCz8WZ4hVIMN5eNBE+I9yFsokRhCdZCC7BzyAgMhdwRYdh4+Eychb+CdqAEaIholmYM7pZFA2dw09RmaArdZTaiq4HPbB1xG7SnyxDbpGxQJC4B3kD/drC8yPJa7gLboHvIjmiNEoDTwVeivKgdPQ0ub5l584QMNkdt2B2/CfyDEkgTmC9JAuxCLyn5Ay4lngK1gJf0GcoCw2Beoq1kEw8TPJFFC8KpHaiu/CZRDfwGVGEJiH3oM3kUlE/PB89D2aKT6B1iAp6TfTA55AS6hkYCJeTz6EkfDChFMmRX4AMbyNGwC4giyVDu6B6kiBGQj/BQ+JOoECEUvPwa1Q9OQFbIV4F3YemIkVoCSBB94u6ShzQYfF8YoBkBp5FHEVGS/pCoyUC2hEqg06JRpM9IS0+mXhHCeReIg6zktfIDngnaIfoJbkMvSy6C4Vi+eIHaDNhBkMlz6AAdBBSir6AxsOrUQ36U/QZewyvg1eD66COmA0+Ks4WO2NJyOYWlXZE9J5aDXoTs8A54hACFieBk+Hr1FjkrCgEO4OXIuXi/S3ueSY4GZsk7gHVEzfBo1RX3B0Gqc3YDawZiZYguBqbgo0S4eh9fC61BPpD1mLtSV90PnQEXyTKw+eDA/E/+GfonqgQ/USKkR6STFEWGEcMFFmoi9hF0QLxAdgK/4I6oDaoEe+PRiLfWrze60QhngmWoqdazrywDuhPqAd1EYqFSKg1/hB7jc7DBVANHcRqiFJ0P1RJseJUzFuUjWRhDPqY+E7+xZeLWfQLeEosQzX4UOoj+JOoRgJFarCDyEC2xxYT9egGajcsFidjKBpFhSMKEiNSsG3UVkSB+oPToEjREqofNRt7TB3DPInW0EfRMvQWOgZ+ip+DAKQj0pNKhu5hlZSZAMhY/D/yNMji86gvmEkUCX4i4vFdyABqDKWFwiAvUbDoGt4amQDfFCdBQcRqkQXfRs4hbGhf8IYoFakSeUGh8DLxM/Q4XozNIJOJOtEDbIQ4Ad8rHo8BlD8mRXq0sNp1ZE80hcJF+4m/8BbiAz5DXEeNoqaDdkxMLG3Zo0jyleghWIGjcAXqhsxCRpPj8GtYKvES9kdK0N5iAsymuoPxIq5lpt0fugH3xCvgdGKyaDs+HPQCM0SVlI+oGXNHA1E3cD9Uho9D3yJz4ZXgdVCJxKFPoCXEK6iY2oOb4MeitTAq2i6KwOaQq9EHog6oCVFh20ReKAQ3od7kZDADyYVb+sZ4IVaI38S7otOpycQxqCd1ATcSEhCmfuElkI2yQAPIBsyK/Yd7YCeIemgsnA/fFF0Dr8DziGm4CXqLvYVuIoUwTA6kCsFrorXIZygcnoPI8QVUHRUt+kQcJD6CGPUbccYV+FtwOO4BBYuSofSWzOhIxcIs0gV/gs9EOpOXSBt5QoQT/qAPuBW5KEogV8L3iD1oP2QKtBLahH2hEuAypBo+h1+D1xIXRdktEUrEJ0A0FkGlEOPwbDCV6EFtx2+gZsITmw1TxFoiF1tNzYN3QoFYDDgKH4cHiRpBf7wPvhLuDG+gtoId8K2QHf9ADAWHwv9XeEdAF7IfNgoJRAcQ/YnOZAzWDe2GmoFa8irpBH1DUEqFHMHmkb2I5RhFvkAvYPVIEhxPHcU2wr2QN/g3/BfoSSRiBdgP6DXuRKxD3hCuom3YOige7w4dA/3hGOoOnI5+g0eQAeRuEISmgjYgAf2NREGHoAvkKLRVy/N+4jvQEiIT/YVVIlMIDi9GXhErUbkoGHpAQqQzkkSUkFuRmxhE/gBtaBV6gBwIochS+Auhgo4Q7lQLclPO+G2wmlrS4pWEkjy8G3HDP4G/8JvwSkwH3aZCiBhkMQzDfkQQsgwWgy+RkVAg6okvARPIDPwNXgt7wvOpg3AMMhxeDEMtO4ITE+Cx0AY8EanHnlOnWmpkBlYGe5LvWvKChU6Sj4j7cEf4AoFQrQlpCyozUBzRDlwOpsJXwa1kBboTmYsMwNOJAYiEUIBlBIZ4wyJwHeyL58O5YAm0klgOt8PzyTvgDWQ13JXyIS5RN6Fp0HxQS7TBUCwWa4seJHviOaiJKEePUQ7oDFID/wVHgL2xifgTbAsSAHfA/6MW4xVYGqIiOxNqdDweB4oIFB+F1kJqJBTdAC8keKwGWES8azlGwp1QAIRa4t4WzSN2okORr9j0loo3AcwlepCLyfFwHs7C3dF+WCm5BU0FKlpYyRvch2Ra+jgWnCBWw57UH7ACSCcjiCFoIrEdvIc9JOKxvuRHVEEBLVo1FDkPtwQMbYVfhf8Cv1r4RjvoBt4bWwy6wrFYBNyKOAOUIX5kREuUcqGNwCN4JXq7hcX8Ic8Tz4ARWBKphaegBHwLz2upFiSxk9gC9UCGYy/hWvwNPAzOIBZDp5DzWDkyHh1DbMdGQMvxM3Ab8CqMEoNbVGssXAu1JvaiLvBzIg5yIYeTx+DT+EZiIDAUXgtAaChpg+fhS6DFYAxY3/Im74AzYDQxDNgFD4KO4pW4lCxpQRQToUJ4FACOET7YD2AwcAqZgBWjo9HBLV/VfvgqdI24B/WEZ4MgygBOSJ5wARyNwiiO3UMZxAk8i84CFoEE+lV4h8lakKYeWAer0WQsBpmEK8FUcA/SDh5ODIAqsSEQip5FL2J1wjR8LhQOhYDVcAfoHLwfzoBRJAIeLKzAxqFq4CNubon8Y2Qq/AWzAlkt6Ldd2IlhwEa0CzoQHwc8w2X4aiAKGSy0qH88D76D/oLaQ9mYLzoJ5zEfoScG4GcRNTIS+4hVg2bkMgohY7HvwHzsIvJWsILZ6B4QxSqBnZAIDQfOYwXQIzikhb0OQ73x3uAdxEnoDOaCAnoG8G/hGbfRRvQWX4dK0d/AQngfmtrSa8pGw1qy6TUowWigBM2Ck9BYfjO2CqGg8+BS6IhwChmAYsI/tCt/mjcgu4RIOA2OgzqjY3gXeAp/FbqCfgJWw6sBM+wHj0E9gWjhG5gAbkYyhaKWfL0ujEB9kUHIPrQVsgEphnM5K/cD9EEFsBEIRKKRj5ynQEKZ/DZAENTCI0AijAN7INFgy5QTjAlTwXjeD/gCnuc+ISbEF+nCDwEP8gB0n98m/ADToDDwOqvn47hpnBN4k5sKxfJ+Qin/W7DzruxyYSZyn1sLzIU9W+pAb26csIkXADXQC2wWDnH5/AKgPfwATOIGc8P5kXBXMAruzhHCMri9cAu+D/Vo4bEqQMruhOfw/fm5MAb/49YI5xiOieUOgs/YYH4ZMwhOBA3QeC4d3MWRkA87gx/LbmcGC/ECBqQwKUAZf5i5z84BJgjT2E2QFz8DsDIHwWVCZ6416w++Y54JBDOoxWnryXuARwEvQQtMoV+yr4Rh/FsWZ4bxM0EnXgzgoCe3h2GF/XQ11xO83aJb+goHgF7CRGAWX+DYJbiB3TmQzeTfOl7znQAZM0co5N84dnIr6QZGxAwXdnFKlmHcAS07iR3HhfB5dDw9Waig57CzhVBggdCWLmYT6e3sMyYciKVvMMEObyarRR2OY1exM3kb3ZW2MAB9hz/Bd2ZmsSRwnp/oEPMF7D1eSbdjhgmXOYiztPjRUm4nfZOLdXxz/GPWcRAwj9/PVdtLuWx6OBcGtDhEjmzhhOOF/Su7kAllvR03eTv9mHlNx3I72cnMVGGBI4MO5b25Ant/XiJ8dfiyensn4SYzmxtMz+O38HP5DIcn08l+nh7GgLyKHUK7C1H8N45zxLFOfHbLSluzXYVt9oN8Hf/O3p7ZyIbTCmYFX0xbbeFsP3YD08ve3lFn60W78qMdvx0PW3yTBP5Uy/9Vl/gMvsLR2tGr5Y4j2CDhJzeaz6Wf2t/wfsxCPp9GGRnzxnHbIRWaaCmTz3flFQ5SaHF3bVfZfOYif5tJYcbZp7HnaS820F7N7rWnOQKY0+wOOpPvJExgtXwWPYrdx0znQHs5s7clsru5z8xwe759AvuRHcDwHCwstO+hp/EB3F16niPbXsfOZm/Ye3Bmxy76guMl+9HeiUG5/Y4xfDH72/GJ78e35+8wi7h59o38VPYUb7E/ZLfSMvoQvYjdxHZjLtIwE8785N47DrN6RzXz2J4kpLEXW9wlK9uebuA7Cq+Eqy155y3YHa/pp45QZhW92LHPoWyJWUfuEt9aGMTM5fIZmN7FQcxuLoDx5mu5cH6l4zOTwD0UYNpA/6QttKOl27Cb/8eFCCe5S9wtYBw/lG7LLBZG0I1sIDCBvcT1Bz7RQUA+9xcYSnszCPOKXkZXsitplAth1MInpjeXx7Zm1zFTuBNACecDZgs2romh+PHsB0YG8EIW91TozvRiQe4x2Mgv4v9jdYKJ9RdW8r15MdudO8gVsgmCXoiAroMsGw0d5hRgKHuLP8wPY2PAh8IfQMO1AodAk3maF7hl7HJwFXCBnyUUCtXQN3CEMERwhjl2OVDMbQUWAofZGtZFaAJSQQMAgXLuGpTWgncvgbVQH+EXkN5SDU5xKfwnfiykEqZxboKOT+HH8Ol8GfdcmMHf5voBnZEFwg3uj+ABvRVuCmtAGzyxxe8G+XDgg1AhNIKrwVdCD94dvMXnIzkABcXC3aBrwP8AUEsDBBQAAAAIADN/U10SXgznblsAAOpeAAAhAAAAc291bmQvd2VhcG9ucy9yb2NrZXQvcm9ja2x4MWEud2F2FVwFUBtdF13feIK7a4tTrEIpFerurl/dvdSou7tRd/dSpS1tgSLF3TUEAvH1/fNPZrKbnezuZHPePefee94bNzQhoX4WAEyOnzRo4Yr17goAAEDzy3MSAAx8AgAQoAAWzF0/96v5OxF/HP/ZO3yP17xZFchJzjvluRMhr+M/NiydMqomf9FXnxEUVP8nanfnfDcZVafuXQHBedNDpIfHdCLZStxmOfV2QOFkfmfx9LeLK2Z0dw53D9P+Wf4vPqb/wuX8Tn5n30TR8P9vbRZrewwbMx7mdzbOhvqM8CtZgPYqdl8yzmbHt9G3xHVOzttdYq/ZwMHnV3hJ325MTzTN43e6rON3rrfxXfRSwe9Mm1e2+GFffmf74P9frXQSv/OLB7/zg6vJ4f+fHePcBD9E/US3R6+RNGH8TnDe0RHsHEdXq8V3/fYCl5wm9F9pPprs7igR92a3vp2qnOQguj2Q3+k7NTY6KOQ64wN+G1CCnZkUAN4X2cYO65WHRs8SsTEJjv9J+ysVu1R9QpK7YgY8tV0+Bq1KH90YcAt67PHPo65qhn/bCCSt8fM2fb7vBOqC0sOC9vQraIitK//l0FWvTx3REt9Q6/wua5PkQV6J3yMvwvujnzRn/LnOT5K2d3A5eu1M/qsSy8kXvmvrc6ejYFLm8aHFrxANuudn9qtBzeFAwV36muo8mNT6BUxSXp3ywPm8S8G6gum7wKSDBz+TU88pP9X8Sb0NJuE3TSfBJDBpTFHJCTBpZun/95MvTrr16/LuQ49U12+ASfSDBWVg0stfjhVjvoNJX96BST7lnw+U/StWD7/1/g6YNPE8e0Opzqn8/5lg0oOPYFL2q7CiG+8mn3dVg0lbD4NJpRWDP4FJDQ/3PfnvZVbe5tRFpSu+ycBFZ8UPF1lqVOzeZeW9nww9du+vSjXClJ9zoTiFLMtUOzak+L5QNFPQQP3KrwfK5lf5So+X62QD/XfcHR4p7Vfmd4Uus78krGwZFJrR/UW8ssvLe+pPW/2gkthx1T2HdPQjXk27LiEGrYb0xd19Aru/Bi7b3isJLykGL1QmrLKefjSm0HaKXWoUPubTQG/P1JWdiftinnlO36nSDVs/ZXxfv/cb3m+f779hpJ1gFzUi+i7m2u/kJI9BixYrF+f33hLG78wxY2j/KJ8Bc20uDc/aHubeYvvXvXBsr/+SIh+vfby5ZFHisn9rDvem1xwK4He2zuV3juk1wPxuRub6pLWaBU9G8Dt3hfI7DXO39vaX7N3E7zw/+MXSi9NOLJ63lN+ZtDF3uO+ijJU1m/3k/M53Y0ck6OPtYYtxEzynU5O29ef5nauHbnd+MmWVbdSIQ5EuXIGXtcuD8CVLPtiVecdMftxaMH0rwYXdGvl94KgpM8ZUh0b7rJM6eryhdrvvi5Z3v0wVDIjNGIeHF1sHHMYXxq0sSyt0iiILncK/fMD+vAyZVJXrsrsu+rFfzTz5fUfP4EBtS4BaWdz0oHJWfUD5/Pv7itZS9vcTbYbcLK0SIHhDumKo6NMNid3WSytOgF3JtCu+ArHu2HFq9KdMdFnNw1vLNbs/vDjlfQhMij0GJkWcR87k7q5KH375/dulD7cWfP56vO5zXt9bux7M0vfbf+wKmKTOUTTebfNqTT5h+HO3OPrKnc6Cb8r3aR/31ES8G1j1svq/txuTpx8ifsw/8+PAnVzXU/9HXUfj/efNHyIN1qd2ZpTWDqe21kZ/BpMG/JCmx+ekZAvSzJh96/9wda3tye0XW36ASaZrYNKGV/WPep9Pz1p89Vt24rWoDges4vcYLXw5PjX/7e5zJ12bzy24pXnX+m6leND7ybmNDiOS5zTfoEaLpzosbQvQhbuepwcpF77KtLid692Z3nCmboLP3NqYvFLNf8XFYa3Ry/4dydK2u4m3pNfILwibs7smnB3yqKzK4mvLl7IwdOD0ypopfslTMwg3Heczccx9+sO8dUzgqrG9vIaKY97NoyzCE+1M02auGpoV3uVVsOm4KUKU0OMXH71q738J7O7AcfEpm/mdz7f16lViER9WvgMV1TnYOoS7jBv+Y45o5uR18+ISLT958T3ItbcGnd0xZNa2Pk/MUdGiT/DygYP3R8lGXVpvjodrPHosXnHT5/PgAustKyYNmxo5K3b7wKpVqsk+eF/Pu26C/2YljAiYuii7e/4s8ZgRVuPtnaboHC4C3Zckb423mrYMn7t9hbpf6Eww8PPi1EHf5g6a2RXg4Xi7K2H2jGE9Arz0UE/L6KExx2edZevc06O2x1pKj4X1tAlw6uhXFHGpfkYprV0unRTi5iLLLk3YbyclIrrfTbvw+yTS2XQ+a2fg0coN9GC/X+Vhf7ry7jLyF5O7+6lG57MvNmYvT/nv9yuLF5jy253bcPkn6bRS69Q94rguK1HfvEPK011Uvp2q+H1c5Yrsbpqm9Lw/G+7Yf/2um3jGCp5aYvtsrcom7SrTpi06evMQ+HzgRd0l4xu3xwfTEx5x738oo4lxmqzc0ltgUtTeplYwqeZOxOfYf9PPe+9KzZu4R6ifZIjSgEnrC8CkFbrAkmfqHV9zakKarpcCVzelrdFEasEkr9bpuXnqoNfdLpkxly59sOHqtecjzdHP6bSm6H3SytsNmshjtw9trB7Xduxy1uW7V7Ox5ZXzBSGnbVIA4GRuceWhNqbUW3+u6t1rtq7xrX85XuptZOVCWZhrYsYM4+yOGS1OX4a5RWeUesN/ha6O0LqSeOlA2dWgbnWvc/C/xzVdxsl97GXlebN/O4CamIDi4VIq7rT4muSzPDeqtFKRcGtsD3a9Y1Dr6gHra38LL1r1bv459UX9ttGzXe7g3/0DJvScvHlwu3Li1OGug73RaZt06xeyU29hJ7wtevcL/Wr62x2IWjJyqt2kidlzbIbCEzeNgC0vbvncf5uEElyfDwerh+7e+lPW02Opmde3+DXY/v6vLvGWrX3UZ6dVI3VD+J3nVlwK7BniZnd059w129f8GK4c+HDm+rVXRs2dc3hKouU2y6WLOqPLhX29R0SeGzHVJWFY0eArtqlwyJpLzkt6CuTbbKwnHpi1ImhkwpwJmHwF3YosHnbYbn1kXbBdzOIJcYqxPTP5N8TaULDPEZiIrfIeHkSH3DImO15xnOnzvWNWBDDCoPqPSxt7OH6EfXP7Upd3ze3OvfyH0yx+pnpgbk2MUrct169nYtypqBXFz+3fRk38m4wVtOqQoQY7yedSSbsrFGU0fhb+HfA68y+dVk+mPe+vD2HqC7zQnO/f71o35GUit9Z/tTaNZPbout3oV33j8xh60uvR5/vVV79fdb3kY9dZ9xbPlx9z1vz7WXOBqFVtYLY+XdS+JXPpffjVjisB+yY2rKjrLD9+rM/vvA7xM+XXnjWZ7b0/gEnvUjzL3rSOVYJJi4vbX+U+j/5TeNr/Ve2eTw+Qd6vvbfw0Mzn+ujH92l/RAZec1UePKXMfQXubGj7USjLZnGFpM2/W3fubvv3jhf2xXaOoQtPI45HPn+gy3zvWZ5uKGnprrrzQfT777g3Fp3OmbtTKZpodCHRwk/j5b1MViYX9/20Xx+V9lPxT7sb3a/Xf50H1JTN//ayVl4V+StWn/Qwvd/293X4c3+o7DDJ8e+rWXXZR+qhUG7y+66n9i5Z//NqwFDtt7WSXAx4N0QNie4fEqL44vvbNGO5FOfdcGj98iGLwj0gbJ9fIA619YAaoI6WtxwhekuyUqFutxefuDVpPb4z3telEnw15ACVHrrS+5pEzPmDM8GH+075Or7Q6gHkNL52/J1Y17fDghRO+e29fscC5w81hTsEGRYgkcY987MrTit4Ogg09Ro6fz/gmT7w0asqSBTF7twjm/tkG22ydmDctKeHN4rn9twTvGj8h9FKQgzBsum+38xHV2wZGVQ3+tZgIPe/JrvuxdnTMQMeDm90SHk5Lt9oWaOFzT2Lh69lfMzQgcF3ssLmD4gO8do+JsRwbONW5YVBG2MbxTsOIsSWzG4bN7dfp92XqbctxoT+if1sFjcqJ6uz50uLGsJU0MPh+Y9egPfGzob8t95ye9LmsHAw6tjPx8XWxxWXiXmWG9uX5pwWdYUsQQ+dur+PuuY3jw86pOHdXu/cVgwtnmvAs547yD0Xv98H3TUnfVPnd7S7XJeW/lk9Rns2/pHr0t/Lxiuzbad3ShM33uxJvDUkLzwBviN7ZXquueVKDXdtP/SBntlu9yf9y/oLXvVeno15+KBWmhpV0Xix9Ln+/VjPt7n+tpwrh5KXa72fY8wpl6Jnyb/wxz5bJ5zsvcPuFWZdbw26t/p73Ou3r58fH00aeOJpikRZ+eryefveuyu+wV+OI8/1St73acmrXMyrli8r1uyBVdmNHwemrL4osiImN04rffDt5V1IsaH95vi13g3pypX1Gt2a7O7/YAdklHWeaZrwmhPS3O7+kPza+FjasURpk156Of3T9jSzvLEiVT3zz69UeeaYqovarzKYjwO6D47DGWfSyjBH2I6rd3a/lbGk9m3Mwyx6s8nf746I5lj6qta1kc8OmrsNZfnRvSaHiscXdpp5WHt6QPMtd0T8uOqjyXcKdHhtrjN2f+a9vuO83ZPD1wZfdPjgkdK6RKt3uw+S4Bdpk2UUg0t0wzsp5Uox9Qr8e28J8hgsWbB+Iez/w3++4d57aqd2vReAydNcyu+6R+CyR8/SPy68rPK36iB97TRq/Z5LGX+v/ZIHGqn3t2bkOdhGLjiw/7TM6OsH+Y/d7077bcn5f3LZZ3QsaHXZx7I9BVTalPXsHfFult73R0z3gnvcV58j/vqypS2gOCLdvFH4cGu74wPqi5MwsqfM81yb33iMkvc+Hfw9Cwr1idXHTrJ36GMcEoL96TRk4v9ucCaHxjVPynL3C7w7ba1VgubHX9XFuxkvc7NE09AgPsEbVErGo24KGVwMlnVVRoo50ZJw2jml22l6+tFkZ4tLLvSE34E6PAXXloaeDunxve/Q2qBqt1UlcRl1q9l25Z7u62+jWwJ/Lre18UmqjNRAyNLWlgsjd9WHftwL+o7wvs10ZTmNf7lf3y617dfYxkTOV2PTCQztPeZN1q+j/W/Dw+0eHZ5Z4yuuaDrF+aSefk/Ypv/LRtcLq1qf6DwldI8pmZs9un/F2y4v+BVEXZv2Y9XnLy9zfQdot9yednaYtaWYr+2cufjblkyr7S/W5a1VNPVUOP0e2fWjd9ibgpu2dqef7Nqa9cUrbW8GeDbx6LOdMeUTr+V8zH+Yr7b6Xvm18HpINPelrrG9zv/z2fc39aeW/9cPuvW9wfLnsjiP17l78z3vvPxWUfzr0YC7CcqFAzcO72l9p/ajsP+8zT/1Oz1vwsd1KWD6pTIll/j7/Ov/Hpo4+ZSd+g5ZBnfFuxX/uicjvD6hRyGb1FXiQ9cC2J177JZgpxXlnwS1ldIVHwExVX2JPfZRsrnUi61IhCFK0PhRH4Bb6LU4K503BXYod/TPDvbQBwjb9pP5bo38OODVwqLAiBsL29z+GHe6uc4/V/jfyRbzQb0qIz5Sxsufsp8lye40nYSHHnMY24v0lNcgdu+WK9RNegF5xp+385gjjTgxmxdj0SuGmqYXxr6at7fWf06txInc335aR0cscPeMnLpr0a3infI2399LLvbz8K/stGhYzc96wygm7u0+dNtsWkm6TnOp3b+zkkcbYAb5/+qjthuDVPVMm3J26eFbviAMxfW3cIvmIip5Dh69PyJnyzdFr/BaPO1G/xqUP79M/WHp13PpuNyxSbeyi6mXJMeGxseNr3DYPfYwnDLXWz7fcpBcMXeLigb/VhluOlKBdk3sO9V4afLLnM+Zy8J5w78ij3aw0C8sdjE+Reitfp8eFc6rO2Q0VdMcfBA01HHX92BVcv9O1si1JObvykHps/nHufcNQDjD+AyM6V/8QpN3RzWlwKFwCuduwX4YaikVUpgirbltXtOAnYdj1tomcWH+7OixrimDifeCzoaFP16DGxR2Jv8MYuCzjwVrNqKoFf17w/6WwD47/TqtflPqj3lD/7yXWCH5Ykoz+7fPrxgP4952i2y+VT1Mvj/o3pmztt5Wfe+XM1K68dvTdqxq+c8rztltj0w8/D8lb8mu4stf1uPtLf92pKCZ/dVY2PK/6+/O0uupRUZboxdE3gRUexlmZrt8PPLLO3/Rr39fsO64NVWktNRNaB/9j2GtfP38bY2CaK5qvZIzOeUIPFoVrZ+qA1wmKBTUP6VUFPD5XeoZK/pZgi1g7K4cT1kxYZrS9g+h86QrXa3wo8qrqRMOO2iBjsMAfuWw8Y8rSjlR1dym2uVcyvpppsRCwVqfrb7Z/9ghp/htQGhzNKUOi6oPjUl1wRxvvGOshGhefCuV2oTVS7CruD2sM3f+5XoNX9X4V3t9B6TtKznqERW4FIHRwt7b4SxwSvtPdybU1VhZ2cdhAVGKVMiVOtn3GbdeZ1lNt/w5/7XbB4ahvXUhIVNNIaZ/k/oKZgxUzRz/r8WDYc+mYwYtiOyf0mLQ0ZMD0BeIKuyuSuwMeBlyyHSd1niSz/zZ7stegvn6+9z2nh+qdrk7Idt038O5gdEyVYw48vteYgP1T+vsVQivjYgO87JOia3om9bg1RRLe5GWwmSl/I9MPnGHrZRkruzS81nU/c9/yH717RBpslK4NGx1zwSWGKrEkhAVB38J/xl8mRkivOWb67xd/dbZut4zpbBI6fHI8QXob3aFr2gdVNpyJL7eP6vCrltTENbtUHHabYr+/drQzYzna4qEqqrMX7NV51E5nq0Q3ZDtYX1MQeRcbb2SJ6XpJz7ISwTrGRNWRq9mHRZdaB1ddzaD+tua01oRBrR/vfLb6/kS/uGqUdi/gm5KrlqvvNd03zHr48usOqvntk79rqoQF2pIfbcZ86fM/z9D2f9+nfYVTtufMfJL6elfO5kfprcc+7LgfRf5scf576Ikq5UBKXpPHW+bnxYpPReceXKktU574viIjVn+wRfcVKXraelf13PAs5fxtn59ELfF6Smfcr+aMhS8Olz3JP0RVv89SQ58M5JcXyXrN57cpM38nqh6/m1Xcj/YuuVm9Od/rc99yTQbxa35DZEW29jkoVxbUxSOziT50ITpAu634CP4l+0791Z+ntb5F4py36CXaoeZwZWblqqZI64euPUR/obWFSzHIRyZId3dsutT9jdUBcrSLyveYi51jNzStLdlvcat/tzCvvwI3lrG7GfQCzO0txZtifqGOXfflct2nPnvpKa4avspi0iA8JhrFRe1op5Tl13FjZXUWzc6E7xq/I0MZhy/ud5w3oBdHzB9W4NBnuL3/Oa8Cp3g5arMk6obgiIR1q7ZVKl4nmPp1Yj9HHR4S3OOMd9l4me+K+Enu9a5G/LAFHLl2VHjEzIEnuj/1vh7627ePeD22eVqgzUbRgeAr9pSkSXB14iDL+MCuqI4Bs2IDgp8MP+m43Hz0oY3RrpvcZ1RMyCoFOPhhhJfPh6CT4Sf7BQ03hATzkgFHgyd5d8Upnc5h5djC6MN9twtGGPb4uWhXh6905T3sTFfBQig7iHea0wckwsMzyRoRpDxORwXEdtxqn9Qt27ehuUVg5+zg2b9hT3mk6j/7TdQR1yzni8JA6IQYrGvWv+rcYejKrqzDWr8XFVgOhHrDEss3Ze+qu4p+yaZrlB3TMz1r9uqzW9f9qyx0bS9NTcTfGTf/efF9M1iVY1V5tmXW7ybdvXcLqrxTMuCONCxP3vlE3f9t1p/7hVfSrr3KaH7DuVPjqnrRo155fXmWu6Xt0MeIb++J5o7HXRkZl3PGmd6Vfss7n/UpZ8XHFZlTHjx4I0g5+aktJ011pSkxp+8rTUvytw0Pv6ZeK7H7UPZU2vqo2KMl5nN40Yzaj7rdqZfJs+9/0q/qdr/giA1F8xmIndMZ8+Zt4fHyut+HwPgaSZs3W9MS/7OrNeErk5H+9yYO4xapA5Dwz09VE4vefvv6g8zPLD8DdGudZciUfCd0+ASiFDqtDbe/Y9ht+qkuY6fY7LRYU35G2FxxPH96s6jhWVWH2LaktWaCfYhZGQ7xuqV+aeGnTjD851shOeEczF5u8vWQq+Nl79wdOqGoH1i8PjJoodOTXuk2FI1GR/VNkgyNQCIuwVvE9WHzcAvKIXae274EGO2NLO+7RzQU+jJoRrdP0pnB3+Igu1HuO/hVQcGOCzzvxt6LjZAP8Sn1WoXYygptJkf2Dp8QzXsnhZ8cXjN85sgxvZ9b7B9JCQKCnKWSiFrLxJH+2OXwz/G64DKbz66kl8rt4XB6zDTL7wEdoyoTVo76Eh/Wb0g/27HHbId6nnGc0edVYLjFU/fnkQ99ivxmOhxw/eN11nVTYJN1RI+lvmu5zdEjBi4L9XCEaMvg391d4u3tVEE2oMzRwelqzDJjKHYg6gCuisoGgiLdpEHu8R4vhAtkMBIf3GBVpegm/CL77N/Wdp/rCLDUHCEbfWNVL9WJSHKzwWYi7VVV6TQPjOUXAeFNXTJvx/9KLeir4sfqhorZxpHqJ+22+Zek5YURSGthmbS3sT1TxcTlHMcfVk5APfnTBVW/EpuGZPT/Me0bjdk1rS/fkXdJnZMTooM15Y3j9G/f32gfoms1rG+j3x/6ISt4/vpsZdi3ffVHTE0GU4dfuqH53OtVRSvKrCrvZKmMM0v6lTSXjX4+NfuOem9u4e8v/yYXL6kb9DHJ9Oz9lx8McYc8mTf7B5edlnX7DdkZ+svN1KvslsFXt9ZAZBeVJtTL21KrBn/+136UDs0cXQJm/n0frk4lJjfuL3zXdCx/ZUuwnitRAA1FaTVlTYngcnqkukR1h/DXrfjhV2Ut7a7d2NGz4vtvd+Q7vQ4dIMwXFhQ8EySURDXmGbe37m/10OzTbJL1b0it/tm0hGP5wLJJFqOdGH2orXtrTuV63yz3S9wGp8va493KXd+6mhovmVYLeoA/YK0kSTBBoMDJbn5kNaAOS+T6hAW55/o2Oo8NeUc8N8zsVhJ4zT1cHgYt9n0QeEjg5p9OijnbIG/ukY8u/LDdotghTkzfjeInPp1WD/y6YsOGDAQjvC179U7oi673eOK0NcLasx2GnGyGHbK6KeuwWuQntixLuB8erBgpeRzj7vAi8JbXCfEr9Fc01Kebdy/RTZtTspV4oc3LeJH0qctHt2NDb/RzjYmJe9y3F/o5ZLCLxOlyQrp3S9+j/bZ0X2h5yDI39IDgj3ecj7V/0YBd/QPgB9IL8U7Y/F65wlW+1xRVtt49jM637arQeOoResuODltLTIJ3CKKEowLXOpu6RTA2WJvTWXWzjwrPNjUq+wlkkhr17JamJrnrg66P1nuVHeR72bX2Dw7G9hCXFPpA2UhBbs2leo3pc91ndiRyomAX2p/cVX2uFjS+055WhUpBWWX7BGEw2dH2sXZx01NdK3skfwl23zCs/lYmBzyizmWlmH51XC7sXhtVVdkoUo2tbM0YXPJUL+SSOyNztzQFqWfyDzLAr1lUSdn2T1sNr4yR369W4t8X612Vw6vbajZkjywqbV/xvvDnMs11kzFleIPScOLbi+r5WemqVU2a8qsNfJW0q6I5vDS69oIOzGl8/7ic+VL/ZXJlRcH+P5O/T9ehlD69psxDLS2NK3lS3M4kVfBfh+aeSseyctq/le/JIwzC5t/ka50u3bkFqRK2jUZd8iLVvTvkOeqMJXB8VnolUmCZVa8xoo8qrCrJyidUboGAduyaooB5uCW82AIPFoWqWsv3ORxFD4mncozlZibLkmtY0PnGydf9jt0DzYMGoXybZ5G9veN75zS5j/GFg0QXiU1sW2eM7ejj/RkMt88KPtVNZNNgaA+0l94OTxYEWb8I97LpDyU6znR/KSizuGwnli6MCoqMCY5gW6IXRIJR28VPIkY7jgv8L8jB4ou3V/jywL+Cj2hiyOGQcY6F/uMVr4WPrURO1u7Rtrd7zgxw7bZZrugjCH3n8T4moT8aVu220uJfz9SEba5Ur2WSPbbz+44UDXPtjFntV2t1yvajYGe/jYPW2vf1Od1nf1Ch7YCQ+uDEgGz/i1CJjcYpxf1C9MTw4175QA9/n7hcvrRndyka9Fda4HEqNFWR6xNjN0b8gGgNaIdoeZnxmv1et+OEkZ7nUBUa4rDQb4crjj8L7OoC0e/2C4UruseJL4kGej/Q9zAKmFKvhy0u7o5GVvLH9YWnLepnbZC4t7rbdIgGVU231lIlqE58pA4Se9Vsao4rLqY0yKJWH2KEXFRY3dxbV4RkSfL58TkfSbLCmeneNLR0umiy8B100Oif19IE6Xp2ldCjqiJpbQZM9M2AasZmry2fUq/VT/19MbWRyW9U/Z2gs8/y/dlI7koNS+uvMaSW/a3XvaV/5edUV7QENNn9C/9tldasBkuK2p9lqX4/+pVaV523qfRty9L6D8aFLeCX04aFDUdaV5Sm/4ONq+tGNM4xpHX00lH5bxvPpCf+/pP26++jCrx0LTM8dWt1M7FcFVplatje/OzvGqZ/fapyFuNUNyjfP6Py90elS/2sotzaWZ0WFaw2AnZqrjOtaVWX5BEzikeXvca6a3p2Ohrj6nc1GCoGKEvwdGCfhYv1+a4dqisdT1uGO5xvncWoUWndu9qest0uErlQf0nXiD8Sb4b2et2Eu5m+KJ9rvVSZbv/AL/owdYYwTbjQb7Z7DfDU+hvaU3rd8F3e185G19eW6O4cMNzhvTWO+ZpEPotdNkZZug+weOpz3f5Z5NnQuz6nGD9hGnohcpHAt/tmwU9PN8cnsSm+3RUp1hv7OsQM6Ls5DIr7YB2Fh0RsFXDRcwOvR5Oun8QL4u77K+OvBL0RTYjdEDDEQe6t7XPALj/6h19twC5bY+RB9+Euc2w95fctP0dB/uUx9ea7+UvHhNTL7MM2QN0EawMiMZNof6izNFAW6XY9YqzVU6uy6BrggVes1zxBhs21iCt4fLf3iMpuuuxrjwlSrpsNc05aE1bs5yVcHzJFdFXoyh4STKRscRdRkXC9ostT7fjLIsfuid3G9s0m1C3SSYz1JDY7zVd1siniB5JpDkyzSGetE3fWOu3vJOWUqY+t0OqQVVrnPKO6QwqZGldztyxtifuGbq2TtTO0mxo/V/wQJ6u7qt6YRrc2Gl4KHgsuFNzK+0VdpjaatpQ45j1sS8xOMEkr3IFQPqFsaK0V9KH9d4d73YuWc8qD2lk5teVzCvbXv/m5pdJNf5gdWvg763Ph6fRdaaPLhOmPiC3/4jtnlWxpulhdQq3IXFm85Pe0PxU/4zJW/nTQz9bdqrStvPBPmv4gr+7Pgqxrv7TfN1Ta1qKlsdUtRmu9L53f9arLyijMnk8TqmnkFeUnZpL+fIVF+rfSkSXK9N2tfTq86YH8kqpxpbIqadaAyoosj7ph9WOwktxh2AGtCT/RzusxMqE2pXyRsIdks84BvqWOw07CB5tErC2a11ZlcY+Mtx4taW0eZ7MQ/QH26ODsm5qXIFu4ZMlExQJ7q7ZSA6OATFLnjx1Jbgs86xwKiAZ5qIOXNJDeAd8zHKeOIbugMiHh+deZBLIljqbLjg+spsIf+Mm+rUFXoJFCK3+TJxR8wFHIGqkWnxgozCZN8NnaD/ZXhPTo57cZX+rvhc6zno9e9kQ8bvUIxodaXvetg3541dlsU1wLmahYiIgVu7ud7rFWobc7H9zlexHdGvTW9Wv4W7ux8kM9si2H97kQnBt8A1E5evSy92m064lbWArlNRaXBc/gKyJZ4DnnR25jwhRh1bbP3d9Kj9nticnu8dQTjwiwu+E9KmABMMQxAb3g28e6pwzC+lqH+P1nY+M5pXue1VPsKX7VfaNzjoWV6BnwWmLj6U556P7zh7SfZZes5KZYPNo+xD3acpl7DnLFfZ3igqbOuBro77yFjrMoEM/hvYA0J2duRcc7B72yQfCsIcxwR3ifKayXKi8KtrMljdeBrZ1pDTF1sDGl9prJoGOJA6iTpku3Gv4smqacLRyCDS/YgaPkB1ZfeaLxP9365pFUNbQ97wqTkPOzbEPOtvztzXsKRxA1OR+zlCb9v/acHjXzm4bqqgvrdcGMquBV0e7WOv1izW0DTD+tbemY3XImS10EFRkN9SXB+j61BX+WZisz3Ar8W/s2a1rW1VqW/i1NK49sBdQKYlyDseygelXJ6IydnQMaLFrjK8bTibkq/XXmVSFA9jHszxvXsaZyWlFY2698leESaF23Rjmqc1zpMKqUD2euqSeWutRY1wk1P40lbZR6QpEfQdSlCAxoZcPWtlvNHdVa7ADQR2IqD6d9KmYq8usoroqzr+3WYGqwIA82XGNGdMaCMkU1dYOfAoy3tRfYq2B9vspZ9JUl7PysbxKQ+08LxMXOdbVwoqcGGSlpF+ZLN9p48EH6w1Z9yYXWz/kr4iHWr4A1UkLxAD/p8ABwtfGQjfca5aKmDnn2AqUwFszAXPdXFuPFFwJ/+7hjU+TJ1qsD7Tz6YQGKtbJU530Ka5+Nfisi5tnWO8C+XvLCqPXyqu6uii/hcp/FkmgUDFrnnhpChK2V1AeOD5sqCHKM6I4i0dHjBT7SYP87vjniNdFZIZnhIa73uo2RlIiH2hyz6e5D+d+AAPcx4cfCcPRCt33OM0CBZYTQz0bn3s3KA0h1WeQ+pHtvl3zr4U5P5EN8xzhNFX+WTcL3u030S1EUit3dhnO3HeJtx4nyxXnWmyWRxjyHDJkz3stLZjvFvQLPEfxmILQKOaYIpAiBg2y1wEvwyOImHq0IJYcwrlJMPaNtNbiovQ+4W6aRflWuEV+lqjqEiuL6D61K5pp4f0MUWyuI5GbUqqEJiBcjK/vC9yOHKEXo/uLees/2dqh/ZZehVTkfeNBwo3ZzcUIjogqsamrf05RXEt0urQ9pT27JJbvRuVWTyMgSKiuJPK4ZVpWaZWdC2tMr95CnO2LaHNSn65u0MytS85ZUdas83bS9uiW3viW/fgj93LizQ6+z0t4siKn5qxrZLih9WDizfAadVTRet5TZnjWKeWDwNGws2NamaysyfKR/cSsLnlVtVf9oSjUGdwxqcP/3pWka7cvZ1CmVFoX7uLCGX9qg+mCurbKY96akekZ5neijS1J+r9xG36sqbOwNosr9YqbuL3AWQOhGrqq5tzHUdLm+t3q9EWQvdPJAmvaGsoQ7a7hp2mIR0HkZeql62zZQ7tVxQwja2JKTbPSiywZXs2HIs+uSY5Ksxuaa+1L+qKhK4uHci2piN7utlGrQIPv1bm18uvGOR3dbod8Ah5POA/wkrpsskuXOwn9+Xp6TQE/wqdBassuiUjYDluG/XGa50DJv9xPd0gNCnCsDzoRioR89c4LFVnL/NPktz4fwxzBH6+BAR/f7XgXyjXaK0GEyFpvl7x/83Oms/Z9uuGc/r5dBce4jsdfdGkPfCp+4bHY7FrwqYL9Qb3bF9HTOR8u9wu38A3j73oIu0Y4gldU8q+eiSkzp4x/y3P6jdDY+hnvv9lDswKptvzl/kJUKAyVG9If1Zv/h7rQD5Rzq/sNjvG8ghDn0lwZTR11+eh2w/ujq5j6VfWevY445fMI68dMiNeTrmkUXSLKtR9LrgK+yXYSnboD6pK6Ez+X9rYpUq2iT6GtHP0UaflnyzKIS6k0+aFuPsE0FTUuNYxF/3QTaHXiiz0RmwSp9U2VD3TOeNl7Wuxhm1HR2oFWJxDKijFhjJPXT2p5UU63P6+KqtjQc0h0qvUbuK6gznjLaaJVFB8lvHekVdm1LW4hqkvxcYFMSZTBVBFXuy/1etCm3Mc+7q6KKNRZpexvnqwr0q3RSamnV5ILrLdfaGtT1RY/rz+vXtmhz9/87Vj2nxrW1im5u25VnV35P30MpbMabhhbu+HdDVVY3qYMjT5HzumayvQqusq9bHxDOhd3BpIpnSpfmjfWF9KOOmAa3+uVlyqrYakDZDdlWMa8h3hBt6uhMghLqLZEorKPKpb0n/ZkcggNNffWL9fW1pOEx1ynZq9nH/ccuIwYaZFI7sBt62PKVRSxa3KGAAlRiQak2pqtS5CLc3fnEAHa6WNYaR8tlkBX+1W6p1TdjuWMI9d6oxj9KLqFLZOPtLjgutMkwzWM6ZUZLW7eZzvH4TP6tbK9tL/FVz5M2KW5j5Ocsc3xnCXv4FuK4x1/n55Jih8GSBBhES8AzQD9hQSAgR2xnQFrve0G052y3e4KNLicsM/zPBiE+Kp+dTr4hxTJWtF/ez2Gh+zX3RbIdLmXSF4GbsX9umxUn7L6K4uzGOrqGJHn1cTsVbOqe5CWEp0uj4C0KB+Ebn2WiN4HPRS8gHyej/VL3CDlg7eHp5+picVnii6htkmx0oiIfV581frfcAJ8mLsebYqfTJ+Db3ptcTjplSu/Z/aEvEeccbNg30FHxNHvY9Jq8DX/hLoBvnZ/i5dLbhkmmX/w5S5FxK2sEewoPKZZ1GrtWaeqEjoI8eKNAg7xh73G74IetG7ssoGjDt9YfrWcNjzqOqC9rQyRjhc/ZOOJmi6qrHHrS8bWl3DCnbmMVBkbjH3TDqt3Yg0SyXm0IIPa0jOaHdHlrq1X99Hklf+pWt+xhZjF2poyuuloPc/HqTrNLkabKo6OjjGZO1iWWEuVfO3+xsZ0nDRgpqg2otDJ1mHpXTK/Haw91bdVNo9bUzlPfLZzS+q9iY/X+Srx4dedL43jdq/z/inI0yZrLdKpBWH+5dGWbX9XsdnnN5hIh7V73s0ZNhrK7Ojrblmjftcyqf11WqX2hHNeRRnzpcufmqFPKlJVVDXTLvoYfcJpG3SEyNiHi5nNAUvPdhlUNt9ukhmEaXtVFhPNaYBzSTu/hc5ho0fSWUF20bD/3BeihO0LaCHd0pMnf67rLhuDuhp3qCyoNWECJ+MvQSlsR8w5Mt/pjWMddtfezKtYysBe40fkhDNlONuhN2+Bdxgj5a6sflu+Ec3nIZptHirMCVFseoITib2C8fANbbL9HluSe6/NHmG0FCHyRUd6ky1xwkLPYQuM8XbIHeGXX03WV73G42ea1rd7zpuc1eJfvOOdF0l/2Cyx+iCL9Ncgz1/NOxy2CPLvbZgsV3TZ4Yeg/h96CeOdFsjt4hPNpt2Nwhlc0Xmr5wuOJ6KGgzHWGTx//U6KbjnM9T/r6Og73mOsTYzVROMpbD0RYX3E/iEOOSV5f8fne1ZbtCrllFf/SOs2uXFrlHA+/EFXhanypG8fchdbwA93G2560E+FbHVvguTaLiSaLu+gTwx7LOONc6UcFSsUqQmkL7UyHWIujfCf5T1EDA+I83mi5TBID09wnwxjksOAiE2EqhgL4JGSHClCWqGa0WXCH8Te8gbnRbNE+VfzWeKPJBjvSsk6vbTzTHgFHMLdqT6FX2lZTu3Q+jLb9lvKhqrHtECWiRlYr9dM6TcwentBcAw11Q+t2s6OMeFW4Md+U2PbYMNoUV9dF/lcyirMp3dJxlskrvVv2TDu64476dZWybV7TJsKWfFlOGPq3/Va+bvJr31z+UJ9ESZr7GbM6W0u8a9JqXzZ2mNZXigjXmuda66pFtXBJWmVxe55mSMviRrZlr3or9bvM3nRMt6TjVZeBtNQlMq4kA8S37KCWGzuqDlOP2dquXpoe2nI+gVnJou1uLUe1x2svkbuU93QlHf4CXHAWKmh8i0ah9ehBY6M40ZiqzsTPtTWy58RuxB4kRtgPcGzTMqeER3QLpadEU3RCq0Ryrprn3mtdOmXCRgsn24uycNEEOkW/3HBFepH+a3dIXy88Z2yQZaAnhGM4P9v37G1gF7RPYQ/+kS9Dj8EuTl3OcyEe8pEu9pgN3wKeC9cK3uJbuEj7ybJkwWa0BZrk9lK8210sO4q6WwTZuEj3Oasd5vl195LBV/HXPn/g19YzZYcsvllnuNd724g2WrfiSjRessevWDhH3u7og9ywF3iT1qsVnhgmUopgs37753ZHtk8Ouct8ekOWksvoXeko2+eiDAtr8TIXH0W95z67Wfh3uBKZrWhwLHdPwJ47jXa+g00TbpE0eFxShIoLOKnDKhc3mRV9GSyRNJLZjmOkgxW38O2C69ZfBKRQRX1Gp0oG8PvARm6bdV/b7eRWZhflYqrn5+lcgVbNIcYaXiW3Nw4TuoliqSSLELXC6Ekl6Mbz09SjdTdEGrwS+2H8rPqjX6a9TLhr3aggbi96pmO/6lnrNfKmJqt5PvBcq28MIG2brqDLSBOR1+HdWqNZYJjGYNx45hz1jbZpuUQXAd4NE7T1dc86VmpVNcaKEZSLLoH60jSnPlCzsXoWdbihunFG5WCyvnxSk52xQD9Fa0v46h9V66v2tBToX7Z4VW8r79fEaKQNI8omNtpXLW9+pt1KX29b3ZZEfaDnspu7UPItm9j4QFlEJjbMqDMZHqr1xL+6wQ0pJkjlo9nSbtkRr1pE5ykHdcY1nW5NUjPka2V83XXItrVA26p2osug7837IB9jBztZ/031j1xL5egqOwYYt2EKqlywjoxo39Nehc/RntUkdvQENOITqhywg24lZe3jqQGi7Z2z1dOZQPKEvFmajcWRz0SVaL1uljRPu1fxlj9n487spYKQyWitWWtZKnyAFkOmNc8GiV6L5eIc3Bv2k4RbPHJ6IzAygSAvO+XkCmHoO0mgSMMesk8Sr0Dd+fuuWslapxTFX+EFjz/W+fxpRabnUQcPm2TY0xLHbni+d5/q1e5wBF4rLQdZu7FIhlun9TPhHa917o2yJ1bDpHEWzZ4au3sOAp+36DPLgy423h/k6ySjbb5ZM7Yj3DOxrY7tbpGeiXZW7qmOluIJHk/lCaItNjE2ufgpqAKfb7ncUs/72K+1H2g1xOoWPEtq4aKTu8ndrNqstPb1QDlHQN/hj9w+LIhmnUKAXDySIbhbtoNk9jblMGsxSJhJzBWlwHKxynqmha/pF3DWqgZSkvOZPNyX8xD9tIzHVwi6mU1DFvRmDBH64TJylnYZWt1lCy3Un2+fwoewoZJX+BPNV2ihTk2R/EXVGyBfH8bd51YoofbNxv6qvBa+eVLLH8pePbJxHx+q+dw6UNXVOpFIaaFIutlWH6T92mpowlt+dmSaXvCSGidgb+tpXa8uXbtc86TakqvvKtFfIJ1rF2nu0UNbJlX5NfCmuHan1ruG5JqzxGDDO1UfXc/OXy00sZ+6rg00DFQOYSxoWeu26nWVfsyAhgrNtfYH9CYjrRK1RbV9rvJnezZsb7hc363hk4oiTmiu6V50cUTPmhlUVR2nGd41iiutz9WqDSfU4/TrTIFkt/rVRpmue+MBLrc9kIlhpnRkcp90d1SbkLTWg+1nWnvrHmpmUBxKGP8IbvLd2120o4kE4Ks2kB/BnpDsEyvx22QUEGYUsFt0l0RTofXavuJP4pVIsdgWs2Gfom/lm2Rz9RX8Zf0MnAfLyNny9aIaq9mKUrE9OUh+hf2i2GaNSU2SiYJah6+SF1IJ/hQ+pWgVe1k3Ys/tj4n0TtcsEOuDyEar39wlYKt0M3jVrky02zbfoRMLdiuU9BAb5KjbM3NSvlL41WKjaJnoA3gLGuVYjtsj6W7/BIX2910q7eucb0uybJw853oMQtMtf+NxihArB8stNpfRtTYGgYtdpNMVjyzREEQDg0KhxR7RLvvPtoOdxJaPEKE76vbGbr+81jXXaaL1SJulTjGWI+GetnMUSx1LbBsdV9vly3ywi7aFmAFfLvYRJdBzBa70S7ySmQvEyp9D04EiqLvijLzWYiFgZD8QtDQcFKKNdD/yHncYVWAZwDRyleSOoA+2HU8QDiEmaExEiLCViRL11duRj3UjQIG2nOiipZrH6hj1BENA5++uOjLTdF8bBPsyD5kv+v/A2LaVWCuTb1wPpHJ7WxaYrMlNXS7ttY3hJkTzkfeF8lR31cc7NpDT2HT9vvoIlR21UTOn806HNWtkIpW9uTzmfWtux6T2ubVL1ZPpFeoAwxP9Ld2J5g9MftN/7PKaY22J6vGm/Y3hja+oai1poDSjmyZrJYZcU0s7aZrbNaV2EzWvXa1M089rJJtw4pXuUp1v7V+yoC7Z+FUnbVSw6+payQrlyrrh2qeGJ7qZjF6f2jKdnt3wp2sd+bNVrh9ogjSY4T/9Bm1/05jODs6NPdquYTboBnWeQwZ2zWPAdgtVm8EDnMMd1y9F3hhOqaPBvryxazofKYxU/zQlda4WuBvn6FgxSpGdTmJ7eiMUCzdi2+ENxigGBJZJ9fKTwolgmGS14qDkFOFtnSm/QY4UvRevo7zRLPEMLA2NFVrhjGiF3Tl+C3LErIf2SYzit/JeNrDCh91mH67oIczmg8STHE7abhUlQVY2z2VDHZ7Za8U3IJOLK/jIpssm0C7U6YZVPngQISTtcpXovmKzKBxe7yyWZqODBaTVNRdH4US0h2MwqkTPygttpkqWIIidViGW3ZC1WdXbimWrkbmyd9AL5LmdyOGIQ5rdFCzLOcZyoGKbxEuGCOpFS4RFNgkuC7HdDqvtz9l4OcRKJzo4KlwRBnopthUnsR+gC0CGIECyw7rL1ow6q0H0QIEYmoGPkKwRNNIym03YTMtAIoN6pCiksq3G0hJTDp5leieoEHMSBTEN+g9OVATKavW8br/IBfoL6SRa6L2mpGsfPYDeg6/mcvCbwGgjgmnU4eAAaq5ZE9VSgbBCHcrN0k4jqtobdWM08exaWqWboAqi1pv8ulZrroBvtX3ZnsqDzRM7R3AOGnc6nRpq2qk73XiAb+KmMog+vCPKuF11uwXuOtCi0tgSP6nxlE6fYujVPFqXSFWrMluz6svJtuYUnQcLq8I6z5nuqaCWfANZN7A+22Cjvk3bMCENmGGsATL5GrR18/S+6u8MYtrCzGI7W9KV7nq86zD7u6lUp+24pxW1HOMjqSK+vmm2rr9ykzJWre8cyI8Gt/D7uXcdvThn3QVVhj5C6Q+ITXc7ZuomalVAA7C8qwgeot6tGc1uoWTkQNCfN5o1eAAm1PfFo0ApGk0a+Wl0scFBc1APg7c4TzBfIgan8wRlwLuku8n59BDDNczO8IGMFc0j3oosoKsMKZ0papU0wfPBE8LbohliOX9ccNJ6A7yQirRhqLnASb635X/geqbD9rOdk2K8zWy2hg2zWQnsEFVYjrVMgFyBJuQiiNtuw+6KYfuH0CcQRyC0RAyJOyVi+/t2ndgz+XZhg2Cy/T6Bq0uLzVTnzbZbFJU2S6BOaR/ZD6dQhdJW4nRC9tK2Wf7cTmgdhxkxucMcGSM+LQMEve1rbOOscuxn2r+y/mNnLyqT3RTulK2wsrPqgc2x7S9Dhay8EhGBD9CjVrvlS2VBUkieYN1XBlt2CjbC12RL4e+yRqtQaLzoEPpA1k90VRBgMUCwk9GhwdYFAhepkq4VTbb8p8gRJIhOokcVQiwcFWAm42BmIGqgvppmGJPxOcgFgRIsxb8g2UAKeFNnTT3iBewzNB0MEo4XPsZuwFuRRCaAa+NbkZHMFTaBvwiXdb0mX+mGgNlEncGJKuS7tQ9B1NQlk4p4DRwxVOpemRYC0rbottj2T7STBmzXkbGa0a12xC5G3H6ysw/v2JLQ4awbbVhGnaUZ4xJW0XqzcXtzGTFUTev8G0Oau7EvmWlmd0wUe5MZRy8x3Wtt047XB2rGtzYrPVqymkdQr9kejdOI+xqtbrDST22nBJQatpsht3VFmzu1hywlYjSV+snKsexs5k1LdOe+jrs0z6/RRBAf20rIg121xFXTHGagRgI8Jus7/nFDoAtcTdtP8hd3whgBLdfO4MthIaHVvOuoRv7wVuROUzWzUzcf+G1S6z21LaiD8Tf3T8sbokWTjZk6NTyR0xtTxYPg9/RYyF6cjMtF37g2fD/aTvQGE6BS0lZ4xKTFS4QjSRgK5hPoGH43c4oaJCiQZQPXsD2Qi0LLjrP2N//aQ3IZPAy4BkBQmZVCkAv8AcsgmcV7ZJ2oRPxd5GIdYn8WjhSkiZ3t3eSgxS/Q0XKyZKv4g9AkKBDD6BfRGwsW6yajsWhUIm537I5Nh/yQRqRaKBZvQaZZnLUY55Am3eA4W1TikG45VzRYUCf3dHho6w7PFGRZL1NY2Fnah9tcs2sT8oqXmAwOkcttC2U2qL201todPG35wWY6koxsFFfAQjRR+Moy1GYiOEhy1zyph1O8AA6K9wgBqYfUCcwULRVZ8CPALYKhqLXFQYFc1EWmsifBO+K+wDBgjHgUVk5/JyfiO+mvgmpsA62jvRmVsdiQLAzhRxladNf0Q0UPUUgwXpTLiJFngITZxm8xVBimERgbq7+D9dfM6DJ0bgIzumo199F9+hGGBlKisaQqCClSBd/UFJnn9n6lDvBu5ImOLpWlsZ2X6OQdUaaT6v5MOtedeEnAbW+1N9t6MfPoAuYBReg7qNLWdtWhDh/NY30KRRIUITUeaPlhnEN/MIzQZJiuaIuVvdRp7FvyVoul4ZNpe1tIywtdsGGh4REraJunftnyj9mm9WOFzEy9mh1EXGh9abhkHGXsTlq0P+2KVbvrLptqqIfkTiWvfGHM4m4od5BHDUPbE8Hbnd6mzDZ1R1DXC6iukzO9VssYq04Ft42O7LignqEbSO1CW7uEGrNNxnTF+Ib9oxmNfIc4w106hUggSG277qcplnXClUY9EkNeBceQK8F94od4gCEcmAwEEVuIcnI0v1wsBmvEEQKJYDh/ER8j24s4Yn+BqdQzSTYbDo5GaNyS7k63M79QVvRRkqhoszRwIcLV2E/rNZinAoHlEg+bgTZC8X/QBOy4/CM03qLM9qPVGrFIcFluwNYD4/EwsB+eYOlrmYAdsraRVVnE292zWyk+al9iOdWiP3oYNiqi4WqLU1a5tjTiaFeCFkv3WZ6QYfbWSJPNC9TWisYHWTvbq5FFwp2YxE4uixFJZcMUjZZR1nrRedtzVicsy4AQ9L3FPDTNMkWwEhonHgFnIknSLChO3lvyB1zIKyXLrTaAv4U6+Rn2BLgFniAexvdD9kmjoGTpGtktOkfeJZovfi9OQl3JYchFCSSfz67ihtIUEgt5IocxMbwAbiWXodtoD6SE2ofxzAJAiV3UuaAJSIvuPpRCOHOn6RFUIjkTb0cWQTHG91wZ05O6xIVzqboBnDOVCb0E5+o81CwXQ/8l6ulFTBw7k9cRSXRi+ypDGX8T7Ml/0PzRnDGNU+3qesHUsTM10zr76xyZyboiglDfUIVS3fSK9nidWl1oHKyaa3qhjGNGcq+1mXqkQ8V8bV2lFhmkuiNdtsq9nSKdRBds7kpv0VvRtp1HtJtUWp2I6uqKUkeYinRLlbc7+zC0fochzvBe60u+UBJctvaXuj+xn7+judnRj6uii9QDuB/MRP0hw972t+0UkEzdAx30Iu0j/q4hz4ASu8gkeJr+BvgfvQ0uhmTGCu09rhX4TV7gdpkG6UYZ1xgrDEGGBFrMRLA34Yech6kXcZV7Zwgn49kxeC94EuWJ/iSGAbDIGagyLSbzmFNwBduH6UA7mCZGga4GeNKERVAu0FVZD84GG4XeFp4EDYK/klowHmwGuuB80QeLgTAoSOHbJc/lMfLR2G94tyhLPsJyJrZTFgp+593AGktLZI21DfREyIiNsBoQYf9k3oLD4idImqjJcpR4lXwdtFN237q/ldRqmfU78KRNufQWfFi8WLFWMhwdC/vLLotPCmpkpZCNeLzNIbEWsYUF4v6KrXJKMEyOiN9bseKzllOkn8ET5ri3A7pmoYL+SW7KN1jfFtwTTpL3xmfKNlj4W0WKlnJr+RTwNl9teVVxRbYUQPkl2AXhfLBRDuD7ORfonige0MPXaT2WwB4CNZAenMrCWDPRRGzAW4juTDTVaZoufCjsB/qQdkSooD+vJn+w34xuwmnoKjRasB8EuWrcpLfQ2RtX6NaSGm4Ckspd0GJYi1EAxTP2pnOczPAaHgN9BTiizDwGrOBPOseuXZpK6gJoDUVRaNcgXTW1XTuEvAo8VmOdBo4wrdfdYeL5bzqsvVx9jzPolximka5sOdlpCKOTObFxS9tHFc48YQ+r1jJerL9uhG51x0RjkgEnNnZOpX+pKpkQup/qmK6ivaBrD7WsrYYqos8QNe2fqa2mVeqXbbHccv10M5YvEk/aZxDvO6K6NOrt3E76BeumdeB6MryG1Tqqe3RcMTHsFL2ayjI+4LYyH9QLNPf5pXQe+a/zL7MNfA7PoK4xc2CS32YKJeXcEd1IdJ7+KOOBLuOPY0pkAPOeteSv6AbSk83Z2XlCSzdDviREyNGd/GVwj/A5coMIwwZgD0WPuWHoT/aKuBQ0+8K5YHwI2Q7dpU8B96hAyRexo2w0PEj8kbVmDjG+YgSdJBljvsgTaB8SAN0Ux0nHYFq2nkuDM4TbpNvEYRaj8QUWf0QHLCcoPkmsRYiIlT2Cl1nmChtFKfgAdCb4G79j3WLtYjkTfGg5SajCtfI66U2wSu5vRSBb5JUCAvOGV1ldhTWgHh8nd7QqF4ViWyzOIhnWO+R6uTtGWA+Glgo2io8KjwsmIIRwtuVC+I1lpuQ+PgqKwxahmUAgMFReKRuiUItQhQ3+14JDk9GDYJEiA5PAp4VbZSelHxBPwRNpMZ+IvpQgSCJ2FXoBN+L7ZD2Y40gxTfH1lCcrlAzF1Hw8uZDpJViH9gLnUKGIPdRs8iTEZCh9H3+J/mc6YWo2OJg60Kd8PeQEFOsHQErutKE/sgSJoZp4FVRMbNCmERegUXAG8kw3n2mBB0HLNXJDkbEZHACIdPs6Oc0ZvkC7nM0DVlHBuuH8coMreYVeT+7mKP0mvZpTcG6aBXSagTeNMjnrRhiWUyOMBNGXG2v4ZZLwtBkh77o2tDe2TzJmdKzW/FPRpL32uuErYU/atmva7UmjcZe2pKOP/iGzRfOk63p7qd6ZiKVKdYlsteELY0MEd2Z2lXBf9bFkTOdk01+mlmcMfgSrj+WOd25T+2t3aMYxvYzJuktcDnCR5TXupgLNcTNDX+SqukD6BBMFjiQURkbrCX4EDaCa9tX35ZfBmeBa4yRdlnEtfUZfi2jpk8B30zGwLyuFhzBb4GHQX2CScSd9AxkHzSL02Gk2mbovvISfYeaQ+9n/8J6sCTIhywXTKQA4j6yBA+EodjPylFECE2E5iPARQgX7E1SIOe4yngTOF1cgXbLp4iWiE0A3lJFu4yeKbM08d1XmANnIaUWE1NXyNzIEJ+Bz4nHQYstnln0wFfhIPlvqJE6TkFCg7LNirbDYwkrYCwmydJYMg5+aZxC8lBml5y32W2jB+xYqRSh+QhCoYNCnFsfETfgH7KBklmW2INu8r8f+wxtkGxUXxJskVRYDZNOEa5D+6DaLh4oLFgeQx0hvoC/uJZiD+wlughvFY8WnRLj8ERYiPChbK3yIHJFslA4y60ep6BRewdsIP3E7JBvRQiAbKBDKhP/4j7Cv4A8VIvqKhMIHsBL0K7OHOiLoxA/Q0ehp2BqSo++QEFxE7AN9cY4OIw6ZRphGsWOYwXQi/x3tRo1BnxououmG5yZr41L9dCIJWUhYA+t1UuNJNtHIAINMVzWXgR6a46avuu+a42ChaRe3RSunw9kNunjycWcI0YdPJorNykwIDOdHUhX0eK5JV9j1yLSGq9L213DMM/M9HTVd6r56ovOoZo2py3BGZ6LfmVYwsYRW3aJxpf30Oxnfzjhmkvo4eUwT3NVkrj0m0aeMJyhRZ6g6i4DZM3q245P2hXELebfLlzigrjBja4RhmGkzZdNZYJpp7E2mUKVkiIEmMs061tOo5/x0jw0+mt2aHCqTl0NNxnzOA8pgvhEw7aBHqBLSxFbQEn01mawLgRvghcxufgUAAwosGVVCacQZQk1kYklgKLCXK+R3MKvRT4CSqhI8gNeYn1gUlCt0QGzp88ADYBkWhXqDRaCEZqBgvE0oRSOAMPMM6guYI3/Q7IwpR/yxDxBs1kofgR/ABWQ2FIauFtECCZDJWeIWsv2CHvJJmIe8UR4CjsU8JJ8Ud0SPFP2x78gPiJSulPWAFeA8tAI3IhMtJkl3yHzgwxZCLAeuMTsmSrA90qXyw2CqAjP7Wj6iQxQPJYlwtMUy2S4RZskr1slthO8sQuQJYhRbLOwrHSl+LEpFGHOt6TtmlOZhInkgHi4phFeaF/m5Km4VX4Oj4HRolygW+8R3R2KgfHyv6DZ8SLYEw4Xx4kOwUXIfGIreEvfja9k3giJxBjCOnQemoz/QTNE68Xx6G/ICsWaPgkHsYdSsMdlVghGYO36PHcXEgXoula1lXqImuIFeaFZDnpwC+k58py5QG0w9id7GS6iM7UflMUWmnWCl6S3YSjUYSSoLusIVAwC1yrCD/MSM4ZN5Ffta/4NM1I8DnMGP5rynH73YmKjvMlwn8gznObXuoOE0fbnLh9XpPvB+epl+t15P66kfzNGuH2bWl+hmdv7unE3e7pzVec04ljll7OiarhvKeemvdV7vTGOXdz1nB+lXEfPJLew2+iT3mLChvNlPHKI7TA41otwx1t74ynjCFG5Sm74bz+hfGvppNxl76Bab7pEbNb7GdmaZdh1Rb2TNmmGE7g5ry6TS9wzu2jTanU+hM7V7jSuNbdowZjW9W//e1Jd4Ty1knPmDzH/6QcYJZCDXBd6Ca9gB7GFAa+hgFpMkuY1UMN/YZHoNd5GlMQM3Hp4Ad2cnUjnoRqYHdpJ+jaZjroKd9DxsCdUF9eDfMO2UPf9WEANFCzeKO+lL4hDhNtFm8Vq+BzZLMBB/IT6ITxC4cTTuAA+GNBzFTeZNwpnIZ/4Mv0hQih4UNctS+Rf4QOCBWT+ckvcQF0uny/WCEsFX+Q1krGCW4LZogeIQdlz6B8rGg4Wz5SpZLNQpL4Z42RykQ/JTPA6tlk1UCIQD0ANwFbQbtsG7I+8E/aVnJY8hXD5dPhTqIY9H94hXCqOwd8IRspVgJ35cKkdkQmdsDNAgQKR2El9QJ3oBaqRB/CCBHJ8qEMAMdNKcsdyGYgXTcD38E2JRVDwPD0QfA1b4WPNZ+UAiA4sPAO14BfwZugzqoNt4I/0GzBNIsEbMip2Lb+C8gATgBF4HhzMEJcJiiFnsSFSH5rCV6CzOittFmfg3dKxxDX+T7AO5QLfNyOPZyWwU6WbM5geB61gC2sr+gHJNrxmN0d8QBRhMJpakb3EXGZRRG2YTbtRF5ja9iu8G2JlS6I0aO+M+/QC20+SoDSSXGy20zfo/XbPNdRhr/UHNfrKb5o6xH11ObNY26huoVfRTarPRmmA7u2lfaK52ZXOB2gJdDFfDWXb9JlqIKpNAc0/fk72vPccwxgjmBZPGIjxnyKd76Gq6fOmX2rf6VNaJzdKuNFkRPvp09jD5yvCUX0q+0osIjVm9LqGMbLxujp4gzlIB/A8gVp+sP0Ke1pcCxaZfEG5U8pnQL96F9mVOQBqTE7GCwIkJ8BLzyF3DaGgMzjT9QwcQxTAOttP7sHTag4fwlfgRoB2ci4RTI4CL0D/kCv6Zzhc0YoQgHpwOZbHViBi9IGhnx8I3QE9Oigzls7gIfj32G6RRRHCMPy00G+LxRLRYYA0dgc5Lavh+EkRiD6YKwiXOWBZoIxSIrQQXoDjZYUAHs4Lh4AjxNWQZnCvWCX/LYHEnNhe3FW2By7BnQok4VQJLDbLZQkvZAOS0BMK9wXfwEEm04Cg8WnINRODNUhcBhQyBw+RPoaXCT5Kh0HFhb2SEmBYpYSEeKauHq4B14CHBIdwF6wW14NsEMkSOn4cWYI+BVCRZ8sCcHQTxCYKbYkesRBiE+ghmghHIP6xJdFcwAFqB9UVm4yAwX3QPfI/eQJSsltsIjsHzgMtYERKPSqFhkN7cn1KwW+FLjCdUAk6AgqEgaB/bxF9ir6AF9B3gJviJ60lC9B4qjhjBpTMe3GPqOASCt5nV3GJig3E0dNU4lM3m/aEa/ThDH2gxuRf4wxwj79IHyD7gAGYxcJduNeUxU4lbZg/tEYBhH1MvOVu2WC9jRumSKQ9+ArdOd4W+b8jQHzHG8NfIp5oWfYvOzfjacIWzNB40SbVvNEHadqaC+kRO0FTo3E2vtYNN181oKCOLDb2MX8yVJlsOpnnyu+aFETAZ2Hx9KVfPljChDE666i+xPWg3vs6Uq1/Jf9HdNY5lf+k/8QAg5S7QGcxe42K+hynNWE0PAMOJs+Ak03/AYfIYH0teYCZxfSFvYwTrRYZAXlA51IdaCVtyw+m35ChyKduTEPAVEEP1R4R8I+xDj+K2QBuQr+gN+Aj/lfuOdKfj8APIS/oo9BcegLNIKrOFDgeOsi3ACbYJXMVX8y7oYE6BDmLHoShuXtYD0oBegllcM0xxXcIKkScgQDPQnma03jcvPNcb34v54mLBQrEEyQOqhX8RVnxQMBx7iQ8VNcM7gHbRKWAhfhMhgbN4l/g8/Ad7BL0Q+4rXiufBAvCj0BJMw9yh3cKH4uFQN7xJekT0WfAXjIO00ipoqCgLtcYWQDckIyBImi/9ii2D/0PWiY+JPEW9sRSRWLwRTEJ1ojKztijDRsJ+OCVQi1vNGcg1/oowDdIB7fA+2AocBdznXwGP+HhBK/IK0qIsth+bxFnwAnS2wJ7zZ0cCMxEFmgXGgH9hCBjB5XOt0Bo4H9+Pr8cScCNfzm6G99MEuBv5Al9mGpHB7DSwguxFO4AUMYq7CNpQcnANAnAF0Gu+li6AvvMNfDxzlxpN9ONRoBt1kzoEpRhH0N3ANNMl0BLM5ftyCsrCCPLHiTpmCvtMv9T4gbcw2Zsuc9nUO/18ZrnxNVvD2+qvEigH6/obRvOzeKFuOb9CN07XQ/+T7eCWGBYZPxK7yalECmMyZrBC/REda/ClVhg+csnG59pxRin3VjtYr9LOZVx0NPeayDNaGqYaGonhJiUbQ3bqD7J+9H5+oL6QTtb9Ja7oljExxh/kWfIX/Z47as72p5DzzEzXm7rJuxodTDOpRJMKmGyaZLpo6MdmUW7UIj6HjaAA6h+ZAxWytaZj0DdmOJ3DRHAtVCw3lcDIfshWcD0YbeaYNAiCvoOxYCY0DBzK9aPGgk+Zl+wXIBlYAcWCs8zs54Yi/En2iDkOPDCz7kLUEt2DvoReI68FHC4UXEAPAafYA7AOTEWy0T/mtRZ3itbwbdxpsIzviY1B27nffKUoGc8VsUIvPBQ9hP0BXJDhwFXwDdYbmSzsJVTD6wSzoU3iBjxS2IRPk7gib4Uu+EFwO7QDqhdcR39iG7AI8RB4EvYZ/4kWoMPxT/Ac8UaxPb7QnPH6wRvhm5i7BIJzxF+Qu+BFURpag61DT0J7sVNwgrl2Mw+YBc7Fi6AZmA6oE44XvIX3YSegIviJOZ4N4Q8JKK5QuAW5LJoGbBPygjxUgHpzNvxEHgQj8FjgMhAAeAFjoU6AMuOzgz2Kj2F9IROXyIZB+3Bn/hP7H+oD64FH2G04HBrHW/HJaB2go/yp27QdV8zfADvB3sAmZhzVC+yiePgdtRSeCpaZPKiLpkTQD9rDpUOzoH0ECr1mncFTzG6K5gxUP2I+j/JhBGTKIqrINwxD3KTq6G7MZcNd4ir116SlT3ELDXtYhjpnHMfsYZ7ROmqmHjR8JvcxO5jPhjdsMJFBLjWi1Bv9Wt0N035donEj9ZKqo7Yw2fRPajf5idSRPLeCuUAMYV0Nrmyc4RW7kQmii+h5rJ6tZmabBESpvpI8bppkCOQWcPeMpGmQKZhqoG0Zb+CNWVMc4TRECfOMrabcAW+A568SIHuadgH+mPs397gU0292AeHL2nNTTbNYDwggH4BHqFxARZ9mXDmzwZW0ZMax/6CddBS9h6kB86lT4CR6K7ya2YE8Zz+Dv9hjyEQ4HbgMPUFAJtqMgYcIhbXzHcBY2A91RCg+D1oFtOKvoUooHLYTPMXiuEicYqtR81RUfjvQCQbC8wVq7gK3EK6FMvkXcJBwBfaK9xPeEl5HOwUUOA8vFjoCckwL3Ad/CnPAE8AJNMjc73UX/YUvYO/BOdACKFL8E5qOS5BC+DY6Cg3HIfQZpEI3ge9F68BGwUN4BnIa/yb4DMvER4TzhV9EtcIyAMBWoJ+wreaMdbe56/1RmICJBG5CoZCDN4Kj8ExsNngHC8TnCOaIPkHnsdHIeOQWfwnuBv3B4+A81APUQ5nm7uYBuCfcDtyAAVwgGId95HrjW4BBnA06GLIG+2PDsN/YA0yMDWamQf1YHdfM7oQWAcX0QEQHnEB2QvP5l8BxuAjoDtizJmA3F0tlgQ7cYiAK6iAtoVYgk/Yws0+wuV/cDfKifJmdVAD7kPoOjofyKAhcSJRzSdxKYBDtSkYDn/ipjJX5OYpNiYAWQAA3bjlXRtYaFMR2rtLw1NiTaaJAo5JDOHfDW9M6okI/gdxteEXCVHfukUFAyNm5ZIIxhpzO7jH9ZRsMkyh7dprRixrHWhjl7ADumOGWfiJVburJ/WOnM5eNn8jhBpi4bCijL5hu04vpV1wAv8IYxBcTQ2hPfhmx3JRKPuV3Eh7GaEAMkIb+wF7TeHO+ks6bIx27mFtNArSaswJJ01AWo0aRMqKGZ7nrprf8YMCPK2XFfBvQSNwA0tkhlCs1lnIHfVkVNJBqhuvpu8A3IB6aZ94r4NYAoWAuImEZ5gV4ETJXa/gl4GPmHjeMn8XuQbyZ3ZgbeIUfzB8DBiDv4Fl8NRcHfQOs+X2cNSTBNNh1oBErBTZBF7EJgglwEBSC3cTzsY/wPjPHnwM3oscQAG0GX6JvwHfYXTDFrAxtQYGoCm1A74MrsUPYeKFaAEAXAV/BLnAXfglbBTuLL+F2oBKE4XnoDOS9uTYnQoqEj+BzggBQJpoi8hCSaJ5IgwxC+uMyaIKZdXtircJpeAX4TDQX80YvYCmCtaJl0EaRVFRrrkP7CweCxdgNYb5greARukwoE6j5MsEieDUwHT/EC/l7gijBBYEAHAstxGfgG/B+2Gm4EN2Ps9wpyBUq4hGuO7+Oj+Mc+eVwD/gk9gKyArTQLraJm8kG83OA+2ww8hTq4HsBargMXAotgJO5eNgfCaUng3ugYu4I1BeUw8vJdUC92VViDWZSCdQw8Djgz/8EUygN5QvkAcNoN+YOGM3+M00GbzKP+Db+EikwxZom8LGsNZ1ITWDvs+nMTXaOKZP+SI0geDP7aamV5G9DfzaRX843m/LJPcRKYhP31rDWuJe8Tj40bCVNZDJ9g/MzY15Njaf3MyuINdxl+p7xGxFoPGYaxvwknjGrjM2UO53HjuTms6PpEeQOU4VxrfE5eYN8aGwlxMYerAVTYTrJ9eBF9D3TTvIaPZVv5TFTHNBs7vxM4JaR2ymGDGG2ASzxjZwNnqESWBoQkuMAI/2HuU8ZSBklM+PPH5hFJXNPwZ9MB3MWDGBuUmeZHoyQngSU04NpKe/ORXKPgCXsY/otv4ypYfoiX+F43gAZgF4gDz6FAO4smM1VcCPYvqgK2MStgZ4DDnwauAbLAyv4UWgGoAZdYRfgtlkbXuHv4cGCFHglGIRdRCrxWWZ8CYRdCAKNFNwD5qIaqBZIAN8A1wXewlXAZOy28Bd+CDHgTXgfoSM6FAqDXIQluA8oRNwEQ4WTkTpMgWwEB4mWQO14DFYDHsdu4xngcOQ3GAGvQe+ZGXYNSCLf0FjBU6Ee0IPjBHHCUcIF0FvIDRIjamQBFoMEApZCAjUvVSLwwzfDFoLX2FxBMs5htcBSfj+cBV8D/uKLzGz8HZyCXsNAcAN4EjWB+4E/nBFLx3zBo0BP5AU4B9jJJ8BnudlssbknFWzeSpBtkB9gwV8x11L/QiJYCz9C3pora7awM1PHT2dcgCPgDHYFnM5voYSUCJZDBuoi+4ZbxJ7h9/L36U3UGVIPRHEqWsC5MNfN/7slP4NYQowlgkFnIIxZwo9iHtI96GyKoWiyib7JbuNPM2s4mM1n9/OtxiDWvHQOoyMeki+ILvYf1UVE0o9NfsQOurfpOOdMHjbtpiOMbkSTKcMEMycYiiyhN1NyUk/J+N4mnN/AraYxBiJwNpJPNs0nBnATqXyujn7LxJqCiYvGzYQ5GTa9ZqtoF9aV1BpHcx1sAR3NKk092Wp2Od2LIsjjQCu9hsykjbSJvExVUweAiawrn0wXcwCYyiYxBsYbyqGDoAvgJRrgnpl7jg+gHOoR+5E9AdyGrvJD6ed0GtAFljA9wQguBCaZpbwUjoPW8ZOZe0AZGM+cN0e7Geg5BobnsPuQFO4/qARWg1/gCeZRvwSZz1vCFsBKaD92FvzMO0Bh2DFuKegOf+V2IWJkLhYKv0Qf8IXwaLSH4ADgCe5DHqCL0GPgeCAWeQ/vgnehU6ELkBYg0SlAHViAlSKXwFqQAiaDY9EXaCW0EXyHx5rz4QhhBd4IlQIRwrHwfWQxtESQLChClghCBDsFADxC+BqOBMcjFC4SnjN3KSizj3sFcAMwV/kEz+FnuBF1FgxB55j5dCT0CjMvKI34IDL4OugJ9wZUuBgBgffQa9QaRYFs6Az4COT42fB1YC80CrHFwqFh2HF0CZID/eZegjbQeISBQT6GM7AUHAUchJdyBWwyOxCayxwE9EAQ956joBowjKmjf0PdzDyPm8diXzYUTKYbGGfQjXZlLtBWXHdzxlvFp/GBgJF3p6yhJ9R3JpnOYH2Zz0AuPwl0MncKs9j93EoSZUqYKLIPvZ1vok8D48hHfAvxmGjgZ1Ig/ZXewi+gCGoM5UJT5DlOwpTQJm4BeYkoZM9R72gHDuceMRFUi+kaSbNj2WziA/eB9KRJ8g3bYbpsms5E8RBzhc4wx8tSiibk1Ct2M72R0JtWEgfoVK7aZC7jcLtNIPuP+EacYtIZgj3MvWJmcofpUBoHFhKbSS1lY8bIKl5G/6A/meNXIzGAvMrsYO8DmwCU8mDFzFg2lT3NJjLxYDUzHxCBqaCBRRkZMwVayz1g/VgpFMajXD0YQNeCC+GHkA9/EprBxnId3E4wkCniJ3OvYBl8gOkHikFvxIbjzYr7NbsG6s+NN1c2gvhQ4DnfxIei4fw1dD3Syn3hrwIIeJfvD6JwM+TOi4Hz8EfUGZuHVaCHoRjUC7JE6/gZyHlzBcQCHoZ8B6diFkikoLsgGx4I84gYqzez4ClALkhCgxG1WbVpsQdoihmfgYJaPARbicVD5fB8tAdqg8ZDNPxdcMOc7UzHI7FkBDX3UYJQV3gOCmB1aA7+CByProdPAFFoG6Y2+xx6CGjYEfgHDcAvAaexv4gc/QVsxlOxw3Ak2giuBl4hvaAMxJ0/DxCIAvwfUEsDBBQAAAAIADN/U10reMfX70QAAIZIAAAiAAAAc291bmQvd2VhcG9ucy9yYWlsZ3VuL3JhaWxnZjFhLndhdhWcdVhUWxfGT8c03SmIhCiSKmJgIYrdhV3Xa3d3d3vt7gK7xcIARFC6a6jpmdPnO98z/w6H5+y917ve9Vtrz7Ckvn3X9weA0T1H9Zk5f6mvBgAAUPr4jwKA3ncAAAI0wPQpS6eMk76TpB7hNCnRb2xAr7AJmQPaR3FtzAFOqhbbFeN7uzk+tYHNiZa+A2aIGxrWuI+/P82103ufCH4N+txYkB8pTrZO8PZQ7fF5HijG3uhWG5yGJNmGl0ZmDEk//2zWteGXVr3cVOL36WG1Gb4Kv5ZPathTVp6J3wfP8w9K9185k3ck8+62/OTyYfxlz6nRYwMKOoBwKr/CElXxsvnnl/ktgZSP7IDdr/5pE+OSgUVxc1+l6EZsTlwSv0uRZb+u9SAx3G68fV3Ioshv45v6uY11mZ7eb2LwJaIn0DHvXr5PukuWujzi5xrTt9ob5t/iM99DsrjmnhX1b+WP685evjD9/Jxd6kclF9c9X5vzoj5eyXj9tny0ZlDXbG/ql2U1fkczl6cf/bS/OMZupmtBx8CuA4YN77oznkrG4srCCpSV8PhGb91lTXqbS15dIq5OGTM5c53H/LABG/vUDyQcKFWLaDDmZT9uorW5zUs05yMzneXhGbHjXIu9/tO3FNjnU1dib/a+0P72rVMvn67/XFXKWv6zloNLiOtg0R+g4srL82nAndQbp489v6l9M8CqQRMVmR2scetCqFC12ym8ymmrqcwwRNfc6EHH2+0J3xU2cqh6wfOVt9YsGjNzZki8d/cN2AL3TMNTehjeCk5H13Rd0ntNonuPS8N7xTwKqg6kAQddw5viO7p3bpdt2R8+51YcsobbeOfe1m34gtqEfFkFlJ7yjD+R/9+8i/1vXLh36Rnd7Kn77jhKmYe8CZ6maDKWmbm/x4uyStHK/S2uDWcZFdknomjYnn7i6F9DSoblDO8xIMHZO/AmmUVNB0ars+xbg7f3PzUyd2jQoIhJd3qujda6zlC5w7Py3ufP/XCn/GDmp5xocERrtWuE5pF7unI8XcE/rv03f9LFkzfwG623TWdvPg7L/F6xyvqj+SixyzyM85Kfb1pvkhf0eJ/xzfPmrGc1ZWtLR5m3CU/d/ov3HZQ4enaft5HyNmOcPoFflPFCtfE0VIJcUfxIvBN/ZnjRPxuX5MysGxATW9lhrhJw2U+dKLiVM6zsodmLzCaSidAODZ0Vbb+5gq4vZEtKpn68/XrY2T9Xhty58GDjy92/oj/++eMgxMhxu/fyyTqoZlPZr+y+nzfd3fPs3Nv3D6a+TWv52BwLR9hP938U9iiejzC2I7wSmXhFsvl69RD4OJzhl+/Pdls56GnyyQn9F4ybXN87pvNY/x/u85VJ9W+BcDbRpML6e95zO+J5P7Iu2NgxwO9e8H/m5SWfG3w+VWdcPou+fX3l+YPy/Imtd+qD+AgZxg6vj2odUD3trfnG5nfbT215cvv8levVT9ObFtDu7hP8y+3mxeBhareVsn6QEfLkEm17zIMaIo1LUUdNRqI8fu+Ew5OxETnzViREJFBxTxynQj8tZ/X61plmwLEPUdCxT8egrkWdwV6B7VOjZT5XqXj9gKzlOUO/br5+P+3Si8YiB/1ewyky2y6YDEeP1mKlw37H5Udc/3TZ8Ubok9HXzt3al/Nf4T5jHLzZzc3Fv11eu+kOEch5U7uibrVLfsPaHTXrmBcu8+Xq8KF9pw95NPnuFMuYMb0PJ58KimvzyDUNSLedFr8q5jtvtbsTfyXpv077u6X37N7zaeyXDsuVCvHCr1Mf9rw78Rb4MOFnVV2Xlq/1K3Vxju/A+07f6tcwr/6kP8c+vz9fdezvUZcb7R7ceOKaPbzkPuBHr3R4r6pzyoIPYf/B7pwuy76QquyRvaZyqs3ROSooIxpOMfb+NgwexHQ/HnMncZrn7KBt/GblB5vWZqLa+4R4x4f279whoX2Pcyma3stjZ3qlK9SAZ578rzbX9smSufzT0YKuFdnmnaY85hRKyHUt44DIWufim1/T7v29sPpc3YmPD2+/uZC/Lj/bgGLJyEePL0Sg7IL9fRLR3qmpbXQvXFw5UcdpXSGVF+XvGb2nh1u/4ROHpzYMDBjUJ57wrwXd+CAgil7CmVQO6tN+xi4t/Rf0l/X+0rk64mfwFN9k5w3Yj+qlRX3ehH/b9KqkrKj+SikgXOC6OK13DZGXQ31a95T2+rv6dfKjp4/Lrk65Yb0y403pyzOlEZWp2HTwi3+Sy0Lve1Y3+INhWkunluK/Dj86Z2fr/oDfgDynHx3+7X4gedhIZOy7LrOGqdsnBNljF93OWErZwWQIeE9xOGCOX2L7IZF0b7BXSvKCbr3CU9UnlXNp/lf/z6fzX3799SWkbkZOuCXVdoe8AfZ1CqaOWxD2cPW0rPT7u1+OvZV3r8fjLo/7ZQ4p7VI62rTLeN6zDRIQoPdqQENVwXRWXbc/Ja2H/jyrXVoXB4biA9w+hAphBSPIfp8H3UoKGZnbifJdZufvvhu7JvzF9YbNymR8Tdsg7x/BmbEronZ3dYzSt830aFLPqd1X3jn/S+HHTI8njYX7irpUnS1bQj+0bCe9LRX6pwyjDf6x5k/Qp503dzxRXzWkVd6q+JGd+7Xhu9gOOu/4U/nItcz7josr30M3zqZg5Y3ZBc+LNht/UbGybNeqgAExe3pSExUp2n7fE4Z3Lg9pDj6t6smx0F/rSusCWThR4HvM6W+sIVrfa3270B5/Ynr78HJj8/K/7rlF70Zlf3jk+bzokzbT4Tdk6N76Af0rM/GU9YDxeUnwD1Uh+ebMm9IHr2+8utXnacCPaboNlgwEJjO8pgZVdNC4H/FLxkaJBUx0c0JtbJVF/IgYzO5IvsvuHjv7Te59vOfG8RtSosZW9WvpHhZx226v+qplWnO6YDRswzKg0V63Pc+2KQgP913jVdf+idszIppbpx/+cdqTyodP7mW/CPh0Ovtp/mHtHUMOZ2qKs/yHCchw22ZddklZGfOs5ZPy5axM2bPUzKtVRa3emM3pu4/Sb2zn6XE1UeoOzh0uBcUqZWp/CrEuxFfIYflkpxyH0WHnk7anrEqxJM0ZGtdzSrSd7z+BbcCHAMhkVN+qqCqYy+TVDYPOkLwH7BvqmuHyCRNUDBXM/WnY+GPK56pb/R+tfPfq6em7H9MzSvsVpJrtG2HkFG3jfiv7yweyR1rPl2mrOha0zUE/E7VXitMs35Qv5Wfd/3RAw19Hb0760mNoX99Yrc9ae6Xde2GRsZfqP1kt5y3zUvcNPB8alBQWlxAr9JH3jm1zIGSvD43fss6sq6449rvjj+ofrrn/6jNKA2wr6FjrIKYLupHYbb5e11w+/y/9gnqSfq/P3RsPIm4Jn9Lzt/1e2tzK3KZL8cHYA8xsd8ljo3KrmGE4WlHcGvz3Y8XVmhjrfHyeu8wVjk2N3JCkS4qQ9C9pkHfctdAdHt3tFzosFY9SQWxfdpZlvfKBE+nl43WljVO3d93E8KttrrkDdkjTeGPvP1uyFV/nfV/7asgvxU/Z9+DcpYYkZimqRevR1fKVRn3Zxr/VNYM+/3jGZ2ofjHw6M//ar3Fae4s94OTUwzU2/GDUbG87/+zwm+0OqGI1k7hbUuQ9aulEP1HXA5I0+e/qtrWfcwobf3Dksz5TehQlbA/XB+Cyi+IO49WaTi07qpK1c1qPNvqyUeJrYrZ9P/V0/55oHbEPcqgTm+b+nviiwwPzw163j3xIyWh67fX3W8Gj+gVGZ9kS2ReVgXqlVtt2t9ZQL0pSi0Z/v/pLWz6r9mVroKARWHWa84JObWNfdS+LThv4sntzlC3IEFDo5ei+XDYe7GsNA5XKQw5DXdb4rYhb1G5Tr8zYxB5DYz/5vPNug9hga+0iXVPt65zdJZ1y5mZpS7yaPWracc26EfIwYRJ9QbyBtK/7VPKq+EeO89dB6XsfOaff/Rybda5kTE24BWFSkRpFWUBq4Iqw3S69XcfI3OWBvN642vqch1ojDEpilNNoGep+MehO6MF+2+JsCYXx2vgRHRw7fms/wm6V/Wfzw9abXLuq1Lp7LY6tW/ge9g/hVqc5bdwDp7rcR+sBe3QC76B7/PVb5qUPRY/TP5977Pp+ZlZTrkOuRruJKdGnWmgihflgLrf60rNtjyt3F+fVjv01scijIejvBNu6ltnq7e5dOwyP+RYzoI+5S25frtvSbqJvZ/sF2EDkmvoIdFww09NxQfmSOO/Stc27Dnmxt+PmheSHzvVHwnC3U5iIMI3JLbdLlxTN+X4wH8jW/GJq79S/oRfozgAucHdEsPSBO9U31Y8vKiiK/1383elV3PvML4/yN5aYS7P0o029SdjVwfGCx5X21W1OOa53+yCvJ4fL3dEQscjWG5yB5Sni1Y6yae7nAsK6D+02PPrFgB0D3iT9G9G3Y12gWdVBfoywb9pqtTOlVgxqSW1wRr6QmOhLsJ77yelYoCYZdlXepiKM1t/2mUNz+2RV39c/dvxs91T7/c8f/7JYi8YWwxH2d1QLZPNcdiMBUJ7xRdPYljWFu8vXN/wqbDIf008z35a1V/7jcS2E6BTe52q8JTa878peitj8qNSwGt8N6nCuFN4p3oQXyubbLjijxHON2nt04FT/DUFHfdLbZft6IfVMtW2SpbyM/Po199B3nw9wlvbr6J9Xfqvqu9f1by4Ga/h4qFa4ZgtuKrF2qPWo6/Oz5LPT5+e/Sgv7586qLy3XtrzDt9vHemj9j0XtCEwMBmNrQ7/6NfrcdWx2uAT2QPdbesG+0G7qi32g4mbAAb+hbSMjuJ69u45KWNGDjdwWGh7Qyz1YbBBH1OS36Apn/nlbkVL5rmBrkVE73vy8ZQizAJoJtKXVyErbKe2JMkNBp+yJeckfTc9/Zdl+9nq97fufv19b03Q9xWohzeOj82bf5763gm94HPP2cP6mTNIcEc5CO+BQ6ItpLh2CfiHLlXDbcZ16d3aLOxc5v9/AXu87jur2NfibT6Vdk7K7dbXuH8sL61pDD+vGajfLB9tZ6zhwM6BxeqOpQ0h4L3qGCmocXr5Je/fv1rfVH9t+/JY+6Ouxt/++m13Uq+hN3RU6gV2LrsGPu5jhmaorsuFkHemHXWf+0f9sGGN627rUMosfaFmt2uVww7Wb5+CuDr1TYzSxrwbkRhyMjo0Z60b6xzonIjv57/pMqrttDKVAXMUdiJuqp6JZtcoB8/7XPtOLJHJhK+1qW9pYX7c/O7dg56e0H/s+2v3MyHj3bc7P0IZHTcfrco3jsTXMQmyJqokejwyDLrMbzX61pX/n1T+tCS+Aq1aZIw2DxLlgpkzjpPVlI5bEbArvGo+Hx4VdDin23+T/2GOKqhN7Ed1L32AMzEnbJLoKdyd2+E11uxjiEjYhKNHrmsd294XwCIQ3VBrrtFHZj/KXZ1/7VfSx/Tvmc0jB5NrjNSnNi+tttIHZgKcwq8Svph781tba6j2l7nVHqvcX9/g5uKCl5N/StlVR4HY8zf6yR1Xo7jajukwLmtvxTtD4WGWHOWF/nUDP/o4rFZhqgbUSKJZZmMnCPMfBqpfeEW4NHU/4L478GtrPK6PNHU8f5U/RjR7dCFc6/+7183vBldz1haNyTFlM3qa6PU1pNqD5HpyED6AWyReY1lnlLaeqQ0ot2velZ7OPfv/32+zSjwUd80XDxJbLYpA4Fw937BmQFoZE/ekwvdO6oL9hQNA7vz92Q1XLNfvl36yBljbidWGiurN9kl1nByh4kV9shC2gsOPSNqfbXw96rol36IzA8C8qu7Swvqwsozjr1+e/kQW3Sr5UhzZYandqB5mnWZawJvyu0CwE8rOaB1fu1y6o+ZN3LXfAn7ZFZ38X/2pfP7w1rn6vtZBtVX/wWBmw2nNWp/+iR4bLO44KTQyeLZ2d0YpRsirFSX6C0Av8h8qGBireOEY5JXl+CO3Z4WJEVFwfv3eRh9sfaVtqd8cuEp0O7qJcK6lq54KUbM/fF4um5XQslDe0a4qpz+SKmHi80HJKjMOW4YMMFw3D6h1qPzQg5fpf+7MH/AjN2VSysrpzy5WWAfrr4hFZrH18W6P7nE4p7WqCX0UfCEjzTA48ozITRY6vUQE/zDUheUIPOF99yr6tx2mfWJcZwTsiBoS5hCb4TQu+FprnY/OoB+NQt5aUeoemo5Ubf+74AxelFq7/26FkVHli2eLmjMYKdqDxIJDNveZGEu3NfYTcluNN3RrOF5D5E3KTckdVHM99UXqieGxLmn6k5bK4QgP6kr6z23X27xiLh85uE9rhlHeWZ5Rmp1silKH6wH0FD+E/gZ2yW9hiIEKVrPBzHBZs9LjsfjlgcMCqNlX+cxy/qKKUVYbn+k/1e4tjyr6Xv/s14HPXr7oC4Xd9Xv/qZ63BVDhfwdzi3gAx9E5yBn3V0s44uaXJOLxxX8UR7eU/N8rWFaypT9UuaMy32lMGdKgqyKXMZYXP55CQULxL704/w+92+hH8MGiXppPDO5WXfD1+F++OrYGeCI+5ReR1LB2Vamunc84lDm4+rx1k7ovsH7io1VaABE62nqruVzK1wDEvM6vn9+JfQwp25Wz7XVERX5fcame5JELgDSGb6aXk4fFkPVvL+1FrTSGNbar9W3rW1zTHVDca9dqf+gPMv8gKhZNToK9XSE6HlZ2vtl/Wvm+nNp1ORG7uOCIo3/+Sx0gUBJ9Cn1ml2BZYY2zmFwkbsFL4MPpF7ExUKiyk1lnpct++FD6nvMcPoHbqgioX1R+vWFlwOOvAr095XzNPfKYLAgrd65bp/Cyg4RklgJM1b4hIu4PKCTgs7ywxhma5Ae4DxdCR1DLjW9uOVsLSHnACxsKhrqme3m4eQTc7PG9/IApuvy50exdl4KAObl4NPhc8guHHUBmkFr7pAxoOGlWmPjW7DBF1381vuAF0B+tQ4RHcG/YBNvBN2Dmxn76KDayfVVlYd7CgT/mPnFnf8vOMX9H8RaV7a3pWbde9pwdDiYKKyFAMcR3sGuQYHtDg7epW4TBeVeBQLe8sPGdWCPPFaxBK2ePB5CHYRXPcuafXO1fcb5ZPh4B7HVd0ygmpD9obNMflmKodfo0U8dG6e9Yt2oqaczVD/kT+QWvulZrKIqqyyye1drFOox+IU8CZyHxWie0UttO9eJM52TSwZWDp2sKc/Du1F8sOVG4q/Vo9sHqMWWODkFNoGmR1OeUe6zm8zbeIR1GZHbsEaAPVPht9xYCP6kV23ewna0LRUPaWOROopNXCBDSGf6D6RC5w66M4rs62i7Bb7DTep9SJc64gs8RURmH8YPBs7l3jkHv9x4WsXT+wHzX5tTnG8tpKv/qBlYW1+1oHMAnW4WgPBETi8R3qNcpN/GPssFgBm1tP8Be0Q1q0jTpdn9bFwEWwmLCoWLu7jv7OD32U3kPbKiKA0ElxM9vLAtYG7Qx0DqqyP0IsUy8lPole7K/m3CZDbb4x0vhEm2re0bShZZKxgzCVekfPB1jiIHQCaI9UChMZoqlE/6ppuRYt+5E7qDCw7Pqvf743ZreWmmvRpi8NRP1JKgrJUbxUfVSWuRe7JXi38QtzPRY409nPebpzjvwymkAmYMsJB56Cpohe3DveqEjHxpPdnWlHvXuEG+a1yj8uZKx/f49/Pfu708r1Dh5204kxlmCjf/PVsoCCT1Vhf90K9/9OLNxa/LPGtfBA/aTW+tYtJoF7AyUIHekzcAZu4xbDp8DFtD/br2Vv03uDk6GwNdkoq19Q16RN0t3X76XqsMGyQS497K2ep0N+B+wKTQ7IDL4cdCksoO02L2ffViej/XQNYL+BdBTzLGMtGa13zP7M8+bvtq4GD24YFW8dCaaQX+SnsRnqiURPZBtwlnprjjF0NBU2DdbeKk2sNBa45jZnueYn5IT8vvALKe9S1631VWsDHwHfEhKBvYoCp7cqD882XoRbByezk6vXYq9z7ptUBB4Mh/Gx+FZhOjEHdgSL8WeIO7TFzkX1RD7P/Y2ju1+Ta41vod9CvxaXF46EY5DDJXgC+gZ6Qa9qSaiDK5BaXalHwfLCuOLDRal5nSuaCrxKvzR5GETdc90DRouloWuEcWSckIzmc/sBD2CgbSkdpztmc2zc3XzD0MaMNX1uzmWeWM6zB6AvKoD47ezg8NDfIWSQ74iwZZ1+RoW229V2in+Qf2+3FV6BjieI9qpoWMEEs/6tThb/5hLtntqLDbXae/rhlkx6H23k71k80NVcOyKFVwlKrhM2gp/PT9QFNP/U3q6OretXVVAzrTKhslPerYq3BbJqvnG2sbPhFXCLn4vYqXIcPb26OqncXri7+k3ym+kb6TfVu7vHONd6p2TNU+VPyFVYi7YXvlNB1m/IafQA+wXJkbVVDiAz7P3V11Qj7Bc5yRxvOa+XDVXMskuSofAH/h7lb3huOtw6v3FzxYX8ivKMUuHXwDzxd3bxg4KlxXsa4hputWw1L7Zmi92gTUQ/pZMqVHOYfGU3SjPYfrH6GGlVcvAn4DK+mgmgVEIM5IKksSZwNLgeeIkedz4hd/AiPAf5x7cTAwZ7Tgr66ncmeEMbzsWmWec2xsFPcED/spWGBYZTVccqh9X5V94thQoqCg8VDqsdWHKhVaM36R61fLKGGhYw7QBAuElQ5FbiD7QH3IJGik3UcnqC7aR1urGrsVPjD/POJqemma3xxijbZ94XjVJ0VXOuJXa/XL8HZXsPDYlry4T0bFPuN8NXGZLpu8qx0GsDWa05hKxgTtuWMSXGYv2plnbGMNPdhtVNAxsOtO40fqYuG+eZh3KL4CL+JHCTjxBngP9C3uB6rohnqULzwIYVzSl1T7RQfVRj2/pTtYkVw2o21PXQX2lKsBXRnugIKI5YQ9zR+HjX+u3xyPfZGdIl8FTomwCtt87L4NvH+bAdbNeqSdKcwk4hAngJwti1nJ6O4KxMd5Mzw4MsNwzZTU4CxgAe8knEaThMZYPf8q/F3dR+EbL0sc0yELUHGv1qh5afqAitfpVXk/eicHTZ9squVXH1Rn20rcB60VQEdBDaaxTOhzWi1x8nZ2dH75suv3xveKd4z3E/4hTmbnXKlz9DL8p3yOeRR5k6Otg2RxzJJXFZTC3sI++k9EeOEovxNXYXNEec0jXfHHrLVuCA+oTyLzCZfmV1EWa0/NZFVC1uLqh2rZ7y90bJ9j+txS75v8uGl08o/lXxswJu+WMJ4p5YxyPDZetk2egju3R5oavo5uO2yNXe5bgSc3juNNDpkSYf/QR4i22wGrAR0WK00JcOASFgOzkARNQKdIVqiapKOddR63jG4bLDBYdWtwDnocpVDun23VSFxGvkX5uL6UXD86bcxtiaIsnvfKxaWti1IuCPd0l4wfzaQfWltSHG600LdRvppXAOvpofCXvL99htlflr9qkcXaaropVyR4sdYJeFp8CLsM1EJvKA/wR1gjqyYWgZpsIPgwdkS9FKuxvOJlmNK+nS3zPM083loPtYp3UOqU4tStz+vWakPAwpF4OEWL6x2aFpkRatG13mXDS/onulrPxl5dFqhyLv4h7VGQ0n6yHDXWOYbgV1QWxA3iAzAV/1BXVX+7Zkg8JXft4+H9ul6IVOhu8C53gPsTMYI/oAkVwEk4RMEAdgJWwKugFSy7djG+Ub7EY5KJ0PeRa473Rt79zO8bdPR4fHbjXqHYo6VWfZFWExWmA9Tg+w9mvYUJVY/aTiWZWuuLrUp1JT/qBIU+1dPkWb3bSnIb75bbOL4S9/gCsWkxAAkWu+qPaplapUjU6dq9yKbbdLVveA/hM5Ih26Bj+FnBE/Ohp+Ta0UDagrcR97J9pBD4l/CaVTtLrK9T+HSQ7dvE47RLtccIxxGWN31HGZ02rZIQUEKeAEIAEUbaNNM1u2VK+pXFF1qO5BoW9RY2H6n97F4UVLKl0a9leUaXc0nW0m6XvUezqC+QXvxo/jrzVx9g5ObZVfnTaq0pRJ8iPkPs09lY/8X3IMtBypgPtgrZiB/4YosJ/sSng78AgcBD+AGskFqEbz2n6aZq6qu9tap252SQ6jnArciuQ250lEb80MMI//Tl9metJm/VCdWhfcUlbP1W+qGViwqPhI5Z2ymsLQ8k1lR2oqKpuaNzd+0kM6lCujlNwY+UjZfPVTdZLqt8MnR5VniPtHzWAN5nFQfdVeKc9Q3VEvVY6BNsEknEHg+C2IQU7Tz6GryFv6pxAJ9gIuoR/hFgKXFap2qzra23AzsdChBV9InCXSsLHQdaEG8UEDbRXS506za8POxsjadfXW6hOVH2vHVt0pSi8fWJfZUNrwtI6rPqTv2lRBH+Zn2jyh+cA/sKe8t5294wq7e146529uXm1etAnxvuE22W2Xe5lXgGt/tULZiRgoD4Se4QGEHfyX2ioUcF1NA+kwuoGdTiVSIpVgG2ptz6exBDyTr2T2s8/wEdh5biwRDjjh80QSPcZNpG38v9w+2zCqpFVoCG7w0EfVn9WG11yu7Flf1uCqrWieoi/TdTFNad3Ot7XsBC34IXSQwiSrVT5x2OYGuUa0+erj77074IF3RIDBXe6b4TvPrcj1nNpH5e5YoKhBu8CCcAbaYHJld+om2u408c3963bUympLmr/Vb9I+1P0yDLNu0V039LOQ/G0mx5pDK1idMBp5LUaKr4FEfh2WwyuRdL6IW8SuoH/S7tw/gtrywrKD7W7aYINpng+y7bbkMn85IzCOXwsWAdOJtnazHYepT7quctlt3+Ty1amLM+eq8b7pOdjzgFd3u7kOXxQ7HLwxGHkEHcPKueeWLPaA3k43r9m39UTDnvK6+i6VVGVw6aKK1RUdanbU7a1bUj9ZBxh/N2XT600nqf3sJfgsepXYrGDQD+pgcq4MUgx1XuKwza5OGaScoPliP1sziMBkKnybIgwCwCQglO/C9hNk0FneXRgtXmHqEZn4R4yG9sFvkAbSD/WSz1HdlshFjOYm7kC8UuXLXeFfwAVyGA8h0+mFwCOuyhjFyqjCpvfaFG2odmyjQ+PgGp/KS9pzjSVNSOXO+srGXU3bjW4WX9syNtyyWyRQR1IPHcRLHc6q19q3cQl3Er3tXUf5PXC/653u19t7ovsa7yTnRo+pdiucjmrqcVppkE0WEniROkC3sfUzOdj6m/qYhupU+vxGD92FprYNzwyO2ne6UN1FU6pttT6WSpZO6THgEvSCyofsWFBsFE5C94h54jfkAfSD/8PfhyOAhUIEFMMOZV8CpYCKzhJmUCVAoe0TGwfN5fqISexitAzWIzeI1bI1squEt92/jvOdjjlN16yze6C5YfdOc1T12dXNcYZLi12g43v5EZmPwgu28ouFQayKSrKhek9jR52T4XNzUd2KWs/6nNpeDb9rVlebqmsbYrWzKu2bm+sXNyUaupraMhm0jT3GLSIGETb4kaJEBTjHOZkcLzqFusa4X3Rsdj/vSvgcdh3u8NqJtENc7yq1igKZK7YCGYlOw4LRH2Ih3U+MphPpMIugH22J1b00FrZW6s/Y0vSTbPtMo0ylhrnGAvNL80l+FRUM9IJ+s1fF/cw2FEVyxNFiDlvKjeSb+H3cGXoKZ093BiLp6+wP6xsuklnO7rOO4UbTr7iZ1jXWw+xXoA3LAumQEoHEfLAevK8YqzyMvSFn2a9VJTk/Vc9w/O2id/xrDztWaAj7407OUibfqjyvvq58SwwWfRBWaCtyVInxmVljKW+JMb5qetOsq15aM78yvUJZ+ar8W+Xa2g11w5u3aoMbUppiDFb9D32CLZ5N4e3hSvwCeVv5Qv5O7epc4JTkHuUAO0R69fGRu3R3jne/677JGXAO8vB3yneb67RQ/tr+O9ZHuRn8A2HgRXC0zY8/xLgYyinc2t2c2KRsvapraNivrdT217Ua7ug/SlVXl5aV5mPGEirF2mzy5uYwS9jbwmnmsZAshELDoX+QUwhEvofG4r9QOwVLFCj8Zc5YNDEZXy9/KkuA24spUCbWA57LB/NTxDZorPR/70AlIAQng05QZ6iS784hQA4UCBcQO5EU3InQgwm4CjmDD8f9iFwsGlZiZ8jNMIJ7Q9cEGz+V/cXNAmbzbUScS7RUWvqbu9o2muWtI1sOG5c3R5qa9fbGKONxM2tKt8Qa/2stsfxHjbIulHTIIBxiIvk0KAGtJWMU7VUdZIslglWjXON2XgO6prh4uw12hlwXu9R6ZDm9cAx36eCY7rCN1Kp/kAtgAvmEeYpfxR5UDH+ViTPubB7bGNg4oPFWy9SmbtUra5c2NNU8bsDqPLXu1Tebp9SMbo7WnpcmVua0fNIlWwZY5jBV3CH0jxhKHlHelwcrdHZPHCY6fLC/ak94wB5ar2WuXd3qPDyctrtEeW5ypZwTHMMdo1Td5N+VRlk4MgiHoVZ+JGDiK7hQqlV3WjfMUKpf1DSjMUb7ouVcA6AdW49p9XX6hp+Nt/QLG5ubOpp2t663JJmj6c9WG72Svw9wgh9qQj+Tj2VvsCKZEkcUf8iz5F5lsf0AVbEmyXG8g0ne1+Ga/JTiKVGuqiHvoxEIjM2FUOIQ9hzdig6G5oo7AZYhOUhs4JfZPpoabIvNPqyNGmJ8bZpIhVM60zfLc7OKdmL727ZbvegO7GS2B9UCrmVuCY5cD76QWwf3RzBYCaZBN4W36HLxF/gMThIzUH+4GPzMZyJ7eB55y3eDzsPB/AFkKtyLDeJ+IuMAD8gqNAK3hZnsOn4IvB05BczkevELeCfgHJgOPYOzQQ34D16Ad0I6w4MBFWrG18GTCE/iBH4SDxeWA0fQKDQOfIzMBjtDvYGPYmf+mnCfWkOvp4P5ROsryzn6ljnXOo3pYU6zWlkXxovaZXprqTSbTNesH23t+Qt0ro1hZorNfDR4gmvghiNe8FcxAfaG5Gic3IuYjz1WzlMVEBoiSd6svKP5Tl5S3ZARZH/1X/kvdD5ei2yXjYBR/B/8AuKOKbnJwDqmnN8sVNs6secsI+kAy0+z1jzcCppx68EWxlRsLjDfNg62TLH0NB01u+u6G9ta0s1zbEMth9krTDWbKjyE1sHl/Cyx4P8MBTbJ78qGEtHyfcolcmdFosMU1SFllnqrooO6WbXYfrWdTbWS7CdLVX2RFeGifCs8Hu0OHpcidy/YE+oPscJtai3dZJazWtsJa7r5a+t5y5ZWhXlqU4HOsfW3jm6KbBaM5UaX5p6GNfoc3W7jR3oFs4ACuU5Wir/HL4XHCSBsBsaQP5BkWSLmjD1SXVOkkVX2MtU5h2BlrirU7qWDp/qtwxP7VyqtYoAiX5avrJVJyEOhUPwgD2EnweNYunANHCSOYocIO+gFliHmoea+Bn/Ta0OiMdZImzmTXesM/cbWxc0bjH/055oSmze2mMxjzbx1gMHBFEoLVLT1IJXHfWXjuZ9CKtwF8oJisLvkeuwKkS5rkLdXBqoPyS/azdRcUV5SuyrWa86odtjBmiJ5mvqZ+oVsnHyY6rSCUdzCLeQW0hf5D9yNlAmBXKK4gadt7oIv3cv2yLqf6m26Z/SzBtkA2wHdNatMN9x0VTfVnKfX2EKNfY2MSW5VWRbQSyxtbXP5OTaj1Zdtz2h4Vz5WAMU8jEF64DB2Fj1CNJCVyG3FYOUx/JEyFy/APFRpiiWKccqP+Af5GKUg08hryTvyDLgCjcA5vAvWAE8UP4ubhOFiH3GacEYisvfow8xaYSvjYnvHBQlDbGncG+q+VcYOs7H0Du4qP4VaxQyjOtqu0cXCXOE3vYk5QdnRa4V2ooX9xp8Q7oKcmCCW833ARugNeJ9/h5xEMXCksAg+gl4AloOPxQi0Bn0hfAV7CVvQGmEVHwdtgH2BWkADvwcDxNvAZmCfeFZcCi7gE4DFwihwCDARvAt+4BFQCZ0Ei5AnYotwWNiH7oMnIYOQhVgGGg2XAXugGbAc8sceoloMg/tBiVg7dCH6BfsC85gXNhZ8BfdBhkIzhHHCenEHoOH78gcEiooS8tiblIGZbg6k460DmcUWwTzSOMzAG27rTxnumxeZXxpWSox6n8RyNaYn9HdLNIVTkDCXmS6c5KLAVCAdHAB7gmlgLrEB3idXkgdJUnmC6C5vazdF80K5336dAlVOtqu3/+r4S/PVPtxxh+MQhVUVrqmUuM0mlYtcpqrC/8FWkHZkT8xRqmyixGKxPTCQ6s9FWDeYR5nCqLZmZ/1cU6PuUeO1xvqmS41btM5Nv7TNrZamt1pXLdPSU/dKd6gJ0/3Rk0bKvNJw1/reOIiupmOoBPGC2Jc7DdcjJ+F1WAc8SJ6DdSVl5D61i6LK/pj9NvsFEu0BHY6pXTR77UTNK7vpdu6a3XY5DlGOlHKuZrDyk1pUgyov2Xyyv0yHbUZP4A+xlXAXJANqYIq450J3LoWJo8stX6gZjL+xne2HscrKmn5Z/rPcNT40RuivWrfoU03LLd8s3vRko8ly15JEd7U5WR/YCthMKlYIEvz4e0ABB0LRXHvAHriEvOAnArehT5Ke/UReChqsXgwGPoAxyAdhvbBOwJBIsUJcDXiCvaEjfCn7ngf5m8JC9q7YVcwGNvOjxY1MFtcZeCuM5D7xC6Dx0H5xP/gImSKugjVQF3QoWAQV4PvJTcRw+V7ZdrlWflbWlfhP8YToIHug0JJ7lCq7l+pc1SXZAJIm81Uz1SMUXWXHyEHYKdlEZD7uio6H0pBVyEVBgcjAVfx8OpLRc5+sa22+lhe20baJ5mzTc+MXU62+Z+vu1kf6342eug7aMy2PdQt0l5uTdROa3FtCjB1bdxhv6vobEWtPC2LIt3625FNnrePpqdR8tpyrFdcCRiRN3I71Q4qRabJIolb2B1tC/FaQikbyrvK+rEmRoJgjr5TlqFepH6qnyvvLbpLblG9kHAEpHhKheH9CIJ9igtTpPAxfBEU4DzSDK0E/QIBagXNCAOgIhvCpwhVeZM5y2/irwF92KzefHyWEiK/hBCETuIUEIIFAV+QDsgoTsHtgDj4fmojIMRNxEroPfYMHEV9gFt2L9EW24jS4FPkDBkMTIE84ExguaNhPvIkxMZ9s6yRKGW1WMvuMR43HDSf0l3Wepqutzq33jOeaPZu/t67Xa1ryW5hmVdPW5jeGJ7qIFqW+sBU3PtN/MXvZ7lr8zRuk53SmO7G+QhNrx8LAF/ip0AbSo1/whaiV2CcLln3FFPKvclT5XfFKtUPepBqlgezGaYYpP8puy4tVP5VDFKfkm2Td5PMVzfKPigdoIJmFbCeOkU5IKjwIuw7zULIYgDqBAn8BHAZHwRuAKZIX2sonc+VSrW6B/KS3cke2ge/BNHgsdBpaji3B86AriBGdSOSS3jI34iQaJhsuT5efJcfKf8qqyALZeOwH6YCfR1PwMehkFEYOIzMkDVyI2+F3QV8QEf2hGZAH+Jn9T3hNx1LV7AimgzmEGmS9az1iHm2Wme8bH7d2b6GNJ4zbmv1bzuhv6euau7dM1183TNNn6Txb7EwDTBrzBwMp5e1J1FiLm3WQ+ah1vW0PU8CdYY3sR3aAOJbvJSbCOfwyoS+yANFCQ1EUiwaaIC/wMLwbGAX1AMvEriAL7wX1vAAx3HGwmb/EDxPKxQfiG34zl0rZ87FcN24wO5nLtSWxJ7mXTLUV5wfbrvJPWaWgYTayOLuDMbB1YCq3D74uGMDZ4FTwDM5hd/HHWBKxV95VrlAtlIfLS2RnNRrFD/VHVXdVb7tbmu72czShjreUf+3D7FLtZ6tyVT52S9U+ml2af1Sr5A/lD8hzZEfFStRLFoPFEJFYH+Qb+hJZBw8Cz4LuoChu575zQ/gGYBI/VMTYIXyiYM8tZtuJHnwuGyUw3CBgCjARYPh08Dx0BQwGKOgk/BdxJqKQhehbYhgxEFVjY8iJ5Ar5CPlymaMcJEvRAKwdWYy4ElnIBtQb3wLtRHeDJ8RVyCMwGlDzIDdalDIuu4TXM/2tJcxw5l+qlIq3pdkOmjzMbSzXLQdNi82vTFN0Gw35+iJdT2Om4Y4l3XLXFC/t6DLjYSmDm6yXLCvpncw6NpIaSeWy54SOrLNYxSzlAsD5nAroynUUS/ljwBTRBB3gn0M3xAxhGdgD0PFyKUeVMal8W/4AM5aj6CLbV8th5oglwxZOCYYmQ6Llh3Gh5ZdeJVWc00yF+jRjUctok7+hl/6TPtlUaALMt4xxxkxLiem3Mc20kzJYrprnWexZjF5FvaKnC5voscJ7zhOI5FdDKcJ9sAlKhJqBIqAEVML3MD/sGFKPhKP1EIca0YuoFdkAXQBdQDegkD/CZ/NtpPp7jdAsHuO11CD2PhPN7LWdY/8wi5l06xV6v/WlrbvtBn3FMptaanWjDlpGs6vZSDaQesIoqL7cfuESv0V8zJZJBGAqMEu6ABEEvYKDoG1wF+IOHEIeJHbLesra42ryKN5RQSmuKh4TY+UPZKLsnuInuVDenryHHkVfYZuwd9hjfBZ0CXsKbgROAR6Il1gFfhYQMBdo5ccBrlwPYCu/n/uHTeU6iR34TjxDr+A6s0vZw+x7keGPCKfB5VKqGwisgXeBW+DHWDEG45vgpchrNIocjeWQfcl0ooK8Ja+XaUmzqlK9RbFFTimfqmNUz5TrFDtUV1Q6crvyqXyB5IWnEF6yxZJyYngWdpe4DOeiXTEIzkSDIEDMgqcA3vAc6IiUPSYIMFDJT+encjYhAzzBh/PDIB1/SjgmfIcPSk7xkUQZ+6EbsEcSUdyPZSIexFLiEImTks4oigml6q7yiOyrElcPU15Rz1Pv0zgqVyjfSE44S+GiOC6pn7/8JnGR6CtfSwQStOw4ORmfQZzBL+AQ/gktQMuRQqAUMsINkBp6Cy2QomkjsB/wERPBCH4xsBQwg8nCCfA+4ANzYBSQCo6QqpPZWA18ChqJOZIomUQEY9fwU1gHeXv5aNluZYtsHZmrMil5VYP8o3KEgtQ0SySHk81S/qvYp/xIPlPEy8sVCvy9XEU8wRIIFXpDqgCXIjOROdAdwAXZJkwVF4re/AqgA29huwOl7D5Bzf0S24sPeV/gJneJr2E38v2lNRoLzhXegSGir3RafkEzwTWoiOyG72CT8RjMk8yS7cPr5VPIVnIRCSlDZJWKHwpc+UbeiIOKvuQ2cg1RgiXIz2EdsQdoV3w+xqMH0INQBDwAPY90EztK2rgN+CSkAAGSh9jGHZG83ltuHfOWZmz9mCfcb4mm5tAfbYdoOQczI7khnBNn5QdwM8W5Isud5Aziv8BYqRqsEHoBp8DH8G8wF3mIeqBXkcVIOdQTuY/L8YlYFV4GfURPQ87wTyk7JyM4lIpsRBrFZPAOcAjI5tcL+fxxYR3/hHtObaRWsgZmJJ1hq7WV2b5ZutvWmbcaT1s58wzrI9NlM2FZabpuOm48aI2yraB6Uxus680/baA1gjrGhDF/qVXscuaLdO5fsav4OfwTfqHgKq4TZ4rLxANgCjAInA/lChPFOlDkt4GPhG9StHQTSvnvIiL2YZ/QhySWeoVzY3XW/tYGi8r6w/zYnGIbYjlsnmKssnAWuTnY+NO8y1ytdzKMM6ywDLGsMa6zuBk9jX2tfayLzKHWNuZGawp92faKdWB9mMWSakznwjg9f4Pvzc8XngJT4A3QcVEJRUIvpdlGBDWDo+AYuDv6GRqBuIFLkDXgSyAUNEJFUH9JmyqBamCUsF2aodgritxkIY1LEAjpbIyk9ew4Pp0KZJ5SEXR3pp7z5TRMFZslddxeMsV8C18hdfnygMtCBnRHWAn+B38Aj6ID0XBkINYZOYtukk3H0uXZsi7ECDJW7qm8IussL1awyiqZh6KPrLcsSGVSOMhLlNMVV8nXZBK5hpwnG4ZnoCZsDfoAycXXYLvQHNABI+Fp0BOJX1WJm8UwIR18yA/i5wK3wSLORXARuoJt+RJgnnR2V0iV2wUxC1goHgL/ET9K/mkMrIYnwplQJmpGJuGvpVjLRLqiy9HhuEHy7qfQK3gZVo11Jb5hbZGPeAk2DcLQZ/AuJBA+Ik6Hfoj1PCt2A07zOi6TuUVfoEPZ3hQh0Yg0qtWWZx5ivij1FDtays0qi9rSYnpmmGXuKO3RWMsdUyeJSQRZOHMy9ZKqsLal5zDzrCfZ2Vwf5gmznl0pxLBHOT0rE8YBFjEUChK3QMXgGHg/dBBaLi4CP8L5AAjNBryggZJzXw2vAU0iD/YWNvPdgJkALHSUqsvrYibXieshLmP9+IV8ByZJEJnFXDa7jwtk/9DPeaN0+6E9C4vTeQ1wnZ8BiuBT4AC0ARoFmeFH6B4sB96GxWHl+FRyJ9ZVtlP2mEwlz8hPEe0USvk4JS2/rwxTlchWK1Yrvinnyv6Q88iZsmjST+6Lp5HrcBfiCD6PGIJwiCM6GF0EFkBvgH+EErBaKBWmixrxCuvNTeE2sGO4RhtM5dsmMEdt9dZaqwM7kHpDvac6s90okD7DyBg9ZeMm04VcGdPKXeZa2dlSj2Up/1hSilZ+DDBR3CLECeeBVPEP4AosBRXCPTFP7CZIXQgpF30Ue3KHJPo/R9DzWj6HS5K8VTKXx2Vyz9jTVJktiD7C6m08td02kB3PBlNKmrdl0JVsNPNQ4klrOGd+rPCS3yYKwgmxjv8M+AGXREeoBbRH2kkdiEfod/QeNodk0d7kKll3oh25krRTTlGa5XdkN+RXyF3yWPlpWSd5JZkh/yAHiEUyB6KNpETXsHBsPaKDS+B9UBC8CygXI6B40EN6p258JZvGRrNT6FtcPfuJfULdoQfQ2bZ+EvtbY+1oNVtOW3mq3rLdtoY6Yotj5tqi2RDWRreVzoqC9+Sdhd3sOrYH/4w3SR0Ae/ATMEq0iVrRRRwnjgTDIEf4kvhGPAHehYqllbsiykRn4CBkACrAZNEoPhY+CM9EHx4Ug8WePMct5wZyL8TJ/AdhmfCUXy0G8A+FZGCtWAE08COAXuAK6Vl/gVJxE9gK3AA2QD/BOegPaBh8ArsPn0YLUaPk/I6gCP4Wv4dPwGPIeKkjcw7/g9MYTsaQM7C+BEHsQ7pgPxAnKebuQY7gd+ghYCdkClbRhV/FVfMCncvuZe7SHWwTqMX0X2q6BaN+WmApggZY/1rHWruaZKYj5tsWb9tKS6FE3pyklbFjjlqd6bH0cuY3WytlikkS91kJRAMLwBfQOrAJ7o2eQ6LxIWg4do3oR/YgTuI2chpRQJbK7OXH8VN4PNGVrMcj8M/kMOIQ3gHvha+SMmc2Kk22QXlQWzQTjoUqpHdNlpg7J5YIGdwDvkxo4j4ye/lVTDaTTluZRHol05W5wYJcCv2QWc19kthAHy6W/cUu5c3cVGY5L82hialCDasX/xHkIsc1ip/E5cJEwUdsBTuACwAZpAG2ic7wdrArOEr8Bj0Dr4KFUBBUIcqgOOCVyAEnwK9glDQbSoFq6RrrSKG/NOO5V4CAaNEGLBVygCRQmtADOottxClAL1EF1QskcADsI8V5HngP0kET4BKwK+SB9IVCoFrk/7p8H/mE9JMy5AbkJ7gHnYI2wReQKDgTZuE4yA2sg/qJ+4Vd4C9pAruKy+fO8VO43/weTseY2OmcmXKkRWo7PZAtssnpKdRz+jmdbkuSdsOedqPe0O2Y3bQbncKclfotPvw8iStM5o+KEUA2OBraD6cgX6S8zEFhaCLijmwgtuNjiHr0L+5MYNIu7CH3yVqxDXiyrJfsOfYPQeFL0D34Nalb4YT1Qi8g6+EqaW57rNgAtBM+cIXsaCGOf83kMWnMHfqJbTxltny0LaQG24IoGWWzTjCvN0tNLOsey3ibA4XSNluEzV9SxERuBb2JPc+vE4aJkUCkMBz0h2rguTCGPYXnI+vwWThN/MS64IFEvOwBvouIIXaSUcQuoge5RdaGvEiMJyD8EfGYOI36Yp/QVmgYOhRJBDOAC+JhwUnIFBNZnaQ/CZyV2kbPsLVad9oGSJOODjY/6pmNs060zbQ1W25b21ITrBB1WyKUI20xLE+f4N4y4Xwz31n042+LI8CjYD/AG6oHNdg8pBuK4QexLLwtXkCMI1rINzITKRAz5Dw5mFDKj5IEfgTzwDPwUVgBNh25gyWjD6EhSB74HDgPnhQeibOFg5yZ8WIK2TjmCDWf7mtbYr1I1Uhr9ICS23wpkMq2LbA9s9y2bKbiaBnlQEVJ+/iOecDM4t5L9WAHwSReB26LoFSnpyECmoEOQyLRk/h79DS5FP9IfiHziEZyt2y+TMCv4nayfHwv9gQbinXDH6Er0XaoK+wEPwVrRAvwUrwlXuNjxFXCUO4DE8c0MI8ZCzWY7kmtoG9ZHkmx/ZZytd6SiM0zqoGKsu6kYGa5rb3UlxhCI6w/9y8/lhsnRkuT6jeBKWAAuASdjxyFByO1SBk6jPiNX8KtRCc8klxFpOODZf/ir/Hz+CbJP1wkRuMGJB1lYAh9Cm2HzVA49AyIEFrE/sIgbh2/kvGQ2Gwqc5saShdRedZCi8mWZdti+2A9bIu1/qAe23KtXZhpUhX2l+rGZNKruY78JY4S1ogTxeOQP+SFmMGvSKVU65qxiUQ8fpnUYWPwI7ITJEEYiTwyUDaPfEpOJBqIrUQGVoD2RpqgUphEPsFtpT7JOLGfcFq0cUF8e24dvZZ5Tm2gelA9qRD6vfWW5Yv1jmWu5bDlBnXWdtVqomFpb24wAcxddgRfy31gM7guwmogFjwDbQYvgW8ROfwadkAO4o2YjajBphHvyEB8Hu4syyKGkv9gJ/Dr+A0cQn+gOfAmeCH0GB4K2oPxoBfgKSQBa6X3quN9uW80wtXQ9UwLfcJmZ9tLFVJvbAzlzhyk31II40Sr6BS6ln7D7eQ03DluFD9beCGqxTWSe9kBzIKGIyFIHTIMaYeVw3OQjfhYpBP2F8vAETQBHYmewXoh0dhGrB/8Fj4GHUaWQDZwtaTbIwEayOX7Ah+l7LOM38HH8A0s+n/exXKcwFZzy9je3DzuMbuQ55kULpvfJunSUmEHt0wIFnnhvZTTFgmTJWedD7QCtBgKBEDfgJ2QBtoC7IUKJaoJQ0ugIimbuUFjwHcQB9wF2kE+4kwgEZwB2oHbxL+Sq2wRS4E/kpaKwEWxl9hXtIJdQJ1QKhaKjwEFlADpATsgAmgRN4PXAT+QBCaBWvG4pMONAAJeENOB79IkVoowAzgjLudv84u5CP4+24M7w03jOKlq/4dZxzuzN1lXvh+bzLdK3oTk/hXiJc3AxVbeQ5qffCTeAz8Dj8HTcCN8BnHFeiJx6BL0OjZE6kdNwDdgXVE5TuBfsRPoQiwMpSReMB4+DgaDX6T3dhNb+DFcC6tlPrOLOS2jpxtsx6ixthO0zCZYN1GU1DHaQW2hn9qu0B3ZM0yJ5DwqWDepK9sknAL/iteAMWAd/A4ikK7YU9xXqmY98XIigTxFPsY8ic34W6wSP4KuwlNQFh2GQrAcDoX9wDPiUGAfMEw8zO0S+rKsRCny6G4Si3lOO7C5tMj8S6+g/zLXmT9MFGdh53HruP3cDeGZlE3v8HGATVSKXyQ23R1cDS6FVoL7IAZkkdlwLfwELoDnInFQGOyDvIDOgifh9uBe8D8QAZqAp2CuWCG4AwlijGgWrIKDxFXniAjISRx7teRUFgLpoi+gAwukyjoc6gx0BmlwPpACPgM9oDaAFnghPgd2AXX8LOmc1QkmwcDP4+35Si6SD+SWMueYRPYD84FFJdd6lK1j46Szt503cBauULwo7ALSgdlAe3A23B4uQX4gQ7EVmAK7juVhG9C7ktLMxVRYEXYDO4j1waqQKfAoZCI8CjaAGmiQ+F06o/ZCO24t94tdyU5hC2gfmqInUGn0AcmhrqMeUAMpRHI/qawTI0r0uA03mcsWtIIrIAeugP8BO6BnyGA4BO6J8giKlSNfkdvSbM0cpBhdjlTCnqiLdM/EF24ndUz3Az2gDsA90FFcBgBijrhHOMsnC+eFTfw9cQ3/S5gtzBTm8WniYGEO8EiQAdPFvYAofBZngiqwBjghJoqHBG9AK3VLukv1OiCsFkbyvTgzZ2DDODtO4F5K90Tmc9d4mo3jZ3LHub1CM9coTJKe5A0mgY/BjXAi3BfSQ4+RSMQbVWBV2D/YTdQOT5Aowg00D23GhiAA5o6eQbTwXHCA1N8V+Y3CV85ZcgurpZUfxkSyfRkZlWsrtrWlK232VApVwbSR6MA4ZgNTyBex+TwijALcQSUwBFwL7YKvwy3QOWQvMgFJRO2Q2WgkPAR9DS+BB0FyeAF8FIqCPwDS9wEO2AL2EuWAr9THCBNniceFhVLERok9wP7AESBXnAc4g1OgGjEN6AltBvoAzZKPWgDkArNEfzFdSBGLJK3eJk7gi7lt7EgumHfgItnRUha7yuxmh9MvmXomj5Vx75k01sD95RN5Vuq5kEAWqACHIEMlDkGjA6R64hHuhWWju7HL+B68FO0mzU0cQUKxd1Imawb9YCcwBzADHYGfwn/CNm41q+FamTqJPcexrRIZvsemMN6MiXPkJvP/sr/4n9wCae06iEMAFegNngZuAgbgJGAHpQLXpQ7acWATGC92lU5sk/BY/CLsk1jKa/GZeEY8KWyVfhPlraS78eAyMQxIg2LAqxKHj4ZnwRhciayFa+DeSDLCoGOR26gPkgfNhD5BudI0YjcoTLwE1PLNnAMP8c+ZEmYPG86mSW5wILOQqbJFU+OZI3QwncYukVw9xO/k/fiHYg9xMRgIvgDOQW+gyQgBFyI8bJFU7qrEJcYj15FlyG1kodRd7ASHgzMkmhAP7pIql3HiPDFLHC+EADPEp5L/hUUY6CvpJCG54pnQAYmqhUPTpGriKbQCTJYmjLXAHnAZMFtsEI6J23lcWMUN4K9I07m3pOqpgO5Nv6KDaBc2kIG5ZVwx84hfzTsKg0VUhKQbKG3hFvg95IQ+R5SIPRaIrkZn4P1RPTZROsF30GJ0hVTLhSMRYCOgAOKA3yItPhXTxd4Sn10ubODmCBs5eyGVOyp0FoIFQeI+3kKuNJv/TqqjfgojwVKgH3AC0AFV4kwhWiJEWcIFfga3greySVI8reXac2ruJzed3c0W8Ce4FuGa0E+8LQaDZ6WpzErQE34rVVyN6GLknOQG12FJeCi+C/PA8rHBSDCSgDyBt0J/JVZwGrwMrJP2tpUvZAu4NewFKd+cZQ4xrqwD15UvYNtIUZvGHeV6CKSklpFAGVABDAYwqc6YK505N2CQ9LedxeVAgrCRVwrOYhnnJRwQLnNtxBu8i/hT6gKCYiswQ/pFnd7Qd/AvOBjSSlp9EVmKvsF0yFvUBb2NPMKeS12Zrch8qAEeIOXdHeBYoKewXWjgBnDDWRXbhX3ODJVudQ9kstnvrAsXJGnKJkmDXaSo2sSXiSukLvcy8C1YLx4FasUL4AnwlfgFzAJGgfNEP8nNbhHLhb6iq3BOojyBACx5ygQxDvwqTgSzJHq+HQpBsqB/4Y3wZcmBxEsO9CWShLVFJ6HN0HW4RlrJlcBGsE7EhaPCJ57keG4u48slMT/oM+xhZh8rY4uYQ9w4rjfvw6UKLB8tecQvUrwcBCPBxeBWiaSHQ+PBEMAT2AAw4kIgRUwTu4jV4naxSAgE+gtRQI5wAXgI/A9QSwMEFAAAAAgAM39TXQImmoUYFwAAShgAACEAAABzb3VuZC93ZWFwb25zL3BsYXNtYS9oeXByYmYxYS53YXZVV2dYFFf3n769sQssHekIiIgiNkSwxFiiJnaNvcUSxRK7wYYx9thRI4qJgiUaO3apYkFQeu8sy/bdmd2dmfuf933+X949z37YmXPvOff8yn12ytjRo5PUEDR9xLRRS1dv8JdDEARzETANgkbehCAEkkOLF2xY4MvlQNBkl7uBo2O/Swz7dvak9Cklk5Tj/hnhO4AJFrv6oq7GkoaQkoo3Bx4/uHv39qU7q+83Pvu9sLbcr+MQNVa402tahHwQNvLOuAffdX73zXh81NbBEVHPfLTig85lmmnVHu9nv7rxaOW92n+k/zY/lr0J+vh77WltKrNLmu97LCpqMG9k1rfvJiRP8B17bAQZVxae67lTmG9f0KWsPvF+x+tpT7be7/XvjAdITvXb9Z+S665pm+lBkm7vxIgjA8eOYMcsHDd53Psx8IikgUjEF++5kqnMxp5N9bzPb/LCn196NPfBroeWp/veVL3fVFXYEU62E9+6XQuaHPNyyObkkG9Oj30y5kZSxmAQnRhoU+XjP9pWdaRXpX14/Db92a7Hxx6VPxnwcnWBX+nneqO20WkW7vHoDjnVDxqal3R29PdjdCMPDJ8/sDRymv8WlwpUZS1rv1eV9BHJm/pi79NHT8w5fq+Zwriy6Q2V2iBnuiDDPT2Ijh4zyCMxfOT4UVuTCxNWDnwU5RYgcPXnmSiP7oj6+6XRRfCbTc+f53Q8a32VVpBW8muNs2Od9TsUUdh8MsLTYhOHbE9Ek58n/TOcHdQR8zrU6aWSnYTFFlGHZ83DkvGF/d/cfFHxPOdlUu6Q4tlfhjds6N5C5eLFLoSfNTw0NmGwKUE54kjiimFFA7uivUOKPVdKd8IHLcrO9NozpWverc2tfVX6cu7rFXnvi5O+pNSbu76z4egp2S6vsSFp0bVxYMiLBDbh1VCv+KSYbWH+vhdcFhJGe27PtGaPyvWfnhRG57Kvh7xpya0oaivJq/Jp3as/4PyHt195wnd52PW+0MD+Q3yGXR9aP6i6f0kUP7jK87qsFUWoTdo7TepKSUlt0cu8urejc635H4ovlQbWCNp0+uVOgjfbhfTeGLK1z5P+jnjlEPPgC/Fh/d9E3QiO8s5S7CFCnUC/qc1YU1T27Ye7hWH5+Xm/Fywt7vv5XmVGU1b3attueI+Y537L3zMc6us/YFz8kkHL4mcNmNv3cvjiXjb3OxI94k2d6cltoauPleV+KC4qLPhYUFX09cOFMrL6Ssv4nnQyGskSZ7uV+1WFrurzQ+zSuAMD/4nrjB0fjYdP6rVO/UyahsU4VIYj7aa6I+VXSha9txWtKfr0TvQRLTtYtahprEZjNjIov1Ch8XQPFPTeHf1D7I8Djg3QxG7ruziiNAj2Gah6JTRCvcjMng+tXbVDy0HJvA9bi38sFn1IKUn52lizp8VdO8Xawv7Cf65Y7BkY8DhMG3Ui5nDsx9gf+kVGb+j9QxDq81JVItqNhNj5hs0dzxvcq16WNX4694F+L/34tgT7ml2d1jSvy2A0OlwxpeSS688+Y4K04TF9zH19+12PORPNRDhCHvuv8piiuMMvBj22+brl7d80DKxa8QX+7P2p8CNeUljqKN9UK285rskxjXfS6AHxdZWPd3aAT9g3kZLoaX09+87pExmRGaLxj/S84pIm9EWy7WuMWV0XmrfXbql4Wjbn89oSusRROrscqslv3Nlh0nXYfME03mTZJ7fTPimBcWEvIvRROX28+rhGPgsLD9rta3K/LdfxdZCWCjaWd/Vv2VD3qnLoV7jMtzS9dN2XExVtNWOajnYc1olsn5hL+HDJJpXMq9L/r+Cp4e8jqMjSyDkRV8NygnL9mj1GKj3E5zGW3m4dr7vW8bApu/ZG5fuvYV8Ky25/KS0PrP6tvqkF07w16MlJ4C5RJ7msKvTs7f9nEC/s296zIvpGfAhPCD0VqPNd6dFfuVm8FI9lFWSsobgLbxU2sNV0hUf5/K8VX7dUDKpG6582J3Qu1RFWvVOPVAo2yS+6BXjX+98NSg0dEv41fFz4ldD2oIheh70j3KMUOUIUG8DstIkNYs3frUjjkNpVVX9XkOXzKxoql9V01o9pWdYZrJtu+epYB0P8qdKRqr89ZvkOC4gPjguNDFOF6UMKgrJ63fbRqQ8psyQpPDGc6VhkWa9zdPq2Mg13aydXayr3VQZVvameUpfXCLd1dy3SJ1uXODPgT7x8yXzlFrXB+7r/ocADwcdDLoc8Cq4N9Or1m88Qj4mqZqmXwBdVMJ7kfCOh7dNBNm9r+FSL1gRU962OqlHUfWqY3nK040ftNWMyqWJMyFP+WOk2ZYx6ovdjv9kBYUGqYK/goUG7AnR+6d7n1JjKJj0usKDJ7GWqj1mim9M1qC2nyVZP11bUHKnxr/29Lq/hVfPy9uuaJfo9lmb7ItCMJQkXyAJUy9Rq715+a3pZArICDwdeCmjxX+47xGutu69ynnSiQIj9yy61J1uW6w0aW/uxls+NRfV76vC6yXVL64c05jdTbc+7IN3fpjPkA7oJhnhm0Z9yjSpHzXhd8j3mX9QrKcDey+Af7ffS+46Hi5tDkSp5yf+EfmTL7Zg1xTBIu66zT9vu5m2NgQ2768/Xr2jQNqpbmtsGdYl6kowF1lTHVBCOtfFXSa4rdru2ql94Qb6X/I77l/kv8R/rt98nxCtOna/SyB+KR/CvoFb2O8c76y7jnp7uruL2mNbI5rxGrFHTsKXxdtOulra20s4BWlbvbllJtdIr4DY8UbhQGu9yy/UfdT+vUJ99vqP9lvq1+Rb4uHh/9BC4f1bGyceJg/gV6DYQ6Gy3VZuU+qvdFzrF7VBravPpppFNh5p+aq5pqWj7oXNk91ndCFOELdmxgc1CSohS4UWpj0uyK3BP9uR5J/p0+2C+h3z2els8m9Uz3ZYpPeS/im/x/8WuQWfpC1SBpbexvKdaM6ozoH1b64yW5803m0NaQluz2250eGh6tB6Gw+ZBpNhpZmuQ+8QqoVESqwhUPXCrVR/xzPfa4X3Xe4H3Ua9Ezy3qUW43lTnyVIlI+BNxG9Gwkc79pMCSa8jv8e7+3Glo/7UtrVXYKmjd17qtrb39ZSerOduz23DHLCNPOfqyJfBSvJk/QDxJFupyS1XhdkFt9ajznOQ13qvMs93joDrfLUMV7DJXNlXsKcjBRyFF7A9OK/nUctfYoVumHaJZ1Yl0IO1r2ya0pbdNa9/Rwe8ya2J7XuuPmU5Z31BiejHIQXBigGCYWC7LVPQoW11T3Z+pT3gAD9Tzoscn9SV3mVuoyqBIkT0SvxfkEMfR2VAoAzlMNpFlqrFG97f2lSa6y94R0HGr/WK7oT2z43FniKazm+wZZ6gxpVv3UPucp9ks+CF2m5cmHCC5LdMoGpW/uda71brvVL9V31D3U893H+j2VGVwaZL/IZWLFwpOEDfRp1Ah0+iQUDOtH02bDDN1u7Q6TXZXTmdAZ2MH2bGks3fXCM1f3VN7RutTjKXmOTaevch5jv0JjsOMxHGBRDxHukk+1cWoHOU6wQ13X+m+0324+223D64ZqijlL4p9sh8lItEJPoNPQzMhMzPOeZ+KtzWa7xkf6209G7QDuhM0J7piu3p1ze1q73qiKeuO6XmvyzBcN1VbYsgr9jD6CTsOrkSnES/4PFFvib+sRb7a5akyT/W7q9At0S3a7YtrrOtEVagyVxEqnyGdIx4kJHkX8Vj0FTSBbXTusQ8hFVaxua9xn16mK9N+6XbtPquZp1mheaQZ063WBves1mn0Z43rzGutR8hcu5iex96HCHQivod3WXBJtFkSKrsutypEynblflWHSuCqVR1TUcogpdqlXL5YlicBIjehgm/F36Gn4LkgnGEdLVSDzWaJNh8xehhKdS96GrTx2nfdZ7ovdTd0z9KKeyw9Mv1Mw0fjT+ZwK07aKcipZKLAaHgOuhRfwBslkIoeiYdKz8mK5MWK8y4DlZeUn5RFyiNKX+VWl2uKy/KfZa7S02KbcLBgKe9X/DB6HD4JzjKZzuf2TrK3Lc2Cmq8aVxhm6jfpXvcM7enSFmgrtZ49h3uidUDn0PsYl5lKzbOtrO0RleqYQQ9kPSA7/AW9ii/iSQVXhF7i9ZIsaY4sU75QYVPMcTnl8qfLdpdIlzsKnmKAfJjMX9os3ieSCnfxa4kIfA2aBbcCP3Y+neVA7avJHut+yxCz3EQY/Q3z9YW6mTqljuwhdAm6y7pwfZX+tuEv4wuTxTzKessWTj2yT3ba6D/ZbyELfBaNxV8Tw/k3BLQwTvy9ZIo0RtYj2yen5KMVqxVrFN8oaPkhOSkbIVshXS+ZL+4vMgjO8KN4D/AY7BriCu8DNmY1rXX8YldQz207rFMto8xTTNuMuYYowyP9Yn2sPlg/WL9OX6wfZWg0nDOuMc0zr7ActL60EdQc+wtHBH2RUYGDEIB/Riuw/sReXi7fJBCJpGJKXCTZIXWVHZVpZCHyZHmi3EdeK9suA9Il0ruSZjEtgkR6wQf+ed4sQo4/QxchBHwDTGCtdKZzjsPPbiA/295a31nazO7mhaZ840hjneGEYbFhsmG2IdXw1uBvPGMMNZWYjpmXWCZax9qmkj9Tp+0FDogezuxmC4AQHoccQJ9jXbiI58cPFngKGeEH0QFxlOSZJFZ6QlopxWVqmVJmkT6Trpbi0jSJWTxWfFj0XFgn0PENvA6iDH+E/YGuRBJhFdTFvmYu0Dudyx1z7LOpZWSqLdvabulnOWHGzUdMEaZ649/GNOMO42/GbGOrMcb0h0loPmnua6mzpFuX25LIcMrL7u7wdAbRscwodiZYBe2CjyDn0EtYOn6M2Mqbye8t0AkyhWNF9aIF4lJxjGSH5IGkWtIt6ZKUSbIkayT+kpfiCeJiUbzojLBDECFYyD/Ku0d8wJswHUoiDAzDOCQEctaTCaOHOWc4ttmvUw1kL/JnW7G1v/WmJdZSZF5rDjXrTAWmf0zZpoemMhNkHmY+aG43T7YUW6ZY2637bTFkB/kXtdo+1OHi1DqL6VvMcXYTmAUlwP4Ii1Sht7DteDKB8p7wlvIFgsuCSGG20Ee0R1QtChLPEx8SZ4ufip+J74j/EP8k7ifuEaWLhoo+C2cJKwXjBA/4rvw1vBcEnxiPH8RyUSfSF1kIn4QKgJ3twy5h/qTrnQHOlY4cu4t9HVVFjiXf2sbYvlrXWF2sbyw7LaMsHha7uc1cZ242m80yS7xlleWmxWYZZ822qmxpNoTcT7pQmVSCvc6+2xHprHIepBMYC5PNLgQeUAm0Hx6EaJCz6AisHduP9yIeEMm8d7yx/Ff8aMEpgUkwWnhcWCoUiOJEM0UpolTRfu6bIpohGiASiMqEJ4UThLQgU5AsqOGv4pO8bTw7kUK041Px11g4dgQ1IlOQe7ACXguVgGhwjDUx05kXdBh92sl37nI47FvtkP0Q5Us9JKeSTtt121ybh63OesO6wzrTOswabvW1elr9rBHWROsc66/cieqtattMW4ZNb0smL5IMuZD6QA2137GHODIcfs4MjklZdD8mh2NTCTsbtIO1kAPaAwuRo4gS/QNVYIcwFP8F78CnEE8IL94W3mdeED+F/4Tv5McL1gguCQoFWoFA6C+MEQ4VJgoThHHCMKFSaBdUCf4VHBBMF/gL2viZ/HkcZgW8DTxfXi6xlMCJDHww/hlbgpFoGuqGZnIIPoPHwKXQXEgDNgIEHGV92dtMIlNGr6BhOt05yFnl2O4IcBTbN9vD7fXUaWoKpaQqyQxyDZlIupFGW4ntvu2i7aBtu229bY1ttS3FtpXD8pztjq3I1mETkH3JWeQB8impJ0OpRdQVqpUKt6+zP7PzHdMdNxy0Y7LzuhOiZ9H3aTmzmnnHhLH72TZ2JLgCIK6rHEgNr4c/wmFIKlKJ9EF3o1/RYGwD9hoT4T/g5/A63JeYS5wlSgk+bwhvFe88L4+n5Sn4sfwp/NX8ffx0/i3+M34h/zO/gl/FxVf+J34+/yk/i3+Ov5fjwRR+HN+Nb+WV8LJ4qbxpvHCegygkThHzid6EEX+Eb8eH4zD+BkvFhmMM+gTdiPZFu5FryI+IO1IC/waPgB3QPWglFATVgzNgMhCBfHY3m8DSzFNmMxPP2OkceiedRPPpj87TzvnOCCfpyHOcdCxxDHSIHE32x/bj9lX2b+yhdp69k3pP3aXOUqnUKmoGNZqKo8Iob0pBCSiYokk7+Z8PRTpJiOJRMkpNBVF9qQRqIjWPSqH2U+nUPaqIaqEYSm0fYP/enmI/Yf/X/tVO2r0ciVy9Q45/HdUO1BnpnOb81ZntLHcidB9u7mn0A7qZm30Cs4pJZ4oYiglhp7J72XtsEysDCWAVOA8KgQ0EQN9B26Eb0FcIhiPh6fBu+CZcDgMOmUnIZuRPJB/RIgo0Dp2N7kQz0Fy0DeVhodgYbCm2F7uCvcRqMBJT4JH4KPxHfBN+GL+KP8E/4s24DRcQXkQkMYyYQMwhVhJbiP3ECeIScYO4TzwnCohPRAVRT7QSGkJPWAiKcBIsAfEQHvrfQHgwDxAM4SBIwsxlaIg2opGoJsqI90Qet/4BcYvIJM4Tx4k0Ygen92VcjUnESCKeq+hHuHCKoHANXst18gq/y/V0Et/HdbcMn45/g8fjYbga5+MU1olVYAXYI+wv7BS2j2PfIux7LAmLwfwxGcaiPWgd+h7NQbPQc+hv6GZ0GTodHY0OQINRFYqhFqQVKUPeIv8iV5GTyF5kA7IEmYqMRuKQUESNCBAnrIXr4E/wK/genAmfhg/AW+HV8Dx4CjwKjocjYF/Ok3CYgrRQI/QFKoSeQ3ehv6Dz0FFoL7QV+hlaDM2CJkGjoaFQPygM8oPcIDGEQjQwAw1oBlXgMygCr8FTcA9kg6vgAjgFjoADIBVsAxvAGrAcLARzwXQwBYwHY0ASGAbiQX/O/yJAKAgEfsALuAMVkAMJEAIewAAMWJZm7SzJWlkza2T1rI7Vst2shu1kO7ho57Tbxrb+T/znSft/33J/PrhcLbdGz601c3uQ3F5OlmEhgAIc8Dn9SIGCq6jmKvtxHYSA3qAPiAUDwRCQCEaCsWAi+B7M4HpeCJaB1SAFbAY7wV5wEBwDp7nTXQE3wB3wEDwHuaAYlHLnbwSdQA9IAAAOSSBXyAcKhvpAcdBwaAw3txnQAugnaD3H7H3cRM9CGVA2dB96wc25FKqB2iAD58oYLIXVcCAcxeGRBE+AZ8ALOYQ2w3vgI/A5DrM78FM4D/4M18IdsAlmYQHiivgjEchAJAmZiMzk8F6LbEPSkBPIJeQG8gB5hRQjFUgz0oNQCIpKUU80CI1GB6Oj0EnoLHQJ+jO6Fd2LHkHPolfQm+hD9BVahJaitZyidKgNBSgfk2NqjnthWDQ2EEvARmHjsSnYTGwe5+srsbXYRmwrtgvbgx3g7pCj2B/Yaewclo5dxP7EMjglXsUy/z+ucr8yuKcXubdnOWYfx45gv3H8/pVbvxFbgy3HFmCzuJ2/xUZg8VytYMwLU2AE5kD1aAtaznX1DL2NXkaPc668Hl2Efo8mo/3QXqgMZZBuzq3zkHvciQ8iG5EFyHiO770QEWKB6+EC+B9ubqnwTxzHB8G9YAFsgCq4mV+DfodSOESGcwiJIBOoBC/BNfA7WMfxMwEEcQw0spXsC/Yae5jdwM5hk9kIVsU5bRvzkXnMXGEOMb8wC5kJzCAmmHFhAN1D19Dv6KfcPXue/p3eQa+lF9HT6HF0Ih1HR9KBtBetoiWcM6M0cDqddid3rf83KKfDyXLuyKPFtJLLCuSy4+gR9ATOLZfRG+m99En6Gv2QLqJraT2NMR5MNDOamctsZA4zfzOvmBrGxijYKPZbdhnno1fYV2w9x3BvjsGzOdWd57RYA5zAExrMKff/AFBLAwQUAAAACAAzf1NdT9fHlqUpAAA8KwAAIgAAAHNvdW5kL3dlYXBvbnMvbGlnaHRuaW5nL2xnX2h1bS53YXYNWlOYXMsabdu2MYgz4Y1tn9i2bdt2cuJMbE3snHAybGs3dtvuvvPVY9VTrfpq6R/Us1u3kmIIZFjHoV2nzlksoUAgEGjdkg2FQLrchEBgEApk8oTFEyh1Z9qgDsJH5m4RhXAQ+jY5FTaEeoCkR+3BeGgO4hpylIxjMYW7qZ/oefJHaj/sTfwq8SoBjjKOx2F+ZZ+lIngx1V2OjTtf2ZMt4TQQv2LVqNCqIsUwcS/ZB46Nh+PN4kxWT1Mg5Ajlx8KhxQBzFX2seLloIa8Jf1bBXvUL9lEZRvKRtZTHIKwRjSBIcL8ogwkXiOX8byQzJ0jKEn8Te0B25pviR0JWpN9gkpSrpIs5ZZ6XawsrSx/KaOFIWDvUDWhpelrsAvg8uhA859+dm5dq79d4Zc7VgbijNHrOQPevDvg8dneNZq7tj+aN4Yy2QN/HN8R80bbF0sI2GdSYemhrtRpzB8cn7SdnUydFN0S7R0vTvgfSVfXMZw0B+zptmQ0HNKxSaM7qNxgfeGYG0aFXINtx0xgy5XTtgyfcKfsObxOXLHAevJxs46/IVMXuubcHC3wTQ8WZA0h/pl1EDYuiD8S3xpwYHPZd9hEcjTlI6gZVEESIGZQe2DL2KEITfFvKaMpI2n0hg5Rlv8cmSUtEYymn+F2UMMpB0WVqb14p85j4R8FS6kHODYm26KAorjrCGioPcOMMlmwaj17vgGK7fBDneKFAeJbZl9aMs6NISz0hqVHSeIOVfSntqO0kStEa/jTKarmd+5I5l9sZlyGBzAmiKdh3eBvShxrAboBMQZahmxK3MdzYBFSdlyWbQX7gMFhtYi12YmZVZEC2lX91vKmnvu9ytp5PCnFFWjmEmVPB9emkeWe83LTNc9f0v+BCoMTbyrpGf0u72TPTMdPVDDxsZrqamZeDF93Zim1egVMN9K58bz4EDLZAq/4Dd1YfdvyqEFVMN181rtb4vKO8bGtvQ0NHTHemVmBqDxi8822PQ3n7MsDq+mj8EOvrPeq/bO8RmxkzpLLBSPxHOBl6GOvnz2enQGlhk684tw4Sg+7MdUBfjS/EWpC1yE54GWo35gCtdf4L2UEZx1hPGUurh3iADRDV+H6kanZrXmfOM8kFJoddTx4QP+VAhDelZ0UKxjrRHw6dqy6kcIZx+jHSPLFIo5hCdxa0LfzMFzMquUxhVeE+xTF1DW+4Kq10FtIF8wROblowp4An/K2cwNvBSzObEkfS9ontIoVkBfUwS0lLkF4K5/FraQ1xi/AO8nHsNeg99C4yEbU3hSB3S3xDCNFt4weSQ9JPg+uCoiglezbe2PePjx/QQhbn27ldocUZZ7J7vKtnUHRqXBn81zbd9tyUdS0HeA668ZAO6v3PPsRSW3Nc46wapmnnbg/+6xpZMaFys6GJ4ZN+tpFRYajoY51aO6fqpPmMab2hQrdA98v+zX67ZrH2i60U6BB44DKZfe7x1pb6Pn589K/tlO9hPG2/4KJbJzioibduU7rAv88xCdIYwszQgm1yM+DrEjNgPaJbYsboNuIy3PgEHLY4FYaexzenn6dBCLNJPWEdUAuJ35BjiSex1ei5xIaUz+Q1FCEhShBLRnBOMdurrIKzoiDjvuSSsER1VXGYDQgByXr1TflS+W36MPpLnkkB5/zhPqL3LaKyLcKR0gu8tfK5KpbsrnAMPaCexXSTx4n+ys5xdcwlpCCpp+ikNClhiZOYpsyb3AuC95RNjF3MtoQo5j35LHVObimMCn+cF0Fn4l34a2kSQYO+g+8KaZoGA/XRWEhz+JPI+sSgzKnceCcmGnBi3Ts8rkhjxy5TFyc8UN/PcO/0DNaNd422Vht22sqNS3w/DTTfBu93S1Ut02eueal9A8yp2A3ywBbO9rX7jJ0Asvuxy2sc7+ion2LOOW/Z2pramHbaRgAPnV0M0xwWG9P6r1Mf9gUbAdnQUvAeIIlsBddFG/pm29oFdmc2ufyRZvHJkdv5vbFAxBjunJieEqF2wjfFSajPkGHZC7FySltMPF+P1pL+BX6dpYWRWS8QFxApzHDSTUIfXBexmLoTO4TwSZyirKAmuYvJBkYHZo20I6ORjCmiSewFfK5d/kJ5jblFeJHzj2AlfTf7hLqH+l69K/SZ4gaChsKOCgZnFV1Nn6JqS5/BeiV7WnCRSlBbqQWSFqzZ4lVivOK7WM97K5mL3y5sTxiJusKC4tqyYPgJlLH5gcg3qI6Mm1gJtX96T6YRGZ9dgn2HdEYHYmzoeVFEIArvEtd4voRuQtvG2oXW5fTAZMfowEPbp5DaXW3HeJGhEmtL01rzaeMlzwAfYJcYppuW1xb6S5xEF9P2yAWpnOiqB/ys6mX7VYMGD1carBrwTO0kgOa8pJthueO+7d6nFdvMOo4PabhlnetWutYBD3yR0KEQTTfbkwPa2xqArQBUUuMoi/8BtiTKAVPSke0c6pkvD2x3dwgK8/GoMtQWcSi3GrcdAuCuZcQ4LXoFpDV9J/kyJZIHER9pCFoj1l3cF5YXt5vmYL3k3xKhiO15LyRfqSHeCzZA7aGyckWsYjamcKU4RV2kmsVuX/iuYAD/j2Qrs0eRitVI2E/UXIQSKYXH1WLFOuVJToFaXOxjnuIOotqoFPE9xSve/xQU0XTiv7K8/BWlH7WH6JvwIbGQd45D5OxiGJD7sPt4R8gxUlskippHbUUdgvZAdch9xxxAIuBH8nuwpdg10bcRFaTcVxmx5yrBQUmyOxa/Zv8v0CDNizWPsiPccNewK8CLrjJ3tS+yv7Et18wAjps92oXeEVaf/YIeapIAQfdEzxl9S8PJiteWuR6xvqZyljblqLKNMqE0dMMda5EW0FurhtbtHHJTXHuMDhc6+EGr1nzWxINCxw5wMjjE29m90jrV/zvGdV4IlnkGuicE7+RK0/C0PsSPKCPZ1NPcUFibwGH0YeRx7J3cyKwePxoL4M5iJxJXQbgQCLo+9h4eQ7iJboucjETRvmErUAzMT+xS7EtWBB8TdWZVC57zgjSvTMA0kuP0/eo/FFA9UNZYyRcQVb35SPlPaUa4mPVNNED9pfCH4Idsk/A43c46z33Lf1jUue4+V6tB+hyGSXCOPlfo41eSZjDQ0pdSEuG2dCyugnOOf5AVY3fkyuiL6QtI9fE+0hLEafwnXAnxMmV4FhMvSUxEH032T43J1aSGICVIeqCL/0t+RpIZe+46k2+RvB7eBdi9WcsLCzcYsmT9S0MIQwvL0IDRrdZ6DDf8x/2bayZbu/oHAT+1CNsu94zKvkC3imbGf019jWANs069rLdOccpNg1xHXWuqmd7W9ov6Nq4OJnRNuZWuRxkn2U9ofmnx9lvOQ75Ct9JCin6LdHXzvZt8T9wo//x0iXNjbpm3a/CtRxjUJMt9LeAm5P1AGXRKwpj4jhqVBBP9oSXZRphv+A6EUxQLfhR1Kmst1IBtyZnGF7L2EOaj5ooa0D7iUJJO+E60rUQSE0J7LngtLucUkb8LRNT+9FPURYIF4ncqtOQcf7LsmTJQ8LtwhEBZ7GLNKdjNachTCM3qSaz6HBR9bOE0pbOArxoveC+lFbxikSWHqK25E2gNyUkZQFVKX/OPEnLEbbgKEsgYiR3FWoM5xN4Iz2ZH4ZJYECvL0XHdk23zM+J/o4LktUjf7D+hTOQZFJ17DG3mPxl9CVkTrrVvcF5MDXBcTXkTT0C86wLww3TUVWwoCnzUm52rdC+c7z1ZW6nrtnWAhe1davlTMd9stL+u3FyT0TfSjwQvaa0VCrCB7XntW+1D8JmriUkFmp1L7ZNtZCDtHqfL175yffVVBdy+YWFkhOztC94MIJ0NghqT0rfSVy81z49I+WJTQoshHbwdfNf8lux45HuoGdUetSx3EDk+dzoLxm6jvmQaE0H0CVonyAQCErOQnIc9IJVij+IgVDqjN/YYoR8nI7EKHrFG8bYKzWwVV0OqllQx6yktSiI7zMKzPgrd9IUKX9FNtp+3j3Gbu6UAwqSJJPyuxd9Ytzh2xi7u0cLNknW8cmYjxVJ53QdDHSAPiRVkPnc75QNlnoLBIsghvPmS6fgQahnnFw7JcLOWUS+ibjHLITy4id4GOh9WgnwIb4NAQqZEwewVxKfoEEQ3DC+3H8XNFMHv+YaHB8XzgdYecaI7cDG60dbIVgnc8eHtcmCM4VigxtXWoA+19mF0ac+AmlGBXuYplgbuvW6dSWAfYTlpmQqesUhtw6tHup0WsJZSYa+iGc7Znbbt9jUOhuZhTTlQVtnHDZjg4DnXygAe7GLp7djgAX1mcHKwY0waamMqDQ8ExqUizkceuY+RLU1d8MyJ9MlXJKf7f2cI6WwKDSVm5iVPoLCwrbEPqJaYg9heqKf0G5AA3YbyorqTDCwxex5vE2oBqoQzmE1gthOEpMsIZGoz+g/+LSWGTmSUMNvQVsv3Ki2i+6xD8tvSpyxx4TWhSN5FpZWiC8tZnYu3FjwXtFL95u3mP+A9LP4rqFG8E45glAoQ0mLuB3Z7xVXhbMZp5STmRoWZgSQ9YXZjLqNjGH9Yr0g47h7ke04Gg2KdI1kxe2DXcSXZlhkq6hrFizsd52fH539F/0LfIZ9k/qQ7+I+EYn5J/EZ2Wdoc7RjYkyoD1gX6h1XuG/79oDcw0XXc/SUyyUrUIbyfXCPtE/2FupBVVbPGUlj13dTaNMsosvxy/DFkqp6btxqXVTr/Vmp3mHvZh9nwlf0rlpnPGdwOsnW9AWrubdkFtnTvMY9x9XU08LRxXtevBbb6Z3m6OYt8CwCMtZ91ZoqdvRMu9s1NPnJfiDDS5NjS+JfUf5AR0QEwTlibPp36kQ/jB5C3QUkkKvRhrjWiJR6LOwdVksfDN9HrowoZRNpZIkf8kjaG9UDylPhUNpM0VVQq7ybex6onH0vdwJbJXAV3hBsVBO4KdY3aLtrAzrCXik6It6sWCT+yziif85tzksXlwpeCacXfVCMLD4t7qBYIGrCKxFIFQbKH3YkxkHibd1G0Hj+dsJ42UNgV9YLVnX2dS4Nvoj3FHCE3Ir3BxqhIdC3pEe59eg88FD0OnYG6Eese7oJ5CZme1KaupL4km0Sr/GODvHTPLCvxOvPLtsvzNtwlbvS8Mu0NjAeRHoiTZkmDp83da8fqRhj6OgbpNjgTejWQNOvABjqahQ/QKt9bttgL9HDTatdaxyvNz6om+o1Ac9cV7Tm7wm30PDY3qDZVkWsGmXd6CmwyzxnzapvBtBLEmSqDy30H7Z3NfS1jIqOBZ167Y4AnG+kc2Outhe0J031wWCm8NJ3JH4jNi8kT23NhbC3iH9z6fBVhGqId1Zr/Ti/DXIM9xe/EbEQ1og9k7KAtQvchLsFSRSdpqwhvBXNFdFGtrCl1Ge22qKNUKO8kFhaOlx2T+YUSyQ6OgtVINZhxU04oHlVkUJ7g3VUARWQGgf+A0UZYzfhCfSlQ8VayKUqHSK4ukS0lXlccl2wgHOcUUbfib7O5GLXwCkVNuEYbyxpGKUGJsePhWPwr/EnIbqQnvwzWgiwi3iOGML2TJ/LHgy1izuSDjBnyJj84CU99c7iT091YYBLQ3F1rGRcY6h/syYVILnGQrX9hmqrtHwrYKsyEYIX7Re25qvfa05be7ne1GO83nUr7yMMx9TCPrm1UMciaMv2uDXocmm36L7b3un0OsXuWt6GzgWGoZaCuoW2cYYnnrm6Y3+L3areY2vgWx5qFXvuX+CIxZWw0UJzo5vkTrtP5EGu2OL06NR5G9/5OE9KuXGnuDfxzqidyea45TF3HOHMwz5Bj6b+zs3Ibsf+jhAkqQne8k2fiaig5VHf8ceJu8REelQ6KdvF/cw9JqiQd1Fd5lZzJ9KQcKn8r+c0dxKiW1TC9fLzsTnFAGmb+4AznXuAfLsYJ1nBGyNfUYVTB+yXHFl3iP2D1p7RXaBhv5OepIepn7lFab+FRVjfuKhadGaAJacOo3YSr0S/IO2GllIuEBfhG+CPwZvSRMBJeiMTH9Yk52CHxi7jy9G5MDTySC6fWhwp83hQ8M8fLD1/w7k32912yNQ+4TJ8ix4HhwKXIhvAaf0dTU98ay2njVi3ed8k7xmuvflLj85bUrnCPc8Jc4wwPLAxgMwDWbDHXaGvAP1pB1SPLxKqIq9R0zGEA1L4u7kVesaGnscywxfPZM8Q/w/8i8MVb4WjtvBsb7Blbh3x5oMBuARqGvKF26d0ReSjnxvkbZQ+Fm6Ye+VGhexhXZgIqhCrLbYd8idkyHtwdwiDaWPhqcmNsKWMBIkt6yMTREuxVpMX0CGogaYzoGrmI01uIFVqICm5YyOXs47SQyJj9xR/lqxW3WesKN8luFPyV/OTtZjwumMJLcBvwzwsiinWKb3SDpLlkkaon10b1i+UMm+KaHCrJiLqpMqqt3BX8UtY15lnGPn5X1jZMZy4Z94zdil2f/pNAQZyFuOi9aMcYVVRv/jC1itCb6kSNwhqzVZB8JBGZBiHkSGhD/jxyaLJHsLl3UWRiTBNrG55qo6dsvoN+cXSbcbtzoSMcfuUwus7Y6lu1+hnGye5hegkwx7SqepsLCg7UvdG9qjHUKvSTQVflXOBC7WrjJQ3ENNrdBVR6Ep5SXVsz2/7as9bXxtdCV6Xb5h/kXh344QGAYu8dIGF4oL9hdvlfOfZ439kvpWYFJN7m3l5BYcLmQsWbxgZEXsM3+JvCIqGTAQ38Xkyb242ZQugL4WCXJVpTS2C7oJvJr3KyPIRIgN3iHSLJkFwcQHjB2YgbIe0gbMI7Ia8RlxEXEc8r3fJ3VJPyM+u/gpaFEkVGcEJCKtqjiona8/zCxbwvogPc5+zr9D7srQK/aDC7iN+K+aT4oTwnui1cxvqmPiT4JJzKWiO/oOou68SDK1vxlkqP4aYKqkla0mBMlnyfGKf9h+/NeE+fAvkNn48awxhGO0UooZYkELk2yRuQzvmy/O+cGqVONIcuCo6NYDxR6DvfOk9/EHBMTZki9YHGgSO2eiDacswucuIMm8DFoEd32tfCUa65qvnj/GDdbO3rQXpf6O57b3v6ms8Zm1durW5c9U8lzd7ckq5Uml/aX7qtTqfOUbkUpBsdIM79onJ1rd3Es3S0YgCj65NHqY1oLzjUYG3oQ5QRpiQbRxWhM86owx0p8/5Jdcvt8/bKuOuSwUapSf6XqPewv6k49D/c2fSW5NP4VMJ4+P8oWzEW6i3MMRyaXMFaQbgAa4lm4mK8D+jGggOiTpj+zCi+O3Epvox8jf5dcYBmo69kUXgP61ItM/MaG5RYaZcFU4UvxHOkx9UG6W5FiUQhXEXXKcpVo4o2czMFE0UMVU2BUb6beYfXjj6f24a5Xj5R9JDeUXRP2pSHJU5kHOC4xE9Ym5jXGXqahz60zg9ZqWF6a2aedA9xn/Ye8pysxJ2Ht4fQUf9kjyVP466Ghuf4kSAc6wG8nXPxADNxMmEObPCdzLyJfQp1BJqZ35qGm0aHPIZSC8kGWPcHj7mHWUsMsJoZtXVBppVsPORprW3uKba1tXep2Kat0Y//+xhUG/81X9XuqpDa7+tjtlu1TsMsbR/DEmN7DdswrRpj2mDf7sF7SeElofnBnZa2kYeWeYbGYHOr1XYiftf/wTs/fNJd4sqkJO7KxLy4Kmf0EaGkzMs6FzkCzosaiWZs70wXXDfCyMz/cq/hSqoE8YK+hShE9kG9hvek6nlknkQyBXOe2VuUFlzlppitaQvJRsZAzhPaOLJHMVr8QM7n7WC4BL34ZAaLa2G0kDoE12TXeM8Kivnziv2iYtnHwh+cxWqcmCXCc/bIDzKfcn/LRlBCqn6kNLm3fKykknZKMlRURHvE2SOYzL7OmYj18S6z3qD6Y98QudDllL7YYvo+yEfYF/xjDDJBTR+BHE3NwSXiNvTmzEAU0U/OnINl3Z/zM1L33Q1TuESJE+JeBlwMp4K/vVOMHrPVfxQca7pjPevA+P01KIMXGG/oZFhpbQTigIx9pLmtrbH2gqfI/duMrn1iaeshWvLAKrPH0wkcX7WzaomXbbpeedU5w9UdnF9dbiw3yi2XbeesjzyQ4MfwYfst86cgHTQD95KPnRu9PIADYt3w8LW83C30FSR2ereE2qfqJUem+Wht+BV8EHFHdi/EgDkJ/x95FnklYSTSSYaTvJRiKhW/FH6NmUS/JiBxj4R6rk14g9iNFGWUybuqDsm6y3+KWtB4nN3CoWKEEC/aUrSJI2EW8wqLKlg2USnHoH7B6KhoTd8vXsnR8voW9y7eKvtMzVEn1SW1o6VIqpNbSv1HeUC6lw2h9xKMJ3oknVk/xO/IWcwIwRfaEuz/iNc5g8m92Hz8LWIj/AHYdQIb0YhKygpgFJQlewCHCGNT8sjn7DAYJR73T88XJkZHhNmvqf/Zv9pPxW/GTyYSiYC5p/djeK3hfni6N2Fpazyn3695ZoBooh6UZa4lojdpbO6Zxqm6FlaXaba1nvaidq15c9VE96daqn6tqal2B5ipvW4c6jHb5/sWeex2inaivSpAcg4F1J7Z4JdwN/dHf2snKTLKdNf93dsAmJDQOwa6G4RXu6Y5NqbuBt8msVEuZCr0NLxRqCzDCu9B7YKdwqUTPVNm0gT0WISQ2owkRG5h0lDjYTtZv7hd6QTsf5zRhJ3kMsxPrpDwg3+fUUhsT7NwZvHQ0jJBWxVF9D9WniaT+vnblMFCa/FYzs7ioYzz0sv8StFb4aR6HrVfEmKXC+eqJ8hu8O1FSd4N7sGCMazvjIvKOOsMlSNcTILJUcS79By7Bz1Cu4s/KA6RTjBE3Du4e/DfBBQrgZAi96PbwNqhOcib2Xekw/nRuMPwn9BF8HS8ZzyIhCJmZz7nbrpL/A0gh3Jr7AzgHjjLS49FnW9NyGgx8Dl8PXBHd8gmAM75j/gMToWVBxyzdzAN1S+uumqF6ls5j7tLHG80qcqets/WFlpjza/aassiTcbUo1ZpbWN8XLvf26uK4h7rXWPvak56IX6vd0UAG+7omB7548kbM9amAMmPTtKAAR5+tCz83LEoddgZS8/23gxvjoW8TYMl4Tl1GUoMhcBJ089g44hNyGTy7Pwq+NX8JyKUwKe1Jb9m/EESmCmyWFhGesEfSZuJ11Bb0JsyRolfk+aT9LKV1JQszxku3s3cpBYpmfLvyvOyS5xiuU5mk9sLl3P/MnGKLYXvuH4Zn0uq94kzj80WbuOIuZGCrlS0qImCqZzBwNe1dFGSiThPLqa+IU/CT6OzeG25q+mPeWZcNauC8oIyG9mQfgNhIHSpk1U5JB3ZBHMV1hoazt4ienFxyGEEOi/LHovsgjrdd1L1/K9cH3xX3I+Bt7aNqemOh7Zl8QsxYeyMeZ6j2rXQX6VdqVtrnONZoRXqQ9Yf1WdAnPGKabRNDuwDwYrnoEH/T9V5wFkbMtU6r9QMr5I5elZvMfyovaM/6J5U81F/3hgGVnpb1ywDPtmGOCG2OXUuyGoTG7zebrHN0Uf+XcBNj86xJIpzNnQjsyhI67w+kodeDY5MydMMtAvlC0yFDUuMQG3CNY13Jd6GW6DfqKl0c5KQeho/DxEmIeHbObN5Ufhq9FCiVCwW9Ce1w4/jo6RhyXfZZF4HzmPJcPIQNYPWUFEmb6GCy92CUYKl0o3ct6wPBcvVv6Sd+TpZgfypuFgOp2+WNpP8w4DyTZwy2jfZa+EbRppSLfpX1I+Fkc6kDyfsowF8EyPMPCgg89uQv5D85CvkxyQy9gKSgmwHKcWsRwdwM2APCBNyX7B3kb/S7mQT1FAMM2pGd0NzkcvSz1NxDy7+Pafy/OvoFOmc/Olal1zlLfY1i0zyW8Pzoy+8A+13PCdd94Afxl2ur96ndXz4wXfX6fXMBiyW3fpU9SfTNOA6EPj76m89Z0532HEWfOe4YiC5m2q7G19WDat9D/bxbfbqTP/atoP/OdGOEvsV31wdw6MJkJ2TgFtgW3t3myzO8wy1SsDhidLYezfGc81rjLfJP/L40nfC4vgveGkumVuAOxd9GJXm7pI8lH20O+nvhFrCJ/Y+NJ9xgNySPYBt5r9iihjlzNesMG4GrjdvI74Vebb0h+wsp1ixlrNXXE4+ob7B2S3fXEcS5wpqi/1sLz0hX8H8JH3IOsxqrDgtG1PvA51S2JaZYyiKOjFFvAVKg3gbbTF1qqQfYyJ/J2UprbPyLKGc85X8lIblrmHdZ41FWwSDKTTqF+4NJgTJpCuInbODkFyiC9U88yszEf8CxU3+yQOxenFqrkvQH1fFpyAuZj4mWe5xLrxzZlyWkrpLEgrrHXuRo39oGtAokDGxPTXe9RaOozK4GmwImnwLnDw/2tGqVmc7rmcZnhnFziEej+YrMN/Q2HnBUW7+aKq1IswrjDlnX1OxSaK3g9vAAl0fx1IjJLBXP9nd0dLB1NTxBRgNPHW4QHhoU8AWfmBt5XI6hte9b2bsQxqMauLdMk3zjsTXYEP/VkRJkgT7lnclWqP7p87kfmF1pOfZFogBueakychdkASzE7URBUdgcI/wnYIZrNnCnOS+9DTlkXwpdwwHpeosHCxoJBBJ/1Fn6QUFc0S3ZLvZpaJpqg+M+4KEsFRQzB1Lb8Dvp4KKZnK+cfsr9OIYo4KzW3VLglHgCucJAc5EUS3nJfWI9IH8J2sZSy4LMPVUJmkl+z7zE/cJfQX8IFZAIDBX0dJwPhkLh5L+gbZBb4UtyT0ntkvcy07M1IecQb4LVPma+h4FVNmvaavvCORyvLPjlLMP8MD521U/9dqxOXjWbwx3j85z6U0ox1cHLNDXWN/Q0LXNdN9R7mwHPnIu0aorp2pmWQTa2Q6J9ie4r1rquuD56TkCXna3tfG9vbSHDWucErBzbW9gqLdNTSujUbNP49aq/UndO9c63U7T8gjF8sRxMY4PDANuprHRWaGMo3P0bnJHaDFYnN0Yu5bY6PNlPVBC8CCqe3YR7CpSnB+GvoPbT6lEXSZvg+lox5g7SR8xnyhQ9nl8FwIBxaUsJOYpJTyPwM65JPFL/2HUTSzIOJxvtAmKf2mj1D1otwp+F2Tpq8Vf5L+ElVwM3SzYyzSqH9ETsuOMkBgieVVoZH3lkcXvZf/yJ4py8p6C1pRynpfVhr+Tt4H9iXEUfx53k12Puoi6jErljeG9IgwQjOe9QUvJIPUQbldOQltL/YJfkF5ONiVHEKozdkLn3KDwwmSnxPjw8ciYxC7YFPei1LZEIHYxyw91SzdyHY5e8d+L7o/1imlC7wx+T422tfu1s77f5HnkfWsf775n2uycojnrg4EnvAcs8YqFjp61SywXbYVVDz3tzdsth92/AZ/DBuy07NVX1uQdztqPhpPVTTyC2nh1TtNV981XpMUBh4LPXIf9rgDRm/S+AGSJSEiYXOgo8fVMNMs+TRwP/kqqPEFozt8EvhvxKjwRfxdbBUEQmpO/IwbiCmmXso/R9/IrsXchYwlnoMtx/9Ha04qJMspL8S0Sir2cX18sIf0g5/iLiBbGb45dNkkS5kyif2ZKhBzlnMKc6pd8tOIJ46xwn5qhkqiWc9uIIfVSksdFf2gzZccKWyqErEn0pkWl7P0SNbNGfZntpPWnfFUOlp0T2EVF/N3Cp+QfYj++WDioLgeowb6jcKHTuJMpE5GPYc9oowldSFXQ86g2KBB6B/kzMh0xFQWJPYEtgPYKXMz2SfSJ84KuQEH2MngkQnDPiE9KjLG197Aje0KLrJP8Sds9V2fdZNsImxecb7njxPgFtU0M7wCWfqnrtem5DaHZ7t7rsTr/aBpX7q0p/zvH8dg4zpjWTQeP2rCahbrTnoaGjcBE+0HthZojvqNabe0ME9o9321xnXMdAv8zN3e/s4acjFBDsNjx1zk1w4v8TZvcW3PbUokUC3kI9ihxI/w7xsbNjU6HtMIi4MNwzUlqKAw6G2/IXiAA1JmUSnor7CNaV8YigVfoxc8TTGQfoH0hoAid2RDFUn5QuFrZlzNIMpvbX2qQrOT3lvaVnZR1UQ2TnGPHC2jFP1gx5egivPAJpwmvs4petIP5Tb63UMnVymbw9qj6Fm5X7hLtUDhEO9j7aUGFgriU1JQgIQzDthXtFUkZUHwM34NkRqVIEDyO+YUqIDXIjMDi4CfQLRMR3EbI2WxVYlOyX6pNxOHfHxqT9CYr/OeTTSJDowNc+uiU0KFIT0vcNiG821gJZMG9sRaGW6bNrssWi6/MgtbHDdFq0EDx2a0vdLLKH5VXnAr9GNs00+Pai9U3raVWp/2PuXvV24oBpkP6OWB57XHbEf0VzRrzeO94/UOnQDPTtb1WqlkQTgVGhZMRTGicc338kX042MjfILDQLQrzE4t9PM+1VD/oS8+i8LaAHrYe0j53KDkidCSdRvVMpxLD8acIq7EdiV0Q/VBEdIDRG8NF7IMXwd2Eam4BDk0DRdOFIXEbznR+G9oayTL6ANmruv7+NzdO5avf83qLXnHsiveC8ZK+9L1SZuHKIko9nqBSuk38lNFJjVXPF+xTlDAO85jiGLdaOkHUXT5A+UZ0TjBMOUh5X+gWljFhYgZRjAP4E3nXsSGmjgejXqSvg21jXcUfhI9grICiMTYEmP2QO5hYC/tG2EmYl3YmYnBBvG8qHvMEYoiXkBfe98l6idHBo3FmZhp4OFJju+tPh8XejUC3EMHhB9Ceh163t6tul+aZq8B4RLsMOFF9SXPWs8J9znXK0F2TNGxwDdeMAE55IjWtaqb+VWn0eifoAc5Xf3AmdBH7suo3uk5Wmf+JuRT86r7pPuB8Zl5iPBq2hH6BA11X/XH7aHAlGLAX+RpEB7sGx2qdAzIHYJvCn2Lm3FvfU78u+TU8CNYtzSQsgmSIy5GT0GSYCvcNgsjzCRnc1/wg7BbCRHh7ioZzktSXmMVtoO4XswT3CFLCCPEL0XrWN1ojZZlqtAirVsrb8LeJVwj30ovVXTgB0YwigWqOch2vQnZBNbp4rHA4v2XRGPXNgt1KleoUZzqnmk9khdVvC1zqBXKieDJrIXkE+4r4LPUvGUZ4wFeRO2EWsRrSTmGchBTpJl2AWYpmU6rRF/JvqU0pMzJdyJNg3ZJl2WHQz7AKTGFmTnJO7Eus1LM6uwaURv/JPM3oXY5E72g8NMB+MDbfwzH3czodO6xSsMQ03IL22MF+/iWgvkrvRri/AwFNqHq197IdZ69X20Zb4bgCVFmu2/5nblQhMBoM16ojnmFulI5Qm9EoDC/rMCkzwd0kzVa71WuzKY3XvPuN6809jd29/Ajav8A6yPUsbgzM8/1JT4vvjer8/wueiOJzw9INs0ty3dFTs1tjAKZeBg+pj8KmjsOvI40EBnw+4y2snKZh12COcoeTN/AtLDqjMV7HCIh+kTSMpaLH0u2cUSwrhSlaLXrAuSTm0jdQpTIU75loQPFgupNxRiCv95BXy1qv3C6IST3CMwWdCuy0MwV/xQdVNnXzwq+KJ+JrlNkUq3A+fx2fylzPucn/TjxNUpO7MzBSCY+LHsG8RJYRrKQA9F9WkvgvBUtswdoG6w6fms2QxhLD6XEJAfE4DpL3p+nxdqFdiVMBMNTRj48U5MOpe7Fdnlt2beo9uNV+JLzSNMwywzgztjjwwb1L3ys4SF/mIhgaabu7Wbo5+memlpbHNXT3HdNTh1QzyLCs+pKWXX3N/MZdYuRWGq04xxTtCe3Omg91HSXfu8J1wU22qOwVVo9trGGAoRX4yhDR74wWuteHWoDrg2ts94FNtqq03k+LkPzqzLNsWfhvCuWbGjuW5wUvwdan3qc6ZXui36YQ2JIUKz8ECUO+J/MZTxkdUFdQ4zizmb0Qz0gVCAG2GbOK/447gLtD0oNn42UIr3mvOIukKY6PvEZIZZyVAPQH7LQKJu9edEnZq+g/6SPuQuU68UjRCo6IM1tdzBygvFL4V9qOvYe3XDifc59ZJtjCr6zT3tNZMul77mLaYCqScI4+gA7nhfF4ko79P9EfwW/GRdRSBpzjJ+qQe3Be4hDIVDqzbqIxihtLtBKmpv/gRiOv5bDBiQhJtHsCFzqd6J0hural29pnp7muK+Gvgd5WcvSldyb41z7HzbLO133y64LrvKM1vQKXzFEr0tPION21TXvM0Ai8ZJ1oOA+cr1rsrCMXj9AkNkmBjsaPwGLtaq0UcFdJrF/NGytz5ua2Vd7Zvn8NJwypmj62QXU2Y5dvrbuZ4VfoTGyWe6q5wPra0cq+N/3JS8j9Cu5Ldw2c9uyCi8PElCd7L06IIEP/B1BLAwQUAAAACAAzf1Nd0fYOMJINAAD0DQAAJQAAAHNvdW5kL3dlYXBvbnMvbWFjaGluZWd1bi9tYWNoZ2YxYi53YXYNV1dUVIcCvH3v9kJZykqTLkXEEmtsWLE/sRIlKogSYuGp2GNvQXnqU0QRI77YEoMNsTcQlCa9iIC0ZYFdtt62997nmd85c+bMx8yZhTOnTeuTAsCSSTFR8b+keCkAAAC/wycGAKbeBQAIUABr41Liir5zIuQpAfuWTwh5kMdOiR35xySV/ILoQWQCva3ebcy0oFpbDtXnLA9K7D40LXGLyGhaFy1GdRsMxvVH1f4bnjuUmZcF4+A03zP+KXrSdsEwauPjtv0JR8d+1pFBf014BW74sCtYWpJSltxIN9ePDxmRM6y7o/RR9ojXmaLcf4o/tVnl47U1pi7Blm//6kg8l10x+Zj26byW9vc9r9fkDupJUXjmnc8/WNisjfu9sPLI89WWkDTfT7EmLugnVRWNu8R637S+8VrBS8PvhUtcayaulmcTyyb/b+6sioHeeNOziRGDZFM2NleHVnh5hIWMvjKl3gVL7JiTGVSdkuU9Z64anTh1xqaA5bkR6W7/Mc+fX4r6h8+M3NIT09k1bLWbRBqhyfHSzt3BmzWzh1YMaWDiPAI7LgyNx56M57zmOt8Y9oDY0x6g/Fh9W5/QeKXsSOMExll5nTzRdKF5DZH8x41m+qL9TGZ29R+xf/5+3kWRlLUh31Ya9TLDVPP5b01R096mloYYUdaNzEKyfg85xJBY7awbJet3Lh7WRN0Nml6W8OPBFrJyqcvNoEuyrZqQRY9FvvMs4WzkrtinTmeH1tl83DeA6xw0sUxM2coJS03h8fPy45avb9agkM4vevzxQbBu5LT9wBT33z16uS/ynKmrsK/fZnjElY7qq3Gd0LjLZFV8GBbQkl9Wpt1EnmYK8yfR2pfws5nOujvKpjvVP1T5P6vM7Xs1plff9eJ+SsEC3Zmyya2qjlkf4qp2NrCAGOt6vlA87v07zLFod26sdnZD6buqEsaprl9G1iiNJe/MH+lEsy+zZdCqqrD+90blpEXmyG8CqmrSyimEg2T+OJM8ZBtaObt8psLnDn1/6f2wnqlt3uHULM/6uf6+ECzXXFHUqI8wopDYBa8kIeHuQ6P02fznkfcHjw3okho60nCfUDd1YVXV583YBHp958Gu2G7W+a0hzNWUv1o1Uof3HJaPK10kOsQPtaX2Xym9atracLKCEw9pvWX4uybRhtnxDpu5rqnq2S1Khe7sPlbc9XyPvLwk7ktqUxoX5Mi4FCgqiXoGcZ+o7zP9Zc9TLFYd9JurmD1wqq88vEX7D75FdNnnofBPJA0JskwJTRtHgU6zirwcnP3x/YHW6bdnDB/cJIZmuY+biSxXJEdNU84LO6xUB/SLtFhVgE9/dXCC+fjgqG7cf7+Lu09mEIs7fzltX4aM9aG/rZBPbGrU56mFxYO/TDLE9mT1uZq2NfyDuJSPeu7d4tPGaFUVjXq/t1l4YH9RXXRjM9NuVr4tYt5Yyt+O50Rf+fd+tQ9UntWM6K52y6Dx/b5V5djm1mdtqfJhVGrwgCKJMwClIWM78oclBJf6ugd+dHBxJD39Q4UysSlyeEFwi7d5/EqPmrCHqovYY2GRJw3DoY0jSK6EWTcuXf1fWZSXHPIbUTI4WkHb70srvT6rMxxy8XFBFYMS/SXeROu/B07jh9hMNk+rcptX/2unf+OKLm9LP58NNjRTTUOBk2BEd1NfTJdj7YcPoQU/4Du+DO8fail+t634KPQzmQd/KG+CQsptEvPAcWlJ3XzHBfL/ki0GsS3/64qeQFGtiPO437WUO6E6KhfTtb05kpC+U5oVtt+s170b/J/ACtzfeVlAufUGkWqN1ii4v4YPGrxewCOZQydGnCBShS/oWOlI+ztlHH/NZ6bbWBeh/3XgoKzZJGQL2cOKtJ7N1lHaeOUudSCTpEtsyW52gEgiWpsi7mUcOGekvjej7jie2ZUGVDI7yia1hNKrvsUY5STfc063mfGp300j6OSBUHaa1tZ2oX0n1mM+bnZBq3Qm0Qou1lTN1SA3bNuBREiDHmZOmOa408xe8yiFDUjrC6WaHDq9LisDAt3grfY7tjblJbpeXBX4ctBZtyHyv0J41QvUSz4/MMNDDTwOmyi1DDKG1rq80aTzS112YLma01Cp33UyafBUy3hqhIuXw3tNmMjbeJZo1x4zjcKU5lCiU+slZiyo4HjrLVtdZ+WXTXCUIAef3n7Z6th8htIQaXxJ7ZO6VYDGktg2uneOqWjgtP6JMaYVaDJ3L7bt0j1jYjHFN09bO+ZmTuRPc2varjLBuvwekC6kH6IzTFGS9RJCRDGrB0qBZdYM8CyZJnzkOl193pPhXF2/8FOdb/l+CQyW/+bt6+on3Yj/Jo2Xlat/Bjf6z/fe6bdIo/LTy9qJKGk4EsoNcykT7URvgMvkHfptA9UqKTBCOBfc3rueHwUWyFdJn9FPdaN1deQ3ADHv7DzCeepgpqBH83WsztDFNR1jDnUPRmN62pEU9M73uevE5toXcouo5WaD1dNW/u2zALLJjJvQEMaz94BoMqLovSAEuXRyAU4bUWYJl65PsulRL+wySgt24wYUHWS2tctkYJjksZNGcMpZKGn3zmZLRJHOnQ6paJIgVrNTmUOvRVfL74hqmMselex7xVTJfXyKW4n6s/QpWcBtcsx32ioAgCjFVsbIENRPujp0lZaDVlj9eoL6nfSd+mQtCsh0DaAH0Aqr+jYiXkiFZWDgsfEEdxFSDlS1j2zdZ03orbBF0yMs82ADD/XH9FwzLCH68Nlonv0i8goR6OtEGf3zGRn9H5ihHinOkGrkqeNu/o3DYkk9mMTdUJ9QdQmq7I2ODxViwUJsgWgEcEywiImBxJqfNLmCZnGaS4hzn/KM7InjWHs2sEvaq3wi2Aui6gXkEW6cdCR6BW8R53A0MhlLl2+SLWDOEy24lZWLCthgG4vcJZPYF6SRP2loAP/Uu5miSfdeZQ/Np/VtNRaa7vW+BFL7v3RbzGdoQc9hK2YKJNcazhGbka39e0xjeu4yN/vd9BngDOJ/2Db8CveO8jVvH9guDRLHW1cyB4m58jdEuex3xI+WU0FKUHGQHeXMOY12ADEMJFxmqHHWIC5WtLoEOTmIj0l3OyWpPKDZmIvoldNivEZ10x4m26f6laXkw9ka5gookamEVxWvLevM86ku0XmwmBARvfBYcjb1iLxtnYYc5O71SYxhYIM9wWSwQcg521LgH9iZcel9PPCSWW4JhJv1u5kh+hnIKf17sKePpryAD1QcP54PZg9ZjOhwhOA2m+IB3rgEHC15Yl8vLrdmicwIBY0Fz1KZwJ/CRviEsNuugisFDnAmeMqO2H3kPypdFcmO51EFlqI4LUFEGUgkGOb0MzhH4Q+PEyRLD4jU7BD0D3ASNJs9Io+Q7RGuAibzl74n0MSOAuu4ROoTvlhw3agUbgCn26/DVWALkGNwI71REvLh3urHGK6BRiJxYCNfSsWZg8zhUEffZqrIXkJ4wu6G0fwl+iWnpaQDY4y/2E5BBkMElmV/yAPsdCTCGs3akMfWubYAttEqEz0SA8g21gtJgbJFNXy9vZkuRD6yOZKn6D17GZvB3gGclFclyeKF2CTQQejAqfFudKakQhoMlwAXJLnybcwmQRTQw/wi+iSwiL/aM8Hp7A00QdRHnRP9iqiICNsjZiF3Dk4h3ezVdoV1JXTBmEkvA36kJrO1QJxxDYcZT/L/JtXWGBth2DkgtXzmi+jpYD2UQScMTLLmm47zdjCA0NjjbbPZ+8g5aIZlDPOSAcEcUM6EshPgGwI1hQpiRVZqKuuG/YA1oUPQ64I9cCUTLp0Nr5RdEGyXrZedQVfhT+WbwQxspewDm8KO4EZKI9kw9qO4S9SNP5XeFGShzbi75BgL4BpEx9VBqehwDPju25l9KfAkzrG3gUA4yxpG9YL7uKukij1A+Zu7LdchPXOWpowmSzz1hl1AJZGHKJq6x6dZrOaHxDmzF5FKT+SGsFmQnIwlG9g0eCKxm7kLJrNT2WQmk/GxDcfMdDC3lIlAAXAOfhLcgOdB15gyYBE6UXQUaABRvBEDxFGSdxwpzkYxQbIwAfoo9MV+Bi4hQ4RxkhRBDHRLuJGbIilDffF9WDT8L7sHzgNSLAqYJ9Tgy9FEJBK9CFgAjK/mxiJFrI54x6dTe2kllc7ctjrAFtoTPsSt4dKtgfaj9pPAC+snLh3M5n/ht3AIHUm40hCw1L7Jtpf3AUssG4AxZCYjsR23TqE2w1Ymi0iCtyH1dK49D62l18E6dhO7F3nFH4TisAL4IrMQ9gbikdfCa4hWEA5fFb1EC9GT/DDhGnwNWIx+RVqFFwVr0Xmi09AiQTIeBL0WrgXD+DaUhl2RB+wa8Cx/Dl/G9bOzMG9BAWNEo6F74HIwCXbhCsih9ou8nsiHXxCvyFBqLeAJGVkjlUaqyadcP1/JZlo/klft1cAyWyqVzI2hNfbHtiKil/qJ6KR4tpi5avMhmyEV7Ect5Guh+dxw5h3UbN/PaKHJ319WK5sEODIm/pYd+K6VjnVxUiQXmAH7A195gJvPNWNb+ETuFSQG7chXfDcfxk8DNvJ9aB58AHbEXHkaT0VXYSMFwfx98MD3fliCiAUdgIQrByKh4dxj4BqwE05gdvD+9sNAP7vSPph5QW6m/w9QSwMEFAAAAAgAM39TXVFyuPkaKwAA9iwAACIAAABzb3VuZC93ZWFwb25zL3Nob3RndW4vc3Nob3RmMWIud2F2FZl1VFVLG8Z379NBN0iIQYgggoENGNiCF6/Yiu21G+Neu7ioKKjYesVWxEYFEUFKEESkm8PhHE7u3h/fmv+m1qz3nZnn+c3MnBge3u0DADFjoicsX7vZTQEAANhb3KMBYPx9AIAABbB00eZF+b19Rk+71VMdlfrVE56Xu2DuueLypjfUpw2zxk5uTOgZv35CxN28g1rCYtFfcv7799cbaozr15+L7Bf5yKgzvILReD7Bhr2whE/4KZw19dJqqf9D1T4Nn3CnZ+jCjZOHW49xnUGciti/12a4nYPB0WW5t8fuwJOj7db9mCEdcmMAn1C4fYN828IjI77Pfsl5eA4d8qK3jk+YRRnrLf7iQa8fuDosJiRy1Byy/6URJUv7lzRvObV0bI7YeMX3xzCH4UPHhuSK58dD/ewvpXvMnd4vwHrGg2TbhT9qwjdcnOgT3T079El2Yvr5nBzLdRk1/XZf+Pq6wupxdn+3VqILJK6A+4KL7MCauyvlh3QrnA+8+/j2yf77d64ocvnZj1+VgfvQ3MOJ4L55n8F94L7ID+C+C8VT3gdcO1y45W9w3ywc3Bf9JfHlX4X1hv+3G8+C+wacAPelJX3uXpsiMkNScB/8T+Q/uadKiAUn95ir6wZde2xbK6hpcPadkSd4dmlgQIeu85+RdbodlnGdm2yacyrHBfh5/agLXtWf/urvPt0ZMp9+1jOMnLTEpstS1GpXnD7gQv5CyTj1SOvxVYZqQf9Mk381Yhi76LFbbEhpo4Xx8cqc1hRf1uuMe3SX2wQ+YXNbtCR+x26XPRvSth/3PRLNJzzD+ARpFJ/AEsKZEydF+vw/0g92L3W87sQndLv5Ex93/zV4ld8kp5UWWcvat7U6NP+xKmZrx4nYUA7Z8ddWIf1tnSxqQEjEWNXm/hYJq4vjpeDvmTPmRnZuC3mXv2uJrOkpsxF5w1rFbqVWhYcFpQOrumyyEnQjfi571lcJeo1DDhduLnJ16BxwOOV8qokb21nTb6vtvNNpDaO/HSZLHYSnnz1AS97JYz+ZrreqJVYLH8UcP6VLTrr5z6crxcfHXSFvVygSvoaqHl+bK1fcucHJkPHljTdf4OGChlbFkby6C6iRsn3zb8/Syyc/rhQdOjTlSn51Qwfz4sD7S2jzOb7w3rW7L384fLjm49BIqc6ZChZbaZnmt0kPXntnvHT1y+q+9HBOxX7/PvYXufduoR/n4G+16rLnoW/G+wFxmRP4VO6XZJ8+W+w9c0y2tahf7C51y8/WOCem7o824VJH/xnNhiF9AyyzR6TxF0eoDXvCinvWNN+aGoFlL7ntvKf9gvqjFpqQOjB+LDPmyJxsnz+GXPVwhN/EhEeFjhrO8AkLNw6I++0YNdzPdc5Iw+KvkI/uzcjX2pdRn3fxCSum9t34xtt25LGVe4MO/vHZ8s6SLKnDsNOe0ROf8FNnv+wTtth3GdBTNr+6eqzifeRTuG9TBBIlM1Sk+/3XPMy1sPVD9+b2vj+tBmPWP8hFIUGWmZ9Ay+r2i0GVOrjkwlNdtmMV8kL7+f3XJdi8tthXhhoMuF1ElLlmpX16kbogeec17tntGz8KuAtn7v5ryLt+/NWtl0Mf/i2Yfc/5bGHLI8mV1kZx4sVFD4b+XahZj6x+OF914+TQaxsB8MLw413lh8+NOzyX31EZq0p4vD0Fu9D874SO7LtxaOn9Pk/CGkEZIEuDK5/K6x8+2VGVbZ7iAOb55A2/cS6r3PEfq9oXS+UnIAt84ae7/a8IcttL/ecWVb8zVVwrKGgfYnsL31EwtSixKhYCikLcR0+KddFF3Ser7WP428YF4jGyntrvZMaMaYu3QN+WzQ0vC+XFGxeWDpkkLDa5j/SKetsnfWXIJGrtftp5psk53JzgsmJ0gX2KlTmcp+HwJ2uIgPNTntjlutB2w2Ze3JwlXTH+qGWz71Gfy9av4wpcenQbVw30H+56z26EucNQDZmCuyy8pscLWxacjPnW9ntuVld2JMH060AHJ+FURIHHNHvlqGKPKU0pNTuUk/sHihP883I/OL4Gt4XMDZzUkuwhtF6tWf16vcv53BjzAL/HpqcY+Cu5SJzhaKWprnl4BkgkryIu6bHPj2GPOqZ3XuN82lO1SY1/FM3MbM0N5eFXQtU/+qkpQsmA1J9N3k/6EcTrw0197xjObjr73iT+MLX88r1D6d0qi2vY45DP1syKZ7LPP4uGl3mZht25jDFvd6YtkEyq2pItf+Cpe53vUfQh0yQYfH9Y+tu8Vuejgu/vA2z6ZL989FlT+6pBLxVPU+fb7uSOimYLdnaD8HWfao+8tuTuZbx7rUPXqC+S3/20RWUOEX5+E1UPASRgV/hI4E/FSJtxjsCw4pA6y9n6Zdi1FvtOgTExwKz9Ee7jnN+vao5pYoQheGmLQaqNEornLBg1Zu738G/yw2MduBf9Wuj0qSEBHdMLoJChz20DlmaTubGwW7sxdkJJWIxia1BlZLRuZnhS+EjhCwfPJbazx+BOFjv67vTQsMM701Xp8/RYXOu8mGb3EskOy1DqZeNXIi50muOV9iGBscZcyYWBVzwvqAb1O+/T7j7J9bpttqmW1Veu8JRbeAsHFV23WqzPZF6VvCensIkiSqbyUJr//HHlVY0cbx1VmY7vLFgpUbQ/6B7zm31zXlH960vXRGAnN71dSvz3Ju2lc8GkUtdrhyuTzMuwg3XP1D3ljzrb6/3EOfWBVx5fflH5d8FAdryq+GXhU+XNUV8db59qD6y31m77uT8/pPIy2CmPrFj16njObPNz/dZs7NmdzwctQx+EqMhnbwrWWW7ImaL0dDvlAnfJOoO5/frHQLHqdmm55pmt0fcbqesPi+dRftpXXlOcH4Wy5fLqIcyP8k/kZkmqxIy/0y4dF1uD1sWEleDT3PbjNPTdYS8Ux+q1161tPcKCc7HEgcvVQIR8UIJ17Kz9vsB8ok+U3e/AcvqBcJ4DN3LqvOfRyjGBf17oPyliPLOJ+8lOnaiD/pjlgH2KQP7sO2bscINQM6zbqLXPH/tVcGjEyOmu0/PR73SyvNTl+DA/fSx8DKg3HGr54naRLY5scNY6XTSS0lxYaiTdWqtiWwYpipvO8R8G3+p41c/PPtD5oMmqalrnALoTnOMgYu8TT6uB6qXY7izL4keOzW0ycNeX1Jdu4lqkzOxe8LO6sT6uIBzPoEGtSrK3YknnVONnfVhOFnjizvN8ceuqz3r8wqP0Nr8eSaayVPxmS97tFsnXj8jRd2dzdmRFf/yXaOOT9FczATg2/WTmWHodUJUvyfSsOPBARdZpTbnncr7CS3+uyxhWfqvhw9u7H3eWVhl/lkrYMCKgdrrlzHcPyXVM0ec2fZNbQs4PqrnC3XuANeWk0Af7DO+yt7hg95HBRIsN3Y0TbX74hXTudW9QLTHkmj75PwjdMSpHWUe/YWJtaxiHoMPu0d5DhNOIBv95k/pFddo69tXq140/T8jHFZhykbigheGstZcwCuuigGlLHK4K3Qi3wSPhUyMSxu8NeRHYhEeChUSK/UHq5LQ+I2aMqXVtHZTMbJt8JSzI+THp7TfA87a/m8JJ6tZ/h0bnT/TZ4F1FiaxUo6zcrw3bMsZPXwD+EEi854eG9GQ6/tf92ur+4NNB1/13mlExzJ8QHms9rZhjMblmlktajYdrUY971anO7/ymjmelQbol9N+FaerXLSJ1rnBF8dPvezueqMdpyiT0K3PGz6rglsPtj9BNv9RdO4VQc3cLh18S7W6c8iaEVD3+WAS83MbUagMNIYUbuRQ+rK4v9fW1EHfIm1E4MNuvSPP1Xdu+IqsnznhQowm6Cc/NbFZNa2xs/qeFbK9+PY7P7wyuz+Mt2UnvAwrZznMibfM1+6/Nf+HWnANzEfUr3QeudH2FXfgehu3zDhZH1CysG8oOaUiHlQ77WzR1EmcfSXS9JujxwPHKSFdvv1zn/j5mgu5J7J4pX6V5PPS3erVlEBRKbHYa7Hok8LjfR8PVcMZej7b2jZoot3of8JfdTvdV3ANn0ClwmK8lInvIbhhg4TWtDx7Ql9/sGiComZQTsMhpnx0wbJwoSxBtdWaQXvJafFyyQ7/Rr9Ne5vifiTUqR8aLBomfoTkOLx1O+1Wzqx2C+9YNvu0upl9qHw44PWTlgHpm1WDd4E2mj76RnvOJIdLImubW57XtrTVUoumjbR/L1RafepzLWyH/zpRWKe4Jkt/a6aqiW9+Xf0ZVe1UcLs2d3nRPXqA81bJGVGJqLptElFEAr8NfGpa9mVu0XPWm+k31/tpNZEvF8rYYc2pF9Iewtjeqx80z8/tWXNE4vSstdlHdzl6a59a5tyGWSv7u1P4+ryerKPux+nJWodoux6rSp/AQWdpZ34IbxrJdJVtqvFhhvil7EZ/YU1s5C7j1Q1I3tAIFmpVI3UJTvgCzkBmmWSk0BQ23LGyqY0CPVkXTHnNWY4lll0uK42dyILKptcelyMLMbLYE3CSOO2xjA4pd7BWXncIdDngPoVkuyXwq8L5Nk0gfXCz+bLqvnI82jVrNO47WmtvtuuDL8I9+gqGLBPMxcCTXHx9/AJohcrX2DksTZCgLRZvZIw4D/U/hx8cusOz23uEz2vo7ruh3cKA/0BCa5fRZ8DXEJsjOaR4xyQf0no84OnYMvORiM9BNRwosOAm30UfBXnZx9c5yK2n8Q7vNw0MzWXXbqafnmXm+45Lfa5WLAGFtWp+zLleUDJhtzFEFAhJdOLaX3a16iEmEnq0Pq458qzH9922t4EkhIn9WM/X71/w7xcHCofmnAa/KuI8b8IG8Q65tg+iXLOsCu6YlLyf89/VfFxoWlFZXsS3/fKqBxlfHdc//lpz/qVJSuATz17+sbqvTdRz94Zuz7dsDbmulCnuv+cPI1p1TTeTbWhv1StagOVG2v+OqIFMWa3hX2i0aV7taaqv+D13NJ2kuKzPsjgkS627AJc03xYMV0XWuLblt1Y0P61Y2XpZ9wc2G5TpLhR1zi3vtXKa27Iz0/82o/Sf7t4rfDsq3/0NU6LFaPApyEvv5Dw36w3ORwjrYATgaeNAx3n+L09GgUkBpVR/6HTgxOMe6eMBaQaGzk3gT6Ywd91UOxbzHeRoHxqKmoDeh8YOVHgTn5AAFBROKIR2EXuiGWQS4DCm3jhBmy6cM3WxSY2vk7v27TCNFq3w8BZccSsll1u+tMpVn3P0GZniugp1sPvXM16Xryz261Ymqaovprlf72Mg2WPnoTZ1P6y/BN83lgglaC4OF5TkLVUtCRxlxpX0gldJlD0cyl6kY+SiJX7FSe7e8SezExpRPKfgh8mhJNQ4xZPysMxWgX7tvtIaVWwi2sX/WtxtPEPva/6roLhzza2hzjyZRM/LH8o5vqnnmuQ1ki0vDCNXEsomN8SoZNMY49Ksts9ZcWzii06bruthOMAOJNQdqylUPtKd6OsrfNR7TbFexugKLcmww7FUXKqplXBtD9fnyAkk76e0wu7NE2qV91+gnam85ojhmXtPHyjpCOoJq0j53J63PkrBtf6t8D8zqskuQxRz0Rt9ZwCB9A7TeVoFu58/5/IFMEwYNUru62Flg172ygSuBJaIej3zbmUFJ8PeBbr53yDfkNuiE5RHpPs+nTGbwGWsH/xDPdvf5HrMlN8kGL5Dca7ts0EjbBKUCYH0+OH/vE0yFwJco5756Nw9vb2GHZIJghHy3fUbfny4IZMszUo34M53kmmAdzP0r2smU9dR2L7D5qu3FHNUWTbLjXlGnuj/4s3lcu5kb0SazkYnNxEiuuClZUcDtl8bJZrUQzYss/LjnwCzqtBBoiGi53jm25mRDUecT1mzerT5bUay98au63K6pSwfU721Y3xWuUdS1qMjff/6yVyU3ltUqCgoNHoWZ+tVN6d8EPz4iMR1cx/fyUcz0hmHqc42BWD1mDWY3BLWM/+VqcK1trc4rq67hm4787O6MgfLLxyPeFf0FtXxETWBdj26XIRn+9XsoCEqlTcKmURjEprROVo+mDoAtRgvZaVvEkWgvM7qQcUQQ7IE8lATbbrA9oC+0XWgd4igAp/ZZpBzgnu+xzT3K5S/h2T5NrifcpvKzfeJwifCWZHSfUFyN6NiOAVd8x1gOJVPFT5UR8jSXfO9iZUq/BT6lbmlSM1ws/83N8He3WQ4sFWyXZrh9VHrK17P2dreEDeJbjhw022Y/wPGX2KZ+m5334KkOFTYLJQsZBikytUGHXP+wcJFOJ2Y53rY4ji4ROVlEd58xWdB5aE7nCW44IVF5O0Z1dSmc0TCbB52+uFYfLF4vckXT2+cwTnyiGpLNNb1q7pae6+75LeYfAA+w29K+xE1sM9uGXvvRQGi6LhsGq2N7Gpq8qy/x4XqB9iSws3tLZ54Z/UXVLTbt7ohjlvPTywqbWqCN/KiSQW3ZFd2Ef6ecGMY96bZmCXI9FkB8aKMr99S7mKVtbysx1r0j//d9wXJ+TOPl2sSOrNbDzafVe3oq9Pc7WnTN7Tq4WnNFdqINaMT0UGcKASI2XbbIAVFKs5k9q7XDiuXp3V/0Q4zhlq+6lNSX7ofYAFG0RMA/dNthfqGX2WzApusfChqQAFJmmouU2m/FDlvHYf4ebpKPaI6rm/draT8yywK2ees8QLDccyKd6n7Succ9Veoib7MQ2j+TR2Nh1r/6G51KwEQLxz4mH8AjgAkWBbsOEX2wGeG8nfbtF+syGxTYxPC2np9kX8mXskKPT1Qri3o6ygutBwNTqEFm1PGFeKN+NOAAJWm9LPyYKaazXIJ0uNiLzdB04pDFNx2qPmeyFaOwDbKR8tXz6jfG741H4H6Ee/u/3H3WwOlMCm0f0dTmfGI0/1xwuSO5YUxrXvOq2gPwVNat+VBTVN0ZtgT6E3UGZ2E+mujO58zqqnfVe37d0PpXdJLJFWDT1MpR7ZVcjZH41VI9Wfur6bHZ99fA7ssqhug2x1TN7zBSu2BPzffqw9A29cOWDlUvmrOD9aK65qZ13DHdATGB4g0DDCewGOA/ZELLxA7HTm/ZeW2B5JLJhd6tCJUOUSaZnEFLQTcUJjwmfK5kdUcFZ5XbtceVkNNmxTtHA92hyNG7ycOcj7kudJkFWrvx0jhOTjNAuTye+OVS4uCBkUystAmabjHf/ouixirb6pVksGiZS66zzGmA5Ufe1qNNngavFDcirvK5EiunI3SEI4Ca6Rn2kVCeY29yLNIUWQp/5SPkkdNiqlZA4D/tlORbcYGdUiiV/2MhVpoFK2wfGQSmheAp56lWXcJI41cyVBDNP5J/0b0T9vKeehq1h/RAMrTrTWHEQ6ZZ26meZPm6uxb8KGpCN4r0YHLnaGAF0EM5shsYa17VEqvyUi1DF4K84VxtjKACvwi97Mnm001WxHAo11zLjeiprOusf4ik/XpliKJq2z01lp3PO+K1lzpXd6U13oFD6koa3nBG7Rqujn/M7ta7dkbUI11x5ue6FtrYHNt0FRHrFM1HiSX6ZWRw09VW725R0+RGa7ZZOBvfRK+CXZq3AZO797f2MS+io1T1nBAXqpOo8rarOorcLZWpLvKHdGZhj/Yv6xirE5JD3bM4W+Epu4dUN3qfyME3GT8ThaSvdbwgwGoQ8wC6LqgWTbdGmOeWMtCFX8FobYuwCPyNcI+QA5OVKwSYtNkOtnpsyWB/K+pd57jecPvDUs26QxqHGm6ZxxPgp4dM8hV8JtzuuE44x63HPQo5b5UJTBS3M6+EnaIBvSs+gURSJwgn4RRZkHKijSsql54RFKL+tqfQc/YZFiOUjZIUUo96i2p0W8lYQ7Jcal0sUFP+BiM4vWeMeRp337iSr9bUsWX6yvYiamTXF0MWUwgtNm0EpsDh7SNUEWCgOqSt1lDZtarnNU/CN9k/IY4dh1WaHsKvySh9Qff0HoZRNj4hjdwDMAcu5ALJUewVaAbEAntqDvFXTGHsmmY/Pk79jU8lJ2pfwinAn/qZgJsZAZKopPoxTdmqz5qxPRn8K0OgOQL1RNZ1Z/LxnKYltuVffGfLOf1R1dKOFzpBOyeK7loKT6PHSLPUteYqtTOTZLaTzqVBDQcnG85Jm1g3/SjLERahkLf5LjIAS+fSJTbITsAgaRFmyJTWsUpeMYkaYzVTvF72l+1SVMBp6XEgLA9D0x0hRRv4ABIJ3rhcdDS4QM6j3cTyGcJmvsp+jau1pbX4hiXtuEuwyOa6eI4w2Omi1M1+Ng5j7cLVkinsWsROss4lG1A6XbYrs66hx0unISIJrkDhfehP2IphGakinPkpjUW8bP6FfjBJ0hT5AGaFIhHoZzVbUGocClhix4g0Uz2QbkLlJuMJ0QwjohkqChGswD+whUgyW6qK6SjD1gH7MYkopqvKvMRMak4C6ZSs9TflbCrV5mgbjLuajeyu9oP6QHC6vgJEqHjKV23XnUN7gu86ywyRnaGAV/dV7haZqnpgmtpiaAeonUw15Q7EtzSwH4zD9U+4RGPf5s+ICZQyHnCEea5pZFt2i8qws/MevFyXoa/qyIDHm47rBqAugn9pS+YQdJvv0gZT+9Bm4QNxLDVNK+6+QyXL1tPJ5jYknkhlM2hI309QhH6l+xqj0RTWZAnLI63GSLzFXtKBsm7TWttfyg7xS05JZ4ncbAF7wEYo/iycSM2Rz4HDuDMOM9lBoo2SUZAzvtDhu+QRdkE+Au4DBEmrhG/hLps/rW9Z+rGhFi7yMnGQ/Rjhajllc0n+C92KPQKecudBkA+y/yrxUFbZhshy+GfgccQHLLP+hcfa7beqpbzln4VFonD0o/AFuMsyTThZmSPIA8pFY7ky5UvukKjZcNf8CtHK5kgDKRN9S/sPNYfLhFu1U4R/G4NBFaoxOmJSKo340/SD/82PExg6jiFrVAyfZ7yvilAZe7YZZ6E/u7cZNqndoEdtI0E71qjb0b6rK14fB6QzW5kH2mnNq7vfsy4t6w33Oop7hulg/Vn+afuWtlgzx8PEoM6nuixwA+uIFOis1ZTpFAOZxoAjutPUk7suq3wwC8QC3A7GoeswG3WYqYtYodrffVQ/X5uCJkGpRJ35rtCXeilu76nRSrCV+mZBCpRL60zxcCIgltfzl7DDzCxohBFWjlUcF+9hfc0aOB3/mz2Ex0vtJNcFeRJaPkSxx9oD/GW5VjxdKLboZ+0B9ZMmSJ/ivsIT0HPJKIkcVkgOK3wUbegXwTe+HpsghOSDRCGKI5Zj8al2NspSRTG4SrHMZo6dAlstSoPvIWv489a3BBlWc8ShXDNwFMS4C/x2xFe0QfxONp3uUmy02kLEwpFEEfhGqEUqgGy4P5vVq0xDpPMQUPAKzTX70gh1tScYOQsUsQGwH90Cr8F+6wz6ZQIfIkw4kGziS8AidR/uuSa7W9NVqp1AKcCvqrF8DFhENAKviO+943Zrpmk/qE7rZsPZbe5d6dBr4qp6o/Emc7FzLrFXW91dZ7ilT6EqOpTEuC5/3WPzY/2tDnn3bG2L+otexU2ASfVkbjlRTz3gH3aeJwYY+3bNM45k8lUn1KDexXDKfEiTTW7qEZsssAvanXAx+oVYgS4WHGNvMvvRD8x4PsW40hxseG96gA8FWxgDGS07Sd1B00zPgcXCh+h+bp5sPiTjkuViulLaIU3lVoCBlgH0fXiipZcgRbmfnyzcIYuS+Ykeif6wnIgnCdcImy1t8SwgQmIrwoTDrDo4xGYbO9T6MPAFl4nd8d34U1GKUK+4KAXE75RdIj/lBuUd+DV3GRwqOWhdhu5gHKwvC3eKF0CT5HMkdfxIqkBylzVISWiRormXWlOVPyVZnA+5EQpkalBEepHIwpIk/6JjQZP5rKmCKCKVwDyTFZBkOglWMU/o9aZZhBre15vHKsLKNAj4wNwh7MmT5lZiF/ShR0D7Qxc5Fz4Jae56QujJPWpPzcme58ZD9Bx9rXqedrq5Qk+xCcyATpRb0YXrvhElNG6ONF/VJHYvV0/j4syzQG/zdu1B7U6jTp8Jnum2NM3QrTd5QWMMcea3lIHbTTxlXbgHQEDPK81Rwx3Dae4omcriMGIaY3iB7TVN5Hagi5kWcBM3RwCCgGAndZAFgADDAjKWPiQ+yt00L+BE2An+PZdhfgreF/9NHMI3SzqlJ6HZiD2cRi6kPoj/wv9D3dl94k/AGDmPxOI3oW+cE94laBWXgI7gFPk4dq5kmSAauAZ2COQW1eIcvg4VW2xVCnF3ZTQULtQrvZHfckCaIFqstEP3wEf5qUIMTpYZZIeQpWia4G90j+yEuF54ElewGxUHaVDyCdFDtrQb+gZypTKgPaIgaSghxVHhCYHO5A5WwDcZT+6jMRpfjMQKpwqzTJUEangh2G56jWLmKiBAt51Zx2FkMd2AaLHrpkw0RbdUf5W7AUQSAUa9ZlzPfegVOVH/gqjUntCe4SMNWmCgxkczQLesO8vQbFpvctUUkzfYNjrZMJ8MVocRJrpB95HIBCdoPUiUime+a8yUVLOWHMjP6u4g5IbRNGHab/5FtJInuju6I5ATdJvpimYI8KgnCljFpxCHdBPNjVyZ4TdyBzmILkGrjc/ZvZQvnwDGw0X0Yk7CvGEE1C3IhNwU09g9ehYjYn7C5eRN6C6UywlEPdw/MA95seVClYRjVkhjZHcgMeeL9jp7lOSE4kr4EhuEHJNdY7VYvdQPLxX/hCJBOT5KWQ5+EV3Eo6WpuFgwRXJUEskX8Z8QITIX2IEWQIu4X3wBUCidKvWT/oU7C1IUO5S7oRo2F9wpxwRz4RVgIVIMQdgZcSZwlZ6APkGuUZFcIDCB18ARtBP9g9JhHZgnOY9W40+hQTBBlBADYVuwE7lrPAs9p0eYVxg59gAdRw1lCQON/tLL+cO8FXEUwUyr6Cggm+qry+z5DgwEWXqIocr0l3EqMVm3mSjS9+Hm0Y9NA82lxATzTf6lQWgaRB/smURMpKLoXJOFcSs5lBytvdkzQvMcOETamSPBBnaQ6Q/QT9NhOMleYe7xS3UD4BbSkzGYGw0eQB3VTb6EDuoe0pW6MLhSt5Fx4q7o24kStgFRG/0xkWk5nkQPwd4RW5nv5iVsEn1PYAUz9BLAREcLMtFJXAcaBHhR/fkm4AazD85DEvAEJEMwQBCETWPXip+zHjwMForDmVX4Qcl69r6sip8l2yuyA/qIMqSXZW7Ac1EhhPFPgVT5IchbdktWp2Dxr7JkoTtkBtWQAzJbGCdLwCPxBNFXgZjbw2/H7soui6Kg3vMk7BZIxEOBwdIIIcx+AqXcRFEUHo5t4ZPgem6a4BWwlNpOlUAp1GPan/sJDaPmEcPQSHQ7lYa0sLnILXMi+g3xZcealMQwKoZ9S4+Ex/El6GHDAcNuaBB9j88AnfguaAOcAyfS1/hyVq1PBO3AKFpm/mI6o9tG6noKDaMBAfeW20PuN8B0BfXAPASI4u73RAC5xnO6ev1WfrBujbkSpPUegJ+xi9pPT2K/gqHsNp2fztgzXz/L/IQJ0t024WQG0dm7qx/x2SYVsaxXpyLhyfw98CZ9mFuGXmRZbhz3mxuB/mvUMgNNCqqSfIrIyJPgcCwLDEHXUnmMLZQIRAimM8HQWZKgV4F3UBF+ErkMj0ZKhPv5H6LV4vV8PQ/CFxlH0S1WJ4CEs6TtUJHwKb9Gcgr3Aj/hs/ghqFJ2UBQq1km2yV6AhfgMyQuuEpDhyVJHSSkfikPAOWmscD82B3oLXMCd+J+if4BH0pfCWlYOLOMyoCjMXjKRXwQfFL5gUlB7Zq/gDDcVmcAups8xZ8Dn+HI8DP4AKLj1yFDuFyYDuumH9GkkSbCGo/EuHgVPQdHAASKQn4FNQedi47AnyAlyDmQ0vWbs4TIykl0PnjYuMO0lrpCL6LVGC3IQsB8cbNwHmYgv/GVoLZNBLuLFpCvja4o2uJmrWDOQws0zkMxA8zziQ88T7lPPN05hSqPdGZN5F32MGs7V0THgGPaDvhBUGSJB2rwEnEb0gKOZmdxUchO92xBFzgZP8aPBk6Q7kcyG09mAFxFNfWbtmQquH/gE2IOkIG1MEvofeZVsRGDiPGXPpiNCcjFlAx0AV5P7kHK8AA7lK7B4wAHewi7iwntHfRP9QkYDYWA1Z8SeYt4Igt6HVvBHRbvBKozDp8IRaBY6DgzGncEQeDx0VlwmjkFmig9wqyTjEO9ebZFjv/A9vAnIAGnuLabDS9A5wkFCW0GIaAWYgQGiPRKFeBlQBjJ8GpgoHC+Khx7Ci0RlsLOYxt2ha+wm6CPbAe0VvEQdITfmJxgC2EPuTBiXSbsj78EVGIA79hKKir+BNYAF9F44HBpHp9Eappx/RY4xH+GrAZm5922UP2zSw4mUD11IBZpOkq+p7+aFnBp4B+4lfFhb0MnYQubxsPkfoslwgQ9gb5GrzRXmXHMe70X9qT9G+RK8fjgwzZDEHWQOmjqNQYY0Kp9+Q+awm/hZYKNRA2QaQ4kqUwK3j51Aa5k/aLNhEIeCnfRH/gpFMLlgCTGSfktxQH+gCJgNzmVwZgp7DXTgjlGj2d/8EGoMsosPovsCF0AKXopNRQdTu/loYBVmz/Zn4tgnvS65EDsGIvg2fgxKwkmcHVspvAMmc8tBOdofuQAuxb8I3QVPhCugLmEuWM5rBNa4ndCA3BOjgnjAjK0GYkBI2IGBQh4/LfiOJoiyez3qWsQXvCsqh+cDFDxN6CTmoWo8AJ4lNOEKHhDpRJshT/AMm8q9wHE+Qsjit+CpEI57ohFYPO6EbwFr8L8xDhvNP8JOwcPZl5CCiWcmsvfZ5cwicBA3CRwLk8xKbiGzHtrFeBJO1BJmIiOH9OZMJph9xzhyy0yvqI1chymLCKdSmf/Ip2YHusN8ngjnFpHTuHhgnhkCO9k00tGYaH5FO7CfTAmmm0wMP4O5SVxjfrMdTCn/H4sbn/PtfDDYwH8lsoA+jAdwhPOmvjAQ407vAyEwjn8OJvK2YCboDw4D80yt/Lhelneh/Zl8UEE1EheI+yRFuEL/0tPoElAJvUf68yg/k9XwpfweIA4qhndREJaIDsI2ATGQDj6G+0NHsVAkDi3hnTE73Iy3MoH8IHAzfwTuI4Txu8gz/l2ver+HN3PuyEphCEZzJ0SBcDecILCG8kTLhGFYDfYTPikaL3AECfiuKAj4DDtgq3szGggN4QPR+Xgp5Cs6AWngm4Lb+CE4BPkAvIZ+gzXQQRgBdXxH7622o/e2o5DjiAKZBMTiIAcDS1GGKWU3Icn8HOQAlwgpWWcgEJvJ/c0c5RcDOYyMSgZCwCw4AQjhysgaqJqzocbSKVwbnwONY5cAGcwifjafzR7hVxH7ex1CBR1BnjZtAI4Tw4l97BfGhVjAbjG7kNfMgdw00It1p4Ooi9R3E0yeJ9KZ+WaMU5MvmKm92eeN6b3xfUFMZwk2HzhKWPP9TRDowN8jw8E2tgi0YHK5YI4gbhD96fX8BuaBOZl0pU7S3dRIzpbfyOcCG+C/YQ9oE3WcpOn3YDSSwg1HM6gcxI/ZxO6Gn3EnoQh6HrMA3cEegUGWhPSANb+FLYUL4K/oPGAlSvfOkAId462g/9gngkr0OpaARoCpaDxs4DNBP+FqwWg0lRfjNQDJnUY2ACPh3h918Dx4DbcRfsd39DKyOz+HHy+8CWchntAIYDSyCBwOeEISzFG4E1sAJANrwV4ZRdpAPVvNbuF+YregMFzPyfE+8AD2N2QEneFR0BV4BVIDeaPV4CnuGnqUS6EnwI+4mWhfyJOOY4qBGmYFz8OhzD32Hn+biuB209fpAKaN28DZMjwwGJwNvqBnEn6cKziCLQV+AxXcHqrAzJnzzFoaY8p7tbMZGABE0ZHmRWQpw1JXqW/U3/wR8iB3hXOi1lPzzbMYb24+i/I1TFpvvMeajwMx9ESyv/k8v5FMY04Rndwb9iPpBY6jguix3AhSTf/k9Pw/RCF1iy6EIpihXDn9nZXQ56C9VBwTxJ4Curh7nJp7BqQwEv4y+54bCkQy1swheic3lA0B7dkHSCeTyPRBypDrfB73GbnJZyILUCnnD75AzwGu3AZ0BIByx9G9yHpIhspAA3cJ+4h0IusAX+wwAuMTwANAPC6DPODLvb71JRjF+/Kz0MuQGX8DpMIo+h8aiXihcfg9aBYcwcv4G3wEdpab2cs6s2EOvg/NhGcjC7l54A6oDGO4wb3IVM5msv9hEnA31MSlAsO5LKAOOcAchF3ZCqCZ3Qaeg2zYx9w//GMumauiwvhh4B1+IHcIjoVfcN2UN19A/wRL+WpaRUH8bS6VcqH6cEnMVu4Zv4X25mkgC/hAr2CvUYuAVGY65ULM7XVF9wgXyoFMJX3JGMCJG0314Sdx2cRL4CN/j77Lx/OHODNP8N7AZCaT0BOfSVdgGtdDeTMldDnbn1xFB3Fd1HJwN7WNVzBLgau8jvwXOEZNpY8BtpAVN4PZ2Uscu8AI9gxbDjzhLbh5XDksZffQJ2E9qIAfIqeAjdBXdhz4HNwPDARykfnAZz6IFWLWyFt+HXAVvAFth/4E3nJe8GfgT94XzoMqsC0ciW4A1Ohx5DMM8IVYDlrFp6MhUCZ2FIlA5uEqOBXRQYUgjg0GHcDp6A+ohz+Fa/insAa5BBl6Nd4X6AB1SBBWgnzjRUgJ4gYswHT8ezQEzANnQzrUF0kDbqMIomd1XC6bxNeAzfA8Ph72hW5yaaAX7MSdA0729p0OjWNCwFhmL1sCrgAQXg/VAia+mmlkHzHBoBncwTnQMXwC8ArMB/8HUEsDBBQAAAAIADN/U11VBm3G/TUAAEw3AAAXAAAAc291bmQvd29ybGQvanVtcHBhZC53YXYNWnVcVMsf3e5udllYursECQlBVFBRjOezu+NnP7s7n/nsVgxABUVRkJDu7li2u3t/+7n/3pn5xjlnzsy9OZnp6WkxAMCC5PlT127ZxSEAAACg43GfDwCkvQMAQAACYPWKXSs4jncAgNuQQOR37BTSV5o7a79rice4jzJgNCQ/4u+Y8bjkxF3J/6TlZBgzt8x8n100+2yO27yjuS/mX1oQu/DVwt6FjQtPLLQsmLQgZr5p3vG5LXO4s8qz1s/om8ZI906FTimKT4i9H9UZJgka9fvmtdeNzf7ICKE8xsPRa2HlQJZ1r6FHnSL/KkrgdY4eH8zsDegMbJ3VeLsWVv3w9+pfC38c+tZZtPKzT6Fn/uIPje8O5m14++8b++s3r2+8Ln3t86blzbe3o3kZ74UfavJHCsO/fC/eX7Kp9HLZSMXSP/D67qb6ttEuWv/a4abxmYJ+yT4lR9dsOmGPgkwgrmCDSb9oSay3rlaPSN/swKmhjMjfMamTbyV+S85LW5chzYybmZXtObt0DmNu+DxM7vNccy5+/kjuttwf82rmXs9hz1k/a0/WtBkj0xLT16YumsJMeBdLiJ4RviR4pj/Tu9ZtKXuQkUF5ileiYmD7gN8sFn26+q7MLNw6oR+5MzC/J6IjsmVxQ16Nb1VHecHPyu/Yb1eLsj5PKzyWb/5Q9P7TO03e/rzUvDl5z/Pi3zHex3y4+zG+gPMp5cvT4vgSQimzbFFFbfWGusgm37aUrsN9vUOzxwf5RyRhSrn2i+mIPRNCQDZjT5B86MWsMM4VzyZfSeB4aEHk3EnVk2FJxBRu2qGM3kzDjM6sHbPqZg/NeZcTNXfP3B1zveZey/k6587syFkXs57O2JuJy1iXdjp5cyJ78n8xogh0KCSwy+e0B8P1ClNOjScewLyH94FgtgjjGs1TuUw0k1c2OmvQ2tPYUdEy3hBa+75qye+0X2t+lH9bXBz1JefTp4JF+ekfD3zQvy993/je60P1h/yPY/l/FTI+M4uWfB0teVb6uKy7IvXPWF1B0/u21i5m/6lhDPe9YJXUX2XV9Zi/AG5AN6Mm483kt4wU9k83Z+8F/puC54Xjom/HiuNhU/gp56aKM9DTeTP+yarNbpx1ZrZuNnOOevbR2b9nlWRvyGqeIc+szVgxtTilOeld/KzY0ihDGDSY5/fYK9rtgzOKMZt8EvcW+QcyajeZGLok5W7JT77L+N2hqD5t52CrqjGmLr96WUVm2fbSnpLjX3cUvfrs/UleAClYk0/Ox+cvzJfntxUAP/3zObFo+tf/SkJKoWXMig3VytoPjfdbv3ZaetcOKcfu8hdK/JVondY0YW+HlCIf4LaRgxjtzn+7VXrB/F2CEeFlUSmxF+JvJ61KkaaFZQRnjk2fPnNNVkR2QfZodln2nOzrWadm+s84kXk9Y9HU3hTqFEJCY+zs6P/CPwX/57/QW+a2kl3M0JCd8VGoVGgWYIF5je6Q8oVklB81/noooc/UOdZqasyoq6++UHG+rL50zneXb9HF977M+Dzz04PCpMLwwr2FuE/aT4FfCotOfX1Wgiot/vXmd3/V9Fp1Q1vLeIdb77lB6lgZ74x4lWKWNt2UZp8CiUP64RDkDvopZ4bbaa9GP15QU9jRKMOk8PjApNHk7LSd6ZnT2jLRM9Qzzs6snVk8M2fmvRlXpkdknsm4NDUj9euUsYSauK0x3RGIUHBgs882D4FLEvMA9QHhA7oQ9hGYZ3mr/6Sql+oFCdynwwH9Q10/21qbnOuf/FlbuaX8+8+cH1Ela78Kin584X5e/jns88LPHZ9ffKkrSvmKLnH/ceZndHlg5Zo/w3U3m062vejS9e0YJnJbBG+ld1S39A8sr4AfYfnoZ4QT1Eym0mWPR6uPLcAQ8j0iOeZM3PmEqVO+pPSk5aUHTFuQGTL94/Te6XnTvadPz3SadiP9e9qNFOcpfyXMiQPH7Ip4G/IqYIcPxuOIS6OTjUIjsNBkGASoNYt0IqVZ4iFYP948tLTPqQvRFtR0uS7kD6Uyubzk57Efd0ug36qLh4qyi+hFsUWfi84Wf/oaVYL+EfHzbdm2ioPVLbVrGie1pnYe71UMnhlL4bMkGCVe52IOB6RD56Hm4VMoNKcG9t/uv70N/obgX+Hp0Rdiz8bHJj1I/pi6ZWpHOjfj3jTtNN20+9MEGb3p/5v6JfVZclLSxfjLsRnRP8JVwVL/Qu8M9wK2lsGk+OA5KCxUY+831WorFe1iMy91rHBwZi+jk9m6qLGn9kF1XgWsvPBnwQ/496JvP7+6fx0rthfv/5r97UgJ8oeo1K3s7e/jVS9riA2/mvPaW7sDBgpHVk1EizzlfpoE4yLbHvAVxAPsXdJBerLzCGeu1y2/p0E7wgBR0yalT9Yl5E5ZmoJPWzd1VTowIyXDM+N1evPUO2nwVHbyQOK0+NWxEdEl4bZgcECz9zr3NjbFKZoSjw9BUaBqe5vpq/ad4ou4j+c2dnUwuBfYiWtd3CitralWVmwuj/+1upT3vaoEXPL424Nvpm9FJa3fp5eyf00vb6h4XF1RG9o43tLVAe3dMGgZ/ca7I76heKYtN/HsKKgvKgYfRsE71bL/cv/uzfPvDD4eLoyCxrZOzkzcOCU05V7qi7TZU+9NPT4VOTU4TZPyd/K6JGbCnrijMfGRH0MHA+t9j3qCOPNZJ2nXiWcxm+HpIBerUT+i6pPKBB7cY8PY/qauujZE84X6v2oOVEl/fy0b+rmqNOPHpe9R35O/538/9uNzacavSeUnKryrnWtXNqiba9tHukMHvoysm0gSxcgzNOuN122l4HGEBQsgC+jvnTPc8r1G/TqDToVJIqGT6uJiE7KToMmLU2aljqRi0tpTo1MjU1qnYJMk8dvjHsTsi4SETQua5of2us1RsTzo4SQfLBwxAPpgPWFYrV4gWyu8zVUOH+xP7E5qP9FMaJDWsKufV5wtr/u19eee0rEfX37If1wuvfHT/KuqXFqxszq79nCDpbmyvbmbMXB7JGPCVeQkD9TMMR61FYAHEEYskCyif3TEmOfV4fcjaGlYYeTnmOVx+fHPEiOmLEv2TjmVcjAFkxKZrE/KTcyJV8ZGxbhH/gzFBtH8hj23cGpZJhqMpMO0w5+BtluTDS5qgsxFmMMtGE7rJ3Vz2vc2sxpItcur0ZXU38fLcn9d+Rn+M/Hn55/Xf3WXHf99pdLs6PVYw9wWYge156+B7pEzEytES+W7NY+M7TY4JBqZi/ubnMaAsm+6yb3Q/mNBW8PeRF6OYcSlxqMTtyZtmGKa4pY8OCV4Ci3pdkLh5E2x1dF/InaGNgWO+H70TOE8YjXT+oh/MI/hm0FRVrBhSNUsHRZQuf8M0/sVXfj2fc0RDVNrC6uPVhb8ziyfUVb868qvjl8nyx6Ve1Rgqxb/QdThG7e0MDtIPVkDlSPbJ6aJpsqXas4by21GsD9yJi6XnMAwO5916/eS+hUHRYQtjvSNuR37fPL0hNOJC5N+JH1Kik9alIhKyJkcFfs5ujPiQSgpaJIfw6uY4+KcS19FysEGILSg79ZThr/V02XzhRe48uGL/Ru6L7Xbm6saJmpX/8moulqR9nt1uapMXra4POr3wYrgqow/lbVPGnqaV7cnda/orxxezg0Susui1csNd6ztICQiDJtMCqVrWec4Y54G36rAlNANERHR9yc9iouNX5fgnbgnMTexKqEqfuHko7FTYh5E3g+bEnzd/5b3fPdutrtTMiUO74SagLy1bzMlad0V7uJM3qPRoEFzD6FzV2tQU3J9cc216q7K0xUvf0f/nvT73e+rFeOVz6oba/6un9l0pzW20693+WDP6GneavE6xVntd5PeHgFdgzqBP0VZ7oR2Oexe4P2ff1TwvrBlkdxoUOyXONPk5vjwBLeEh/FvJqfF7ZwUFX094kpoaNBBvwNe4W55znI6lGzAtiDugBfbOEa1elAmELInTo34D5B7MjvaWooajXVPa4qqo6t8Ky9WrKr4WLGt8klVyp85tbX1z5uGW3d2Lug9Pagffco7LD6meKrtMpEBs6EnUE/wjyl7ndguZ9w/eJ/3JwUnh+Ej90XvmQSL85rcMhkW/2cyebI4NmfS9OieCGBYXVCsf663t/tnNsIpgOKNh6CaIdfs80zuWpgCJZ7EuzsaM8jsndHZ0lrYpKt/UvvtT3J1fNX7yhuVysrKKvSfyhpJ3aHGXS117fu69/T/HM7gwoVaKUwdbthszQNNwHFYNglO/82ayjntecjXPXBLyMLwgUht9KNJnbE344bjCuLQcfJJy2KWRinDnUMnAnP8NnlNcit3xjOCyB44K6IKfMY23eisgcupojkTlSN7B3b1VHRsbt3dNFFfVoupaagGVxdU9Vbtr772x6WWXX+ucVnL7fbAbmr/jOHq8QOC5dLNqn/1TRYMKAP+P8xJ4nZaIOujq8KD63MyoCb4bZhHZHB0dYxw0o3YitgDscWTDsY0RL2NYIZ5BNf5030IHmUuwcw11G2E+WgvmADw1rxbN085V3KI3z+2b2hJ340u93ZSy/rGwPoVteia4D/11dzqvX9O1iDrQA2bmpJa93Xgesz9USOfuVuFC2Ub1P8amq1YcDpiM3YXaR4d6Lydc9dzh68ygBBSG0aJlEbNiZk86c2k+5PIk3Ax16IeRsSFbQiOCHjoU+ixz9XITKTNJSZjaPA+4H3LGn2KKkG6UvBjPHc4un9jt6Fd2JLShGpIrzPV+NV0/LH8eVpTUbu0fmujvLm/LbCrv3d4MGTsN++S+LQDKx0mAiALehh1G3+RkuM0zPZ19/Su9cMHyUNWhq9yxGGNvhrzImZyzLxoZSQt4k8oMnjM/y+ffR5TXRuYVFoQkY1Rwb4C/7Gk6z1VntJsQf743OHk/pPdXh3+rfebjjb01xXUQmq7anxq9bVT6zGNmc26Vnzn+Z4VA+dHLNz3wmuyB+pqg906GbwDcR37L2kDHeG8hrPbM8z3UsDJYGyYR0R55HjUmei30VnRO6JokcnhupC4IIr/Be+X7jtcNE6x1CzCZDQe1gG4a16vy1YukFzlg8ZLhn73uXdz2/Gtb5u+N6TXz67rreXW7qg7VA9vRDefbN3c8aN7S//u4frx1YJoaZRqnv6spQJohrlh/IgIWgHTyTXaw+q91n99kCWEFV4WIYi8GvUlamHU/khWRHKYPNg/0Oy7zmu/Wyz7E0NBtuJ4yCLIIXuaialFKzzE23im0ZZBY+/Rrq3ttS13m8Yb8uo1dWV1hPqx+qhGaHN2K7ojsvt337sh4dgWfrCEo4zWrTE/AHRCrSgUQU555IRzCXcHem/32xdICAkP6w0HRr6M/BO5KvJQBDU8JLQ1yO7/24fj6cnpYU2l7yMdwi5HhID11grDU/UTWYMwdKJnpHmA09vRqW471XK1yanRo6Ggvqp+ScP+RlpzaGt5e0VXcJ9xkDV2nhcrZiv8tHNMZ+ylED7SgBsl32Zg2bFuOK+TvtcCgoJzQk1hbhEVESMReyLOhtPCvEO+Bw76Xffmuve7HGdyqXgiFiOBfQOesMzXT1FlSy8L0NzWYUn/mp6MzjttK1peNW1tLGm41MBrqG70b8a3bm1P7TrdGzQYOnpywkWklCnVBGOKw6M9RRRhX5JW07ksJ47RY7/PVf+ooJUhxLCE8PFwUMSd8NdhEaGJwY0BAt+bXkNujezNTjUUCZ6HqoBeAywzT9IFKTMl9/mh46ThrH5xt65jd9u2FmGTsHF745FGRlNMc1+Lte1e59sezwH7cBj3g2CjdKFqk/6m5Q9QC8NjEMQ26nLmS5c77v7e8/ywgVnBuNAZYcDw4PCWMHHo4ZCrQZ4BKb5Kz8lufuwahjslHZ+EYkNl9p+mh9r/FL/F7vyasZ9DxP76bm3H7bbilr+aTzXFNe1vSmm+0bK+7UfH2e6qvo1DWxysWyIOU4RrZ5sO2/Mgjcg23HvyHEa+80/Ods8Sn5v+hsD+4MmhpLBlYZywBaHQkOCgHn+Eb40nx43J/s3wpGThZ6ACoQBAh6lYW6wYF2fydWPaoXn9rJ7cTkR7fKuuOa4Z2by6eUZLSev7dk4XunfNgNfIFG6eYJF0sipdv97yL/AHrAVdTjhOhTAnuzDdb3m98E0M+CtIFQwKPR16OFQYUhvsFqTzn+Ub7vXG7Rf7sJOaEkiIQrvC9IBG80fde2WnJFowON41HDyg6PHsam+HtJW2AFpam0NamK1X2s53QLsNvYsHPUenTXwXbpPNV68ynLZ+ALXAezGlxE20Lsd5p8Ad4S33XRyQHpQXfDKkOeRSyI/g5UEHA+h+k7x57oGuNNYHGoTkgXVGWECd1s+Gt+pKGVn0YuL0aMXgur5D3dhO1/avrYMt11o6Wl60gtr5HbO6w/pOD6aOLpn4I9zlWHOZ4ZD1GagMXo15Qcxy8LnCZa/7b6+7vhr/hkBW8GAwPqQguDJoZuAM/zqfJs+VblfYK50ElCBCCjoSRgYqzH26ESVJelgQyZ0y8mHgfO9g18cOeLu4dWnrilZNK729ssPQldfbObBpZDW3UJApdVJR9AGWmcCNsP+hFxKQ1P1Od9iL3b543veB+UsDpgcxgucHg4Ndgz4EfPKL8knwbOMA2R2MRZRH+M+o19DzgM3mxbqNylcSd4FgHDFyeeBkr7aL37GqfUsbvC2iTdmW1EHv2t0zu//x0F9jO3kDorPyDZptxrO2l+CviA/YvSQoPZMV5Vrq3un1P98r/h6BvkH3gw4FNQReCCj12+hz23OW23/ss04e1AOE++i7sOPAtQ62rlT9JyUIW7iCkTWD8/p+dL/udOnwaC9p47Y9aZd31Hb59SIG/h5mjsfwn4vnKaK1k01z7Zsge5ArcM7ku/Q/rHuuUA+L117fTf4dAe8DVYHPA38HzPLP8W32anFf4nqSNZveRCLgPJAMCNAuMUo0JMUWMYZvH5s7TB6Y0QvtzuhkdPzTvrPd1s7urO8C95b2y4eujv3Lk4jOy5dp/jJuth0DX0Dsw8aQvtFkzBqXOPdYrxKfz34eAfaAaYGmAEbAC78XPhwvtvsrl1rmNRqWNBO7FJELTnbcDCVotsl7RRd5t8Ygw+P9Cb3O3ac7j3UQO2I6VB1Tutg9x/vWDf4eOct9J3CVtiuLdSXmekAvtB31Gp9OecB47DyFs8PDx3uRL8CfFnA74HhAl/9tvz8+27xuuqe6nmJtoFtIWbgtyM2QpfYc0yLtaYVQfIN/fVwzXD1A6ZvoTu2K6Pza0dFxprO562UPvF/oQCZ8wl/4QDpLFa4PtyQBp8Hi0FDCLcowo8V5MWeXB8Hby/ed32N/m3+Fv8rvou8db6Yn2+0du9XpP6oTcTFmB3wLaKV1uWG/ukyWJqLy0sYGhyT9B3tvdid1He7M7azsrOta3XO+L2Zw+Yhp3MCfKeEpirR5pkL7N8hH5HGcG/kA/QiL4zrHHeoV6dPly/Vb7B/rf9gv2Hem94iHinOZ/dPpOpVBXI45CD8E2mvdb7itHpNtFk3lHRxzHY4b6O4F9HzvwnTpO//putWd3nu8P23o2GjwRLwjpxQVQ4+3kIAkmAVVik+lHGEsd+5x7Xdf4jXfp9T3sl+V3yq/db7d3sWeeHeRy1zWAofb3YJ7jPwI+Wj/aKrU2hU7JcGCVO6vkfxBt37n3lfdtV2nuga6Grpzetf3w4c8R7849Msguaicr0szpwCmQP1QEtwecjH9EcvF1de9wDPf28VX4xvi1+Lb5ZPh7eN5xG2hyy/mb9pWUhcWiWRBXOxephTtWQVS0sUHcP8deTwY0j+919Cd1O3W/ai7qGdV3+OBVcPPxnJ4q0TVsk3qJEOYNRDkCtejHzu47ObU4+zGkbpHeIm8Mb43fA/7Nvmc9H7pGec+05XLIjHGyevw+ahWaD+Aa7boYlSvpcuFOyaEo11DqQPxfX96xN153Ygee8+VvvyBxcMnxzg8jmiPDK/u11dbfgDfwY6h/QjXKG8Yy5xfuu5w/+K53vuUD8xX5BPuM+Jl8DjpdtHFmZVCx5Av4tqQaggAgDeH6Q4oLZJ6gZZ7YfTuUOBAVh+kN7cnraelx9Bb1A8Z6hvx5wr5CMkehZtWb+TaOsHFiD1YGzGR5s18zs7jhHr4el3wnutz2AftY/Ga58lyX+Tq5LyBsZCixeegj8PuAN9aavQI9UHZJNEM3p+xb8NBjopV9ep6qnrCexP6RvppQx0jRO4vfpM4VNHqOMuetu0Ez0Fgsf8S26nfnKLYkzk/3PM9cd4t3hrv/d7LvT56bHF74rKI9YR+lszBH0C9hVYA+swg/SxVp/SFsG1i09iRYcZgcj+wb1nv4l59b2g/cHDlcOZY3sQB4Qups6pB99R8FrAFGocaxKWQF9BRrJkuRLeZHhpPkPcO72TvnV4wT6j7HtfVzgMMCeUFgYn5G34UdM/6ywDS7JVHiNP5ZeOFIz5DAQNVfebett5pfUv7sYOzhpljqyfYwmjpA2WKDmdW2Fsg95FJuJekUtou5nf2Cc5v9y2eh7zkXr+8FJ4nPY65KVwGWHMYyykMwkV0C0wHpFlTDFfUJPmgCMz/d/zRSOhQzgCmf03fsj5TX8QAbGjjyPzxH7zLoh+ySPWY/pPlKnA9zAP9Aa8l8+jbWMcdORA99numeW310nkOewS681xp7BonNE1OPI0dQzAgifZ1ptdauvKPo9uRE6SxncMrBnn9yP7Gvsj+uIHBQcpI95gTr0E4LE1WDetemA8CcqAE1BOciiSnnWHmsWdylrn3eXz11Hpe9jzjwXV75ypwfuGkpA4SD2AHHfOn2nc4brECleMSmWD5RObYl+GCwakDe/tn9lf0DwxcHeodeT9u5ZWK+mVT1QL9B8sxYDbMjjqM/+rYAQgsnMtpzmb3Yo9Vnps9Wz1uu5dzFrlsYNnoPhQ9/gi6A4YGxVl3G9rU6+QZ4pP8UO5fo7jhhYMJA1X9iv6fAwFDYSN/xkYmtgvXSj8qY3Vy03f7GcgUZCPWmcSgfXRqdd7uesRN597kAfK87nHUvZVz0aWUtZVRQLlJCMZchTeDwLYpxvuaQAVMMlkwxLWNvhqeGCwbSBhYNuA5eG7o7AhjPIj3VfhWqlDu0fma5fYiyDqkFBtOcqflOf10nuGa4fbGfaPHGQ+7e6cbnvOJ3cTcQn9E3oOHoVfBngEHLJ6Ga+pJ8iBH7Nncu6M7h7mD2oG3A5BB4NDD4bbRG9wO/mnxHblOfcmQbkWBqmDL0VX4EfJ9uoj5lW1yfen2yd3ZY8Td7naYs9qlhHWZIadICPcwWMRf4Lu2IeMUbZfik0QquDlRMrZppGDo1qDrYNag29DN4WejKdw1fKvIIEtTN+oPWuKAauhVlBHHIo/SYplk9kpXpluk+1v3/e7P3YI4zi7/sOYzflB+EXZiRPB48BFbnTFC26IolpgFHydGx56MGIbkgxcGGwc/D8WPLB3DT6QI+GKZPEXTbDhsnQQSwPag6/Ed5H/oBczV7LOuJDezW5L7gFsHJ8BV7OzKbKfRyXbcQxQKtgj41GLWH1RPls8UV/ALuF5jgSMtQ7Qh8NDtoabh56MELoT/P9EM2T8qqe6COQEgh5xFqrA00ig1ycnNeY9LNCfXrcXtmVsL5y/XTPYr5jE6nyzCP0Kz4P8DlVuZxpua6YosSaHg4oRorHdk9fC1oTVDo0PgkYpRFtfGWyLyk2WpinQzzSb7S0g88hm2iniJKmLUsFgu3a4qznq3KLe/OSMuNc4cppY2nzwfj0Sfgo0AI6z/GliaIblGvE2wYqJ/TDByY3h8qG9o/3DpyOMx+gRdcFW8Xf5CTTcUWv4G2h33Jm24TtJe2kunuc5bXWSu9Ryg22XOLtcS9nrWBUYIdT1xGpaLmAv5YEeaj+i8VBTZUhGDn8NljR0eOTEcMnxy+NiI69gCrgt/tYgpC1SdcihLvn0uZASRiF1IpFM3MOJZx9khrnGch5yFnE2u/ex8lo5RQsWRILgCZBD0MkBqXqEHq4UyX3EH384tGoOPmob/He4ZrhzJGTvEjebvFLFlPqp9OrPpjuOrYimCjg0gTlDCGFZmPHvEZdR1MkfsqnZZyPZgLWUwqWuJC7Ag5CHIuH2a+Y9ur2qbrEp0gd/OzRtzHY0Z0Q+vGPnfqM/4rolswUvxBvlJh05ttICBd6B41CxcKqmTqmKcZ11h61yKXZtdE1zBLv7OJU5ltCzy//AZ6CHYHNA3a5CxWvOfolIyT7iMpx53HROPLBs5NDJ1tHCslLuYf0hEliFVM3Rlpjn2CfBqxBdMOWEn5TN9D/O1c6JLmOsBVydXnMsKZyYzna4mRxFcMNXwqeBPNh/TD+055Qupt8iF/5D7eWzjaPVI08jR0Z6xFu7f/G0ig3RcydSdNZHtT8FsxGbMboIXZQ3dkznPmc/udnF2LXJ5xdax3jq10v4hl+CfomfA60GJthLjIm2EcrlUIwTx73Hrxx6MMkYTR/Fjp8bvTkwRbBTD5AB1sv6TOR5QAQlFbsAuIHIpVvoV5mVnKfu5S4EL2aXRmcfcwFhF5RPhuF7kLqgSsNGi0+er8+VoSbfAiwfhHht7Nrp9VDiKHm/mBvFpov3SqcrV2p/GOFsZKBp+An0Fn0o+R5vtdIblwWa6rHWBu1idZ7HgTuG0IRIHj0V/h6U5+DDdaNIIFcHSYSGOX8/1cNS1etRpjD7+javjVQhx0kpFm8bVeN1KBp2FdaP4uKckFbWSgWAVOH9m41y+s0udWaxBBoFWRcLjQegix5zV1lwjyuG3ZkjBosl84MTq8U1jLmOHxs6MR00c5ueK3kjXKvdpq42TbJ9ALvDl6OV4GDmBpmbQWQ+dj7A/s+PZTOd5TB0dQ31NHMT+Rm6FWgAnLW4Gidom3yqZLfzK+8SdNX597PiY6/ga7kxenaBFPEPup56jf2fmAK5DRA6HMEaYR8mm/3S6zWp0XsSexN7krGOOM+JpZPIB/Cl0FlwI2mvDmKq0P5RwWalIyf88QeYyxmvHfMZDuUMTPgKbaI4Mq3LWrTE125LA9+H16E/4RHIujc/gMpOdNc5m51xnKIvidIl2hGzFO2PU8HvgIHuV6aBuiypftlh8XBDDO8M9OO48vnF8NRfCSxZgxLkyhAqvm2P6YuOA98Gfoc/gsWQO7R3jGdPIeun8wlnPesR8xXCiQclH8P+hd8CZ4ELbHBNZR1KtlXmJVwnCeQ+4+ePbxgfGNdxCHlIoEWfKsWoX/VpzrT0QshdxCZNLKCG/oMGcGpkK1jrnUOcs1m+nu/RhyksiEAdFNUJ3AvHWUsNdzXdFvDRUlMcvndjBbRrvG7/B1U0Y+VdF76SxSo52hvGh1Q6cBzuO2ooDkNyp5fQGpxiWkYVz3sUKYU5j1FOrSTPxu9C5cAT4rc1xc6sLUl2VLRN/FFzjkSfiuWTuHW7txEM+SgSUblFM1uQY7lo0gEzoIeRuLIM4iwKjBzl9Yd5i1bCyWF7MRQwNFUp+iO9CV8CPgn3tHaanuncqlLxd7CzU87ZNXOUu5Q5wobw2fqzIT3pVsUizyfDeoRw50KPIHVgMMY4ioIGdjjDnsvax5MwSp1H6dupeEhIfh/aCj4Gu2NJMLg63/FZ2QawQCHjHJiq5Rdz5E094VwRkMVt2V7lDe8nYZvUArXPkuwjXTuyl/EVPc7rA9GaRWXOYPEYfbTKFSTyPfY48Ap0EFFk+Gp5rxhUnpQ9FKYKjvFUTam7EBIf3hS8QvpUI5VfVZ/XFZgAgE7LHoRUEwkwykhbDqHb6wOQzdzCznU7TvaixpG4cFY2Ct4HO2qaZgnXzVB2yKvFkYQZfM5E1kTuB5W3l7xAiJG7yt6pzulcmvi0IvMzBEyp+HSmJeoE+2SmN+ZiZxZzh9Iy+lHqJlIy/iv4XvgbsbueaanRC1Up5puSzsJCfw3swcXtiCu8m/4KQLvGRv1Qd0d0ytdhI4CT4ZLQUF0fCUefR7QwwcyHT5qRjTKPbKD6kHpwX2hduAZXaTpt26Z6pAuRekhfCEv7/eD0T0ol8nosgSNQkUcgPqZfpD5g/22VgHEKPvor/RdpGvUzHOnGd0MzjTlmMXTQQBUV8hO1GNkEfAFdZ44xJ2svKJNlGMUe4k7+RR+St523hM4UrxdGyE8pwrb9xjvUcsAhaijyK5RP6yFNpDEa60x+nO04ljAg6lrqA5Ik/h34MPwGeZeeYSfoUdZ28XJIgmiWA8NfwdvOi+U8E70UzpBsVGnWrfsJMBUyFzEcEYwrwNaS/qUvoPxjbnXY5/WFsp++hCkjd+EWYU4i9kOkAtgVlCNG8VJyVikWjgr38r7w3vBn8O4KzIqyUrris/tvBr6v27+BG+Gt0GH4WSUYx0dYwvJyinW4xptMXU7tJzY65LiJOQpYAIi3ehlmaekWB1ElMEebz9Tw57zZfJBgRbZLuU6jU5fo6h/unQtgICXodfhfJTtHSpjEUDD4jmFFHq6IEkSj4a+gf8ALwJftm8yb9a3WCIkXaKJIJPvN9+NP5bME9YbF4teyS0kVrMaCtwcBMaCJSickg+JKPUhPp8xlljP2M43Qu9Q15lPAEa0fSYWDQqLXZKNRmOcx6joQjuiB4yF/J7+IbBL9EHClCsUrN0OPM3vZUcCachf4PV0jMpGTR8unrGFsZlfSttD0UEXEQtxp9F34HfNi+zrxDX6JeotgpxYqThSzBU34/v0IwT3RckijfpcLqpEajY6dwgVmQ17C/CfvJT6gBdAwjgfGDfoX2gzKHtAIPxGQiciHJgCBLpGG3Bq3Ey26Li4T7BHw+XNAjyBFtltDk8ao/2gfGJ9Yi4C/oA2QEdj3BgzyHOkqrpQMYp+lLadcogQ7UT6DDESmQCICnJcywX0NTuss+ifuFrwXugiyBr/C9qFVyXP5Rlaijmhg2X5AvzIQ8hn1GyCQvo3bSHtO/073oY1Qz+SjxGI6O/gu+FrzYPte8Td+gPuno33rxN2GBYJGgUFAi3CAulJ5SNKi36XPMC+zLwbPhSPRW3FpiP/kbVUM7Tl9KP0dDU2WkFIIz9jqyHFoFLLVWGa3aY6pN8g5Jk2iD8KPglWCW8JnonsRTHqR6pF1uzLEuBM6D+iA/Y0bw10nFlEQaiz6NXkm7Tv1OziYuwdlRWfDV4JX2NeYLepX6i0IuLRSTRE7CFkGscLYIJ1ktS1Fe1UQZaBYKgARRwK+ie3DviEZyHrWYRqb/pDl8HuUP0YArQjMRSZA0QKZlg6FKs0/5nyxdck60U4gSzhNmi+TiQJlaEayp1N8zX7dfBG+E49FLcPHEf8nzqFtpvbTrtPtUK7mCaMdVO2q9DLIBsNNyy6DRvFE2yQ5IfoneClOFV4TnRUGSTbJw5RYN2NBlrrP/BN+Eh6F34aYSr5CTqBm0J7RptGTqdfJ04n7cJPRDeA24y+7gp+GEJkt5XpYjKRKVCw8JRUKY+I+EI7crZ2qlhmpLMeAZZCNChibjy4gj5JXUONpKWg/1CaWaNJ+wGotALYEdBV215ZkUuiPqHYoR6bD4iKheWCPcI2oR10sXKJarm3SnTOtsuaBQWB8yEutJuEHaQnlGDaCBaL7U5+QTxC5cIToUsQVyBvDQ0myYrLUpw+VSSYo4USQSThPNE8Olc+VeqnVam6HR8sXxF+E8RCOahztDvEfGUbupcup8KoHiS3qP/4TJQb6ENgJ5VoJpk46s9lJ8k46K34m8RXNEQeJCSYfsmPKFxsvANVfaX4A3wBUoF1w3AU6+TzlDraBmUX0py0gAggu2FRkJWwM6YXtvAuufqd8ogmSpEotohWifaIr4k6RCtlK5TyPVPzcfti8Gu8BfoDqw1wiVpCWUbOoVqgvVRo4jDeNB2G9IDiwXtM/2yjHLG3WRIkW2QuIhviH6JDolBkid5D+VvZrZBrhlyP4FvBUuRCFxnwhtpFxKkCOfBsot8g9iNn4FButwXU+BtVawaZsuQD1XYZMmS3zFP0UwsU38QNolv6Wq1s40oqzDgPeOunxGF+IiiV7k3RQnKpqaReGS+gnpjl43wF0hswCHLfWGedpJqqvyXVKN2EVsEJ0Ul0ruyuBKrTpDzzXl2Q6CYmFlSA3mO95MfEZ+TtFRblHOkNuIZ/DFmINIBTQctMr2xITVV6v5inOyMsl9sZd4uXimZFiKVfxWCbVrjE7WCcBbSDriPvoSDkScIHlTSigPKM3kBaRUwjPsZZQr/H/gPDvPnGaY0Ewol8k3SEmS9eKtYi/JWek5OUPloj1u8LFI7PngXHgJqgI7j7CQVEreRzlG6SOfJt0gEHAU9Fc4E7IQcNMiN5zRHlCNybulGyQvxTfE4ZJD0g1yrrJPE2aoN5+3zwArYAtRa7F2PIb0DzmZkkv5Rt5OOk3A4BgOjxMA2QbIt+CMr7UPVUgFQHZT0imuEq+VfJI+kbNVFO1GA8hSat8PpsP3oPZjoQQIaQ2ZSXGh7CQzSR6Eh9gnqAz4e7DGHmd5ZsjS5qq65QLpXYlWDJaUS/xloY561Dr20hrLUUAUpBKORWuxywlxpB1kC7mLbCcdIa7Gl2PeIVNgj0FCW5y5WH9Ik6dcKL8nPSahShZL5kilMjdln9qu22Vi2lqAe6ESBBFTh7MS7pIukzvI68nZpKuERNxmdCTiEwQBzLV+My7QzVAXKp7JQqXrJNkSniMKvOKEaru21DDdYnAgPhx+GLUJO4QvJ0LI98nHyMWkVGIk/j/MVWQI7BZIYEsx1+jvatqUF+R90ibJdkmlpFq6Vf5OuVlzU482v7ctAimhc5HLMCYchniCNIe8jTxAekAsxWdj1zr6ehussGdaKg3HtY9VsYqVsiDpc0mD5IXUSz5FOapW6XJNEuu/wBDoPcQX9GrcFYI7CUeeTu4kfSLK8LexFaiLcIKjI/WWNKNFS1DfVxTLdki7JFJHPzzkwcoKdY3O3VRgzQXKIAsRu9DeuFyChDhIciV/JF0ntuOPYgtQh+FwyEZAnWWaEapzVRco2mQ3pAApWyqWrpDvUCI1RP0mk9F6F+gPveDA5xTcUsI4sZykIG0hJRK34LHYcJQRdhjMtc+wdBiealtU/yi+ym5LPaTLpVmyYTlSVaRp1Ieay21/g0ahwUgvzBvcM4KdWEj6QoKRPhC+4WIx6UgzdD9oxDbHrND3aUJUMMVu2XlptrRCOiF7o7CpmhwatsMCAdwGI+DRKBB2Lp5EDCY9JP1N2kzswr/BmlFc+AmIHrDKKjC+0v1SZynXyTmyE9Lb0sWyGnmzcolmsT7PFGwrA6ZCryOuol1wXoRrxHmk9aR64gnCA1wgZioSBrsMstn2mp0NOO0GVYaiVNYrfSZ1laXL8cp16ljdemO3ZRVAAs6Gb0S5YRfizQQTcSZJQhwmhOAlmEAUGv4CzAb8awkyInSparMiTR4mq5WSZWj5K0WP6pz2kcFqPmZHgnfBHiG3YMpxpwlviBwSn2gn7MBnYV+j7sFTIRWABGur8YmuSb1T+UK+T6aTesnA8jOKp6op2gzDXTPN/h8IDotBYjCbcAmErUQNsY6oJOzEL8aWo0rhWyFqwHYrzNSjA2teKjvlL2SusukyT/lzxXfVfO0iwyszx/4EhIBFIEGYxY4KzCI2ER04JMTgWdhDqH1wX0g+INzaYszTjav/dYwvkqXKjsk2y60Kd/UfbZvB03LfTgP/D3YFOQNzERdPmE7MI/5NXEYow13CDCLrYLvBVvtpS5jRXbdbna58K/8k2yBrlo3Kbzr4eEf32YizngIYwCnwVNQgRovbQ8ghHiFaCc14MO4Nuh/xGToXNGjbYY40TNVWqmoUa+R5sseyNPk1xQGV2IEggHmtrR+YCN2ESEW/xp7AlxHmEScRtxAsOBVmLWoHPBRSBZhntRq5Oh/NuDJUwXbEb5dp5ZeVJepVuq3G7xY/wE3wAGwQuR9zC8cmAIhRxBLCv/hm7CF0EeIWNAHUbNtsjjXkaodVCsV9uVymkj135K5QbdTOMpwwT9jmgF5CyxBH0XXYU/gnBCKxlTCBz8WFOXTgEiwdPGzfb4kxxuteqq8q8YoIOVR+Wl6g+EfVormr/2rC2vYAWyAGeAMqDIvFzySMEWoJIMJN3DUMGuUM54JPAjjWXmObLkADUK1TbJd7yc/L/1PMUF3QJOvnmh5ZwcAlkHPwNaguzC8cnlBM+Egw4R/iXmNCUDPgzpBywAory0TWb9BMUt1V/CfPlL+S5ysWqa5rUvWzTLesOsBMyG54Nuo75ilOjv+XcJ7Qhv8f7hAG7NAfJfgeINFqM9p0Sxyjnys+ybfKe+RSB+bGNff0b0xKaxbwPqQEfgo1ivmME+P3ExYSzuPpOBzmNPIubC0YDyixnDbe1mE1INUlxQ/5HbmHYoHSR33EgdiVDvWDgqZBcxAQdBJWijPjlxJIBBb+OHaRo+bF0H9A3vZe8zcDX3tc/Uy5TFEub3f0W6dUqDfrZhn3W2rtTuBMWDTyJ7oGm4jHEyIJb/F7cW8wc1GX4HshocBh6zPTU71Z06AKUAYouuQhikhljwql/aT/YlJYpwBPQG7Cc1HPMRtxN/AUAg+PwV/BHkarEBBYJ+icPcXiYZylm1DblYUKtIKoqFa4qgiaE7olxsOWajseHANjIf9DP8Ai8a14Kf4vPAc3E6NE+sOpkHbAeeti0yZ9j6ZMFafMVTgrrivylZvVBdp1hu3mPJsa6A11Q/xGSTBncSfxnfh9+B24esxdlAqugfwC7relmpMNN7VL1PnKJ4p4xSnFfiVWHaqt15eZZNZw4EbIdrgnah3GDZeIL3SMvYHDYLWoNYi90GwQxt5hrjeQdDVqmGpYsUJxVbFJKVDpNUf160yXrA0AMAQLr0XSMYOOqC/hV+Ov4OhYHPoc4gX0BGiqnWCBGWforOooFUJ5QpGnOKLUqqyOsatMJ62/AGqwCVaItKJ/YyW4rfgU/CacGiNArUYcg64A+dh1ZrVhis6kTlCxHFF3KAqV4eoUbZ0+39RqRQKjIRHwYSQL04jl4ubgSXhf3EPMKZQWjoEKgYW28+Z/DWptpZqjYipLFVglXPVYXaVdasg277S9AtZBiuDTUesxRqwYF4FvxP3CUjAjyHj4VIgLUGxtMSn0m7Ur1QIlXjmqWK48rUrXXNQlGhMs6+y3QW+gBxBC1AAmDqfDwfAbcD7YbLQGEQELAAMAnZYmI15frBlVPVUilc7KPuVkdYj2kX676Zj1PaAVXAfbhcxHr8Eexalx33Cd2BzMFNRXeDfkJ/CGYx+4ZgDouOp5qlVKlvKo8qIqSrNWBzcazHT7FNAsKAdxA3Ueo8B+wtXjJuHsmBD0IMIT5ulYddAyZPTWd2uQ6nZlqnKp0lN1UX1Ka9DXmrqtFgANAoTfRZahl2KX4b7i1uA2YFvQ75FO8HAIE6izikxMwyvte3Wa6pByuVKu9FDLNfF6hVFsQQB8wK6wFgQDPYhB427gtuGeYCMwUahfcClkDPjblm9uNWTowjQvVd+Uu5WDSqnqluaPbrVxtqNKJ0AnoFMQ91EHMBXYjY41v2BXYQ6j2IjF0L9ASfZAS4axUHdRI1NJlNeV48pB1f8013VuRpCFZA8EBUEV8LmoyZhr2Km4Wbj32PWYK6hYxFHoKdBW+xLLPuOo7quGpsarPirNSpnqsOaOzt1oN6PtbiBX6BA8CeWF2Yf1w4XhLmEzMFtQNMRS6FpQjn2qZa2xW1ekcVG7qRqUbioXdbGmW7fWmGaZZV8Bmg9FI5ahojB7sTQcGpeLtaPpqCK4HmIBim08M8V4U3dOg1B7qUTKv1Tb1S7a2XqxscUyYOeDWqH/Q3xwMOcsForrxgKxF9EXkDT4dMgMYIItzXzK4K6L0QyqPFQk1TuVQP1VCzN8MT23fgQUgs/CsEgPdAHmGVaGvYw968B9hQNF88E5gOnW1abf+tPaevVLlbdqlspNfV1zWWc3VJvLbDXA75Bd8BbkJzQM+xVbjuVgB9EIB4YQUCaIYneyZBu7dC2aeerdqkRVgapWvU/7Rp9s4ljdAG5gE/ScI9ZsTC62CLsVexijQY0hVsKug28DbloLTARDq5ao4amWqo6qpqs/aV7piMYWc4WtEpgPWQEvQl5DD2BOY89ghzG30KXIjfDvkBZgq23Y7G78rqvRrFTfUx1QgdUhGoU22NBk+mDNAzwGr4MNIriolZg07BEsEWtD56L8EXeg5aAae6sFZDqq36DtVg+rLqrGVSPq3dorerJpzNJjbwY9hYYg5qK0aAB2LdYdG4v5gnqDCINtBO8DHLe+NdENAm2shqN+qxpUFauDtIH6/4yLLZn2JBADWgAXIB+jKzHpWFfsHAwPpUSch7WAJwBKK818wJCoO+qoTa1KoPqgJmjtuuVGmsVqUwDrIevhL5Eb0HcxvlgcNhsjR0GRr2FaMAHoaptqfm3YoHup2a2eUNlUpWqm9v9QSwMEFAAAAAgAM39TXUFhNc7HOgAAdjwAABYAAABzb3VuZC93b3JsZC90ZWxlaW4ud2F2DRsFdBQ981x2z7VXuV7d3R0KLVKcv7i7u7u7O8Xhw4o7LS2FUqi7u1zbc789l/9eXt7uS2YmyWRmMm8ymTYuM3NDMgw2c+SMjBXrt/EoMBgM7iieM2Cw0a9hMASMAlu2eNvi8Q4YGGw18IbxmOvmbwwnJ6SMWJq5Iit88rupLdPuT8NOZUyqHzdx9MOUwZiEkBKvtxxP8mTUcuM1OWHQ3n6nDijb+QuV3/DZ9P7S20dvot+Oe9/6qf67e9Gzf6Nqa9tc+SZZlPEyqpvc67zIJyiMGN+etjLzStaIyXOntk59N2V44ulxb0ZtSFZGLQgUu5czYvEbre9VScMTOz3r1aWqogl5AZ+fve94W/v29Hv7J8+85iKoNLu+uBMuaFRrbVyQyN7t6R7yK9YrjZG5Kss+6feUh1PuTSoaz81oT3GOYQaheaGMNuwkc4+8aWB/q0c1vGRWwayvgR9F756/W/GB+yUvn1mMrJzQ/LavT3rFuAnjT1/u3hToH+OWujXDOP7kJNSUpZOfTegZEzjyS3xe6G6vkezlQKrVX7mff7O1smr5n1c/Gr/gP655j/zQ+Kn0e2HR8bL+hhM9HpJZhjI0lV7n/jwoJXZU2rbM21lnJ4VPPjrxwrj1oyYmrY4g+J7jZBAe2hCqZv6h1sVV9cUuP/Z98fjo/+H2xzVfDxbklryuietQDm/RTkV4UDa7tQbIomen1maQsxQT/zcpacLHMd0jNHHJIWSPWroY3ai3iXq6+us2/Oss3PJt7SfhB8PHq1/vFfBLPGphnS5CtG40ahGtz31y8Ii47BGpYwqzXk3UTXg0rnzUo6T1ESd9ZjhNAiTmXBnYd6LxbNm+olffZ3x+8vHpp+nfzhW6/PtUp+vaLv5uSMYeYiK8MsO6Epalnx/rMcEygZV1MHNRminmv8A/bnXkLHi++sng6VZhZWDx6/wvX7Z8Mn/K+jaq8M3fpLrTXd7iCw4Kz5mZXjfCfBLPpe8fW5gVOqFi3IvRxmRUVIBfK+ci2GEZJZ/Rd7vxZNnZItN31hfk56ovi/Nv/Pap/NRSx7eq3sPmkbe6rQ38F8NKg2WOGP82K3G8JgOR9ipmbOB4t1DyQViN6jn/Zgu38vXve/nxX59/Nn3xyjf9Sq4433xg4LIywS4ggq7OAVejUam0jB3j0Fkfxp3IeJu6LsYtMMzNi3wMNqCq5te2rKkkFbN/lH2d9OXLV0V+42/XyvUtM/lzVFL7XtIe1wUBz6OFKX9Hm8YuHC8Y+2j0t5SN0d4BGa7TSa32hapd/DcteyonFR/6kf1N82X1t6c/DhZ/rOS3POXvUbXb40hY1xJ/RRQ3RT8qfmz+uPVjF40uSCmOLg9IdcshL4bzNAuGHrYtriaV2At2fX/89eK36B/rf9vKrzT96XOTcy0jACu7wTsjXJSwbOSmzO6xN8c+znAeERs/MjTH8wPTjsWaxkvH9R5snF0e83v+D+z3qd/S8goLH5W8rD7cVjxoVn2wLyfmOLf6vo74mvh0ZFLm5LG1Y0pGj0u7EicIeeTpyxLiFpqR8on9b5svVGb8cSkckyf4hs27U3Co+HDFjKYXvRSpl3EdZhe91d01SBA9mFyXviezZMzTTP9RG1NexfCCPT0ozMm4yeY98tQBuEPf5CWvfp7Nf/vdI6/nR9Wv36WH6/50RAyvV9Ps30ETe7tXTciH2LYU0qjATOaYioyZ6e3JB2IOBwd61rBKgPU2f/X04azOJfVDZbRi10Lf/NF5e/OLCrXF6vIjDYu7MgSd6ipbEbCANd1jUhA2Oj2pcsS+0SmZqMyWUSVp8oRDkR8CfrlDjPt4wHZGvV4A7z7XOLFyf0lmUeUPXv7k/GkFLr/O/z1cVdrk27NQGKIZa1uJH8W44bCCd8N74/JSMOnvRz/LGBq9I31Nane8JqIj4C9PzrpMkMPH6ruk4oHX7bPquRW+JVeKdhdI81X5xwruFPFK9OXWOly7sH+tZA60334Hf4CucP3h8znkQ/T5xKC07enzRreNlozKGalLYSSQo3DBvt5XXHbTAPwOuwS6LX3Hn9H5rRGqCi89VGz6+abg4Y/WHxMKDUUVf96Vna8Z1/y7q34wW+ajc7bjcbWUDE6Gx1v/pWFjYkYnjklNHxkwyjDq7ajJ6fy0ncnO8X2R/cGxvmbuJPZEMgfbYLuhOyEvGl7Qu78tpiGn6lfptz9nfo36KSjYU2AsWPzz1a/KP19L51a9rD/fqur+OdgjidN8NMUiXuFNFIJTFdfHBxM0P9wtJj7hv+TZadNGnkmHj/qW/n6kKu1QyqrED7FrIh+ELPD/7lnguo+Fo2zFVyMCLDcgb8WQcGgguru3VdGwpWZDheyf9s/p3++KVv38UnizEPhJKLr961Vx8t+Msp+V92s7G9e1ZXTPH3ghcJblqicYtNabyGD8SxKSEcEJ5oo9l/tdD9oWZosMjbXHb0zal+KVtnREysgPI4tGrhn5acT9tNDU5cnjE3vjAmMiIvWhx4K6/DDeOJ7A5SU7m64iHQFImDvwUGuVYbc2WekkpQqDB9f1NXWtag9scW1Mr7tbHVKpK9P/i/j79M/04qTf8399L8oqYhWxiyYVfS/K/uX5m1s85s+dEva//NLD5Wsqt1Xn1HbXxze9bAlrL+vc1OPbL+B/HD4umi9NULDUWm2d/oVpn3UcjIysQh/E+YHFxKmUelo68z+2jhPruoJ7lHfB86T3et8R/rDAN0GZIdWhI8IfRcgjA6KnxayKXR+3KH5kAi2xMfFoknfyl+T4lNcp9NR1qXmpxtSQtBlp29JOpl12lFNpO9Pmp6WkMdOGUz+m7kyNT9Wk5KbMTyGkfE9enIxLfp00KUmReDExJLEyYVUCJuFJ/Mj4vriDce5xv2OXxeJj38fMjkHFfIheHM2ILo86HJUcZYr8EXkocmwkPXIg4nPE2YhlEekRXhG4CFV4d3hNeHF4fvhXR8kL/x1eFd4ZLgtHRrhFJEXMizgU8SKiMQIeGRm5MvJ+ZFskMyo76mZUZ5Rn9NroL9GImCkxD2NUMaNib8SKY1PjrsYJ41Lir8QPxycknEvoTghJ3JtYmkhNmpV0N6k7ySU5O/lscmGyOJmWEpMyLWVNyt6U4ymnHXVPysqUCSn+Kebkv8nHk5OShUlnkjyS3jjW9ziBkLA6Pi/OGhsTuzBmX/S5qIuRxyLWhmeEUUJrgg8GeQR+9U/x++rj6X3Ys5HHcZ/qdsDlAecz+yfzJ/0z9SH5KHEBGIG3YopRRxCpMJ011zzPSNAXaNerecpm2QXJBBFF0Dn4duBs35ae5V3LO7a1XWn51QRrnF7/ozaupqJqe2V8BbOcUMYrnfLv3l/c36slKSW4Eu0feEl4yZESXcn5v5n/vEo9y0aXn6qQV+6o5tYK6mobWppMLUntNzuJPXf70vnWoWrhW8lD+UPVG+0f/YAJawuDz0YdwT4HSom9FBldxurhFLqeck/xbPOe7VcQYA/yCOWFGyJyo6JiLsf+iSuLv5+QkfgjEZbESNIlPk30TFyfcCJ+fZx37KtoZFRoRHCYPTg3MMT/rE+p54B7r+tvzhlWKr2XvIkA4Tahh+GzbdWm0fo/mgnKQekF0YRhTz69z6v7fx0vWr2byxty6m7VlFb5VxaWnyw7VfrrX8S/rr+//vb+jftX8e966e2y5vIxlYqq8pqWOlrj3mZKW1XHu+7PfW18Z8E28aBshUqvvWKIsXTaDyE9sYXABFIlNYF5yanaRc6Ve1R6H/WjBm4Pzg19H34s0jv6Ysyf2F9xx+JJCQsTdiRMT9DHL46/GnchdlrMQFRq5OrwZaFRwS0BU/2eebd5iLg9LnlO+5mhtBrSYlCK3YRSwbZZzcbTOg9NmeKgNEsUOhzEH923v7u1I7vN2Py38Ud9V21gzbOqaZUhFQnlO8uGS0+WzildWHq91FJ6pWxW+YSKdZV5VWE1NbXX6g82nmv+0Yrv2NZl7LnZP36QKhCJaqXFiiL1H6jK0GoesEngCpQMOwBUE3Mpu+gxrF6n7S6Q2wLeW0++t9XX5N8ReCc4NfRXmGfEksgjUYei58WwYt/F+sbti3sfVxL3Le5MXFpcc+zE2BcxgmgwmhmFjuwOvx82LrQ3eHFQfUCY/37fH95ST4pHgHucW5JLPCeUzWXi6SpKCymPcBc4iFuKGY+KQvBgdBtgwZlAA1sXqM1Ur1HeltdL6ZJFou8C1+Ezg2j+uX5uX2HP6m5e12DHl/YrbXtbN7VsaT7UlNNY1KCsD6nfXldW61N7oQZWs78aWX21KriqpnJXZVDlcMWLii0VoypcKozl3eWl5V/LX5X/V/7YUXPLP5f/Lm8oHyo3l9MrQirGVayoOF7xtOJvhaAC78CcWLmx8lLlx8qGSnUltSq0KqtqRdWhqltV76pKqlqrhFWGKnQ1pZpTzav2qfavDnBU72r3anY1sRpRra0aqmqq+l31puqmA2dl1aSq6CpOla1yoPJfZW7lhcqtlbMr0yr9KqmV1gpxRUdFdUVJxc+KHxWFjm9dxUCFsYJdmVS5svJOZWula9UaByWv6ovV2JozNZzaz7Xz6+j1rfUvG8427m3a03ymJbe1o82lY31nbdeonvLehf1Y/q/B08PLhJPF46XZ8o3Km+pqLUW/0JhndrOdglkRO9E67C7ATNhPtlJ3M+SsuZwCFwr3f7wTnk+8X/pe818WyAh+HAKGTQpfGZEdyYh6HGWL8o1mR9dFTY26Gfk4YnM4Omx+yJ6geQEYv53enzwKuNdc0px+M9yos4m78UfR++BrrdnGdChBNUK2UHR/CD2Q07O8c0NbQfOMxpH1x2v9aoKqb1Str3pftbT6eI1THafhZNPC1pyOmB7/gTXDWnG+4qO2zoixZ6KO4T+QCui3nGLcjnvs8kEGsINfhr4Ld49UR3pGvY68GFERtjhkdmC+7wXPfrdip3T6VuIabAocaW7U/pPrhHv4q3u62gXN9xpIdeNr5lWPr3aqKav9X8Pn5u72nz3pg9PEDcr/9C9s+eg8wkG6iNPkzvV5ETA7hB1eH7E7Ehe5N7w1xD/wkA/k/pzznTYZzEH+M6O0x6S7hyi929vrmzLqZTVd1e4132sfNpS1sLvWDNwSbVLlGxMQH4AB2lnnzR7z/VyDT4TtixBF/A1nhAoC5nnfd+tnLiWuRWWaR6pfiRr7YZ1bm5fU62sm1Kx3zEzWQu4+PgjIJuvM9rd4kP7eZbTXrgBcaFH4vojIcHHwLz8B7z+nSeSxaLhZqNwswPdS23oaPtR+rjHWbm/Etm/qmytapMHaqnHh9FzXYm9yUGIYELE4fGRIjd84Ho39gLAPnqLbI6no/9L+vpFRx6ltqotqNnc2DCYpHpnmYYqpvq4i72NB58J+hsPD1gQmenVxekkKRLkuXNLXd6ztVUN+raA2rnFX+9gBlizE+Autp9pcKb5ng6EwYnh58HzfeDcTdT16hwEhNfdFtU1rqK7tqtvcnNT9UgBpouCLSXucz3mXB90Nex9mDSrzvuc8jvQPFqrJGWZ1HW06XXekbkcTu6t0+JHmInwJWeiC8+0M/hO2K5QcYHHHMzIwYv0o8eUeUbNr/ZO6C02nuzoEOyAWag5tkLvfPzp0W5hT8HrvIM4a8KhFLuP1r2gtqi+pu97U0vVFaNclYzoYUz2mBPaG7gsNDtjhvoiWhWzVvBma08FrrK1717i9c6JADL1G1zOeeOQGdoZ+CZnqt8I1jDTFdlcu7etseVDfXX+11WUgUTkClkGZyf3lHxuKC43xX+9mI32wnZSf6NvWcqv+ZsOMdsSQl7YK1cMY5ZkSdC9UGrTPaylrOmYtxB+qb29o6K53bu3s/6C8D59Ju85bFDg3FAra40VjXUdP1D4ZrG7b3XC1wa09fIgDXcV4sBd6LwrWhfT5N7utIw1aqiS53beaNPW+LTf6fiimwQto2R7CQEsILfCn+wVKg22E7GIPptmrYVGLc/9L5SNENOOO58WghyHb/NtdHxOWmnCiOZ2XGzUND9tPD9/S44BW59F+aSFlQU5eNxmvEFnK43325oMNj1q+90tUh1DZrKXeo4JvB0/1ecoWo/01OQNurR8beC0tfSblT2Q3M9DbPXha8Ffvu6zDqNuq5P5ZLf0Ne1qz+TO0G7ExnE2++cHiwGkeudQKG0/K7t7cVNqY0rlL1GlGkle4GwJ+B8f5LXS+g0uCuvglrQmNzq3vB2o0SdjxnEu+R4NhgfvdDaSbZqJI0NHbOLXZ1ANTTEQEMhVeP4OoQWjPOTQ3Oyjt7brcVNK0pVsodYdNpX/2TAtKDfrgOZqOgZVJ53TXN/U3ne1mylbAntBVnqlBPYH9HgzaU9teyfaue02nmwm9SYpaRD1zuffVIH7AG3cEebz5lPByx6gmYYu+P0SDxK7mXPdtDCL4Y12TgZm6zYPJbalNE9vnDecbbhJa3QT+u4NQPn0sMzJD2dzLaXFqxnaPlN60w+lbPT8EIgPP88ZRHlheiVZ0Vjelt44Y2KOZhn3IOes7P4jhd9P5GO6VNoZf09rVZO0YFuaas8l/3A8HHAo875lNJ8L+Ss9232i+1DK677lyJErLqvUWBur8clwTwUP6K0Px7fhmQXvZMGTIIdx0m+mfEyj0ymUOII4o7vYeb/FtudhjlgXBnRk1njGBf/zLuAtIOtN9YWjnluY7bRZ+DPQSN9F5s++VwCafBM4SLEYbyJ/c9rG5s/OQqNKsIlm4d/1bAjZ4yuj/g++Rp/WWtJS0JPWukYfBP9EDPR8GXPNPcz9H/mw5Ky7pCmihtFEGuGo9qpJl95IGLPWTuD4ltBsnCk91Mlow7b/5XG0TJsAp17s3oNhX7/IMJBhbBWs641pS2wf4WO1BzBt2jPeLALPvd9dBwnXTLNHRrvMtt9qSBq6pXiNB5nxPToDJL8X9CqXUlizL6D3SuqJV2fNOCtgKyDu4+/w8A9y9brMEaG/tzUFux+OWXx0fhjZAdOwq9jYvQkCkXzq3j/zC9llG7vNtW9ja0r1A/N1kAp1cVvvwAh74nHR5SrhuniJ52VPTKmgV9dyW/DE/JExymewD+b/0gbk+IcKtAim272jb9daF3QPCSMMfXDcb47XZf6TfO3cbbSQSoxEOBnRObzW3vx1AKFvtuWSY2x+fu/7uPn0u2aQ7Np5i1ICx/XBrZOf2wS7VfPhjymK37z4b/X19lrhuJ2fB3FU+g2md71u17e/6f8oWWw6BkFOnZ5NflB/bYykrB/fS+FCytu9iu7a1vPPIoFg51f6PON95nVeZ36CvgPeYtRlPMc+VMQZedqDbdnY8638ixZp4uBDmVXeib6vfL+8oNx5tGMXVbxTP7SN2pLW5dY4fEEo/G8Ox9XRvLsLnlV+7T4V7FCsIIFknKicOpXYb2+RtjG71YK6CYenGvWNM5ZZ6b/TD+/7hhTlFEsWw69p1ohN9vzoetc3qeN/rLqxRf7V9AJ4wj3PPegf7RfoWeCQ5L6W4oNcYZ8m7Byu789vNbTc7J/XniIo1AhsHWMtAuyV4nfEt8G3yonMNzEDCVniu7onUc/BfN6bDq92ns6dXPlypqDRGoNJJGey73DKvbb67fDu9Grk/2c7kg+hrZotqpihiwNhlb1/bntqZ3btqiCZrg8LsJ3DTqXROtnuJl4/vXN+13rt5xc736JvAj4gO4yLVJ1E8P7UH0fm8Pa7jSVdZ39rhkTK1lmtdhJ5NzGXAXTi8Qq8Kn1BfqTfHs81toZOE+hdIRN42h2vHynwEsAFMz+xOYod/x5PO1T3zB7IFPNkpzVRTGtwJ95j0gmHmbOUqPeZ55/o0+nR7N3vWug+7JLE11HhCJIYA0xiJ2kPyjSL9YGR/dA++60fHxI7CDkQXpae9L3NwtPCb9ITqhq7SjIfHYZJAO3kdY4uT3QXnfthjmdcb7zk+631E3i1eiZ4evOtuT5znsEvpRjKMIMKWIB/Yj5uP63M1NsUZ6QzR2uEq/qH+U73C7odd7zs5na0dwo5xnbpOaZd3T07v2P4AftzQOsEfUay0SD5bZde81s014izvbBPg3cj5mEqcN7iCeJF8n3qZvprpzf7tlO781EXqyuJ6uzvxlLz3HjM9BZ6LvP56sbyzvY94P/B+6/3O+z/vC94bvDO8md7dXo+8Fno5ezV6nvZM9dR4PPeY78HwqOGd4Y3jgbwG93vu69xHuHPcDdwu7j/uF24u9yn3GfcNN59bxR3kwt293bPcd7q/cO92Z/Gm8S7zGngsjzkeDz2GPYI8N3p+8FR6Bnkt8brq9dOr38vsRfCmeRO8jV5tXs+9VnjRvF57Rno+9rDw0nhr3Pdyt7pNcaW75HMynL6w8MxR9CXUleTpxABQhLuOCUP9gCfZP1o8TZf1CGiP2qK4IIuWaIWNwy2DCP6Cflnvl578bkT3pa5VXee74N3/unt6xvQhB0iDK4axIpmEqlin1kMvjNusU+ExaCq+nXCIYqBHs/2cS1zt3Gqej6fVc4qXk9c0TzvPw/2HazNnN+sj7RLJCziA/gYbNLvqd6pJcoNo0rA3/2Lfw54V3eKu6O7MHm7flwHYsEy0Wj5L89DgbvuAjMEfJe2iK9ilLnyuv8dRz2HPcZ6veWxujnMWayz1G/gbfcO+wrhM80f2RbhyENH/rGd998rumz3Gvj2DNuEi+UatxvQWvgRXQXrOyOfUuH3mTfA84Jnp8ZL72/kT8wPZiuuGPzHd03BlWwR9Aw96O7vfdnN7eQNXhzOkavU4kxx+FP+EomY5uza6Cz3iPPN4+9yeO+2mZYDrkAvMZzTLpNOHP/VX99R11/b86t8//FsaoZ1v+YeSEiYwNjqruMc8LB7jecddhawK8gOs0jZBN1a+QRA/gOwl9qztxfPfCvWKFYYl8AnAAdoizkbueI9vHs/dU10qGCWEP8jtpguqAtF9/rve9J5dvWn8iaIQ1QhTNZJGzGJWuuB4Tzy28665TmR5kUpQJtMt1QZRBH9T7+Ge/X2pQ/OkSRDVDsf70t5whrhTPD7ymG7lrEWk+6i1pjzlFuGSAW6vscfS3y9wVvYaR6ASSU2sKAd/TDyTm5V9k3wfTTMjVNuE4wZ8ehf2QgPnRLvUNZZ92BXUAxwRl+rxzd3mvJj+Hq+2TdJKxLX84t6E3oyBG8J9KptZg/GlbnFASXiJ7mjnXuoH7GOLRtUlXD0wt5fYt3EQIRVAJpgaPMm85TqZl8ib5erKXABmwLyhCRIJX9j7s3cH/4F4ofaU/bfjdovpSuG589Jchxkm4LN9u/aJeAe/qTey7+RglvSETg3nEV+yZrpNd4wV4lxLDcU+MT9V3hW87/+vt6D/q6BG2WnehKXQ5jk7NI9X7lrI7AG3w6xajfgln9b3om/W0AkZz1CMHCYxnFhcT57SrZJ9hDQJ+UrvJXMe+q9vZl/qYIvERfceTiDmska6qd0Xcn861ZL/ojjG2XL9EK1/Wl8dnynxg17BnAhDzF+uRe57uFzOUsoOdJ3RJt81vKh/Rd8r/k/xK60L7CS4nLnY9bz7fu7/OKUUM3qZ6aJCOfy2f3/fcf48sZN2tb0S+MEYdJnmfplbyNlHFWDWms8rfwqCBi71efCPi/hqs/V/+I10vbOcW8d97AzRKnH7rMfV2SJ3/qe+BQNCwTXlSPNJjJrix2Fz3d09XI8wuYRQuLNuspQ0NKp/Vf/2Ib60SPcHfo6Qz/R2tXHlbs4cdyoci7FcUAmFPnxL35sBmHCc8pBpEfoquY0d5qbmyl1XsHHkDpSria2EC+sGPPt9+LeFTcp203b0KvJxdqdrJZfnRnaKouzGoCyA+p1IzF/YP2Pg7fCgzEe/CL4JjGC8cvbjZnCxLlWMcYRNiNkGN0WBAMnf1B/ItwmWKE4btiOcCZsZd50NbqHcNJd9zCPEANQqU5rqnmjMYHH/xIHGIb2EpV1o5WO+kPUsyCWWe9oN4WyhUwlo5FcjWvVHdGcQPZA4EDaUI9arbpheI1cR7PRSTpqbK3eqK+D0llqFd4JPN6Qoj4nyBlMHRg/8HTwhclfCDIdhatxjio610eWb2xO3ZJdvrC0UGe4X7JxBqdwnfjXUPBAw8J4/VvBcukqDN1sQn4DH1EnsmS573K67vXERss/SDOAjFMr6EFLIF4rGDA0NzB14xS8cni2JUsn0rvbJGFeiK13PXuOS6bbNzegidzrKsJJe4YRwpvmc9qn8nUg4tJ9/ZoDJpw0tFXZIE9TJhhs2PYoJvqBsYEZx6lyC3BLdYK5XOETWfeouQjNGBSOZV0CRymcSqcB3aA3/70A8P28wTnBD/FG+VLPPUGsNQi7DTST+pF5jfnbCuRxyZbtVuv7n8o5jY+XSa8inQTMmA3HGKjIc1K5R/pbmiNACylAx353vy2/mew4hBCtFI6X7FThNje676bPtNeI8ZgxQRkRQhfRNrMtOmc5nXea7/nR96xrpOtkFdN7odIQ1mdFLTSFvIZzBX8CcQh6BHbfeMv3Rk6ADaidlv6xLQhRvF7IEiiHk0KTBBv5Z/m7+Lf4wf9Egcqhq6PtwsUAk9BfvlfRLZ8hbFAtVCvURLUuXq082lpkmW2qso+3vYTTEKuRHlALNw47CzcIvAuaAYwi+RCPxJ2kn2ZtSQplDHaQupbXRRtOf0m30iYxrjEYGwExkLmEeZd5lvmMWMH8zfzG/M18yrzF3MbOZgUwDo4ixnxHNGKCfoHvSP9OSafnUYOo1ipKcRj5CyiMOEGwgASQCMPwQtgBzHD0SpUJcgwfB8mzJ1m/mINNtA0q/HmrRjFJ/VUYovskmSrXiD6JTwr2Ci8OlQ/5DnwY3DM4bPDDYNrhuKGl4jOCSkClukdTLkMpVarP2m/6G6aL1Nuw18ifmD/4DYS+ZSdvGOMua4vSdk+c8wWWNC9El2rnHicj+x6DSDKTTYCNWiOyxV5hL9EOaDKVd6i9uE/CG6UM/BnlDmcP+wp9ik+yfCtA9M+20z0C54u8TP1GjmXa2lmN1Blzozm5OMcwtVIggxh5B6C2H9QvV1TKEOFSwa8g8+GeoRoCXTFXs0MabJsPWY1IJm6h5zBan686tzpc4Vaw3tDXEqdhCGMNUpAlwyOyT4dShB0PlgnuSHmWsPsa2AB1K8KT9Y/3gFDl/53xgdVNvgwtRxZaFUJP8o2j9cPbQ2WGLaJlios7d5oP5jzhMn+q02RlwdmULqWKgCrHQtEetkuwQnBpaPmwXWRSF+g0wV3w15RFLwIlx3s22UGcDW+GzDJ7KFlHacMdQofC6/LXOZp+FP0Jdyg5y3sIZwwwnuaOnmj3UveKbw8ohguiIYrXDroQQOAwYx8U5mv2ZchWbZM3SzJZ8HvYarhBxVEOmK+hZ5HMsJYfvdJr+F+DAFkNHpa6C4GGx6KOKZ5mI9aHWsK2cFDZAKUBPMCkVX4Sk4QvC34oUkwi9hnKVPcBpZFlIZqSrgS87Llgz3C4Wap7Yd4MVjP2c3U5y6gSs2VSumCrMHp4t3q65YC8F45hXOMXsIMo9lEAfJGMJYgWXZFcN+9E4apJTFOcpXYeTmKUKf+HXYZT0k06AZFCG2KGcM/R9OLLZIn8liBT8kh01+mB/0XROKraaPBp5F4JJ7gyXiu5pwuDrSBPZLE4EfQl2jDFZhhU8FF5TcewSwjOWL+cK/Q12rJEgsw7zRFXqNtgj0kX2PacV1EmoQug/ccPwQ8kWfTKmn2ZwmsnqA+OtJxQvBduEuSoMbDnpGjveiUCBI2I1LqItggH5B0sRuI71zukJVYh8ry0WTRPMlodYDoALHfYhlEpBFmgSRJ8EtYr5tuvEJexq9hPSBfsTpVZAFV3SBCL3Um85nWKexJ8zjpDGCW5KfUyhgIQ522kVZTO8U5UthDvWcguJpd1z2sqYjjXpboqfCfYrcm2bSGXsAyw3sMD0XbpKkCy7aYbAftZMthOx0YKUHxJkSyeYJMB21hH2WWK8NUJ+UbBX+tw0H3zLCmPnECzmcbIbgueym5ZQx5wSWCnACONFyYCAoKTASBR3pzTG/zCjoTMilMikgVA76OFOhZQ22AklTvhB8srYA5xmfWSlgXjTgIQqvKYE4UYHzl/aa2Su+rawUGzRr8fLmTIH566aPKTBwnrlAfgSKui4rkxHLFNNE4okI0yvwWZWHlOGm6ZfIfYWpWm/oVmMC+xEUoD1P5mn8LnCBXaI0sn2pG1HbFKtFy6XBpvvEJjsSgYMOwO6LsoQ4/R/cY+Zm1k/AZIxTQKI3mhi0A30qewfxM0WP9lOIVaFQvRQn7CplPV2N8VcoUmeYpeSr7G7qHAEWnVeuFrWZqGSxrAT6PGoOrVCmCCtNs0kNLLSGa6Y3dpNomkSgrEIGMcCmYVYuA4hfiI+qc/Av2c+ZQbhN+ofiV3FIbp+LIHpwtoGVBnGSz6JlNqTmHmMXawXoI8JKV0i+qMJRufQf7HqCSfNdVIvUY76N/InDWJZiXZLgcwgXKtKQPykMtkR5Du2RvmgMEx5HHaO4sLeRlkF81EqhUPyHBubbGT9pW5DFKuCRBdlay0TiA9YbvRS1C9NriheqjEyQQ1zA2M5NlZ3TgyJI/XzcI2MHOYYIM4ISUSiKC0ZzaTvZs0lNlno8rEipsoTfo5SxdpBIcKZqmwRSf7QgiOOZWXT69Be0ErxZskr/SrcZcYlZj/wP1OnNE90W+2IBlLvs+rJF2EY1QGRQYa3RBC6mEr6TixVv0JyS0yEUtC5tEmssaR6m1VxWPRV3md5QuhgltFPYtfrCyVbxKFaOfIldRmriOwJN6iEIqv0kXEr/hhjMnMnKDdvlL8RGRVhttHEauYDehM20bBJGik+p14Fv0yOYLnTZqNxuiOSUrG/1gf5gBLHmk4dh0qHxkngkqPamcgcij9rL7UENQC9lPwUH9Uo4TvJJuYVWgMGZ2iWRokzVF02GSGTmcaYCSjM0xVWUYzc1XQSN5L+jTlIKoT3aYIkGRIn7SC8j/SYuYzOxbuYPRXOYrx8nDEZm0RrZ76mNKBoeoE0WzxDedCCAK7SDzCJ5GrEQShdelvsqsqwbgQe0zcyo8iTkHG6f9KtYoJyj/kEbivtDZNJXYhZZWyQzxGfkcXqlchR5HTmAD0X3GnfoymVaMTxqk2WOlwS7TqzhhqBk5vRKpv4twSlWWXLBDppe5hzqI3YIfNoVaTkmIShbrWcwD2grmd20L4Am+0LtN+kr8Xl8gZ9IPIqkceAMZGUG5hF5p2qi5JEyVGl2qhHPSatZFQwCsn3MfVmnhoutYgzFUX6VIQ/AU9PYqbRuoAB2A9dvdwi5kjbVZ0mJNpKLKaDzBzqSOAlTKfLUCRLPkgOKq8aIhBTQJCGZubSJ5FomOcWpeapzCreIn2vyjXWIZaDVdQOBpZxnByN22iv1rUp/kkyJUvkJ7Q5lni0lLCB1sloo98md+C+wQ4bjqrqpVzJIylL9U//wn4eO5GkpNUzvtDryXn4yYj7po+a3fKHkgMSklyh3m2sgcFw/qSTtDuMYMZ06gaCC8bFPsIwRa2VPZJclvyQdah26JXWG6g84AeZR7/BQDEOUqcQ+djf8MPmT1CPcp3sqeS5ZI3sp3IGVGa6C5uLOQ/WkKto2YypjHIan9wJIrCf4dMtSfp/6kRFrfSZpFISJStWjNOc0adb/OAq9DwgkBRETaSnM5IZofRQ6hySg2+YB4jxNqrJV/dR3ap47/B38iRqiUr6VG5UNmjo+tumDBsEP4MW4iDwDqmcspV2he7B8GLcoV+jsalRZANhJ1CMFaFgCLY92XLQKNNd0m5R5yiJihpZn3SUFJJoJcnScuk12S15rSJC9V29QOuiE+mLjY/MB62z7QFwKeIhaiSmCjsSfw/oA/FEJxKRLCK/psygiqkraXU0H/oq+h16Eb2Z3kvvoTfRf9Nf0E/TV9DT6Cy6lPabdoO2npZBc6dZqF3UIupz6lXqUeou6hbqZuo26j7qKept6jtqGXWIiqb50SbSttLu0P7QxDQqPYaeTd/ioHSb/thRbtIP0efTA+lC2jVaKO0T1Zt6gPKbLCXZiHpCG/gAmOTwF1dgGlEhyF3wb3ap1dWSZTpoKNSB0EaNQnVZOV8xS35aBkkfS69Ja6UzZAHy8YqvyrXqpdrbOpQxxzzFxoL3IR9gRuC/gBJiI3k+dT/Nlz6ZrqVRaS8pxaQVhCf4c5h4ZLF9tKXH8BZqUK9WnpNPk1VK4TKD7LWCoiZBZw1LLGtgO1AzcJ1gK8mTettBIZ+WTUWT+SATV4vMspeaTusa1N2KLplOmir7Jp+k6tVGGuE2E6IUSyWcJA9S9bSnNDlFQmzAy1GP7NNNW6HVqotyf9kcmZ9ig1qmG2FRwfdjFxLcKfNpXbRT1L0kE347arvthmG75p5in2y6LEwxoCYaeLaNqExAS5JQq2jbqChSD+4BAmsZhpAquHyczCIXqi8bku1YDJ6wnnKF5kMLIROA3chFllLomfKv7KYsRBkANZi9kXBgOjmNNpa2lAwDDIgN5gfa94rdsqXySeobhkDYT6yZWEJdQftBjgXqEXxTn8ZZsUc2S7FY+8z8DxkBbqHspfVQBsFjqHjLS+1KxTnZEYVQ+8ziij5KSKdOoi0ne+DbYfMN51Uq2SJ5hTrGpEOQwfuUbNpf8kG8ARZpGK3qkjXJDRqShYfWEK5Rm6n3iBC6zLJKa5bLZGdVUkMgohP4ROHR8kiLsHhbDJSlUMhOqFyNdxGrQCy1n/qB+ACtMq/U7JJflxdqdltSMVEkC3UbBQvcgVl1VKVWNlnla2QjOYSl1InUFvA1ItegVhpkX5RTDIsQH8FR1FHUXDADwTOcUwLyHapPRgAFEj9QV1Fu4E/Y70IJikvyPs18awn2ILmDaiOmoJ+apCp/+WflW8No5CfCTWogRYzbbDuhLXHInBRKgx0E+ik4ao/D8kXrVihq5W+1DbZV+C2UVOoe8H/w17rrimr5M+2A7QL+JIVGhYCLMCWUrghSfIeyYY0AmrqFMhm/zRar/Sj3Vpr0JKSAcJyKIa/ChJrFqjVyD/U5cxVmBHkldTYhGOGk/6bwUNyAVsCIIIUqIBNwVZYh9Rn5dVWRyRsjI82mLiA4IeS6Z4plikzdTHgLGE8NJJ/FsM0lqodyQMOxrsVRKR8paEBnm6vtkg8rrxoZ6FmksdSbhGwEUZ+vuK/4p0MjFhLiqatIIeinRrXSKM/R/s8+GyikPCIfwwKWmepSuVZtsyzG2cmrKBvwsbYqzaD8i8poOoRxIndREGAobAyUqPirjDF+RTFIVOp0AgxRqitQ0JQP9QaEnsCgbiHmIacZViovKoJ0ifB8UEhZR1qF1hpTVHGKCu1G+3TgLCWT7Iz9Yc5SExU7NCetn3Aqsp3cjsuzPtK4KMLUO83/MHjyOcpTwGzPhnYqbMpE427UN2IrZQfhDOKQPk1pU7ToCuCdYB4l0kE71fRANVOxVHvSNglvI78mH8I9tFZqshQ0tcCkQC8h3aI8AJ/AIV2YMlEJ6j/C74LnKKtI7phU8wr1TMUczTfLViyOnEHJBW7AxuiIygPKVfoB+GVwE+Ug6RJGabarVyueqLPNEjSDdJASSzAjLhn8VT8VPdqttse4eWQtOQpYDdujm6qcpTypWwPjAT3kdY7oKct+DiIrvyoT9Ez4MUBGHkfuxDnZP0AhytvKf7oFsDr8HfJD8iD+FAym/6t0UoZD4bYG7ENSCEUF7kD+M05Sv1PUqM+ZQlDZhAjKZtJ37DzbNWihY3490HNbD3YDyZ9ymPAVtdR8S8NXbFP90n+GrcbTyIPkx+B75G1TkmZQcVtVoT8KI+ErSWZyFqEfhbTM1yYqa5UCyGi9j5lIZFLCSeG4Tvt1/Q+VRvFFHWm8BN+LLyLJyT8JTEyl1V3nofJQztVIjVTEM0fGhYiMIdZg+mwj9J0qrDJC/U+/wM7Gkolt5GpSHBCD3GVu0NYqZysPa04Y7bAE3GViB/k2iQtsQKIsB6B0VZTysPqF/oztE/o5GE6+Q+4knMR+hZUbXbRlyg1KpibKUGa7hB4D9pI+k18SvfFWxAzLXJ2zeoIyXvVWSzatgb3GVIFq0n/kCuIPvBdKaiUZtmlqlPuVx9WXdI7kKPhTbBhBS7pJxpFOAbfQMnuWaRsEqHcr5crpmqn6xZZuOBu7DpxNOkceJh0jfMIJkV9s74xLoEx1rvKTcq56LXTRON2WiCzFngH9SMvJIeTTxJdAC2Ydosm6zfgGqlaTHafUTNV4TbJOaiTashDZmD78K8Jp0lyyC7mBeA98jvNDz4EfsrYYr+kkGrtKqHyvzFaVquXaZ/oyk6/tKnwQpcReAz4S4kh08mgH574SaQQIvwf7A9UKF9solsVGna5PG6aRqzxUVUqpcr9qu7pCsxHK1q8zPjNrrOmwU4ivqD+Yx7hJQBGoIvQTL5AMJB4ZIOeRIki7iFcJp8B5AAtfgJ2O6UOtchwlB2AM+yfrYgvXLDPWGv7p63VqyA/arK3TpGtK1fPVaHWB6rBquipC5awiqLAqh0qqXFRBqlRH22rVIdUN1WvVb1WjalClUdlUWDVBTVaT1IAaqTaqZKoeVbUqX/VMdVm13wE9Q5WpileFObCDVTGqMaolqlOOXpNqrPqZmqW5qQnWNmmvQMt0WfqxhtnGg6ZvZph1lq3QHgR/gGCiTqMhzP9wj/DNgAhsJ9wnRpAukN6TrpAiSReITwm7QBBYgjuK2Ykah0DBvls3mdOM0frFULPmobpWtU51UEVyjHFde1hXZVhqDrMx4UZkASYVvwjEEp1Jp0njSNnEr+Be/A9MDjIV1ma5YXyly9CeVz9R3VMdUmdom3RYU651PzwN/Ry3DVxDXECKIykd2WjLsWeQ8+3R5o365dol6juqADVOS9XbTVvtFqQPbj/4jDifdIIYAd7CcpEjbZeMOVCX+pNqvPqWdo7BzToGEYz1Bh8SR5FkhL/4GHSf/aRJB3WrC1UV6kHopikI9hu9AVhLjCTdJLTgziLvW+kGiUak2qbeD+03nYWdwIwF+4glRDkwjH5h32a8qiWpt6sLoWRzGdyAXUdwJz0ljMchEWnmy9D/1DPUj6Dt5jWIGhzaEQFcAnaj62ygYZbGqlqslRh5cBLuH0FFDAfT0OVWpe6LY/eJujzLctQfoJv4mZCDdYFdNMzWBKm3QoEWP1QV0EecQriNeWRz1j9Ul6ov6KfZZ2H/OnbmFF4Hf2585YjwwXQnrQhMHOEHUYZPQbwwXtSsUL/XFdqmYRWEVCIdd8YerD+ivqiRGIcRz4AKohCIR3JM1zR31a8c1skbf5tYCR5H8cx2zTH1ev1G2Aj8Q+IK8C4SMC3TmNQk433EAPCcuAe/BRas36L+rVVbijAI4mKCL9rPXKTRqUcb05F7wUXELqzWGgrtVa/Tp8DnA5eIWlyAvRXarLbpumBJwCniL9x322bonLpJ74JwATOJydiPlmitk8bF1I46SUgmuKFmGTvUvVoP233cbuIOfJR9G5Sn7jXUIMMJMwguKJqxRH0WOmXvwM8insZus7RrqjVLLGew2cQcvNnGhKia9aY2NIL4DNgOk0It6hNGAF1F0AP9MJ6uVX3BGIbuIrwBMmEvIEBzwJSC4RK/4d/YXmkfalZaQNwYYj/W33Jco9POso8GmglilNFQqT6gj0eOJ/iB+bAP0FjNefNlbDTxFfaheYKmGsLAF4FaMAlxXcfUVJkArC/xD/aKebQmWPcbXgEuAFthl6AcTaGlGgcRNqLhRoH6rcENPUgQ4EostzQN0Fr4VzAUHA/zgBhab5sSv4mQicTrkzS7zFashvAIrTPY1BuMPhgzYQH2rclVo9dfQ5UQruNolkUas24xci9hPp5mfa5ZrLuOSCFU43OtrRq2LhzhStDiu6xCDdXx70boxL9xtI/XXXDAHMF7WF9p/ugykJsJw7iRlq2aY/os1AuCDcsxp2uuG66gKwnFmG/GKI3NiMcWEQLRkYYlmhLzNdxKQhzyhcOeDloZwDNQDkuBxNrJsEXgMmC5zUW7RadATCRcw+WZN2jOGu6i3xGiMU7GRZpgsxduMWEmMl9H0ybbxgNjQA9Yu/YadMbhP83Dl1veaQb1najLhPeYq8Z1mkETHzuDsAZZ5cg0XWibCbDAKnuBVgwREFqwG+djeaC5ZLiBPkVoRdcYbmsGzc9wVnAsgqP7qL1tlwPzgeO2LG2tbjoyjlCHFZsuaAqN+ZjlhBuoKr1cE2rdj98HIuBboFlQNWwpeA+/zorT3tOPQU0kwLFepvua/aYp2CSCErlS76t9Y/2EHw1+hi2DDkKDsOngDfxla6B2u34YGUBYhS00fdbUGI9gRhM0qAUOSzHV8gBXAm5AnNTlaqtskUA9gIbFQaUQB54OXsO3W5dqOXoesg+MxVnMWs1uQz3Kh9CF2WWq0/wzBmBCCY/RE4zdGoEpEEsn3EdtNcC0FeYurOPhFFKg99EusYzGVYNbkI/1KdqnlpW4InAu8pE+TXvBkoErAx8hhfoQrZOlDTsAZqAOGEjaTDMDawcz0NuMRodmCdEowk1Mp4mkfWkYgSoHPXBlln2OnFMiggPm49PtB6DT0BT7N7wrmIyYol+h9bGsxvLBY2hPE1vbYaCicsC3OKPVCTJBlfYyPAO8hKjWZ2pJ5gBMNxiLzbLc0VbqpLA04DdARNzVZ2tNpm50GfgHm2jFQmjddHsIfjUYg7pgjNWeNmgQagAA4PAQ/Q4t0nwa/Rjchbtj64TcIImFi/0NpmI9rCOgXAhh68R+Bp9jrlmcoWYozNaLfQ82YZSWqdB5aJ3VH/sW/IVNs6F1au0v8wX0GjABfwl2Sr9aO8PYjlgKVACNyDGmh9oXOp1Nib0HXsWete3XvdOONl1EngI+AyhUmWlAi9ftsO7ArAZH4BfBXxv2arP1m+3dDp8jC+cK4+t3aVv1RjsHdwwcj5sKCzccdfSj7UnYFQ54FOKTsdmBn2Mxol4BHwA6us6SrCvSUo1y2ETcRrACVwTvMOKgR9AUczryDn4SeAObAesw1GlRug7zNeRTfBbYgG2FHTWyHNJ11CSAb8FlgwvwG5B0yxLdN8fdi4stFZ0McMATWAuMaToG4aFSQ4YdgdkJWID1WB/4blMT1KMd1Jda16IO4tNBH7wEudxaohdqv0PDRgDmg0kHXMDtuHCkzvJer9dehbKMJpsCtQEfAf7GX0K32ENNfrom7QldkWkGrA79Cx8Afsc3o4/CnMwCnVL7xJGB/shqQTzCHgHgIIjnoCkw0JEZwYBmQJV6sbkZdgHtj9cAD4BM3BLUZ7uLeb1+EuQEVeiophm2DkQPJh9vAw4AM3FCVCHsgKXaEKnDQdugefrtpgm2bAQWI8DdAZTAEP4xdjuqFIa35jreROyAyFAHlO+AKbTGw8+jVmKP4j8BfQAR+B+Oj4YQNfZPliHjXT1CFwXFQTjdZf07Y4LFZquEb0VVYN7iUECBQ/PGAqH4G9h76IVIC+yGbZwl3LTEoNJJoP9B4dBeKESXpL9liDQZzV3WMvtb+EFkKPo9xoIl4rvxa4CvDim+CPgAp/A/cTXYIsxt9GIUF9kKvwybZne1aS095g6T1MgwTjfk6tn6O7oY3SD0DNoDLYSmQdOhRdAO6AZUAAkhjm6C7oguT6fQ+ehn68/q8/SDeoIh1DDBsNyw23DKcMlwzXDZcMawz7DGMM0QY6Ab5PoS/U39Sn20Hqav1N3QLdFF6BC6NugTdB06BG13UD4KPYCqIEA3V/dLl6iv1G8xhBmRJqlJbDZbXG1Z9iOwX3AbIgG1Cn0KcxG7G5eKb8OPBLYCawBv4B6+FdeIvYbxRB9D/oWr7WxbhuW8yWZ4qX/g4EyOY5R4XYD+kCHCFGyZa/sPJkOw0UjsddxnfBYwEfiCP4GrwTxFBSKO2/ss60zZhhJdF/QBmqR7rf9sHGXxsbsjNKiF2EC8H5AAzMRfwZLQGMQ/233zoIGva4UGIFAfawy03LDTkAmY/3BowB9A4D9hDiEb7d4WvaFAVwGN04UaEs0wuxKxA4PABwH5+HzsTtQ22GxLk+GY7v9QSwMEFAAAAAgAM39TXU3E9fOZLgAAaDAAABcAAABzb3VuZC9pdGVtcy9kYW1hZ2UzLndhdg1aZVRUXRR9Od0zDI10iAKKIhgotigGIrZid3fnJ3a3KGJhoYgtFiKlgCjdnQPT+fKbNWvNr/djr7P3Pvfcs2/0hLFj44IAYGZE7Jjl67a6igAAAK0/91gAGP0cACBABCxdtHXRUOs3AJApJb39w8onXJqFLGtcb9jmuXvFnj+7jm7LWF+6zGUuYwow8tAA0Edjn87/CkVabmlqFB4dm9petX3qiO4O0hDGWLICduJ8FcbJXtgush9l39/WScrhS9FV+EQ1v4Vf/jHv0Ofql2EPeDc/XLh6ShlvOvb3+PEzwiujE5XPMj4t+D2ndoj6CPxSPtzvzeCEyAuzhi2du+7Llsgd4E7jtphNM1dPXXQ79lFk9bBXQTc8INtp3AbAYipVX1fM6GC332pv6kzqOauNNp+jGpAWTpjoqGyHbZHdPDvK5ql4FXcW/NSSqDzV9Ke0OJf5ue5l9oM+t9Zfajrz6+Ssk8mnv144e0N9/1nqxm+Nfy41CvSljDX20/xFQ8Mmrp01a8nXNds2rdqasNV784B16PKuecOj145tDOP1ne86XCZm+9G/jX3UaxU3O1Laz3RwFQpls+6W5SNdgd7kJomuy/rbBtuts82RhYoK2Mmg2YT09GpMLkFzH6abX656uDBhwJWw88/OvD+z7XzbFdPtQ4/HvbVkDi650/rKZGKbHEP6RgxLneg9a9Zi/mq3DUc2Dd60aL33qt+LkmbBk2ePFIZc8Jvk/FBsZlwlvxgSVbEKZce8jsOdwd1B6gBDBfYP+MoI55lFt2T18lO2O+RnpLmCUBYAzDDuUWTXXymenDM33S/V7dH926xrNy6ePy+7EHaZujHpnun5j4/zc1dV7Ov0xrt4M1xUAZHh0KSMmSMWRa7MWHtjffW6R6t7L3s6f1tM14S14cv6j/Be6hAsRFEvolDvr5qhiO6Ude7tmtOzQbPByCRqwEvMv7xw8TnZfnmlfI/NVMls/mPGUuq7Huk6XHfj34ts3/RNqd2PzHc6rgNXdlxaf9lwjXnn5KNpr5y+3srfWNOvZx2VKjzmui/If3i/SeEzhXE7ls9anbLm8GrT8ohFSbNXTtWNeTC4OcDW46FtBy8ELsVw3R/lCkVmZ0nnLsUBZbL2kcmPLIdmsaL5W8VbZRJ5L/kumUTcw3VF/xFhujsd0bVv/npmc9PzU38lz79bfHP9tYVXM689ukUnpT099zb2x5uiqIaP6uNgpOS0e3O/9uEjJiXG/lpweWn7iu8rA1fELlkz/9WMXZNcRoKDjvvLXXk2mZyT4EPLaN1J5UnFiK6Erh3dSaoK3T/zMOoHzGP/5N8ST5Tdsplns0VaIvyPkwhPxDM0E9pDapqLXmXB6UNffXz8JykvoenGuBvSWxMT2x5mvnj1cX32kxK4xU6/C/koW+XpFnxwROCk9hkb5z9YvHFZybLmJT8WPpldNS15/OrwI8HRvkOcb0gyrExfND/SzlV+UeR1rVTs6PmmBg06y2g6EUllewlei+UyO5uLspWSKwJXthdUZJmlZrYFVPsURWeJ0r+9+vhk6v3cO3MTAhPm3Wm9l/7kS9r7L8t/7aq42B5lGs6k5C7egwcYR4CT5DOQeY/jdIs7FyfGDZuHz3CerB9dMdg3aKTXfw6RoibGVSrB5KYNV9KKuYrB3duVlRp3IxsfBqxFx3B2CD6LS6RnZBnSueKZ/AzmW2CRmVKWtYRWHfzDzuqXHpOW97TmwZ+75XdsEu8kbX50IOXuu6SMYYWeNVjXXKyW7Wj/3Cdw4KSIdxMDY+Ln3FuwOQ6MWzo/d9bi6N2RCyJWDFL1meGus3UReKGRZIYxTTNQObnboBD1bFUptUNMMsIP9Gf84qQLPojjpWZpl2SSyJG3nDGZpoyve941x1Z2Fxb/XJaOp3U82/qo7t6MJEtS5QPtk8BXqz+tz9L/TakfqowgY3hiRxs/KORoRPTE4OnErEvzVPOd5g+Ys3hG3WT12LZh8gFVfqd7HbWx4cXDDgRtmK0Zqnzafb27o2eTmtRNNEtJJlTNiOCqBcniQOlcqVAyWNjAEaMqMtmws/txU3zF2sLUn8/S017LUuSPdQ9K71c+4D5empL/xvlrr7xTpZLm2RoAeCBocprT+3XInYjSSM/oJTP3zlkzd9gcwUxe9MaJB0edGtwa1Ord6jRI2ofDgph4rEGmma4U94zo+aFcq2Eaoi1MqgLax3zKtROeEhdI3ksCxb6Cx+wf8E1ivn6i4mnjr3Kg8O5P+POuN1EvfjzhJ8c+epsc/CwnNfbDh4zX+VDljLZo/U2oUHTWZZ//2EG3I0ZGwtO+zFg4q33Wkpn66TmTbcf3HhE1qLivxHOhA1e8mPUIEGCZ+ib1TuXhHmXPHdVSLcc4FVNRt2EJC+EFCxeLF0l4kokiOX8razc0GXfVBXR9bXAtf1hw/+eaz5PfXny5/Zn/k/LHp59Gv3B8U5A+JKtP0Zya7Z3eJiFaIrF1PdDn06BDEdcn/J3CjxkWuyT2fEzb1MsTS0crh/YZ0NB7oRtmSwveMxbRAZax+h/qp0q8J0m5Sz1bxzSNxn/TMch1VjQvQhgo7hHPFS8VIrxRzDCQj6k1rp3N9fFl8wve/Wz53O9dU2r/lKhnsc8WpCx/Ffc+8NvD3OPFl+q3dVdYFjPfy/a7LeorCY2KqB5/YfL0aNuYxulZ01qjNo9/HPE7zKcfz/e3yxsbCd8PDaGWm+t0aepO5T7lTNUMzQQ9YQogbgEUImFf5I0SakSbxA9FewU6jpwBAOXmArVbh109UOZdUP1z7Rf398PS9C82p5Sk+KVueHPl074fpt95Zc+bpqtWEhfYO+VZ7l4BU0KhCO74UVEXpqqmLZ4GTdFGLhlzIfxHSHjADK9YpzPSUdwPsBf51nRc90odrEJVInWgdqChyywk48AEdD87mzdY+FTUI+oSXuA3s5XIH+qp6Z2qX/uCuhOlQIEoC/rq8uHu68+p119OSe1OW/v+05d3WUF/eiqTW8XaMiqRa2fX7ZEfsDk0aUTvcR0TcydnTWmfPG4Sb/zykReG/Ave5P/ZnbY/Kj7PXgT1IexNo3Vf1fGqy6rfapbO2VhkaSUdoABGHVvJ8xHOES0R+Qsf8spY+fBD8oQxRTml7U2tR2lXfkxW8lfvj7y3J9K+vcpJe/x23qfC79W50/4Za/7reKl3B0/zr9sbPGcG7g3tMyJ07OFIy6SbURsnXZswYMye4cmheNB33xGuWbbXhBamJzgRv2AU6yrULSofdbymXkcZX2BpVB70mtGfw+WzhaCoWLhS8JH7m/kCOkJsMbzq2ddqX1tY0pr/KGvWt7BPB9/NedP+esjbeR9GfPmb2fV7TmlL/WhFgGkqPEdocWj0yg3cGHp/eOgY6QSviRsm0hM0Y9eOvD+0eOCwAD/veudkmxz+XivTBzAno1JLqieov6nHaF/rq03/4dvotXBf5h6OE79RkCQcJrzPL+BkMq6Ba/AV+h/dH1vO1hwvUeazsuXfY9Px9wHvBO+evWem237/md1aOLHifVN7zznLApQlHub0yts1aHIoe7j/6FvjJk8YO+HyuBmj04bXhdkEX/d/7nHT8aFUzLNH9VSe5aOhUhugeaueo4F0Rw2vzNOJvgCC3GK+53jwUwVhwnuCal4T+yt6DJiLrdA1KOAWSc20EmbB9uz673s/7/mIfhjwwebT4y+NPx7k/f7rUb2xdZ36Lz6FeUOy1Hm5T1yQbej8cPEox7FbxvUaFzQmK4I1rM+gdUFcv0i3DfZfxds4f2CK9LGsMPzVrtL4aMyar7ppxkMWO7IGuIhQzC6OK3+H4LcAFkh4JtYXZC8dY9ms5SrmNT+s9ivpW6DJfpPx9AuUXvdx1qddn0d8v521NT+hpKVW0FGuNZHubL5sgwvkeyKoYND9Yd0Rl0dfG4ONLh45Yvi6wWcGVPe96g32WmirFupYtyFn8prZy1CuTdEkam5od+sdTBOxUvIgKENjWWKujB8imCmI44/nClgZ8E4q1nxcM6rrR9PYalHJooJdORd/NHw9/flj+q7P5V8LfkTm9vszq/x0w8UubwMAVHCW2cT1OuabELRxUNXQzyNYoz6Oqhy5f0Tu0OZBYP8F/qGeRU4rbYYKTjAPgdMIB7NW36G1aJy0g3UDDPUmPn6ScoJOow9YgVya18Ov5X/i7eP4MPOgPeRi0xN1fOegJkMVUnKvgJe7O9Ppu+PXS1+ufw3ImJrV+av2L13p0kx0zzb1gFt49+SDXLW+t4LgQcjQo8N3RNREfBnRP3ze4JUDTwSafbVuHx1OSO/yQhh7gBt4iqlAD+uitLe1tTqFIdGch4fQKRCGtrNGcht5d/gL+BJeGnsUoww8RuwwlqkqOj40plUxSlQFT3PX/FyYkfJt/be07/szc3J2F2wvuVBzrTVKtdnyHdbxs22NrhP84oP+C3EbMjq8eTg9/GG4cgg5iOrv0feRd2avj3aZYicuhpykddhU01u9ny5Z66Y7qL9rnGPZT1TSA+EFDFd2FPcTbzy/mreC285ahHYA1/ErBoEqpGNc474qWcmEwul5S7Me/4jIGJ+R9yMrK/gX8YcqE9Zj7cc0m/Cd6Gxhkd0dt5N+cUGWgQMGk0MnhXuGXxr6NuzZwAdBRb1Xez5zLpLLRC/ZxXAKtRCDTU/0M3VM3WOdu2G6SYT1IbcAr+EPjKnsKdwzPAUvhveJ48Q6jABAGvZFP015t725IaYqsORFIfprabYhs+KHa2bVTzT3Uv76f1sqdzSO7XqoiyXlzIeiH/aB7u/9/IIWDhwa9nJI2tDIofGD/xu0InhOwHnfke6PHSnZXsFMVgbUTFZbMo1P9Gd1a3X99T8NoPk79o9EQV+ExdzOHs+dxTvJ+8Xlc6Yzk2EXusSi0iX2yNtPNYRWxZY4//n+a23OuKwNP00/27OH/Gov/FdSXp3fvLc7xeBBJ7AqxQkOz9z/+jUGfhgwJHT+YLshWwcfDl04MKifW58l3oGu6fYjpRjPhpkJ9iZXWi4Y0/T5ulLdZ/0yY4p5Db6JOgdeRqYwL7PDuM48T95Q7gL2KUYRFEGRZn+dufta2/AG36oTJdf+HPm9O/d2Niv7d3ZP7qr8wL/e5b513LZbyjumcoDNMUriHCUeFX4nA9EBwYMYYfvC7oYeDRkdzAw0+03wDHJpsU0Qn+F2oBXAEQK2rDFm6cX6UfrxBsQUYxESbFoEmZCzzCdsD2419yP3OeclKxslwDVkoHmjdl63VxvQ4FmVXeJQNCX/TJ4h525OQq7y15nCNcWrK1c2DOp4oN5h2Qot5OJSodNyjz9+XoHjgt1Dng1qGvQ35OyAAf26+9T7RLiPcXKTc0QDOIVWprvx5+Zpxib9PP1rfYkhyWSyvCBu0CegaWgm8x2bwb3MjeQ6cAAWhPYFbxGrTN80vxVfW/Pr/asEpclF7gUPf03NC8tb/as9/3HRjdLE6itNU7quawfjGHyHp5A9cUr2eOeXFnCwP2/g5JDxIcyBif2DAut6l3tNdF3nsFl2VqBm5cBh9DJ8iXmkkWF4rvc2xBmHmq9i40g3AIPuoWrmZ3YTZxy3nHOMHc2MQJYAf/FnRjvNaMXi1gf1w6riSof+xQt+/E75VfRrQH5V4cd/6eVZta9aort36NuJ1WgOP8smyLnM44xfcMDLfqpg5YDUARHBH4NC+tb7NniscHliVy7x4n9j/oOOUD2Yj3mosZ8BNNwydBtLzEF4JXkfWAx3ozasj+z3HANnEUfDesA4At+hhbjBsFud2yVuPVY/uyq9tPJvdWFzPi9/eT5WkF30raSosro+vW2UcoRxP/WTUS04LX/grPeI9XvStyyosP+ZYPvgQ/2qA8b7K73NbleczPKp4j/cJIYKrCWPYEbTCONSw2yDxLjdtMqShS+jnMFMuC8jmJXKjuckcjrZc1lmNBeqo6Zj4w2tqpldv1u21B+sci3b/y/jD6twTQFWkP7n6b/0sorqpsbXHa5qowkA2KwqYbgt6gJ7SvxkfQ2Bj/v16X+sX04gs+9yP66Xm2upw2ybauFpzhXUGRxLemNFpihjguGd4aQRMOOWWEJBnQedkOWM8ay77GmcMZz17CxmFCqCPKg7lvv6OSpV57mWNfWpVWfKehc/Lwr887vw9J/tf4+VPK/4V1vZfLOrS3PNsg4MY2eJ6mxnuECeGb7b+ggCDwb9CjIESgOG+p/3GeQx28XbPl+6SzCHfROZC3whSi1vTIuMVQYbI2Q6bj6BNRKraRxch1xnzGSdZMs57WwNK4B5H5kHriNVZqa+Unmhc0HL2vrOKqi8pvjW39lFvYsc//Ytnl12sepb/ffWjd1JOi88B5rBSRCvsbviovNY6lvo7xYQE7gqcFXA8j67/bK9NrrdczpuO1Xiyx/Cegk/oUcSFyz3TfuMzsYdxj0mgUWKryCb6TjoPZLJWMhazy5jH2NvZl1nEPBzK+IJ5s26OGV4Z0jLjvo+1QfKr5Sc/Xf074m/yf9qS7wq1tckNt5oH6Aca0gk+MgC7iJJu12WS5kH4ePiH9DXO4AV0NDne+8fPizP970sDphNm6iT24dZCqF0CT7TctOUaFxqrDbqTBctN/EOcgbwBcKQNkYcaxL7ItudrWNCjJkwAEiIJ6Y2raZH12HXcqp+ezVUMb30v+K0f+3/Akviy9orw+s2NS/q7FBVGpnUCHQGTyadbt/ukuJxwmd570F9TH2e9pnn7+Yn845157ssst8nOyNM5wQwONAGagvua7lhyjW+NEaY1phlmDOxhMoAZPBAFGLOZXmxI9nprM3MdehbaDa9DheZFmtP9aR1wC3J9XnVZyrkZQdLGopHl7wu9a9IqoYbQlodFac0c8zz6ThGGP+d9IU95rLTQ+Dz2G+of45/lH+t30mfjZ6vXDc6lduKpKMFt9nD0clgG+mMw5a7JqORND42NZkvYbeISsoHXAqvRu2YU1kWFsWaztIwKhEb6C1ViO03tmv69uzuMDUX1HvUuFTWle0rFZQmlgaX51ZG135uVLZldzvrflkSgQ1MnmC8DLcHeoV6nPBu8Q3vfbW3zm+JL+5V5m7bq9Fhvvy1mMs/y4pD7gJryGKs3fzS5GeabBKaZ1mEuA05gY4HU+DrqC9zBCuX9ZLVwdzAGIfsBOVUCKY3bNFUdk/s0Ddj9Udr3lY+Ld9bNqzMXPayYkG1pW5N8/WORcpEvR/+F1zLKhDkycIcLC497qSXg+8wv+V+Cb4q762e49xOOsfZa2RLRU3cc8xzVqZx4hJWYs40xZmSTDvMBZbj+CnyDd0IquHvaH9mb9Yl1nzWXmYP+g6uB/aS9y2bDCzN6W6vDktzUENPzbSq3RX7yteUT67wruqpudbAbx3YpVRJjDsILTSbfUA41GaVQ5vLdfdVXpN8hviG+I73OehlcP/Ri+XUbXtZ6iXM5SQy8qF19DViHpZrrjMlmIymevNwjMQJ0g4YAPVBGtEQpog1l8ViCZhrUR94AtBOyC0G/QP1+G5mB7NlbcPcWm1VVOWBihsVSZXXqrfV+Tc9aMtSrNVsNb0lIWQgx02UaHPaIddlsHuh5y7vEB+Wj9nLznO/2ziXSw7H5GMkBv5n9hfUFmqjwokg7KeZNlWZosxjLanYRmIltRM4DC1BSHQAU810YaUy7zIUyE3oAz2TOG8+qB+v5nVr2p1aUhuKaq9Xe1Qdqcyu1FTBtYb6d81BHeN7arQ55iYKRkHuG5HB5r5DokuxW1/P+179vKu9nnu+cxe5ljv1tu9rg4iLed9YncgGcA2lwrlYjtnT7GR+aE6xuOB1RBFVDORBlxApoy8zn1nHnMnsx1iLCCHrThYXmiV6vapC0dwe2oI1RNaNrMGr4qs0VcNqVtetaxzUmtr5RTlMz8UAQId+5YaKh8lTHNa5LHOL98jz9PdK9VzmMdftmcsmxwLbRmmR8Bu3iOmOFAM4+RRXWYrMk83WPZVZip3EJ5DBtC/Ihb8iHgw35gNmApNgZKA9cDx4hxqDXzE90yWrnitq2+e1TGzMq1PXlFWfrnasOVb7u76u6UWbl8JbfcEQgQvAUsZa3gvxLiuKIBeVa4270sPLM97D3Z3pOsVZ7rBHniR5KvjAUTJWwqOAq+QGvNrSYN5jfmyeadmJ6fFU8gK9ExwHNyEBDDFzFzOWmciIRjfAEGhH/cTcTBN1i1Xxirr2Yy33GqPqk2pf15yvGVn7u86rcWyLY8fZ7sOaMuMKQgAlM3l8W8lj+T2Hbuctrn3cRR69PBa5t7h+ciEcs+xCbNaLL/C/se0Z6dB3egg5FC+06M0pZrU51VKNzSGklIL+Ae6HITSYQTAmMAXMkYwmRAcdAK6QE7DXRq3WU7Va0db+voVqLKuPrbtQe7l2ZR23YVfTo9YDnd09f7UC80ESgNey7vC3SPLlpx0SnTW9droFuTu4h7s967XV+ZXDAVtCOl70H6+YNRW1h8bSnYQYz7EILE3mwRYONgz/SmyhhgNMKBV2Qgcwmhm2zJ+MZnQLsgsCAFvyn2WSMVHbo4xR6NtVLXFNSxr49RvrrtedrB/XmNNMtVV0hatk+jDLSaoZdme7C35IWuTrHSKdV/XKcJ3iJnfr5brTJcRpo/0oeYGkr/A/ro55GTkCllNJhBLLsfSx2Fv+syzGbuO9yELqHDAeqoH7of0Y2YxGxk7GURRFQOgofZtYZOkyxGi/KEcrOB19WnOadA3Z9VPrb9Y/bdjfJGiN6vDtPqaONMRi8fRH5Df7poAh1cnHOiidalyYrutdZa5wr0hnymGQndjmibiX4AKnF7MZNgGbqcVEMZZvmWyZbvlnScdwfC/pRVcDRyAYGYn6MR4ynjB6MzzRa/ApkEv7EAbzWYNAe0k5ROHVsaG1f3N846GGoIZbDTmNqc1T2q50ru/5odlqXI5vBw6jKzkM4XCpSW7rcNpposvEXmd6yXopnD2c/tizbLukF0RO/KfsWMYweDsgp3oTX7FyyxbLOYsLJsFnEuXkLtod/Ah5IVGoE+MQYwOjGv2J+MO24BXqHX7OHGYo0mxUhinGdbxvvdfs0jS8UdR4s7GhqbbleHtx1xOlVnvRtJqYBQ5jmDjLheukWnm9vafTW+czLs9cbFzKnUDHZLsmm3zJEaEXr4B1E71vZfonieOpWJvltqXAsgZbiacSAVQuvRRUQCORGJTHmMPozziFLkW+QQ8BD2oCHmDu1F/TxCiHKTZ0IG3ylg9NZKO68XqToRltS+9gd1er7PQPzYvJAKibsYebLrwgbZHftX/v6ORc4PzL2cE517HVPt72p+yj+JAglEswOxAJdIneRRbjyRhmybXwsA/YF5xFHqYkwD3QFp6LzEQtaBBDhw5GEWQGFAK8JRuxf6ZE/TJNuHKcIqEjtu1My4zmL01FTZeama0+7e2dg3oQzQDDM0sUZYbOMXVcRPRUWiifaz/a8aATz7nLyc3pi0OR3Xp5qvSl6Dh/JieEOQI5DQbSg8hX+ANMgpkskzAUFxHzyH/UbKAaHAFvQGLRRhRmpKEdyEO4B/xNR5L7sD2mufpQTV9lrKKw43kbq1XXvK/5RfPpFpu2UdZ8a57SXTvamIz1pd/BPqyFvNGidOlLudC+wKHJcaIT18nf8b19hu18mweSVOEt3kH2HsZ9WASWUCRxDX+E9cV8sTPYNHwx8YLsRScAImgJfBCZhuagJehG9CoyFj4GLqKbCRest8lZL9F4KNcq0E5m+7HWyy3hLadbDrf2ap/T6du9SzVIF2m6hgPASuQ1K4O3S5QpPSn/YhftMMLxhGNfx1CHd3Yf5DGye+JPgvfcN6w8VAQnAIeoX8RhPAWbhM3F/mAJeBpBkiutDomAjsCnkfHoE/Q+2gcdhXRAbiBGHSB+WmqNLTqN2kV5TBHRuayd2RbSSresat3e5tmxpiu854x6pH6MeS+RCwjRAWx7/kMrivny5XbF9nccsh2iHSbYf7J9ZzNd+lhUwK/laJju6DGoPxBC3SG24B+x9dg5TIy34wAZSb2g5eB66A58GRmKnkA3WPnQwKegb8BVypVYb7lqfKUrU/dSPlQc6sxpP9lW2fq9dXTb8navzu2KKOV1zWhDiCWWPAY+Q5+yl/PzRJ+kveUcu6n2FnvUYaf9fLtMebpsjuSdsIvH54QyjyIoVETryJ3EKjwXu4RlYdPxfsQk8hKlpqPAq9A7+DrSF11uVeY95A4cBC2wIv6JO1lijEd039Veyl+KrM4+HcL2/W0H25zbYzrcuvZ0x6gStEONzpg3FQYNY8g5z/jNomdSjc0T2992MdYs+K7ddtt/NtnSleJCgZA3ln2CoYLPgtvpd+RsYilejX3CCOwKvou4SlZRAcAhMB3Kg28gDugIFEbnIZPgUtC6IyPX4kVmW+Mc3Ut1kFKnEHRd7rjW7tE+ol3fHt5pp9jVE6O+qvM34ZiCaoR+MnZy2vgG0WXpa5sxtqPtUuyO2P22vShvk1VI9ot6+OHcE6xmdCnsAnrSh8jhVhQarBkLxsvx70Qd6UyvBlLBGqgSvoogqD36G5EjGLQXfEDvJ+3xeHO9IUT3QD1C6do9p4vucO3Iawc68jo8uzjdm5VRmhN6sbkQT6YPwhHMvxw7ASDeId1gUyP/ZMuwy7S1yF/b0FKN+JbQhr+dU8IcizZC74FKKprsTazEObgAX4vbEQzSg1pA3wNqQAvUCp9HuhEVcgH5Az+BrNtp2ofMw0aZnxtsdbfVMcro7idd6zqfdWzo+NqR0MlUmLuXqsK1WwxK83ViJiBD3jLduCMFsDhG6m2zSR5ou9CWYdtbXiFzkYrE3wVjee/Yvsw0ZDk0C7hC+ZGOxEbcGx+MP8RnE5HkciqBLgMQSAJbZxrkH/ITmYkch2dBhYCeKib2YYh5n4HSJqjXKeO7ia7azkGdNp17Otd2tSkaeqaqfXUzjD8ss0gaSER6sVZylwpoUW9ppQyS35N/kE+QL7ABZaMkIVY+9nNp1n8Mb0RvZXoWxSBFxB58DL4Sr8NvEKfJZKqMZoF+kC+sg/cgb5FriCMSAbOh3UAidZgYiOWZphs6tYnqk8rv3dGKKV0/O9M7B3UNVmR0ZypDNFx9gOkMJqLugG7oIVYyd7/AICIkx2UXbGRysfyczWVZoHS9eLHQjf+VM5XVhd6DT4CptBvVQXCIk/gy/BouJyqIArKV4gMDwUhoMGyA1yJXkJVIPYxBn0BfIIoaSGgsF03W1F37SP1cSXY/VWR2RXfFdWm60O7rPUkqubZND5in4l+pYOgmWsWq414UtIhyJcEyZ5v/bNbYlMn+SBdJ7oiuCObxGJwnzFmoN+wFLqPV5B+CRdzCj+M5+BRCTnIpV3okEAeuhCbAeus5shUJRe7Br6F1YCVNkQo81RJn4hvyta/Uf5XDetDuMEVjF6p4qijoXq3crVZpPxl+mTnEEvo7xGH0ZvN5dwSFovOSKmmyzCDLlrnK+NIb4hLhH34iN5bNYRYgaVAe4E5nkenWWqTiz3ETfpyIJsdTs+ktQDx4GJoBq+FxyDSEiSyD11n75kn6FfkQ32rpb9Lof2oz1JjyYM+S7peKjVYMcd0Xe8JUUZofunjjaUs6YX2FAm9ibGEP4D0QpIliJAekQbLlMnfZWulkSalIKBTxOzgprM2MCcgYaCvQQiWSzwkhkYP/xX2J78RZ8gh13uqQZ+BNaAHcBfdD+iKlsC/sA5UB4fRKcjE+1MIyVegztKVqb1V2z49un25aEdVt0zNdCasdtWf1Uaax2DLyMvAd/st4w57Buy+4IJJK3KTvpWXSA9J0yWWxXDRNEMsL4/BYTWgBXA96ASnUATKJsCUacLPVHyYih0ynMulCIB98AS2FG2F7hGHlQwE1gWesDnEj3XGmpcn404qiWx2rEig9epK6z3arunN6xKo8dbM2xsAzWzAm5QYGI37MHvYG3m3BGtEfcYYkXDpWWifhS2pFc4XX+Q+4F9ibmbPRWfABsJbeQy0hbxLuBI67EieJABKgtJSBNgEK8Bu0Ai6FAasyN8AvoDvgGCviWqINKzN/M77RZ2uZmuOq2cpjPQ49Tj3ne3Yo81UnNY90MuNP8wM8iXoIJiK7mK6cw7yLgghRvHiBJNOaBYdLFol7ix4JWnkmjopVzyhHuiBv8CY9mZpIXiWCCDtiApFOLLEu6L1pd8AZZECFVhQ5cAv8Dh4Cb4LmWj29gkogUrAn5iTjY32h1kvzVfVIqei50vOsJ0jpqTqiHqddqi80brOMJ4JpdwhGfzAncs7zDgmkomFiTDxe4itJEn8Q7REa+YN40zgxrGjGPOQIVALMp32oUCuKCCKE2EwoiOvkWmoWPRkYAbpAldAy+D2cDZ+BmfAAyB78THtSC4gd2AFzvDFRX6UdpzGqjMppSpEyVFmo/KMapKG1TobDpl5YC/GVvgbFoTBrE+c6b42gQagSXRbni2+JUbFUVCSI5J/nvmJ/ZxagHbA7FA9404i1c94gphOxRALhROaTidRxeiewCAyGmqBF8CP4MbwY/geZwQpgN91CehBjsNnmjcab+k7tWk0/9TjVe+UpZZZytWq7ul2TpvtjCDRnYrvJEQAKv0OHs85zbvKmCZ4J74r6iKeKBeI1ok3C3oIHvB6OLbu/dVe4G84BIwAd1Uq6kInESmIHkW090SnyL/WOTgT2g2OhTmgOfBGOhwfBt6Ev4A0gjH5k7RZybJB5vvGGHtde0mxQ31T1UjFU0SpE7aS5pF2k32ssM8fhbOoLsBZGGFtYTzjXeMGCzcLJop+iUtFhUYnwnyCeD1n5OMJ6yihBpPBmK9PZ1G9STiYTB4gbhJrYQwZSAN1IZwI3wVioG4qG98LLYS68CjoMzgFwajX5Fu+y2JmjjLf0Yt1XzQu1UnVcdUhVq7qt/qoZouMaPE07LSb8PNUfLICjGPdYX6y6EAkGCjHhXNFskVk4XBgi6OQt435iG5i+jMXIK8gDzKJvU29JMZlGXCM+Ew7kE3IhFUBzgFYgDVwKKaFx8DJ4FFwHDYDGg87AV6ofeQT/YSFMEcYkfW9dl0atHq3WqHDVCnWwZr62XvfKkGOSYvGEhE4CvZGzjF+s35wjvC6+UfBAqBHWCTcKnwvu8KfwCjm+7HXM56gBngFVAmfpXdR9Ukh+I1KJemI0WU6eoebQ/QAUzAU3QD3WcyQKdoVfQQAkAJvpIxRGTMcTLC2mUGuOM0bnoA3W3FLPUW9Xq9Q5Gov2oD7auNT8BBOTp2k2tAv5xehhlXC28L7z3wqihPHCpcJOgbOAzf/IHcJJYCkYg9CzMA1eAebRs6nL1loUEr8JmFxPItQn6j96BuAO1oA7IQXkDwfDBHQUygfLgCf0RCqb8MF3W/6Ygo1v9Ut0E7U7NTr1TyuG7ZrZ2os6J4PSSJhD8cskAKyBshGAyWFXcBbwLvE3CQwCJ2GXYIngPH8nz5ebwrZhrWdkI33hF+AMIIAeRp0gZWQ90U74kNfJIKqNSrE6ZBjYA+6H2iBH2A4uh2ZC18FEYBMtoy4TJDbX8sUUZMzUH9Ud0H7TTNIEaFZqCE2H1lf/1nDMdNbyA5dQ64EciI8GMT2sKMbylvL7CG4J0gSbBQ18lN/FvcXxZF9iGq0z5F9oMegIoLQXdYh0JLUEQk4kM8i5lIgupq8DM0ACPALVQ2wYh15BftAycCUwmG4glxFl2HDLCyuKUv1j3VstU/tIc13ToDmo3ab7pJ9gtDM7YeOIk1QZ4ARHoXOYIewSTm9eP+tzxwjBOAHGX8jfz4vjSjiJLDnzKGqEd0NOYBvdQImoPaQHySDdyA1kJ/kfFUqb6ffAGpAN/QeVQ0aoDjoFEWAwGGxFnEKGEmmYl+WeaYCxU1+g69FO1QJaSDtLC+loXaShyphsfoBlEQQVCq6FT6AHmaPZvzlcHsG7xW+zZsFH+Q08C7eKc4btyrrDsEWvwn5QFfCW/kbR5C6yr7Uaw0mrPihrjknbA8XAAVBmRZFv7VvfoaXQHxC0evovtY8UEOcxoXVHPdhI6w06b90t7VztGm2h9oguXl9qWG4Ksvjgw633qcvgO/gbepc5mf2N08HN4k3jn+Jv4Qv5S3g7uTM5fPYDpj/jJTIErgFvA8fpJEpjRRFG9icXkB/IUKqUOkoPBnqAC6CTVZMZVhxJUDh0DywCCum71BSyHd+EEeaLppFGO0Mv/SJdm/adtkQ7SgfqeYYFRpXpreUR/pr8QytAHFajn5kx7BecTO5pHsoP5HP4t3gdXAungn3emm18QSchrdBlcCmwgD5OtZF7yHHkBHIfWUMuoHAqmZ5t9WkS6AEdgl5Db63/ttA28C5wm95IeZAZ+AxMYT5nmmwMNkTqb+v668S6Ybr3uv36s4Zm4xZzCNaLcKeCgGHQEMSRUcyMZd/i3OJO433kFfPu8XrzNnL3c+az7VifGTHWXeElaBoYZO3Im6ha8gA5k1xMJpC0dbrpRefR2wBH8CXoA+2FHkK3oUWQGpwAbgLW0SOt3SIRH4LVms+a5hqnGnbqq3QHrNnvA52f3qwXGJea9OY07BJxijoNnIC2ISMZbdZaHOVs4sp4a3g7eUN4n7gYh8FpZT1gTmaokcvwOEhiZdqOXkCVk/+RK6z1SCfdqcfUKLqTPg8Egulgb2gbdMXKSgSUB7qAo6xTlpz6R+zHPbG/1lqsMW40JOvtrQrN0fH0N/UbrflWk2mjxQ+HSTXVDBRBT5FlDL1VF2s4o7llXBeeE6+UO5EbzznP3sQawGxFzyPDYQosB0poCzWZKiHPWJVxhawmx1C/qWU0E3gKRIBZYB9onRXDGsjVqgodIAfEtIJMIeJwkXVTfsm033jBUK6fpXfUu+s369mGNmv+O9/caUnA15FT6IGgFK5GjjBo5hj2FI6ce5X7h5vB3cCt58g5LmyQlcs4iA5AlNaZPgl4RtdTI6hi8hp5mnxJYuQKSmntm55ABhANFoD+Vm9shqZBFLgHzAUUdBuVSZ4kRuOUJcN803TR+MbANtzQr9Lv05frdxjmWPOtEvN8jEuUkE/pw+BUmIneZqCsMHYQp5UTyz3IXc7lcrdyHrNfsi4z4xiuaC18D9oNrgeO0TnUQCuKe+RdMo+0p45TQvohPRwos94BSqw3otnQAigEqgVjwDvAd/ozlUCuJPxxpeWL+Z7psbHSMNRQpX9vxTDE0Gz4bfXHeEsBtp0YSAHAL/AEHIimMdis3mwh5zVHxu3H5XGfcHicoezRLH8mgWYiJ+A5UDg4HFhGp1F9qTJrHd6SLdY57zEVSGdaHdIFWO8doBcUBUVCDlA6GABuA67Sl6kdZCQhwxst6eYUU4aRNmwyOBkYhn6GO4Yo42BTnPmDZTBeQ1ykpgEC6As8Hf3JYLFs2Qr2Ac4/TpMVyzjOQ3YJq5qZxUhAVyODYTnEAGXAWGsH8KGqyS/kL6s/YqlcajJdT28CCGCn9SxzhUZAA6183ATZYJTVIeuoGLIvQWNlVhSfTNVGH+MjwwJDjOGkATC+NT4yFZq9sPt4OKmg7gCTISW8GS22MgKzs9mRnHOcy5y5nA52BHsdaztzCWMEKkdUUBn4D+ih/ekLlAfVaJ3xGkgHaivVTq2lMToe4IOHwTrQAepvVWYTuBNsBrytiMdTwaSE6MYKLF/NeSaTcaqx1pBkuGdosqbxTiaROcxyFmMRCeRwut3qUwfkLFprVaeCdYct40yyZsEw5wS7nsVhSZkIox3Jgh9DN6zazKUl9FHKjeq0usNIDqQuUCh9gpYCCYATeNKKQgq5Q2woG5wJfrW+7He1zr0y0oLXYNmWH+ZKk8y0xygzthjUhjDjN+NB005zkkWPrSKM5HnaH/wORSCP0FaGkfmPtZ1dy2ZxTOzn7L7sA6wnzDeMJ+hFZCe8FFoEbgWSaYLaTblS/wNQSwMEFAAAAAgAM39TXeuXFHMwAAAAAAEAAA0AAAB2bS9xYWdhbWUucXZtcxEpEmJlYGBQgGIHJMwgwMDADMQMHCAOC4hFdRBo7BgfGOYbX5iYnpibSgsb8AMAUEsDBBQAAAAIADN/U12Q+SoNLwAAAAABAAAMAAAAdm0vY2dhbWUucXZtcxEpEmJlYGBQgGIHJMwgwMDADMQMHCAOC4hFdRBo7BgfGOYbn5yemJtKCwsIAABQSwMEFAAAAAgAM39TXbc5CYAsAAAAAAEAAAkAAAB2bS91aS5xdm1zESkSYmVgYFCAYgckzCDAwMAMxAwcIA4LiEV1EGjsGB8Y5htfmkkL0wkDAFBLAQIUABQAAAAIADN/U13x/s3DLwAAADIAAAAWAAAAAAAAAAAAAAAAAAAAAABzY3JpcHRzL3NoYWRlcmxpc3QudHh0UEsBAhQAFAAAAAgAM39TXVed8RanAAAAqAEAABIAAAAAAAAAAAAAAAAAYwAAAHNjcmlwdHMvYXJlbmFzLnR4dFBLAQIUABQAAAAIADN/U13sOQCocAAAAPEAAAAQAAAAAAAAAAAAAAAAADoBAABzY3JpcHRzL2JvdHMudHh0UEsBAhQAFAAAAAgAM39TXWwDTwQ8AgAAsQYAABIAAAAAAAAAAAAAAAAA2AEAAHNjcmlwdHMvc2Z4LnNoYWRlclBLAQIUABQAAAAIADN/U11PjVsFowAAAAgBAAAWAAAAAAAAAAAAAAAAAEQEAABzY3JpcHRzL2xpcXVpZHMuc2hhZGVyUEsBAhQAFAAAAAgAM39TXQqfe0DRAAAAFQIAABQAAAAAAAAAAAAAAAAAGwUAAHNjcmlwdHMvc2tpZXMuc2hhZGVyUEsBAhQAFAAAAAgAM39TXU5+9fi7AAAAXQQAABUAAAAAAAAAAAAAAAAAHgYAAHNjcmlwdHMvbW9kZWxzLnNoYWRlclBLAQIUABQAAAAIADN/U13hHq/pd24AAIiVCAAPAAAAAAAAAAAAAAAAAAwHAABtYXBzL3EzZG0xNy5ic3BQSwECFAAUAAAACAAzf1NdXQwyGbJaAAD8XQMADgAAAAAAAAAAAAAAAACwdQAAbWFwcy9xM2RtMS5ic3BQSwECFAAUAAAACAAzf1Nd5HYQSnVaAACgxgMADgAAAAAAAAAAAAAAAACO0AAAbWFwcy9xM2RtNi5ic3BQSwECFAAUAAAACAAzf1NdVK7cKXpRAABs2gIAEwAAAAAAAAAAAAAAAAAvKwEAbWFwcy9xM3RvdXJuZXkyLmJzcFBLAQIUABQAAAAIADN/U13Enljt1QkAAIztAAAeAAAAAAAAAAAAAAAAANp8AQBtb2RlbHMvcGxheWVycy9zYXJnZS9sb3dlci5tZDNQSwECFAAUAAAACAAzf1Nd+C76OzQOAACszQAAHgAAAAAAAAAAAAAAAADrhgEAbW9kZWxzL3BsYXllcnMvc2FyZ2UvdXBwZXIubWQzUEsBAhQAFAAAAAgAM39TXS0X/v6CAQAAdAUAAB0AAAAAAAAAAAAAAAAAW5UBAG1vZGVscy9wbGF5ZXJzL3NhcmdlL2hlYWQubWQzUEsBAhQAFAAAAAgAM39TXRU48HKPAQAAbwMAACIAAAAAAAAAAAAAAAAAGJcBAG1vZGVscy9wbGF5ZXJzL3NhcmdlL2FuaW1hdGlvbi5jZmdQSwECFAAUAAAACAAzf1NdJJQI8iQAAAAiAAAAJwAAAAAAAAAAAAAAAADnmAEAbW9kZWxzL3BsYXllcnMvc2FyZ2UvbG93ZXJfZGVmYXVsdC5za2luUEsBAhQAFAAAAAgAM39TXcA2Jz8lAAAAIwAAACcAAAAAAAAAAAAAAAAAUJkBAG1vZGVscy9wbGF5ZXJzL3NhcmdlL3VwcGVyX2RlZmF1bHQuc2tpblBLAQIUABQAAAAIADN/U13EWc/OIQAAACEAAAAmAAAAAAAAAAAAAAAAALqZAQBtb2RlbHMvcGxheWVycy9zYXJnZS9oZWFkX2RlZmF1bHQuc2tpblBLAQIUABQAAAAIADN/U12VrRUDoBoAABJAAAAjAAAAAAAAAAAAAAAAAB+aAQBtb2RlbHMvcGxheWVycy9zYXJnZS9zYXJnZV9za2luLnRnYVBLAQIUABQAAAAIADN/U135ZQWuTwAAABJAAAAjAAAAAAAAAAAAAAAAAAC1AQBtb2RlbHMvcGxheWVycy9zYXJnZS9zYXJnZV9oZWFkLnRnYVBLAQIUABQAAAAIADN/U12A0qOl1gkAAIztAAAeAAAAAAAAAAAAAAAAAJC1AQBtb2RlbHMvcGxheWVycy92aXNvci9sb3dlci5tZDNQSwECFAAUAAAACAAzf1NdvuTEOjUOAACszQAAHgAAAAAAAAAAAAAAAACivwEAbW9kZWxzL3BsYXllcnMvdmlzb3IvdXBwZXIubWQzUEsBAhQAFAAAAAgAM39TXR+Dgh+DAQAAdAUAAB0AAAAAAAAAAAAAAAAAE84BAG1vZGVscy9wbGF5ZXJzL3Zpc29yL2hlYWQubWQzUEsBAhQAFAAAAAgAM39TXXqU2ziPAQAAbwMAACIAAAAAAAAAAAAAAAAA0c8BAG1vZGVscy9wbGF5ZXJzL3Zpc29yL2FuaW1hdGlvbi5jZmdQSwECFAAUAAAACAAzf1NdZfMM8iQAAAAiAAAAJwAAAAAAAAAAAAAAAACg0QEAbW9kZWxzL3BsYXllcnMvdmlzb3IvbG93ZXJfZGVmYXVsdC5za2luUEsBAhQAFAAAAAgAM39TXYFRIz8lAAAAIwAAACcAAAAAAAAAAAAAAAAACdIBAG1vZGVscy9wbGF5ZXJzL3Zpc29yL3VwcGVyX2RlZmF1bHQuc2tpblBLAQIUABQAAAAIADN/U13EGKjKIQAAACEAAAAmAAAAAAAAAAAAAAAAAHPSAQBtb2RlbHMvcGxheWVycy92aXNvci9oZWFkX2RlZmF1bHQuc2tpblBLAQIUABQAAAAIADN/U11FTkUSDBgAABJAAAAjAAAAAAAAAAAAAAAAANjSAQBtb2RlbHMvcGxheWVycy92aXNvci92aXNvcl9za2luLnRnYVBLAQIUABQAAAAIADN/U12EE31WTwAAABJAAAAjAAAAAAAAAAAAAAAAACXrAQBtb2RlbHMvcGxheWVycy92aXNvci92aXNvcl9oZWFkLnRnYVBLAQIUABQAAAAIADN/U13ztm7i1QkAAIztAAAeAAAAAAAAAAAAAAAAALXrAQBtb2RlbHMvcGxheWVycy94YWVyby9sb3dlci5tZDNQSwECFAAUAAAACAAzf1NdibEOoTQOAACszQAAHgAAAAAAAAAAAAAAAADG9QEAbW9kZWxzL3BsYXllcnMveGFlcm8vdXBwZXIubWQzUEsBAhQAFAAAAAgAM39TXelw49KCAQAAdAUAAB0AAAAAAAAAAAAAAAAANgQCAG1vZGVscy9wbGF5ZXJzL3hhZXJvL2hlYWQubWQzUEsBAhQAFAAAAAgAM39TXSWXrZ+PAQAAbwMAACIAAAAAAAAAAAAAAAAA8wUCAG1vZGVscy9wbGF5ZXJzL3hhZXJvL2FuaW1hdGlvbi5jZmdQSwECFAAUAAAACAAzf1NdTbF/MSQAAAAiAAAAJwAAAAAAAAAAAAAAAADCBwIAbW9kZWxzL3BsYXllcnMveGFlcm8vbG93ZXJfZGVmYXVsdC5za2luUEsBAhQAFAAAAAgAM39TXakTUPwlAAAAIwAAACcAAAAAAAAAAAAAAAAAKwgCAG1vZGVscy9wbGF5ZXJzL3hhZXJvL3VwcGVyX2RlZmF1bHQuc2tpblBLAQIUABQAAAAIADN/U105kWS1IQAAACEAAAAmAAAAAAAAAAAAAAAAAJUIAgBtb2RlbHMvcGxheWVycy94YWVyby9oZWFkX2RlZmF1bHQuc2tpblBLAQIUABQAAAAIADN/U12obtVQqBgAABJAAAAjAAAAAAAAAAAAAAAAAPoIAgBtb2RlbHMvcGxheWVycy94YWVyby94YWVyb19za2luLnRnYVBLAQIUABQAAAAIADN/U115yl6QSwAAABJAAAAjAAAAAAAAAAAAAAAAAOMhAgBtb2RlbHMvcGxheWVycy94YWVyby94YWVyb19oZWFkLnRnYVBLAQIUABQAAAAIADN/U13hCu1OugEAAFQGAAAlAAAAAAAAAAAAAAAAAG8iAgBtb2RlbHMvd2VhcG9uczIvZ2F1bnRsZXQvZ2F1bnRsZXQubWQzUEsBAhQAFAAAAAgAM39TXdo6xBZ4AAAAEkAAACUAAAAAAAAAAAAAAAAAbCQCAG1vZGVscy93ZWFwb25zMi9nYXVudGxldC9nYXVudGxldC50Z2FQSwECFAAUAAAACAAzf1Nd9jr2xr0BAABUBgAAKQAAAAAAAAAAAAAAAAAnJQIAbW9kZWxzL3dlYXBvbnMyL21hY2hpbmVndW4vbWFjaGluZWd1bi5tZDNQSwECFAAUAAAACAAzf1Nd9OFpE3kAAAASQAAAKQAAAAAAAAAAAAAAAAArJwIAbW9kZWxzL3dlYXBvbnMyL21hY2hpbmVndW4vbWFjaGluZWd1bi50Z2FQSwECFAAUAAAACAAzf1Ndv188hLgBAABUBgAAIwAAAAAAAAAAAAAAAADrJwIAbW9kZWxzL3dlYXBvbnMyL3Nob3RndW4vc2hvdGd1bi5tZDNQSwECFAAUAAAACAAzf1NdtgyYrXYAAAASQAAAIwAAAAAAAAAAAAAAAADkKQIAbW9kZWxzL3dlYXBvbnMyL3Nob3RndW4vc2hvdGd1bi50Z2FQSwECFAAUAAAACAAzf1Nd5Z3oS7cBAABUBgAAJQAAAAAAAAAAAAAAAACbKgIAbW9kZWxzL3dlYXBvbnMyL2dyZW5hZGVsL2dyZW5hZGVsLm1kM1BLAQIUABQAAAAIADN/U11tVPxldQAAABJAAAAlAAAAAAAAAAAAAAAAAJUsAgBtb2RlbHMvd2VhcG9uczIvZ3JlbmFkZWwvZ3JlbmFkZWwudGdhUEsBAhQAFAAAAAgAM39TXXJ9NZ+4AQAAVAYAACMAAAAAAAAAAAAAAAAATS0CAG1vZGVscy93ZWFwb25zMi9yb2NrZXRsL3JvY2tldGwubWQzUEsBAhQAFAAAAAgAM39TXeIBSdh3AAAAEkAAACMAAAAAAAAAAAAAAAAARi8CAG1vZGVscy93ZWFwb25zMi9yb2NrZXRsL3JvY2tldGwudGdhUEsBAhQAFAAAAAgAM39TXXBRwSu8AQAAVAYAACcAAAAAAAAAAAAAAAAA/i8CAG1vZGVscy93ZWFwb25zMi9saWdodG5pbmcvbGlnaHRuaW5nLm1kM1BLAQIUABQAAAAIADN/U12eaXZjdwAAABJAAAAnAAAAAAAAAAAAAAAAAP8xAgBtb2RlbHMvd2VhcG9uczIvbGlnaHRuaW5nL2xpZ2h0bmluZy50Z2FQSwECFAAUAAAACAAzf1Nd+0cXDbgBAABUBgAAIwAAAAAAAAAAAAAAAAC7MgIAbW9kZWxzL3dlYXBvbnMyL3JhaWxndW4vcmFpbGd1bi5tZDNQSwECFAAUAAAACAAzf1NdWBl33XgAAAASQAAAIwAAAAAAAAAAAAAAAAC0NAIAbW9kZWxzL3dlYXBvbnMyL3JhaWxndW4vcmFpbGd1bi50Z2FQSwECFAAUAAAACAAzf1Ndnehs9bYBAABUBgAAIQAAAAAAAAAAAAAAAABtNQIAbW9kZWxzL3dlYXBvbnMyL3BsYXNtYS9wbGFzbWEubWQzUEsBAhQAFAAAAAgAM39TXf2+xrJ4AAAAEkAAACEAAAAAAAAAAAAAAAAAYjcCAG1vZGVscy93ZWFwb25zMi9wbGFzbWEvcGxhc21hLnRnYVBLAQIUABQAAAAIADN/U13bxDwTtQEAAFQGAAAbAAAAAAAAAAAAAAAAABk4AgBtb2RlbHMvd2VhcG9uczIvYmZnL2JmZy5tZDNQSwECFAAUAAAACAAzf1NdPg9lUXgAAAASQAAAGwAAAAAAAAAAAAAAAAAHOgIAbW9kZWxzL3dlYXBvbnMyL2JmZy9iZmcudGdhUEsBAhQAFAAAAAgAM39TXURIsjSAAQAAdAUAACMAAAAAAAAAAAAAAAAAuDoCAG1vZGVscy9wb3dlcnVwcy9hcm1vci9hcm1vcl9yZWQubWQzUEsBAhQAFAAAAAgAM39TXfAZRr9FEQAAEkAAACMAAAAAAAAAAAAAAAAAeTwCAG1vZGVscy9wb3dlcnVwcy9hcm1vci9hcm1vcl9yZWQudGdhUEsBAhQAFAAAAAgAM39TXQqsHKaCAQAAdAUAACMAAAAAAAAAAAAAAAAA/00CAG1vZGVscy9wb3dlcnVwcy9hcm1vci9hcm1vcl95ZWwubWQzUEsBAhQAFAAAAAgAM39TXbs9NNcUFQAAEkAAACMAAAAAAAAAAAAAAAAAwk8CAG1vZGVscy9wb3dlcnVwcy9hcm1vci9hcm1vcl95ZWwudGdhUEsBAhQAFAAAAAgAM39TXTECWQKGAQAAdAUAACUAAAAAAAAAAAAAAAAAF2UCAG1vZGVscy9wb3dlcnVwcy9oZWFsdGgvbWVnYV9jcm9zcy5tZDNQSwECFAAUAAAACAAzf1Nd5p0UwFIUAAASQAAAJQAAAAAAAAAAAAAAAADgZgIAbW9kZWxzL3Bvd2VydXBzL2hlYWx0aC9tZWdhX2Nyb3NzLnRnYVBLAQIUABQAAAAIADN/U11Qj/M0hgEAAHQFAAAmAAAAAAAAAAAAAAAAAHV7AgBtb2RlbHMvcG93ZXJ1cHMvaGVhbHRoL2xhcmdlX2Nyb3NzLm1kM1BLAQIUABQAAAAIADN/U11Pi3gj0RQAABJAAAAmAAAAAAAAAAAAAAAAAD99AgBtb2RlbHMvcG93ZXJ1cHMvaGVhbHRoL2xhcmdlX2Nyb3NzLnRnYVBLAQIUABQAAAAIADN/U13c9NMlgwEAAHQFAAAgAAAAAAAAAAAAAAAAAFSSAgBtb2RlbHMvcG93ZXJ1cHMvaW5zdGFudC9xdWFkLm1kM1BLAQIUABQAAAAIADN/U10X4Ts9lRMAABJAAAAgAAAAAAAAAAAAAAAAABWUAgBtb2RlbHMvcG93ZXJ1cHMvaW5zdGFudC9xdWFkLnRnYVBLAQIUABQAAAAIADN/U10LVjVyggEAAHQFAAAhAAAAAAAAAAAAAAAAAOinAgBtb2RlbHMvcG93ZXJ1cHMvaW5zdGFudC9oYXN0ZS5tZDNQSwECFAAUAAAACAAzf1NdGKby1A4WAAASQAAAIQAAAAAAAAAAAAAAAACpqQIAbW9kZWxzL3Bvd2VydXBzL2luc3RhbnQvaGFzdGUudGdhUEsBAhQAFAAAAAgAM39TXe1m2Rp4AQAAdAUAAB0AAAAAAAAAAAAAAAAA9r8CAG1vZGVscy9hbW1vL3JvY2tldC9yb2NrZXQubWQzUEsBAhQAFAAAAAgAM39TXambX6yLEQAAEkAAAB0AAAAAAAAAAAAAAAAAqcECAG1vZGVscy9hbW1vL3JvY2tldC9yb2NrZXQudGdhUEsBAhQAFAAAAAgAM39TXVcDuph3AQAAdAUAABUAAAAAAAAAAAAAAAAAb9MCAG1vZGVscy9naWJzL3NrdWxsLm1kM1BLAQIUABQAAAAIADN/U12NQqvG0A0AABJAAAAUAAAAAAAAAAAAAAAAABnVAgBtb2RlbHMvZ2licy9naWJzLnRnYVBLAQIUABQAAAAIADN/U12Lxn33xzYAABIAAQAnAAAAAAAAAAAAAAAAABvjAgB0ZXh0dXJlcy9iYXNlX2Zsb29yL21ldGFsdGVjaF9mbG9vci50Z2FQSwECFAAUAAAACAAzf1Nd94SEWjIzAAASAAEAIwAAAAAAAAAAAAAAAAAnGgMAdGV4dHVyZXMvYmFzZV9mbG9vci9jbGFuZ19mbG9vci50Z2FQSwECFAAUAAAACAAzf1Nd7lVwpDIuAAASAAEAJAAAAAAAAAAAAAAAAACaTQMAdGV4dHVyZXMvYmFzZV9mbG9vci9nb3RoaWNfYmxvY2sudGdhUEsBAhQAFAAAAAgAM39TXZURgIlPLwAAEgABACUAAAAAAAAAAAAAAAAADnwDAHRleHR1cmVzL2Jhc2Vfd2FsbC9tZXRhbHRlY2hfd2FsbC50Z2FQSwECFAAUAAAACAAzf1NdWbjLQigyAAASAAEAIgAAAAAAAAAAAAAAAACgqwMAdGV4dHVyZXMvYmFzZV93YWxsL2dvdGhpY193YWxsLnRnYVBLAQIUABQAAAAIADN/U13DVkstVjoAABIAAQAkAAAAAAAAAAAAAAAAAAjeAwB0ZXh0dXJlcy9iYXNlX3dhbGwvZ290aGljX3BpbGxhci50Z2FQSwECFAAUAAAACAAzf1NdG8eC1fImAAASAAEAIgAAAAAAAAAAAAAAAACgGAQAdGV4dHVyZXMvYmFzZV93YWxsL2dvdGhpY190cmltLnRnYVBLAQIUABQAAAAIADN/U11I8jyESQIAABIAAQAYAAAAAAAAAAAAAAAAANI/BAB0ZXh0dXJlcy9zZngvanVtcHBhZC50Z2FQSwECFAAUAAAACAAzf1NdCwz2npkSAAASAAEAHQAAAAAAAAAAAAAAAABRQgQAdGV4dHVyZXMvc2Z4L2p1bXBwYWRfcmluZy50Z2FQSwECFAAUAAAACAAzf1Nd6NBrIOgeAAASAAEAHQAAAAAAAAAAAAAAAAAlVQQAdGV4dHVyZXMvc2Z4L2p1bXBwYWRfZ2xvdy50Z2FQSwECFAAUAAAACAAzf1NdLTpN6e08AAASAAEAGwAAAAAAAAAAAAAAAABIdAQAdGV4dHVyZXMvc2Z4L3BvcnRhbF9zZngudGdhUEsBAhQAFAAAAAgAM39TXTjLYb+cEwAAEkAAABgAAAAAAAAAAAAAAAAAbrEEAHRleHR1cmVzL3NmeC9mb2dfcmVkLnRnYVBLAQIUABQAAAAIADN/U13CszlRYBkAABJAAAAZAAAAAAAAAAAAAAAAAEDFBAB0ZXh0dXJlcy9zZngvcXVhZF9lbnYudGdhUEsBAhQAFAAAAAgAM39TXezyqlOUXAAAEgABAB0AAAAAAAAAAAAAAAAA194EAHRleHR1cmVzL2xpcXVpZHMvbGF2YWhlbGwudGdhUEsBAhQAFAAAAAgAM39TXYViSdtsAgAAEgABAB4AAAAAAAAAAAAAAAAApjsFAHRleHR1cmVzL3NraWVzL3NwYWNlX3N0YXJzLnRnYVBLAQIUABQAAAAIADN/U11kMdfpVggAABIAAQAfAAAAAAAAAAAAAAAAAE4+BQB0ZXh0dXJlcy9za2llcy9zcGFjZV9uZWJ1bGEudGdhUEsBAhQAFAAAAAgAM39TXXY3fT9qLwAAEgABAB4AAAAAAAAAAAAAAAAA4UYFAHRleHR1cmVzL3NraWVzL2hlbGxfY2xvdWRzLnRnYVBLAQIUABQAAAAIADN/U11vgO4jygYAABJAAAASAAAAAAAAAAAAAAAAAId2BQBnZngvbWlzYy9mbGFyZS50Z2FQSwECFAAUAAAACAAzf1NdwO1BaoQAAAASIAAAFQAAAAAAAAAAAAAAAACBfQUAZ2Z4L21pc2MvcmFpbGNvcmUudGdhUEsBAhQAFAAAAAgAM39TXansnBCIDQAAEiAAABYAAAAAAAAAAAAAAAAAOH4FAGdmeC9taXNjL2xpZ2h0bmluZy50Z2FQSwECFAAUAAAACAAzf1NdVHU0KT8JAAASQAAAGgAAAAAAAAAAAAAAAAD0iwUAZ2Z4L2RhbWFnZS9ob2xlX2xnX21yay50Z2FQSwECFAAUAAAACAAzf1NdvAQ6XyAPAACsDwAAFgAAAAAAAAAAAAAAAABrlQUAc291bmQvZmVlZGJhY2svaGl0LndhdlBLAQIUABQAAAAIADN/U12umVb26z4AAKJBAAAhAAAAAAAAAAAAAAAAAL+kBQBzb3VuZC93ZWFwb25zL3JvY2tldC9yb2NrbGYxYS53YXZQSwECFAAUAAAACAAzf1NdEl4M525bAADqXgAAIQAAAAAAAAAAAAAAAADp4wUAc291bmQvd2VhcG9ucy9yb2NrZXQvcm9ja2x4MWEud2F2UEsBAhQAFAAAAAgAM39TXSt4x9fvRAAAhkgAACIAAAAAAAAAAAAAAAAAlj8GAHNvdW5kL3dlYXBvbnMvcmFpbGd1bi9yYWlsZ2YxYS53YXZQSwECFAAUAAAACAAzf1NdAiaahRgXAABKGAAAIQAAAAAAAAAAAAAAAADFhAYAc291bmQvd2VhcG9ucy9wbGFzbWEvaHlwcmJmMWEud2F2UEsBAhQAFAAAAAgAM39TXU/Xx5alKQAAPCsAACIAAAAAAAAAAAAAAAAAHJwGAHNvdW5kL3dlYXBvbnMvbGlnaHRuaW5nL2xnX2h1bS53YXZQSwECFAAUAAAACAAzf1Nd0fYOMJINAAD0DQAAJQAAAAAAAAAAAAAAAAABxgYAc291bmQvd2VhcG9ucy9tYWNoaW5lZ3VuL21hY2hnZjFiLndhdlBLAQIUABQAAAAIADN/U11Rcrj5GisAAPYsAAAiAAAAAAAAAAAAAAAAANbTBgBzb3VuZC93ZWFwb25zL3Nob3RndW4vc3Nob3RmMWIud2F2UEsBAhQAFAAAAAgAM39TXVUGbcb9NQAATDcAABcAAAAAAAAAAAAAAAAAMP8GAHNvdW5kL3dvcmxkL2p1bXBwYWQud2F2UEsBAhQAFAAAAAgAM39TXUFhNc7HOgAAdjwAABYAAAAAAAAAAAAAAAAAYjUHAHNvdW5kL3dvcmxkL3RlbGVpbi53YXZQSwECFAAUAAAACAAzf1NdTcT185kuAABoMAAAFwAAAAAAAAAAAAAAAABdcAcAc291bmQvaXRlbXMvZGFtYWdlMy53YXZQSwECFAAUAAAACAAzf1Nd65cUczAAAAAAAQAADQAAAAAAAAAAAAAAAAArnwcAdm0vcWFnYW1lLnF2bVBLAQIUABQAAAAIADN/U12Q+SoNLwAAAAABAAAMAAAAAAAAAAAAAAAAAIafBwB2bS9jZ2FtZS5xdm1QSwECFAAUAAAACAAzf1NdtzkJgCwAAAAAAQAACQAAAAAAAAAAAAAAAADfnwcAdm0vdWkucXZtUEsFBgAAAABrAGsA9x8AADKgBwAAAA==";

  // src/qcommon/vm.ts
  var VM_MAGIC = 309466180;
  var QuakeVirtualMachine = class {
    name;
    instructions = [];
    memory;
    mem8;
    memView;
    dataMask;
    syscall;
    constructor(name, buffer, syscall) {
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
      const rawTotal = dataLength + litLength + bssLength + 65536;
      let pow2 = 1;
      while (pow2 < rawTotal) pow2 <<= 1;
      this.memory = new ArrayBuffer(pow2);
      this.mem8 = new Uint8Array(this.memory);
      this.memView = new DataView(this.memory);
      this.dataMask = pow2 - 1;
      const copyLen = Math.min(dataLength + litLength, buffer.byteLength - dataOffset);
      if (copyLen > 0) {
        this.mem8.set(buffer.subarray(dataOffset, dataOffset + copyLen), 0);
      }
      let pc = codeOffset;
      for (let i = 0; i < instructionCount && pc < buffer.byteLength; i++) {
        const op = buffer[pc++];
        let arg = 0;
        if (op === 3 /* OP_ENTER */ || op === 4 /* OP_LEAVE */ || op === 8 /* OP_CONST */ || op === 9 /* OP_LOCAL */ || op === 11 /* OP_EQ */ || op === 12 /* OP_NE */ || op === 13 /* OP_LTI */ || op === 14 /* OP_LEI */ || op === 15 /* OP_GTI */ || op === 16 /* OP_GEI */ || op === 17 /* OP_LTU */ || op === 18 /* OP_LEU */ || op === 19 /* OP_GTU */ || op === 20 /* OP_GEU */ || op === 21 /* OP_EQF */ || op === 22 /* OP_NEF */ || op === 23 /* OP_LTF */ || op === 24 /* OP_LEF */ || op === 25 /* OP_GTF */ || op === 26 /* OP_GEF */ || op === 34 /* OP_BLOCK_COPY */) {
          arg = view.getInt32(pc, true);
          pc += 4;
        } else if (op === 33 /* OP_ARG */) {
          arg = buffer[pc++];
        }
        this.instructions.push({ op, arg });
      }
    }
    readString(addr) {
      let s = "";
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
    call(command, ...args) {
      const opStack = new Int32Array(256);
      const opStackF = new Float32Array(opStack.buffer);
      let sp = 0;
      let programStack = this.dataMask + 1 - 1024;
      this.memView.setInt32(programStack + 8, command, true);
      for (let i = 0; i < args.length; i++) {
        this.memView.setInt32(programStack + 12 + i * 4, args[i] | 0, true);
      }
      let pc = 0;
      let steps = 0;
      const maxSteps = 5e5;
      while (pc >= 0 && pc < this.instructions.length && steps++ < maxSteps) {
        const ins = this.instructions[pc++];
        switch (ins.op) {
          case 3 /* OP_ENTER */:
            programStack -= ins.arg;
            break;
          case 4 /* OP_LEAVE */:
            programStack += ins.arg;
            return opStack[sp];
          case 6 /* OP_PUSH */:
            sp++;
            break;
          case 7 /* OP_POP */:
            sp--;
            break;
          case 8 /* OP_CONST */:
            opStack[++sp] = ins.arg;
            break;
          case 9 /* OP_LOCAL */:
            opStack[++sp] = programStack + ins.arg;
            break;
          case 10 /* OP_JUMP */:
            pc = opStack[sp--];
            break;
          case 5 /* OP_CALL */: {
            const target = opStack[sp--];
            if (target < 0) {
              opStack[++sp] = this.syscall(-1 - target, programStack + 4, this);
            } else {
              pc = target;
            }
            break;
          }
          case 29 /* OP_LOAD4 */:
            opStack[sp] = this.memView.getInt32(opStack[sp] & this.dataMask, true);
            break;
          case 32 /* OP_STORE4 */:
            this.memView.setInt32(opStack[sp - 1] & this.dataMask, opStack[sp], true);
            sp -= 2;
            break;
          case 38 /* OP_ADD */:
            opStack[sp - 1] = opStack[sp - 1] + opStack[sp] | 0;
            sp--;
            break;
          case 39 /* OP_SUB */:
            opStack[sp - 1] = opStack[sp - 1] - opStack[sp] | 0;
            sp--;
            break;
          case 44 /* OP_MULI */:
            opStack[sp - 1] = Math.imul(opStack[sp - 1], opStack[sp]);
            sp--;
            break;
          case 54 /* OP_ADDF */:
            opStackF[sp - 1] = opStackF[sp - 1] + opStackF[sp];
            sp--;
            break;
          case 55 /* OP_SUBF */:
            opStackF[sp - 1] = opStackF[sp - 1] - opStackF[sp];
            sp--;
            break;
          case 57 /* OP_MULF */:
            opStackF[sp - 1] = opStackF[sp - 1] * opStackF[sp];
            sp--;
            break;
          default:
            break;
        }
      }
      return 0;
    }
  };
  function loadAllQvmModules() {
    const loaded = /* @__PURE__ */ new Map();
    for (const vmPath of ["vm/qagame.qvm", "vm/cgame.qvm", "vm/ui.qvm"]) {
      const raw = VFS.readFile(vmPath);
      if (raw) {
        try {
          const vm = new QuakeVirtualMachine(vmPath, raw, (syscallNum) => {
            return syscallNum;
          });
          vm.call(0);
          loaded.set(vmPath, vm);
          Cmd.print(`^2QVM Interpreter: ^3${vmPath}^7 verified (${vm.instructions.length} instructions, ${(vm.memory.byteLength / 1024).toFixed(0)} KB RAM)`);
        } catch (err2) {
          Cmd.print(`^1QVM Error in ${vmPath}: ${err2.message}`);
        }
      }
    }
    return loaded;
  }

  // src/renderer/tr_curve.ts
  function tessellateBezierPatch(controlVerts, patchWidth, patchHeight, steps = 6) {
    const numPatchesX = Math.floor((patchWidth - 1) / 2);
    const numPatchesY = Math.floor((patchHeight - 1) / 2);
    const outVerts = [];
    const outIndexes = [];
    for (let py = 0; py < numPatchesY; py++) {
      for (let px = 0; px < numPatchesX; px++) {
        const baseVertOffset = outVerts.length;
        const stride = steps + 1;
        const cp = [[], [], []];
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const idx = (py * 2 + r) * patchWidth + (px * 2 + c);
            cp[r][c] = controlVerts[idx];
          }
        }
        for (let iy = 0; iy <= steps; iy++) {
          const v = iy / steps;
          const bv0 = (1 - v) * (1 - v);
          const bv1 = 2 * v * (1 - v);
          const bv2 = v * v;
          for (let ix = 0; ix <= steps; ix++) {
            const u = ix / steps;
            const bu0 = (1 - u) * (1 - u);
            const bu1 = 2 * u * (1 - u);
            const bu2 = u * u;
            const bw = [
              [bv0 * bu0, bv0 * bu1, bv0 * bu2],
              [bv1 * bu0, bv1 * bu1, bv1 * bu2],
              [bv2 * bu0, bv2 * bu1, bv2 * bu2]
            ];
            const xyz = [0, 0, 0];
            const st = [0, 0];
            const lm = [0, 0];
            const norm = [0, 0, 0];
            const col = [0, 0, 0, 0];
            for (let r = 0; r < 3; r++) {
              for (let c = 0; c < 3; c++) {
                const w = bw[r][c];
                const pt = cp[r][c];
                xyz[0] += pt.xyz[0] * w;
                xyz[1] += pt.xyz[1] * w;
                xyz[2] += pt.xyz[2] * w;
                st[0] += pt.st[0] * w;
                st[1] += pt.st[1] * w;
                lm[0] += pt.lightmap[0] * w;
                lm[1] += pt.lightmap[1] * w;
                norm[0] += pt.normal[0] * w;
                norm[1] += pt.normal[1] * w;
                norm[2] += pt.normal[2] * w;
                col[0] += pt.color[0] * w;
                col[1] += pt.color[1] * w;
                col[2] += pt.color[2] * w;
                col[3] += pt.color[3] * w;
              }
            }
            vec3Normalize(norm);
            outVerts.push({
              xyz,
              st,
              lightmap: lm,
              normal: norm,
              color: [
                Math.round(col[0]),
                Math.round(col[1]),
                Math.round(col[2]),
                Math.round(col[3])
              ]
            });
          }
        }
        for (let iy = 0; iy < steps; iy++) {
          for (let ix = 0; ix < steps; ix++) {
            const i00 = baseVertOffset + iy * stride + ix;
            const i10 = i00 + 1;
            const i01 = i00 + stride;
            const i11 = i01 + 1;
            outIndexes.push(i00, i01, i10, i10, i01, i11);
          }
        }
      }
    }
    return { verts: outVerts, indexes: outIndexes };
  }

  // src/renderer/tr_bsp.ts
  var BSP_VERSION_Q3 = 46;
  var MST_PLANAR = 1;
  var MST_PATCH = 2;
  var MST_TRIANGLE_SOUP = 3;
  var MST_FLARE = 4;
  var BspMap = class {
    entitiesRaw = "";
    entities = [];
    shaders = [];
    planes = [];
    nodes = [];
    leafs = [];
    leafSurfaces = new Int32Array(0);
    leafBrushes = new Int32Array(0);
    models = [];
    brushes = [];
    brushSides = [];
    drawVerts = [];
    drawIndexes = new Int32Array(0);
    fogs = [];
    surfaces = [];
    lightmapLump = new Uint8Array(0);
    lightgridLump = new Uint8Array(0);
    numClusters = 0;
    clusterBytes = 0;
    visBitsets = new Uint8Array(0);
    // Expanded GPU Buffers (World + Tessellated Bezier Patches + Inline Models)
    gpuVertexData = new Float32Array(0);
    // 14 floats per vertex: xyz(3), st(2), lm(2), normal(3), rgba(4)
    gpuIndexData = new Uint32Array(0);
    gridMins = [0, 0, 0];
    gridBounds = [1, 1, 1];
    constructor(buffer, lightmapAtlas) {
      const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      const magic = String.fromCharCode(view.getUint8(0)) + String.fromCharCode(view.getUint8(1)) + String.fromCharCode(view.getUint8(2)) + String.fromCharCode(view.getUint8(3));
      const version = view.getInt32(4, true);
      if (magic !== "IBSP" || version !== BSP_VERSION_Q3) {
        throw new Error(`Invalid Quake 3 BSP header: magic=${magic}, version=${version} (expected IBSP v46)`);
      }
      const lumps = [];
      for (let i = 0; i < 17; i++) {
        lumps.push({
          ofs: view.getInt32(8 + i * 8 + 0, true),
          len: view.getInt32(8 + i * 8 + 4, true)
        });
      }
      const readAscii = (ofs, maxLen) => {
        let s = "";
        for (let i = 0; i < maxLen; i++) {
          const c = view.getUint8(ofs + i);
          if (c === 0) break;
          s += String.fromCharCode(c);
        }
        return s;
      };
      this.entitiesRaw = new TextDecoder("utf-8").decode(buffer.subarray(lumps[0].ofs, lumps[0].ofs + lumps[0].len)).replace(/\0+$/, "");
      this.entities = this.parseEntities(this.entitiesRaw);
      const nShaders = Math.floor(lumps[1].len / 72);
      for (let i = 0; i < nShaders; i++) {
        const b = lumps[1].ofs + i * 72;
        this.shaders.push({
          name: readAscii(b, 64),
          surfaceFlags: view.getInt32(b + 64, true),
          contentFlags: view.getInt32(b + 68, true)
        });
      }
      const nPlanes = Math.floor(lumps[2].len / 16);
      for (let i = 0; i < nPlanes; i++) {
        const b = lumps[2].ofs + i * 16;
        this.planes.push({
          normal: [view.getFloat32(b, true), view.getFloat32(b + 4, true), view.getFloat32(b + 8, true)],
          dist: view.getFloat32(b + 12, true)
        });
      }
      const nNodes = Math.floor(lumps[3].len / 36);
      for (let i = 0; i < nNodes; i++) {
        const b = lumps[3].ofs + i * 36;
        this.nodes.push({
          planeNum: view.getInt32(b, true),
          children: [view.getInt32(b + 4, true), view.getInt32(b + 8, true)],
          mins: [view.getInt32(b + 12, true), view.getInt32(b + 16, true), view.getInt32(b + 20, true)],
          maxs: [view.getInt32(b + 24, true), view.getInt32(b + 28, true), view.getInt32(b + 32, true)]
        });
      }
      const nLeafs = Math.floor(lumps[4].len / 48);
      for (let i = 0; i < nLeafs; i++) {
        const b = lumps[4].ofs + i * 48;
        this.leafs.push({
          cluster: view.getInt32(b + 0, true),
          area: view.getInt32(b + 4, true),
          mins: [view.getInt32(b + 8, true), view.getInt32(b + 12, true), view.getInt32(b + 16, true)],
          maxs: [view.getInt32(b + 20, true), view.getInt32(b + 24, true), view.getInt32(b + 28, true)],
          firstLeafSurface: view.getInt32(b + 32, true),
          numLeafSurfaces: view.getInt32(b + 36, true),
          firstLeafBrush: view.getInt32(b + 40, true),
          numLeafBrushes: view.getInt32(b + 44, true)
        });
      }
      const nLeafSurfs = Math.floor(lumps[5].len / 4);
      this.leafSurfaces = new Int32Array(nLeafSurfs);
      for (let i = 0; i < nLeafSurfs; i++) {
        this.leafSurfaces[i] = view.getInt32(lumps[5].ofs + i * 4, true);
      }
      const nLeafBrushes = Math.floor(lumps[6].len / 4);
      this.leafBrushes = new Int32Array(nLeafBrushes);
      for (let i = 0; i < nLeafBrushes; i++) {
        this.leafBrushes[i] = view.getInt32(lumps[6].ofs + i * 4, true);
      }
      const nModels = Math.floor(lumps[7].len / 40);
      for (let i = 0; i < nModels; i++) {
        const b = lumps[7].ofs + i * 40;
        this.models.push({
          mins: [view.getFloat32(b + 0, true), view.getFloat32(b + 4, true), view.getFloat32(b + 8, true)],
          maxs: [view.getFloat32(b + 12, true), view.getFloat32(b + 16, true), view.getFloat32(b + 20, true)],
          firstSurface: view.getInt32(b + 24, true),
          numSurfaces: view.getInt32(b + 28, true),
          firstBrush: view.getInt32(b + 32, true),
          numBrushes: view.getInt32(b + 36, true)
        });
      }
      const nBrushes = Math.floor(lumps[8].len / 12);
      for (let i = 0; i < nBrushes; i++) {
        const b = lumps[8].ofs + i * 12;
        this.brushes.push({
          firstSide: view.getInt32(b + 0, true),
          numSides: view.getInt32(b + 4, true),
          shaderNum: view.getInt32(b + 8, true)
        });
      }
      const nBrushSides = Math.floor(lumps[9].len / 8);
      for (let i = 0; i < nBrushSides; i++) {
        const b = lumps[9].ofs + i * 8;
        this.brushSides.push({
          planeNum: view.getInt32(b + 0, true),
          shaderNum: view.getInt32(b + 4, true)
        });
      }
      const nVerts = Math.floor(lumps[10].len / 44);
      for (let i = 0; i < nVerts; i++) {
        const b = lumps[10].ofs + i * 44;
        this.drawVerts.push({
          xyz: [view.getFloat32(b + 0, true), view.getFloat32(b + 4, true), view.getFloat32(b + 8, true)],
          st: [view.getFloat32(b + 12, true), view.getFloat32(b + 16, true)],
          lightmap: [view.getFloat32(b + 20, true), view.getFloat32(b + 24, true)],
          normal: [view.getFloat32(b + 28, true), view.getFloat32(b + 32, true), view.getFloat32(b + 36, true)],
          color: [
            view.getUint8(b + 40),
            view.getUint8(b + 41),
            view.getUint8(b + 42),
            view.getUint8(b + 43)
          ]
        });
      }
      const nIndexes = Math.floor(lumps[11].len / 4);
      this.drawIndexes = new Int32Array(nIndexes);
      for (let i = 0; i < nIndexes; i++) {
        this.drawIndexes[i] = view.getInt32(lumps[11].ofs + i * 4, true);
      }
      const nFogs = Math.floor(lumps[12].len / 72);
      for (let i = 0; i < nFogs; i++) {
        const b = lumps[12].ofs + i * 72;
        const brushNum = view.getInt32(b + 64, true);
        const bounds = this.computeBrushBounds(brushNum);
        this.fogs.push({
          shader: readAscii(b, 64),
          brushNum,
          visibleSide: view.getInt32(b + 68, true),
          bounds
        });
      }
      const nSurfaces = Math.floor(lumps[13].len / 104);
      for (let i = 0; i < nSurfaces; i++) {
        const b = lumps[13].ofs + i * 104;
        this.surfaces.push({
          index: i,
          shaderNum: view.getInt32(b + 0, true),
          fogNum: view.getInt32(b + 4, true),
          surfaceType: view.getInt32(b + 8, true),
          firstVert: view.getInt32(b + 12, true),
          numVerts: view.getInt32(b + 16, true),
          firstIndex: view.getInt32(b + 20, true),
          numIndexes: view.getInt32(b + 24, true),
          lightmapNum: view.getInt32(b + 28, true),
          origin: [view.getFloat32(b + 48, true), view.getFloat32(b + 52, true), view.getFloat32(b + 56, true)],
          flareColor: [view.getFloat32(b + 60, true), view.getFloat32(b + 64, true), view.getFloat32(b + 68, true)],
          normal: [view.getFloat32(b + 84, true), view.getFloat32(b + 88, true), view.getFloat32(b + 92, true)],
          patchWidth: view.getInt32(b + 96, true),
          patchHeight: view.getInt32(b + 100, true),
          vboFirstVert: 0,
          vboNumVerts: 0,
          iboFirstIndex: 0,
          iboNumIndexes: 0
        });
      }
      this.lightmapLump = buffer.subarray(lumps[14].ofs, lumps[14].ofs + lumps[14].len);
      this.lightgridLump = buffer.subarray(lumps[15].ofs, lumps[15].ofs + lumps[15].len);
      if (this.models.length > 0) {
        const wMins = this.models[0].mins;
        const wMaxs = this.models[0].maxs;
        this.gridMins = [
          64 * Math.ceil(wMins[0] / 64),
          64 * Math.ceil(wMins[1] / 64),
          128 * Math.ceil(wMins[2] / 128)
        ];
        const maxs = [
          64 * Math.floor(wMaxs[0] / 64),
          64 * Math.floor(wMaxs[1] / 64),
          128 * Math.floor(wMaxs[2] / 128)
        ];
        this.gridBounds = [
          Math.max(1, (maxs[0] - this.gridMins[0]) / 64 + 1),
          Math.max(1, (maxs[1] - this.gridMins[1]) / 64 + 1),
          Math.max(1, (maxs[2] - this.gridMins[2]) / 128 + 1)
        ];
      }
      if (lumps[16].len >= 8) {
        this.numClusters = view.getInt32(lumps[16].ofs + 0, true);
        this.clusterBytes = view.getInt32(lumps[16].ofs + 4, true);
        this.visBitsets = buffer.subarray(lumps[16].ofs + 8, lumps[16].ofs + lumps[16].len);
      }
      this.buildExpandedGpuBuffers(lightmapAtlas);
    }
    rebuildGpuBuffersWithAtlas(lightmapAtlas) {
      this.buildExpandedGpuBuffers(lightmapAtlas);
    }
    buildExpandedGpuBuffers(lightmapAtlas) {
      const allVerts = [];
      const allIndexes = [];
      const remapLm = (lmNum, uv) => {
        return lightmapAtlas ? lightmapAtlas.remapUV(lmNum, uv[0], uv[1]) : uv;
      };
      for (const surf of this.surfaces) {
        if (surf.surfaceType === MST_PLANAR || surf.surfaceType === MST_TRIANGLE_SOUP) {
          surf.vboFirstVert = allVerts.length;
          surf.vboNumVerts = surf.numVerts;
          surf.iboFirstIndex = allIndexes.length;
          surf.iboNumIndexes = surf.numIndexes;
          for (let i = 0; i < surf.numVerts; i++) {
            const sv = this.drawVerts[surf.firstVert + i];
            allVerts.push({
              xyz: sv.xyz,
              st: sv.st,
              lightmap: remapLm(surf.lightmapNum, sv.lightmap),
              normal: sv.normal,
              color: sv.color
            });
          }
          for (let i = 0; i < surf.numIndexes; i++) {
            allIndexes.push(surf.vboFirstVert + this.drawIndexes[surf.firstIndex + i]);
          }
        } else if (surf.surfaceType === MST_PATCH && surf.patchWidth >= 3 && surf.patchHeight >= 3) {
          const controlGrid = this.drawVerts.slice(surf.firstVert, surf.firstVert + surf.numVerts);
          const tess = tessellateBezierPatch(controlGrid, surf.patchWidth, surf.patchHeight, 6);
          surf.vboFirstVert = allVerts.length;
          surf.vboNumVerts = tess.verts.length;
          surf.iboFirstIndex = allIndexes.length;
          surf.iboNumIndexes = tess.indexes.length;
          for (const tv of tess.verts) {
            allVerts.push({
              xyz: tv.xyz,
              st: tv.st,
              lightmap: remapLm(surf.lightmapNum, tv.lightmap),
              normal: tv.normal,
              color: tv.color
            });
          }
          for (const idx of tess.indexes) {
            allIndexes.push(surf.vboFirstVert + idx);
          }
        }
      }
      this.gpuVertexData = new Float32Array(allVerts.length * 14);
      for (let i = 0; i < allVerts.length; i++) {
        const v = allVerts[i];
        const o = i * 14;
        this.gpuVertexData[o + 0] = v.xyz[0];
        this.gpuVertexData[o + 1] = v.xyz[1];
        this.gpuVertexData[o + 2] = v.xyz[2];
        this.gpuVertexData[o + 3] = v.st[0];
        this.gpuVertexData[o + 4] = v.st[1];
        this.gpuVertexData[o + 5] = v.lightmap[0];
        this.gpuVertexData[o + 6] = v.lightmap[1];
        this.gpuVertexData[o + 7] = v.normal[0];
        this.gpuVertexData[o + 8] = v.normal[1];
        this.gpuVertexData[o + 9] = v.normal[2];
        this.gpuVertexData[o + 10] = v.color[0] / 255;
        this.gpuVertexData[o + 11] = v.color[1] / 255;
        this.gpuVertexData[o + 12] = v.color[2] / 255;
        this.gpuVertexData[o + 13] = v.color[3] / 255;
      }
      this.gpuIndexData = new Uint32Array(allIndexes);
    }
    /**
     * Finds the BSP leaf index containing a 3D point (R_PointInLeaf)
     */
    findLeaf(point) {
      if (this.nodes.length === 0) return 0;
      let nodeNum = 0;
      while (nodeNum >= 0) {
        const node = this.nodes[nodeNum];
        const plane = this.planes[node.planeNum];
        const d = vec3Dot(point, plane.normal) - plane.dist;
        nodeNum = d >= 0 ? node.children[0] : node.children[1];
      }
      return -nodeNum - 1;
    }
    /**
     * Checks PVS visibility between two cluster indices (R_ClusterVisible)
     */
    isClusterVisible(viewerCluster, targetCluster) {
      if (viewerCluster < 0 || targetCluster < 0 || this.numClusters === 0) return true;
      if (viewerCluster >= this.numClusters || targetCluster >= this.numClusters) return true;
      const byteIndex = viewerCluster * this.clusterBytes + (targetCluster >> 3);
      if (byteIndex >= this.visBitsets.byteLength) return true;
      return (this.visBitsets[byteIndex] & 1 << (targetCluster & 7)) !== 0;
    }
    /**
     * Samples the 3D Lightgrid (LUMP_LIGHTGRID) at `origin` for dynamic MD3 entity shading
     */
    sampleLightgrid(origin) {
      const numCells = Math.floor(this.lightgridLump.byteLength / 8);
      if (numCells === 0) {
        return {
          ambient: [0.42, 0.42, 0.46],
          directed: [0.75, 0.72, 0.68],
          lightDir: [0.4, 0.3, 0.86]
        };
      }
      const gx = Math.max(0, Math.min(this.gridBounds[0] - 1, Math.floor((origin[0] - this.gridMins[0]) / 64)));
      const gy = Math.max(0, Math.min(this.gridBounds[1] - 1, Math.floor((origin[1] - this.gridMins[1]) / 64)));
      const gz = Math.max(0, Math.min(this.gridBounds[2] - 1, Math.floor((origin[2] - this.gridMins[2]) / 128)));
      const cellIndex = Math.min(
        numCells - 1,
        gz * (this.gridBounds[0] * this.gridBounds[1]) + gy * this.gridBounds[0] + gx
      );
      const ofs = cellIndex * 8;
      const ar = this.lightgridLump[ofs + 0] / 255;
      const ag = this.lightgridLump[ofs + 1] / 255;
      const ab = this.lightgridLump[ofs + 2] / 255;
      const dr = this.lightgridLump[ofs + 3] / 255;
      const dg = this.lightgridLump[ofs + 4] / 255;
      const db = this.lightgridLump[ofs + 5] / 255;
      const lat = this.lightgridLump[ofs + 6] * Math.PI * 2 / 255;
      const lng = this.lightgridLump[ofs + 7] * Math.PI * 2 / 255;
      return {
        ambient: [Math.max(0.22, ar * 1.4), Math.max(0.22, ag * 1.4), Math.max(0.25, ab * 1.4)],
        directed: [dr * 1.5, dg * 1.5, db * 1.5],
        lightDir: [Math.cos(lat) * Math.sin(lng), Math.sin(lat) * Math.sin(lng), Math.cos(lng)]
      };
    }
    computeBrushBounds(brushNum) {
      const mins = [-9999, -9999, -9999];
      const maxs = [9999, 9999, 9999];
      if (brushNum < 0 || brushNum >= this.brushes.length) return [mins, maxs];
      const br = this.brushes[brushNum];
      for (let i = 0; i < br.numSides; i++) {
        const side = this.brushSides[br.firstSide + i];
        const pl = this.planes[side.planeNum];
        if (pl.normal[0] === 1) maxs[0] = pl.dist;
        else if (pl.normal[0] === -1) mins[0] = -pl.dist;
        else if (pl.normal[1] === 1) maxs[1] = pl.dist;
        else if (pl.normal[1] === -1) mins[1] = -pl.dist;
        else if (pl.normal[2] === 1) maxs[2] = pl.dist;
        else if (pl.normal[2] === -1) mins[2] = -pl.dist;
      }
      return [mins, maxs];
    }
    parseEntities(raw) {
      const list = [];
      const tokenizer = new Q3Tokenizer(raw);
      while (!tokenizer.eof()) {
        const tok = tokenizer.nextToken(true);
        if (!tok) break;
        if (tok !== "{") continue;
        const ent = {};
        while (!tokenizer.eof()) {
          const key = tokenizer.nextToken(true);
          if (!key || key === "}") break;
          const val = tokenizer.nextToken(true);
          ent[key.toLowerCase()] = val;
        }
        list.push(ent);
      }
      return list;
    }
  };

  // src/renderer/tr_lightmap.ts
  var LIGHTMAP_PAGE_SIZE = 128;
  var LIGHTMAP_ATLAS_SIZE = 2048;
  var LIGHTMAP_GRID_DIM = LIGHTMAP_ATLAS_SIZE / LIGHTMAP_PAGE_SIZE;
  var LightmapAtlas = class {
    texture;
    numLightmaps = 0;
    constructor(gl, rawLump14) {
      const pageBytes = LIGHTMAP_PAGE_SIZE * LIGHTMAP_PAGE_SIZE * 3;
      this.numLightmaps = Math.floor(rawLump14.byteLength / pageBytes);
      const atlasRGBA = new Uint8Array(LIGHTMAP_ATLAS_SIZE * LIGHTMAP_ATLAS_SIZE * 4);
      atlasRGBA.fill(255);
      const overbrightShift = Math.max(0, Cvars.variableIntegerValue("r_mapOverBrightBits"));
      for (let i = 0; i < Math.min(this.numLightmaps, 255); i++) {
        const gridX = i % LIGHTMAP_GRID_DIM * LIGHTMAP_PAGE_SIZE;
        const gridY = Math.floor(i / LIGHTMAP_GRID_DIM) * LIGHTMAP_PAGE_SIZE;
        const srcBase = i * pageBytes;
        for (let y = 0; y < LIGHTMAP_PAGE_SIZE; y++) {
          for (let x = 0; x < LIGHTMAP_PAGE_SIZE; x++) {
            const srcIdx = srcBase + (y * LIGHTMAP_PAGE_SIZE + x) * 3;
            let r = rawLump14[srcIdx + 0] << overbrightShift;
            let g = rawLump14[srcIdx + 1] << overbrightShift;
            let b = rawLump14[srcIdx + 2] << overbrightShift;
            if ((r | g | b) > 255) {
              const max2 = r > g ? r > b ? r : b : g > b ? g : b;
              r = r * 255 / max2 | 0;
              g = g * 255 / max2 | 0;
              b = b * 255 / max2 | 0;
            }
            const dstIdx = ((gridY + y) * LIGHTMAP_ATLAS_SIZE + (gridX + x)) * 4;
            atlasRGBA[dstIdx + 0] = r;
            atlasRGBA[dstIdx + 1] = g;
            atlasRGBA[dstIdx + 2] = b;
            atlasRGBA[dstIdx + 3] = 255;
          }
        }
      }
      this.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA8,
        LIGHTMAP_ATLAS_SIZE,
        LIGHTMAP_ATLAS_SIZE,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        atlasRGBA
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    /**
     * Remaps a local [0..1] surface lightmap UV into the global 2048x2048 Lightmap Atlas UV
     */
    remapUV(lightmapNum, u, v) {
      const slot = lightmapNum >= 0 && lightmapNum < 255 ? lightmapNum : 255;
      const cellX = slot % LIGHTMAP_GRID_DIM;
      const cellY = Math.floor(slot / LIGHTMAP_GRID_DIM);
      const scale = 1 / LIGHTMAP_GRID_DIM;
      const halfTexel = 0.5 / LIGHTMAP_PAGE_SIZE;
      const cu = Math.max(halfTexel, Math.min(1 - halfTexel, u));
      const cv = Math.max(halfTexel, Math.min(1 - halfTexel, v));
      return [(cellX + cu) * scale, (cellY + cv) * scale];
    }
  };

  // src/renderer/tr_shader_compiler.ts
  function evalWaveForm(wave, t) {
    const x = ((wave.phase + t * wave.freq) % 1 + 1) % 1;
    let y = 0;
    switch (wave.func) {
      case "sin":
        y = Math.sin(x * Math.PI * 2);
        break;
      case "triangle":
        y = x < 0.5 ? x * 4 - 1 : 3 - x * 4;
        break;
      case "square":
        y = x < 0.5 ? 1 : -1;
        break;
      case "sawtooth":
        y = x;
        break;
      case "inversesawtooth":
        y = 1 - x;
        break;
      case "noise":
        y = Math.sin(x * 37) * Math.cos(x * 91);
        break;
    }
    return wave.base + y * wave.amplitude;
  }
  function computeTcModMatrix(tcMods, timeSec, outMat6, outTurb4) {
    let m00 = 1, m01 = 0;
    let m10 = 0, m11 = 1;
    let t0 = 0, t1 = 0;
    outTurb4[0] = 0;
    outTurb4[1] = 0;
    outTurb4[2] = 0;
    outTurb4[3] = 0;
    const concat = (b00, b01, b10, b11, bt0, bt1) => {
      const n00 = m00 * b00 + m01 * b10;
      const n01 = m00 * b01 + m01 * b11;
      const n10 = m10 * b00 + m11 * b10;
      const n11 = m10 * b01 + m11 * b11;
      const nt0 = t0 * b00 + t1 * b10 + bt0;
      const nt1 = t0 * b01 + t1 * b11 + bt1;
      m00 = n00;
      m01 = n01;
      m10 = n10;
      m11 = n11;
      t0 = nt0;
      t1 = nt1;
    };
    for (const mod of tcMods) {
      switch (mod.type) {
        case "scroll": {
          const ds = mod.sSpeed * timeSec % 1;
          const dt = mod.tSpeed * timeSec % 1;
          concat(1, 0, 0, 1, ds, dt);
          break;
        }
        case "scale": {
          concat(mod.sScale, 0, 0, mod.tScale, 0, 0);
          break;
        }
        case "stretch": {
          const val = evalWaveForm(mod.wave, timeSec);
          const p = Math.abs(val) > 1e-4 ? 1 / val : 1;
          const off = 0.5 - 0.5 * p;
          concat(p, 0, 0, p, off, off);
          break;
        }
        case "rotate": {
          const rad = -mod.degPerSec * timeSec * DEG2RAD;
          const s = Math.sin(rad);
          const c = Math.cos(rad);
          concat(c, -s, s, c, 0.5 - 0.5 * c + 0.5 * s, 0.5 - 0.5 * s - 0.5 * c);
          break;
        }
        case "transform": {
          concat(mod.m00, mod.m01, mod.m10, mod.m11, mod.t0, mod.t1);
          break;
        }
        case "turb": {
          outTurb4[0] = mod.amplitude;
          outTurb4[1] = mod.phase;
          outTurb4[2] = mod.freq;
          outTurb4[3] = 1;
          break;
        }
      }
    }
    outMat6[0] = m00;
    outMat6[1] = m01;
    outMat6[2] = m10;
    outMat6[3] = m11;
    outMat6[4] = t0;
    outMat6[5] = t1;
  }
  function mapGlBlendFactor(gl, factor) {
    switch (factor.toUpperCase()) {
      case "GL_ONE":
        return gl.ONE;
      case "GL_ZERO":
        return gl.ZERO;
      case "GL_DST_COLOR":
        return gl.DST_COLOR;
      case "GL_ONE_MINUS_DST_COLOR":
        return gl.ONE_MINUS_DST_COLOR;
      case "GL_SRC_ALPHA":
        return gl.SRC_ALPHA;
      case "GL_ONE_MINUS_SRC_ALPHA":
        return gl.ONE_MINUS_SRC_ALPHA;
      case "GL_DST_ALPHA":
        return gl.DST_ALPHA;
      case "GL_ONE_MINUS_DST_ALPHA":
        return gl.ONE_MINUS_DST_ALPHA;
      case "GL_SRC_COLOR":
        return gl.SRC_COLOR;
      case "GL_ONE_MINUS_SRC_COLOR":
        return gl.ONE_MINUS_SRC_COLOR;
      default:
        return gl.ONE;
    }
  }
  var VERTEX_SHADER_SRC = `#version 300 es
precision highp float;

layout(location = 0) in vec3 a_pos0;
layout(location = 1) in vec2 a_st;
layout(location = 2) in vec2 a_lm;
layout(location = 3) in vec3 a_norm0;
layout(location = 4) in vec4 a_color;
layout(location = 5) in vec3 a_pos1;
layout(location = 6) in vec3 a_norm1;

uniform mat4 u_viewProjMatrix;
uniform mat4 u_modelMatrix;
uniform float u_morphLerp;       // 0.0 for static BSP, [0..1] for MD3 morphing
uniform float u_time;
uniform vec3 u_cameraPos;

// DeformVertexes wave uniform: x=spread, y=base, z=amp, w=freq (0 if inactive)
uniform vec4 u_deformWave;
uniform float u_deformPhase;

// Stage tcGen & tcMod uniforms
uniform int u_tcGenMode;         // 0=base, 1=lightmap, 2=environment
uniform float u_tcMat[6];        // [m00, m01, m10, m11, t0, t1]
uniform vec4 u_tcTurb;           // [amp, phase, freq, active]

out vec3 v_worldPos;
out vec3 v_worldNorm;
out vec2 v_uv;
out vec2 v_lmUv;
out vec4 v_vertColor;

void main() {
  vec3 localPos = mix(a_pos0, a_pos1, u_morphLerp);
  vec3 localNorm = normalize(mix(a_norm0, a_norm1, u_morphLerp));

  // Apply deformVertexes wave if active
  if (abs(u_deformWave.z) > 0.0001) {
    float off = (localPos.x + localPos.y + localPos.z) * u_deformWave.x;
    float w = u_deformWave.y + sin((u_deformPhase + u_time * u_deformWave.w + off) * 6.2831853) * u_deformWave.z;
    localPos += localNorm * w;
  }

  vec4 worldPos4 = u_modelMatrix * vec4(localPos, 1.0);
  v_worldPos = worldPos4.xyz;
  v_worldNorm = normalize(mat3(u_modelMatrix) * localNorm);
  v_vertColor = a_color;
  v_lmUv = a_lm;

  // Compute initial texture coordinates (tcGen)
  vec2 uv = a_st;
  if (u_tcGenMode == 1) {
    uv = a_lm;
  } else if (u_tcGenMode == 2) {
    // RB_CalcEnvironmentTexCoords
    vec3 viewer = normalize(u_cameraPos - v_worldPos);
    float d = dot(v_worldNorm, viewer);
    vec3 reflected = v_worldNorm * (2.0 * d) - viewer;
    uv = vec2(0.5 + reflected.y * 0.5, 0.5 - reflected.z * 0.5);
  }

  // Apply tcMod turbulence if active
  if (u_tcTurb.w > 0.5) {
    float now = u_tcTurb.y + u_time * u_tcTurb.z;
    uv.x += sin(((localPos.x + localPos.z) * 0.001 + now) * 6.2831853) * u_tcTurb.x;
    uv.y += sin((localPos.y * 0.001 + now) * 6.2831853) * u_tcTurb.x;
  }

  // Apply chained 3x2 affine tcMod matrix
  v_uv = vec2(
    uv.x * u_tcMat[0] + uv.y * u_tcMat[2] + u_tcMat[4],
    uv.x * u_tcMat[1] + uv.y * u_tcMat[3] + u_tcMat[5]
  );

  gl_Position = u_viewProjMatrix * worldPos4;
}
`;
  var FRAGMENT_SHADER_SRC = `#version 300 es
precision highp float;

in vec3 v_worldPos;
in vec3 v_worldNorm;
in vec2 v_uv;
in vec2 v_lmUv;
in vec4 v_vertColor;

uniform sampler2D u_tex0;
uniform sampler2D u_lightmapTex;

uniform int u_combineLightmap;   // 1 = fast-path single-pass base * lightmap + dlights
uniform int u_rgbGenMode;        // 0=uniformColor, 1=vertex, 2=oneMinusVertex, 3=lightingDiffuse
uniform int u_alphaGenMode;      // 0=uniformAlpha, 1=vertex, 2=lightingSpecular, 3=portal
uniform vec4 u_stageColor;       // evaluated wave/entity/const RGBA
uniform float u_portalRange;
uniform int u_alphaFunc;         // 0=NONE, 1=GT0, 2=LT128, 3=GE128

// 3D Lightgrid uniforms for MD3 models
uniform vec3 u_lightAmbient;
uniform vec3 u_lightDirected;
uniform vec3 u_lightDir;
uniform vec3 u_cameraPos;

// Dynamic point lights (up to 16 active dlights)
uniform int u_numDlights;
uniform vec4 u_dlightPosRadius[16];
uniform vec3 u_dlightColor[16];

// Overbright & Gamma
uniform float u_overbright;
uniform float u_gamma;

out vec4 fragColor;

void main() {
  vec4 texSample = texture(u_tex0, v_uv);

  // Compute stage RGB
  vec3 rgb = u_stageColor.rgb;
  if (u_rgbGenMode == 1) {
    rgb = v_vertColor.rgb;
  } else if (u_rgbGenMode == 2) {
    rgb = vec3(1.0) - v_vertColor.rgb;
  } else if (u_rgbGenMode == 3) {
    float ndotl = max(0.0, dot(normalize(v_worldNorm), normalize(u_lightDir)));
    rgb = u_lightAmbient + u_lightDirected * ndotl;
  }

  // Compute stage Alpha
  float alpha = u_stageColor.a;
  if (u_alphaGenMode == 1) {
    alpha = v_vertColor.a;
  } else if (u_alphaGenMode == 2) {
    vec3 n = normalize(v_worldNorm);
    vec3 l = normalize(u_lightDir);
    vec3 v = normalize(u_cameraPos - v_worldPos);
    vec3 r = reflect(-l, n);
    alpha = pow(max(0.0, dot(r, v)), 4.0);
  } else if (u_alphaGenMode == 3) {
    float dist = length(v_worldPos - u_cameraPos);
    alpha = clamp(dist / max(1.0, u_portalRange), 0.0, 1.0);
  }

  vec4 color = vec4(texSample.rgb * rgb, texSample.a * alpha);

  // AlphaFunc discard (GT0, LT128, GE128)
  if (u_alphaFunc == 1 && color.a <= 0.0) discard;
  if (u_alphaFunc == 2 && color.a >= 0.5) discard;
  if (u_alphaFunc == 3 && color.a < 0.5) discard;

  // Single-pass Lightmap + Dynamic Light fast path
  if (u_combineLightmap == 1) {
    vec3 lm = texture(u_lightmapTex, v_lmUv).rgb * u_overbright;
    for (int i = 0; i < 16; i++) {
      if (i >= u_numDlights) break;
      vec3 dlPos = u_dlightPosRadius[i].xyz;
      float dlRad = u_dlightPosRadius[i].w;
      float dist = length(v_worldPos - dlPos);
      if (dist < dlRad) {
        float atten = (1.0 - dist / dlRad);
        lm += u_dlightColor[i] * (atten * atten * 1.6);
      }
    }
    color.rgb *= lm;
  } else if (u_rgbGenMode == 3 && u_numDlights > 0) {
    // Add dynamic lights to MD3 models
    vec3 dlAdd = vec3(0.0);
    for (int i = 0; i < 16; i++) {
      if (i >= u_numDlights) break;
      vec3 dlPos = u_dlightPosRadius[i].xyz;
      float dlRad = u_dlightPosRadius[i].w;
      float dist = length(v_worldPos - dlPos);
      if (dist < dlRad) {
        float atten = (1.0 - dist / dlRad);
        dlAdd += u_dlightColor[i] * (atten * 1.2);
      }
    }
    color.rgb += texSample.rgb * dlAdd;
  }

  // Apply gamma correction
  color.rgb = pow(max(color.rgb, vec3(0.0)), vec3(1.0 / max(0.5, u_gamma)));
  fragColor = color;
}
`;
  var MultipassShaderExecutor = class {
    gl;
    program;
    locs = {};
    tcMatBuf = new Float32Array(6);
    tcTurbBuf = new Float32Array(4);
    dlightPosRadBuf = new Float32Array(16 * 4);
    dlightColBuf = new Float32Array(16 * 3);
    constructor(gl) {
      this.gl = gl;
      this.program = this.compileProgram(VERTEX_SHADER_SRC, FRAGMENT_SHADER_SRC);
      const uniformNames = [
        "u_viewProjMatrix",
        "u_modelMatrix",
        "u_morphLerp",
        "u_time",
        "u_cameraPos",
        "u_deformWave",
        "u_deformPhase",
        "u_tcGenMode",
        "u_tcMat",
        "u_tcTurb",
        "u_tex0",
        "u_lightmapTex",
        "u_combineLightmap",
        "u_rgbGenMode",
        "u_alphaGenMode",
        "u_stageColor",
        "u_portalRange",
        "u_alphaFunc",
        "u_lightAmbient",
        "u_lightDirected",
        "u_lightDir",
        "u_numDlights",
        "u_dlightPosRadius",
        "u_dlightColor",
        "u_overbright",
        "u_gamma"
      ];
      for (const name of uniformNames) {
        this.locs[name] = gl.getUniformLocation(this.program, name);
      }
    }
    useAndSetFrameUniforms(viewProjMatrix, cameraPos, timeSec, dlights) {
      const gl = this.gl;
      gl.useProgram(this.program);
      gl.uniformMatrix4fv(this.locs.u_viewProjMatrix, false, viewProjMatrix);
      gl.uniform3f(this.locs.u_cameraPos, cameraPos[0], cameraPos[1], cameraPos[2]);
      gl.uniform1f(this.locs.u_time, timeSec);
      gl.uniform1i(this.locs.u_tex0, 0);
      gl.uniform1i(this.locs.u_lightmapTex, 1);
      const overbright = Cvars.variableIntegerValue("r_fullbright") ? 2 : 1 + Cvars.variableValue("r_overBrightBits") * 0.55;
      gl.uniform1f(this.locs.u_overbright, overbright);
      gl.uniform1f(this.locs.u_gamma, Cvars.variableValue("r_gamma") || 1.15);
      const numDl = Cvars.variableIntegerValue("r_dynamiclight") ? Math.min(16, dlights.length) : 0;
      gl.uniform1i(this.locs.u_numDlights, numDl);
      for (let i = 0; i < numDl; i++) {
        const dl = dlights[i];
        this.dlightPosRadBuf[i * 4 + 0] = dl.origin[0];
        this.dlightPosRadBuf[i * 4 + 1] = dl.origin[1];
        this.dlightPosRadBuf[i * 4 + 2] = dl.origin[2];
        this.dlightPosRadBuf[i * 4 + 3] = dl.radius;
        this.dlightColBuf[i * 3 + 0] = dl.color[0];
        this.dlightColBuf[i * 3 + 1] = dl.color[1];
        this.dlightColBuf[i * 3 + 2] = dl.color[2];
      }
      if (numDl > 0) {
        gl.uniform4fv(this.locs.u_dlightPosRadius, this.dlightPosRadBuf);
        gl.uniform3fv(this.locs.u_dlightColor, this.dlightColBuf);
      }
    }
    setEntityTransformAndLighting(modelMatrix, morphLerp, ambient, directed, lightDir) {
      const gl = this.gl;
      gl.uniformMatrix4fv(this.locs.u_modelMatrix, false, modelMatrix);
      gl.uniform1f(this.locs.u_morphLerp, morphLerp);
      gl.uniform3f(this.locs.u_lightAmbient, ambient[0], ambient[1], ambient[2]);
      gl.uniform3f(this.locs.u_lightDirected, directed[0], directed[1], directed[2]);
      gl.uniform3f(this.locs.u_lightDir, lightDir[0], lightDir[1], lightDir[2]);
    }
    setDeformUniforms(deforms) {
      const gl = this.gl;
      const waveDef = deforms.find((d) => d.type === "wave");
      if (waveDef) {
        gl.uniform4f(
          this.locs.u_deformWave,
          waveDef.spread,
          waveDef.wave.base,
          waveDef.wave.amplitude,
          waveDef.wave.freq
        );
        gl.uniform1f(this.locs.u_deformPhase, waveDef.wave.phase);
      } else {
        gl.uniform4f(this.locs.u_deformWave, 0, 0, 0, 0);
        gl.uniform1f(this.locs.u_deformPhase, 0);
      }
    }
    /**
     * Checks if a 2-stage shader is eligible for single-pass Base+Lightmap combination
     */
    canSinglePassLightmap(shader) {
      if (shader.stages.length !== 2) return false;
      const s0 = shader.stages[0];
      const s1 = shader.stages[1];
      if (!s0.hasBlend && s0.map !== "$lightmap" && s1.map.toLowerCase() === "$lightmap" && s1.blendSrc === "GL_DST_COLOR" && s1.blendDst === "GL_ZERO") {
        return true;
      }
      return false;
    }
    bindStageState(stage, shader, timeSec, entityRGBA, combineLightmap) {
      const gl = this.gl;
      if (shader.cull === "none") {
        gl.disable(gl.CULL_FACE);
      } else {
        gl.enable(gl.CULL_FACE);
        gl.cullFace(shader.cull === "front" ? gl.FRONT : gl.BACK);
      }
      if (shader.polygonOffset) {
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(-1, -2);
      } else {
        gl.disable(gl.POLYGON_OFFSET_FILL);
      }
      if (stage.hasBlend && !combineLightmap) {
        gl.enable(gl.BLEND);
        gl.blendFunc(
          mapGlBlendFactor(gl, stage.blendSrc),
          mapGlBlendFactor(gl, stage.blendDst)
        );
      } else {
        gl.disable(gl.BLEND);
      }
      gl.depthFunc(stage.depthFunc === "equal" ? gl.EQUAL : gl.LEQUAL);
      gl.depthMask(stage.depthWrite);
      const tcGenInt = stage.tcGen === "lightmap" ? 1 : stage.tcGen === "environment" ? 2 : 0;
      gl.uniform1i(this.locs.u_tcGenMode, tcGenInt);
      computeTcModMatrix(stage.tcMods, timeSec, this.tcMatBuf, this.tcTurbBuf);
      gl.uniform1fv(this.locs.u_tcMat, this.tcMatBuf);
      gl.uniform4fv(this.locs.u_tcTurb, this.tcTurbBuf);
      let r = 1, g = 1, b = 1, a = 1;
      let rgbMode = 0;
      if (stage.rgbGen === "vertex") {
        rgbMode = 1;
      } else if (stage.rgbGen === "oneMinusVertex") {
        rgbMode = 2;
      } else if (stage.rgbGen === "lightingDiffuse") {
        rgbMode = 3;
      } else if (stage.rgbGen === "wave" && stage.rgbWave) {
        const w = Math.max(0, Math.min(1, evalWaveForm(stage.rgbWave, timeSec)));
        r = w;
        g = w;
        b = w;
      } else if (stage.rgbGen === "entity") {
        r = entityRGBA[0] / 255;
        g = entityRGBA[1] / 255;
        b = entityRGBA[2] / 255;
      } else if (stage.rgbGen === "oneMinusEntity") {
        r = 1 - entityRGBA[0] / 255;
        g = 1 - entityRGBA[1] / 255;
        b = 1 - entityRGBA[2] / 255;
      } else if (stage.rgbGen === "const" && stage.rgbConst) {
        [r, g, b] = stage.rgbConst;
      }
      let alphaMode = 0;
      if (stage.alphaGen === "vertex") {
        alphaMode = 1;
      } else if (stage.alphaGen === "lightingSpecular") {
        alphaMode = 2;
      } else if (stage.alphaGen === "portal") {
        alphaMode = 3;
        gl.uniform1f(this.locs.u_portalRange, stage.portalRange || 256);
      } else if (stage.alphaGen === "wave" && stage.alphaWave) {
        a = Math.max(0, Math.min(1, evalWaveForm(stage.alphaWave, timeSec)));
      } else if (stage.alphaGen === "entity") {
        a = entityRGBA[3] / 255;
      } else if (stage.alphaGen === "const" && stage.alphaConst !== void 0) {
        a = stage.alphaConst;
      }
      gl.uniform1i(this.locs.u_rgbGenMode, rgbMode);
      gl.uniform1i(this.locs.u_alphaGenMode, alphaMode);
      gl.uniform4f(this.locs.u_stageColor, r, g, b, a);
      gl.uniform1i(this.locs.u_combineLightmap, combineLightmap ? 1 : 0);
      const afInt = stage.alphaFunc === "GT0" ? 1 : stage.alphaFunc === "LT128" ? 2 : stage.alphaFunc === "GE128" ? 3 : 0;
      gl.uniform1i(this.locs.u_alphaFunc, afInt);
    }
    compileProgram(vsSrc, fsSrc) {
      const gl = this.gl;
      const vs = this.compileShader(gl.VERTEX_SHADER, vsSrc);
      const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSrc);
      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error(`WebGL2 Program Link Error: ${gl.getProgramInfoLog(prog)}`);
      }
      return prog;
    }
    compileShader(type, src) {
      const gl = this.gl;
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        throw new Error(`WebGL2 Shader Compile Error: ${gl.getShaderInfoLog(sh)}`);
      }
      return sh;
    }
  };

  // src/renderer/tr_shader_parse.ts
  var ShaderRegistry = class {
    shaders = /* @__PURE__ */ new Map();
    loadAllFromVFS() {
      this.shaders.clear();
      const shaderFiles = VFS.listFiles("scripts/", ".shader");
      for (const file of shaderFiles) {
        const text = VFS.readTextFile(file);
        if (text) {
          this.parseShaderFile(text);
        }
      }
      return this.shaders.size;
    }
    parseShaderFile(text) {
      const tk = new Q3Tokenizer(text);
      while (!tk.eof()) {
        const shaderName = tk.nextToken(true);
        if (!shaderName) break;
        const openBrace = tk.nextToken(true);
        if (openBrace !== "{") break;
        const shader = this.parseSingleShader(VFS.stripExtension(shaderName), tk);
        this.shaders.set(shader.name, shader);
      }
    }
    getShader(rawName, hasLightmap = true) {
      const norm = VFS.stripExtension(rawName);
      const existing = this.shaders.get(norm);
      if (existing) return existing;
      const def = {
        name: norm,
        sort: 3,
        // SS_OPAQUE
        cull: "front",
        polygonOffset: false,
        surfaceFlags: 0,
        contentFlags: CONTENTS_SOLID,
        isSky: norm.startsWith("skies/"),
        deforms: [],
        stages: [
          {
            map: norm,
            clamp: false,
            animFreq: 0,
            animMaps: [],
            blendSrc: "GL_ONE",
            blendDst: "GL_ZERO",
            hasBlend: false,
            rgbGen: hasLightmap ? "identity" : "lightingDiffuse",
            alphaGen: "identity",
            tcGen: "base",
            tcMods: [],
            depthFunc: "lequal",
            depthWrite: true,
            depthWriteExplicit: false,
            alphaFunc: "NONE"
          }
        ]
      };
      if (hasLightmap && !def.isSky) {
        def.stages.push({
          map: "$lightmap",
          clamp: true,
          animFreq: 0,
          animMaps: [],
          blendSrc: "GL_DST_COLOR",
          blendDst: "GL_ZERO",
          hasBlend: true,
          rgbGen: "identity",
          alphaGen: "identity",
          tcGen: "lightmap",
          tcMods: [],
          depthFunc: "lequal",
          depthWrite: false,
          depthWriteExplicit: false,
          alphaFunc: "NONE"
        });
      }
      this.shaders.set(norm, def);
      return def;
    }
    parseSingleShader(name, tk) {
      const shader = {
        name,
        sort: 0,
        cull: "front",
        polygonOffset: false,
        surfaceFlags: 0,
        contentFlags: CONTENTS_SOLID,
        isSky: false,
        deforms: [],
        stages: []
      };
      while (!tk.eof()) {
        const tok = tk.nextToken(true);
        if (!tok || tok === "}") break;
        if (tok === "{") {
          const stage = this.parseStage(tk);
          if (stage) shader.stages.push(stage);
          continue;
        }
        const cmd = tok.toLowerCase();
        if (cmd === "surfaceparm") {
          const parm = tk.nextToken(false).toLowerCase();
          this.applySurfaceParm(shader, parm);
        } else if (cmd === "cull") {
          const c = tk.nextToken(false).toLowerCase();
          if (c === "none" || c === "twosided" || c === "disable") shader.cull = "none";
          else if (c === "back" || c === "backsided") shader.cull = "back";
          else shader.cull = "front";
        } else if (cmd === "polygonoffset") {
          shader.polygonOffset = true;
        } else if (cmd === "sort") {
          const s = tk.nextToken(false).toLowerCase();
          const sortMap = {
            portal: 1,
            sky: 2,
            opaque: 3,
            decal: 4,
            seethrough: 5,
            banner: 6,
            underwater: 8,
            additive: 9,
            nearest: 16
          };
          shader.sort = sortMap[s] ?? (Number.parseFloat(s) || 3);
        } else if (cmd === "skyparms") {
          const farbox = tk.nextToken(false);
          const cloudHeight = Number.parseFloat(tk.nextToken(false)) || 512;
          const nearbox = tk.nextToken(false);
          shader.isSky = true;
          shader.sort = 2;
          shader.skyParms = { farbox, cloudHeight, nearbox };
        } else if (cmd === "fogparms") {
          let t = tk.nextToken(false);
          if (t === "(") t = tk.nextToken(false);
          const r = Number.parseFloat(t) || 0;
          const g = Number.parseFloat(tk.nextToken(false)) || 0;
          const b = Number.parseFloat(tk.nextToken(false)) || 0;
          let next = tk.nextToken(false);
          if (next === ")") next = tk.nextToken(false);
          const depth = Number.parseFloat(next) || 512;
          shader.fogParms = { color: [r, g, b], depthForOpaque: depth };
        } else if (cmd === "deformvertexes") {
          const sub = tk.nextToken(false).toLowerCase();
          if (sub === "autosprite") {
            shader.deforms.push({ type: "autosprite" });
          } else if (sub === "autosprite2") {
            shader.deforms.push({ type: "autosprite2" });
          } else if (sub === "wave") {
            const div = Number.parseFloat(tk.nextToken(false)) || 100;
            const wave = this.parseWaveForm(tk);
            shader.deforms.push({ type: "wave", spread: 1 / div, wave });
          } else if (sub === "move") {
            const dx = Number.parseFloat(tk.nextToken(false)) || 0;
            const dy = Number.parseFloat(tk.nextToken(false)) || 0;
            const dz = Number.parseFloat(tk.nextToken(false)) || 0;
            const wave = this.parseWaveForm(tk);
            shader.deforms.push({ type: "move", dir: [dx, dy, dz], wave });
          } else if (sub === "bulge") {
            const w = Number.parseFloat(tk.nextToken(false)) || 1;
            const h = Number.parseFloat(tk.nextToken(false)) || 1;
            const spd = Number.parseFloat(tk.nextToken(false)) || 1;
            shader.deforms.push({ type: "bulge", width: w, height: h, speed: spd });
          } else if (sub === "normal") {
            const freq = Number.parseFloat(tk.nextToken(false)) || 1;
            const amp = Number.parseFloat(tk.nextToken(false)) || 0.2;
            shader.deforms.push({ type: "normal", freq, amplitude: amp });
          } else {
            tk.skipRestOfLine();
          }
        } else {
          tk.skipRestOfLine();
        }
      }
      if (shader.sort === 0) {
        if (shader.isSky) shader.sort = 2;
        else if (shader.polygonOffset) shader.sort = 4;
        else if (shader.stages.length > 0 && shader.stages[0].hasBlend) shader.sort = 9;
        else shader.sort = 3;
      }
      return shader;
    }
    parseStage(tk) {
      const stage = {
        map: "$whiteimage",
        clamp: false,
        animFreq: 0,
        animMaps: [],
        blendSrc: "GL_ONE",
        blendDst: "GL_ZERO",
        hasBlend: false,
        rgbGen: "identity",
        alphaGen: "identity",
        tcGen: "base",
        tcMods: [],
        depthFunc: "lequal",
        depthWrite: true,
        depthWriteExplicit: false,
        alphaFunc: "NONE"
      };
      while (!tk.eof()) {
        const tok = tk.nextToken(true);
        if (!tok || tok === "}") break;
        const cmd = tok.toLowerCase();
        if (cmd === "map" || cmd === "clampmap") {
          stage.clamp = cmd === "clampmap";
          stage.map = tk.nextToken(false);
          if (stage.map.toLowerCase() === "$lightmap") {
            stage.tcGen = "lightmap";
          }
        } else if (cmd === "animmap") {
          stage.animFreq = Number.parseFloat(tk.nextToken(false)) || 1;
          while (true) {
            const f = tk.nextToken(false);
            if (!f) break;
            stage.animMaps.push(f);
          }
          if (stage.animMaps.length > 0) stage.map = stage.animMaps[0];
        } else if (cmd === "blendfunc") {
          const b1 = tk.nextToken(false).toUpperCase();
          if (b1 === "ADD" || b1 === "GL_ADD") {
            stage.blendSrc = "GL_ONE";
            stage.blendDst = "GL_ONE";
          } else if (b1 === "FILTER") {
            stage.blendSrc = "GL_DST_COLOR";
            stage.blendDst = "GL_ZERO";
          } else if (b1 === "BLEND") {
            stage.blendSrc = "GL_SRC_ALPHA";
            stage.blendDst = "GL_ONE_MINUS_SRC_ALPHA";
          } else {
            stage.blendSrc = b1;
            stage.blendDst = tk.nextToken(false).toUpperCase() || "GL_ZERO";
          }
          stage.hasBlend = !(stage.blendSrc === "GL_ONE" && stage.blendDst === "GL_ZERO");
          if (stage.hasBlend && !stage.depthWriteExplicit) {
            stage.depthWrite = false;
          }
        } else if (cmd === "rgbgen") {
          const mode = tk.nextToken(false).toLowerCase();
          if (mode === "wave") {
            stage.rgbGen = "wave";
            stage.rgbWave = this.parseWaveForm(tk);
          } else if (mode === "const") {
            stage.rgbGen = "const";
            let t = tk.nextToken(false);
            if (t === "(") t = tk.nextToken(false);
            const r = Number.parseFloat(t) || 1;
            const g = Number.parseFloat(tk.nextToken(false)) || 1;
            const b = Number.parseFloat(tk.nextToken(false)) || 1;
            tk.skipRestOfLine();
            stage.rgbConst = [r, g, b];
          } else if (mode === "lightingdiffuse") {
            stage.rgbGen = "lightingDiffuse";
          } else if (mode === "vertex" || mode === "exactvertex") {
            stage.rgbGen = "vertex";
          } else if (mode === "oneminusvertex") {
            stage.rgbGen = "oneMinusVertex";
          } else if (mode === "entity") {
            stage.rgbGen = "entity";
          } else if (mode === "oneminusentity") {
            stage.rgbGen = "oneMinusEntity";
          } else {
            stage.rgbGen = "identity";
          }
        } else if (cmd === "alphagen") {
          const mode = tk.nextToken(false).toLowerCase();
          if (mode === "wave") {
            stage.alphaGen = "wave";
            stage.alphaWave = this.parseWaveForm(tk);
          } else if (mode === "const") {
            stage.alphaGen = "const";
            stage.alphaConst = Number.parseFloat(tk.nextToken(false)) ?? 1;
          } else if (mode === "lightingspecular") {
            stage.alphaGen = "lightingSpecular";
          } else if (mode === "portal") {
            stage.alphaGen = "portal";
            stage.portalRange = Number.parseFloat(tk.nextToken(false)) || 256;
          } else if (mode === "vertex") {
            stage.alphaGen = "vertex";
          } else if (mode === "entity") {
            stage.alphaGen = "entity";
          } else {
            stage.alphaGen = "identity";
          }
        } else if (cmd === "tcgen" || cmd === "texgen") {
          const mode = tk.nextToken(false).toLowerCase();
          if (mode === "environment") stage.tcGen = "environment";
          else if (mode === "lightmap") stage.tcGen = "lightmap";
          else if (mode === "vector") {
            stage.tcGen = "vector";
            tk.skipRestOfLine();
          } else stage.tcGen = "base";
        } else if (cmd === "tcmod") {
          const op = tk.nextToken(false).toLowerCase();
          if (op === "scroll") {
            const s = Number.parseFloat(tk.nextToken(false)) || 0;
            const t = Number.parseFloat(tk.nextToken(false)) || 0;
            stage.tcMods.push({ type: "scroll", sSpeed: s, tSpeed: t });
          } else if (op === "scale") {
            const s = Number.parseFloat(tk.nextToken(false)) || 1;
            const t = Number.parseFloat(tk.nextToken(false)) || 1;
            stage.tcMods.push({ type: "scale", sScale: s, tScale: t });
          } else if (op === "rotate") {
            const deg = Number.parseFloat(tk.nextToken(false)) || 0;
            stage.tcMods.push({ type: "rotate", degPerSec: deg });
          } else if (op === "stretch") {
            stage.tcMods.push({ type: "stretch", wave: this.parseWaveForm(tk) });
          } else if (op === "turb") {
            const base = Number.parseFloat(tk.nextToken(false)) || 0;
            const amp = Number.parseFloat(tk.nextToken(false)) || 0.1;
            const phase = Number.parseFloat(tk.nextToken(false)) || 0;
            const freq = Number.parseFloat(tk.nextToken(false)) || 1;
            stage.tcMods.push({ type: "turb", base, amplitude: amp, phase, freq });
          } else if (op === "transform") {
            const m00 = Number.parseFloat(tk.nextToken(false)) || 1;
            const m01 = Number.parseFloat(tk.nextToken(false)) || 0;
            const m10 = Number.parseFloat(tk.nextToken(false)) || 0;
            const m11 = Number.parseFloat(tk.nextToken(false)) || 1;
            const t0 = Number.parseFloat(tk.nextToken(false)) || 0;
            const t1 = Number.parseFloat(tk.nextToken(false)) || 0;
            stage.tcMods.push({ type: "transform", m00, m01, m10, m11, t0, t1 });
          } else {
            tk.skipRestOfLine();
          }
        } else if (cmd === "depthfunc") {
          const df = tk.nextToken(false).toLowerCase();
          stage.depthFunc = df === "equal" ? "equal" : "lequal";
        } else if (cmd === "depthwrite") {
          stage.depthWrite = true;
          stage.depthWriteExplicit = true;
        } else if (cmd === "alphafunc") {
          const af = tk.nextToken(false).toUpperCase();
          if (af === "GT0" || af === "LT128" || af === "GE128") {
            stage.alphaFunc = af;
          }
        } else {
          tk.skipRestOfLine();
        }
      }
      return stage;
    }
    parseWaveForm(tk) {
      const fnRaw = tk.nextToken(false).toLowerCase();
      let func = "sin";
      if (fnRaw === "triangle" || fnRaw === "square" || fnRaw === "sawtooth" || fnRaw === "inversesawtooth" || fnRaw === "noise") {
        func = fnRaw;
      }
      const base = Number.parseFloat(tk.nextToken(false)) || 0;
      const amplitude = Number.parseFloat(tk.nextToken(false)) || 0;
      const phase = Number.parseFloat(tk.nextToken(false)) || 0;
      const freq = Number.parseFloat(tk.nextToken(false)) || 1;
      return { func, base, amplitude, phase, freq };
    }
    applySurfaceParm(shader, parm) {
      switch (parm) {
        case "sky":
          shader.surfaceFlags |= SURF_SKY;
          shader.isSky = true;
          break;
        case "slick":
          shader.surfaceFlags |= SURF_SLICK;
          break;
        case "nodamage":
          shader.surfaceFlags |= SURF_NODAMAGE;
          break;
        case "noimpact":
          shader.surfaceFlags |= SURF_NOIMPACT;
          break;
        case "nomarks":
          shader.surfaceFlags |= SURF_NOMARKS;
          break;
        case "ladder":
          shader.surfaceFlags |= SURF_LADDER;
          break;
        case "flesh":
          shader.surfaceFlags |= SURF_FLESH;
          break;
        case "metalsteps":
          shader.surfaceFlags |= SURF_METALSTEPS;
          break;
        case "nosteps":
          shader.surfaceFlags |= SURF_NOSTEPS;
          break;
        case "nodraw":
          shader.surfaceFlags |= SURF_NODRAW;
          break;
        case "nolightmap":
          shader.surfaceFlags |= SURF_NOLIGHTMAP;
          break;
        case "pointlight":
          shader.surfaceFlags |= SURF_POINTLIGHT;
          break;
        case "nonsolid":
          shader.surfaceFlags |= SURF_NONSOLID;
          shader.contentFlags &= ~CONTENTS_SOLID;
          break;
        case "alphashadow":
          shader.surfaceFlags |= SURF_ALPHASHADOW;
          break;
        case "nodlight":
          shader.surfaceFlags |= SURF_NODLIGHT;
          break;
        case "lava":
          shader.contentFlags = CONTENTS_LAVA;
          break;
        case "slime":
          shader.contentFlags = CONTENTS_SLIME;
          break;
        case "water":
          shader.contentFlags = CONTENTS_WATER;
          break;
        case "fog":
          shader.contentFlags = CONTENTS_FOG;
          break;
        case "trans":
          shader.contentFlags |= CONTENTS_TRANSLUCENT;
          break;
        case "areaportal":
          shader.contentFlags |= CONTENTS_AREAPORTAL;
          break;
        case "clusterportal":
          shader.contentFlags |= CONTENTS_CLUSTERPORTAL;
          break;
        case "donotenter":
          shader.contentFlags |= CONTENTS_DONOTENTER;
          break;
        case "playerclip":
          shader.contentFlags |= CONTENTS_PLAYERCLIP;
          break;
        case "origin":
          shader.contentFlags |= CONTENTS_ORIGIN;
          break;
        case "structural":
          shader.contentFlags |= CONTENTS_STRUCTURAL;
          break;
      }
    }
  };
  var Shaders = new ShaderRegistry();

  // src/renderer/tr_main.ts
  var Q3Renderer = class {
    gl;
    textures;
    executor;
    bsp = null;
    lightmapAtlas = null;
    worldVao = null;
    worldVbo = null;
    worldIbo = null;
    // Dynamic Quad/Beam VAO for Sprites, Flares, Railgun Cores, Lightning Bolts & Decals
    dynVao;
    dynVbo;
    dynIbo;
    dynVertScratch = new Float32Array(256 * 20);
    dynIdxScratch = new Uint32Array(512 * 3);
    md3Cache = /* @__PURE__ */ new Map();
    skinCache = /* @__PURE__ */ new Map();
    // Scene buffers populated between RE_ClearScene and RE_RenderScene
    sceneEntities = [];
    sceneDlights = [];
    decals = [];
    identityMat = mat4Identity();
    viewMat = new Float32Array(16);
    projMat = new Float32Array(16);
    viewProjMat = new Float32Array(16);
    entityModelMat = new Float32Array(16);
    stats = {
      drawCalls: 0,
      tris: 0,
      visibleSurfaces: 0,
      culledSurfaces: 0
    };
    constructor(canvas) {
      const gl = canvas.getContext("webgl2", {
        alpha: false,
        depth: true,
        stencil: true,
        antialias: true,
        powerPreference: "high-performance"
      });
      if (!gl) {
        throw new Error("WebGL2 is required to run the Quake III Arena engine.");
      }
      this.gl = gl;
      this.textures = new TextureManager(gl);
      this.executor = new MultipassShaderExecutor(gl);
      this.dynVao = gl.createVertexArray();
      this.dynVbo = gl.createBuffer();
      this.dynIbo = gl.createBuffer();
      this.setupInterleavedVao20(this.dynVao, this.dynVbo, this.dynIbo);
    }
    setupInterleavedVao20(vao, vbo, ibo) {
      const gl = this.gl;
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, this.dynVertScratch.byteLength, gl.DYNAMIC_DRAW);
      const stride = 20 * 4;
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 3 * 4);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, 5 * 4);
      gl.enableVertexAttribArray(3);
      gl.vertexAttribPointer(3, 3, gl.FLOAT, false, stride, 7 * 4);
      gl.enableVertexAttribArray(4);
      gl.vertexAttribPointer(4, 4, gl.FLOAT, false, stride, 10 * 4);
      gl.enableVertexAttribArray(5);
      gl.vertexAttribPointer(5, 3, gl.FLOAT, false, stride, 14 * 4);
      gl.enableVertexAttribArray(6);
      gl.vertexAttribPointer(6, 3, gl.FLOAT, false, stride, 17 * 4);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.dynIdxScratch.byteLength, gl.DYNAMIC_DRAW);
      gl.bindVertexArray(null);
    }
    loadWorldMap(bspPath) {
      const raw = VFS.readFile(bspPath);
      if (!raw) {
        throw new Error(`BSP file not found in VFS: ${bspPath}`);
      }
      Shaders.loadAllFromVFS();
      const bsp = new BspMap(raw);
      this.lightmapAtlas = new LightmapAtlas(this.gl, bsp.lightmapLump);
      bsp.rebuildGpuBuffersWithAtlas(this.lightmapAtlas);
      this.bsp = bsp;
      this.decals = [];
      this.uploadWorldGeometry(bsp);
      return bsp;
    }
    uploadWorldGeometry(bsp) {
      const gl = this.gl;
      if (this.worldVao) gl.deleteVertexArray(this.worldVao);
      if (this.worldVbo) gl.deleteBuffer(this.worldVbo);
      if (this.worldIbo) gl.deleteBuffer(this.worldIbo);
      this.worldVao = gl.createVertexArray();
      this.worldVbo = gl.createBuffer();
      this.worldIbo = gl.createBuffer();
      const numVerts = bsp.gpuVertexData.length / 14;
      const vbo20 = new Float32Array(numVerts * 20);
      for (let i = 0; i < numVerts; i++) {
        const s = i * 14;
        const d = i * 20;
        for (let k = 0; k < 14; k++) vbo20[d + k] = bsp.gpuVertexData[s + k];
        vbo20[d + 14] = bsp.gpuVertexData[s + 0];
        vbo20[d + 15] = bsp.gpuVertexData[s + 1];
        vbo20[d + 16] = bsp.gpuVertexData[s + 2];
        vbo20[d + 17] = bsp.gpuVertexData[s + 7];
        vbo20[d + 18] = bsp.gpuVertexData[s + 8];
        vbo20[d + 19] = bsp.gpuVertexData[s + 9];
      }
      gl.bindVertexArray(this.worldVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.worldVbo);
      gl.bufferData(gl.ARRAY_BUFFER, vbo20, gl.STATIC_DRAW);
      const stride = 20 * 4;
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 3 * 4);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, 5 * 4);
      gl.enableVertexAttribArray(3);
      gl.vertexAttribPointer(3, 3, gl.FLOAT, false, stride, 7 * 4);
      gl.enableVertexAttribArray(4);
      gl.vertexAttribPointer(4, 4, gl.FLOAT, false, stride, 10 * 4);
      gl.enableVertexAttribArray(5);
      gl.vertexAttribPointer(5, 3, gl.FLOAT, false, stride, 14 * 4);
      gl.enableVertexAttribArray(6);
      gl.vertexAttribPointer(6, 3, gl.FLOAT, false, stride, 17 * 4);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.worldIbo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bsp.gpuIndexData, gl.STATIC_DRAW);
      gl.bindVertexArray(null);
    }
    registerModel(modelPath) {
      if (!modelPath || modelPath.startsWith("*")) return null;
      const norm = VFS.normalizePath(modelPath);
      const cached = this.md3Cache.get(norm);
      if (cached) return cached;
      const bytes = VFS.readFile(norm);
      if (!bytes) return null;
      try {
        const md3 = new Md3Model(this.gl, bytes, norm);
        this.md3Cache.set(norm, md3);
        return md3;
      } catch {
        return null;
      }
    }
    registerSkin(skinPath) {
      const norm = VFS.normalizePath(skinPath);
      let skin = this.skinCache.get(norm);
      if (!skin) {
        skin = parseSkinFile(norm);
        this.skinCache.set(norm, skin);
      }
      return skin;
    }
    clearScene() {
      this.sceneEntities.length = 0;
      this.sceneDlights.length = 0;
    }
    addRefEntityToScene(ent) {
      this.sceneEntities.push({
        ...ent,
        origin: [ent.origin[0], ent.origin[1], ent.origin[2]],
        oldorigin: [ent.oldorigin[0], ent.oldorigin[1], ent.oldorigin[2]],
        lightingOrigin: [ent.lightingOrigin[0], ent.lightingOrigin[1], ent.lightingOrigin[2]],
        axis: [
          [ent.axis[0][0], ent.axis[0][1], ent.axis[0][2]],
          [ent.axis[1][0], ent.axis[1][1], ent.axis[1][2]],
          [ent.axis[2][0], ent.axis[2][1], ent.axis[2][2]]
        ],
        shaderRGBA: [ent.shaderRGBA[0], ent.shaderRGBA[1], ent.shaderRGBA[2], ent.shaderRGBA[3]]
      });
    }
    addLightToScene(origin, radius, r, g, b) {
      if (radius <= 0) return;
      this.sceneDlights.push({
        origin: [origin[0], origin[1], origin[2]],
        radius,
        color: [r, g, b]
      });
    }
    addImpactMark(origin, normal, radius, shaderName, color, timeSec) {
      if (!Cvars.variableIntegerValue("cg_marks")) return;
      this.decals.push({
        origin: [origin[0], origin[1], origin[2]],
        normal: [normal[0], normal[1], normal[2]],
        radius,
        shaderName,
        color,
        spawnTime: timeSec
      });
      if (this.decals.length > 96) {
        this.decals.shift();
      }
    }
    /**
     * Renders the complete 3D Quake III Arena scene
     */
    renderScene(cameraOrigin, cameraAngles, timeSec) {
      const gl = this.gl;
      const width = gl.canvas.width;
      const height = gl.canvas.height;
      this.stats.drawCalls = 0;
      this.stats.tris = 0;
      this.stats.visibleSurfaces = 0;
      this.stats.culledSurfaces = 0;
      gl.viewport(0, 0, width, height);
      gl.depthMask(true);
      gl.clearColor(0.04, 0.04, 0.08, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.depthRange(0, 1);
      const baseFovX = Math.max(60, Math.min(140, Cvars.variableValue("cg_fov") || 100));
      const fovYRad = 2 * Math.atan(Math.tan(baseFovX * DEG2RAD * 0.5) * (3 / 4));
      const aspect = width / Math.max(1, height);
      const viewAxis = AxisClear();
      AnglesToAxis(cameraAngles, viewAxis);
      buildQuakeViewMatrix(cameraOrigin, viewAxis, this.viewMat);
      mat4Perspective(fovYRad, aspect, 4, 8192, this.projMat);
      mat4Multiply(this.projMat, this.viewMat, this.viewProjMat);
      this.executor.useAndSetFrameUniforms(
        this.viewProjMat,
        cameraOrigin,
        timeSec,
        this.sceneDlights
      );
      if (this.lightmapAtlas) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.lightmapAtlas.texture);
        gl.activeTexture(gl.TEXTURE0);
      }
      if (this.bsp && this.worldVao) {
        this.renderBspWorld(this.bsp, cameraOrigin, timeSec);
      }
      const isThirdPerson = Cvars.variableIntegerValue("cg_thirdPerson") !== 0;
      const firstPersonWeapons = [];
      for (const ent of this.sceneEntities) {
        if (ent.renderfx & RF_THIRD_PERSON && !isThirdPerson) {
          continue;
        }
        if (ent.renderfx & RF_DEPTHHACK) {
          firstPersonWeapons.push(ent);
          continue;
        }
        this.renderRefEntity(ent, cameraOrigin, viewAxis, timeSec);
      }
      this.renderDecals(timeSec);
      if (this.bsp && Cvars.variableIntegerValue("r_flares")) {
        this.renderBspFlares(this.bsp, cameraOrigin, viewAxis, timeSec);
      }
      if (firstPersonWeapons.length > 0 && Cvars.variableIntegerValue("cg_drawGun")) {
        gl.depthRange(0, 0.3);
        for (const fpEnt of firstPersonWeapons) {
          this.renderRefEntity(fpEnt, cameraOrigin, viewAxis, timeSec);
        }
        gl.depthRange(0, 1);
      }
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.disable(gl.POLYGON_OFFSET_FILL);
    }
    renderBspWorld(bsp, cameraOrigin, timeSec) {
      const gl = this.gl;
      const leafIdx = bsp.findLeaf(cameraOrigin);
      const viewerCluster = leafIdx >= 0 && leafIdx < bsp.leafs.length ? bsp.leafs[leafIdx].cluster : -1;
      const visited = new Uint8Array(bsp.surfaces.length);
      const visibleSurfs = [];
      for (const leaf of bsp.leafs) {
        if (!bsp.isClusterVisible(viewerCluster, leaf.cluster)) {
          this.stats.culledSurfaces += leaf.numLeafSurfaces;
          continue;
        }
        for (let i = 0; i < leaf.numLeafSurfaces; i++) {
          const surfIdx = bsp.leafSurfaces[leaf.firstLeafSurface + i];
          if (visited[surfIdx]) continue;
          visited[surfIdx] = 1;
          const surf = bsp.surfaces[surfIdx];
          if (surf.iboNumIndexes === 0) continue;
          const bspShader = bsp.shaders[surf.shaderNum];
          if (bspShader && bspShader.surfaceFlags & SURF_NODRAW) continue;
          const shader = Shaders.getShader(
            bspShader ? bspShader.name : "*default",
            surf.lightmapNum >= 0
          );
          if (shader.isSky && Cvars.variableIntegerValue("r_fastsky")) continue;
          visibleSurfs.push({ surf, shader });
        }
      }
      this.stats.visibleSurfaces = visibleSurfs.length;
      visibleSurfs.sort((a, b) => {
        if (a.shader.sort !== b.shader.sort) return a.shader.sort - b.shader.sort;
        return a.surf.shaderNum - b.surf.shaderNum;
      });
      gl.bindVertexArray(this.worldVao);
      this.executor.setEntityTransformAndLighting(
        this.identityMat,
        0,
        [1, 1, 1],
        [0, 0, 0],
        [0, 0, 1]
      );
      const lightmapOnly = Cvars.variableIntegerValue("r_lightmap") !== 0;
      for (const item of visibleSurfs) {
        const { surf, shader } = item;
        this.executor.setDeformUniforms(shader.deforms);
        if (lightmapOnly && surf.lightmapNum >= 0) {
          const lmStage = {
            map: "$lightmap",
            clamp: true,
            animFreq: 0,
            animMaps: [],
            blendSrc: "GL_ONE",
            blendDst: "GL_ZERO",
            hasBlend: false,
            rgbGen: "identity",
            alphaGen: "identity",
            tcGen: "lightmap",
            tcMods: [],
            depthFunc: "lequal",
            depthWrite: true,
            depthWriteExplicit: true,
            alphaFunc: "NONE"
          };
          this.drawSurfaceStage(surf, lmStage, shader, timeSec, [255, 255, 255, 255], false);
          continue;
        }
        if (surf.lightmapNum >= 0 && this.executor.canSinglePassLightmap(shader)) {
          this.drawSurfaceStage(
            surf,
            shader.stages[0],
            shader,
            timeSec,
            [255, 255, 255, 255],
            true
          );
        } else {
          for (const stage of shader.stages) {
            this.drawSurfaceStage(
              surf,
              stage,
              shader,
              timeSec,
              [255, 255, 255, 255],
              false
            );
          }
        }
      }
    }
    drawSurfaceStage(surf, stage, shader, timeSec, entityRGBA, combineLightmap) {
      const gl = this.gl;
      this.executor.bindStageState(stage, shader, timeSec, entityRGBA, combineLightmap);
      let tex;
      if (stage.map.toLowerCase() === "$lightmap" && this.lightmapAtlas) {
        tex = this.lightmapAtlas.texture;
      } else if (stage.animMaps.length > 0 && stage.animFreq > 0) {
        const frameIdx = Math.floor(timeSec * stage.animFreq) % stage.animMaps.length;
        tex = this.textures.getTexture(stage.animMaps[frameIdx], stage.clamp);
      } else {
        tex = this.textures.getTexture(stage.map, stage.clamp);
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.drawElements(
        gl.TRIANGLES,
        surf.iboNumIndexes,
        gl.UNSIGNED_INT,
        surf.iboFirstIndex * 4
      );
      this.stats.drawCalls++;
      this.stats.tris += surf.iboNumIndexes / 3;
    }
    renderRefEntity(ent, cameraOrigin, viewAxis, timeSec) {
      if (ent.reType === 2 /* RT_SPRITE */) {
        this.renderSpriteEntity(ent, viewAxis, timeSec);
        return;
      }
      if (ent.reType === 4 /* RT_RAIL_CORE */ || ent.reType === 6 /* RT_LIGHTNING */ || ent.reType === 3 /* RT_BEAM */) {
        this.renderBeamEntity(ent, cameraOrigin, timeSec);
        return;
      }
      if (ent.hModel.startsWith("*") && this.bsp && this.worldVao) {
        const modelIdx = Number.parseInt(ent.hModel.slice(1), 10);
        if (modelIdx > 0 && modelIdx < this.bsp.models.length) {
          const bModel = this.bsp.models[modelIdx];
          buildEntityModelMatrix(ent.origin, ent.axis, this.entityModelMat);
          this.gl.bindVertexArray(this.worldVao);
          this.executor.setEntityTransformAndLighting(
            this.entityModelMat,
            0,
            [1, 1, 1],
            [0, 0, 0],
            [0, 0, 1]
          );
          for (let i = 0; i < bModel.numSurfaces; i++) {
            const surf = this.bsp.surfaces[bModel.firstSurface + i];
            if (surf.iboNumIndexes === 0) continue;
            const bspShader = this.bsp.shaders[surf.shaderNum];
            const shader = Shaders.getShader(bspShader ? bspShader.name : "*default", true);
            this.executor.setDeformUniforms(shader.deforms);
            if (this.executor.canSinglePassLightmap(shader)) {
              this.drawSurfaceStage(surf, shader.stages[0], shader, timeSec, ent.shaderRGBA, true);
            } else {
              for (const stage of shader.stages) {
                this.drawSurfaceStage(surf, stage, shader, timeSec, ent.shaderRGBA, false);
              }
            }
          }
        }
        return;
      }
      const md3 = this.registerModel(ent.hModel);
      if (!md3) return;
      buildEntityModelMatrix(ent.origin, ent.axis, this.entityModelMat);
      const lightPos = ent.lightingOrigin[0] !== 0 || ent.lightingOrigin[1] !== 0 ? ent.lightingOrigin : ent.origin;
      const lg = this.bsp ? this.bsp.sampleLightgrid(lightPos) : { ambient: [0.45, 0.45, 0.5], directed: [0.75, 0.72, 0.68], lightDir: [0.3, 0.4, 0.85] };
      const f0 = Math.max(0, Math.min(md3.numFrames - 1, ent.oldframe));
      const f1 = Math.max(0, Math.min(md3.numFrames - 1, ent.frame));
      const frontLerp = 1 - Math.max(0, Math.min(1, ent.backlerp));
      this.executor.setEntityTransformAndLighting(
        this.entityModelMat,
        frontLerp,
        lg.ambient,
        lg.directed,
        lg.lightDir
      );
      const skinMap = ent.customSkin ? this.registerSkin(ent.customSkin) : null;
      const gl = this.gl;
      for (const surf of md3.surfaces) {
        const frame0 = surf.framesPosNorm[Math.min(surf.numFrames - 1, f0)];
        const frame1 = surf.framesPosNorm[Math.min(surf.numFrames - 1, f1)];
        const scratch = surf.interleavedScratch;
        for (let v = 0; v < surf.numVerts; v++) {
          const d = v * 20;
          const v3 = v * 3;
          const v2 = v * 2;
          scratch[d + 0] = frame0.pos[v3 + 0];
          scratch[d + 1] = frame0.pos[v3 + 1];
          scratch[d + 2] = frame0.pos[v3 + 2];
          scratch[d + 3] = surf.stData[v2 + 0];
          scratch[d + 4] = surf.stData[v2 + 1];
          scratch[d + 5] = 0;
          scratch[d + 6] = 0;
          scratch[d + 7] = frame0.norm[v3 + 0];
          scratch[d + 8] = frame0.norm[v3 + 1];
          scratch[d + 9] = frame0.norm[v3 + 2];
          scratch[d + 10] = ent.shaderRGBA[0] / 255;
          scratch[d + 11] = ent.shaderRGBA[1] / 255;
          scratch[d + 12] = ent.shaderRGBA[2] / 255;
          scratch[d + 13] = ent.shaderRGBA[3] / 255;
          scratch[d + 14] = frame1.pos[v3 + 0];
          scratch[d + 15] = frame1.pos[v3 + 1];
          scratch[d + 16] = frame1.pos[v3 + 2];
          scratch[d + 17] = frame1.norm[v3 + 0];
          scratch[d + 18] = frame1.norm[v3 + 1];
          scratch[d + 19] = frame1.norm[v3 + 2];
        }
        gl.bindVertexArray(surf.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, surf.vboDynamic);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, scratch);
        let shaderName = ent.customShader;
        if (!shaderName && skinMap && skinMap.has(surf.name)) {
          shaderName = skinMap.get(surf.name);
        }
        if (!shaderName) {
          shaderName = surf.shaders[0] || "*default";
        }
        const shader = Shaders.getShader(shaderName, false);
        this.executor.setDeformUniforms(shader.deforms);
        for (const stage of shader.stages) {
          this.executor.bindStageState(stage, shader, timeSec, ent.shaderRGBA, false);
          const tex = this.textures.getTexture(stage.map, stage.clamp);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.drawElements(gl.TRIANGLES, surf.numTriangles * 3, gl.UNSIGNED_INT, 0);
          this.stats.drawCalls++;
          this.stats.tris += surf.numTriangles;
        }
      }
    }
    renderSpriteEntity(ent, viewAxis, timeSec) {
      const r = ent.radius || 16;
      const left = viewAxis[1];
      const up = viewAxis[2];
      const p0 = [
        ent.origin[0] + (-left[0] - up[0]) * r,
        ent.origin[1] + (-left[1] - up[1]) * r,
        ent.origin[2] + (-left[2] - up[2]) * r
      ];
      const p1 = [
        ent.origin[0] + (left[0] - up[0]) * r,
        ent.origin[1] + (left[1] - up[1]) * r,
        ent.origin[2] + (left[2] - up[2]) * r
      ];
      const p2 = [
        ent.origin[0] + (left[0] + up[0]) * r,
        ent.origin[1] + (left[1] + up[1]) * r,
        ent.origin[2] + (left[2] + up[2]) * r
      ];
      const p3 = [
        ent.origin[0] + (-left[0] + up[0]) * r,
        ent.origin[1] + (-left[1] + up[1]) * r,
        ent.origin[2] + (-left[2] + up[2]) * r
      ];
      this.drawDynamicQuad(p0, p1, p2, p3, ent.customShader || "flareShader", ent.shaderRGBA, timeSec);
    }
    renderBeamEntity(ent, cameraOrigin, timeSec) {
      const start = ent.origin;
      const end = ent.oldorigin;
      const dir = [0, 0, 0];
      vec3Sub(end, start, dir);
      const len = vec3Normalize(dir);
      if (len < 1) return;
      const toCam = [0, 0, 0];
      vec3Sub(cameraOrigin, start, toCam);
      const right = [0, 0, 0];
      vec3Cross(dir, toCam, right);
      vec3Normalize(right);
      const width = ent.reType === 4 /* RT_RAIL_CORE */ ? Cvars.variableValue("r_railCoreWidth") || 6 : ent.radius || 8;
      const p0 = [start[0] - right[0] * width, start[1] - right[1] * width, start[2] - right[2] * width];
      const p1 = [end[0] - right[0] * width, end[1] - right[1] * width, end[2] - right[2] * width];
      const p2 = [end[0] + right[0] * width, end[1] + right[1] * width, end[2] + right[2] * width];
      const p3 = [start[0] + right[0] * width, start[1] + right[1] * width, start[2] + right[2] * width];
      const shaderName = ent.customShader || (ent.reType === 4 /* RT_RAIL_CORE */ ? "railCore" : "lightningBolt");
      this.drawDynamicQuad(p0, p1, p2, p3, shaderName, ent.shaderRGBA, timeSec);
    }
    renderBspFlares(bsp, cameraOrigin, viewAxis, timeSec) {
      for (const surf of bsp.surfaces) {
        if (surf.surfaceType !== MST_FLARE) continue;
        const dist = Math.hypot(
          surf.origin[0] - cameraOrigin[0],
          surf.origin[1] - cameraOrigin[1],
          surf.origin[2] - cameraOrigin[2]
        );
        if (dist > 1800) continue;
        const r = 26 + Math.min(36, dist * 0.03);
        const rgba = [
          Math.min(255, surf.flareColor[0] * 255 | 0),
          Math.min(255, surf.flareColor[1] * 255 | 0),
          Math.min(255, surf.flareColor[2] * 255 | 0),
          190
        ];
        this.renderSpriteEntity(
          {
            reType: 2 /* RT_SPRITE */,
            renderfx: 0,
            hModel: "",
            lightingOrigin: surf.origin,
            axis: AxisClear(),
            nonNormalizedAxes: false,
            origin: surf.origin,
            frame: 0,
            oldorigin: surf.origin,
            oldframe: 0,
            backlerp: 0,
            skinNum: 0,
            customSkin: "",
            customShader: "flareShader",
            shaderRGBA: rgba,
            shaderTexCoord: [0, 0],
            shaderTime: 0,
            radius: r,
            rotation: 0
          },
          viewAxis,
          timeSec
        );
      }
    }
    renderDecals(timeSec) {
      this.decals = this.decals.filter((d) => timeSec - d.spawnTime < 20);
      for (const dec of this.decals) {
        const n = dec.normal;
        const upRef = Math.abs(n[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
        const tangent = [0, 0, 0];
        const bitangent = [0, 0, 0];
        vec3Cross(n, upRef, tangent);
        vec3Normalize(tangent);
        vec3Cross(n, tangent, bitangent);
        vec3Normalize(bitangent);
        const orig = [0, 0, 0];
        vec3MA(dec.origin, 0.5, n, orig);
        const r = dec.radius;
        const p0 = [
          orig[0] + (-tangent[0] - bitangent[0]) * r,
          orig[1] + (-tangent[1] - bitangent[1]) * r,
          orig[2] + (-tangent[2] - bitangent[2]) * r
        ];
        const p1 = [
          orig[0] + (tangent[0] - bitangent[0]) * r,
          orig[1] + (tangent[1] - bitangent[1]) * r,
          orig[2] + (tangent[2] - bitangent[2]) * r
        ];
        const p2 = [
          orig[0] + (tangent[0] + bitangent[0]) * r,
          orig[1] + (tangent[1] + bitangent[1]) * r,
          orig[2] + (tangent[2] + bitangent[2]) * r
        ];
        const p3 = [
          orig[0] + (-tangent[0] + bitangent[0]) * r,
          orig[1] + (-tangent[1] + bitangent[1]) * r,
          orig[2] + (-tangent[2] + bitangent[2]) * r
        ];
        this.drawDynamicQuad(p0, p1, p2, p3, dec.shaderName, dec.color, timeSec);
      }
    }
    drawDynamicQuad(p0, p1, p2, p3, shaderName, rgba, timeSec) {
      const gl = this.gl;
      const pts = [p0, p1, p2, p3];
      const uvs = [
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0]
      ];
      for (let i = 0; i < 4; i++) {
        const b = i * 20;
        const p = pts[i];
        this.dynVertScratch[b + 0] = p[0];
        this.dynVertScratch[b + 1] = p[1];
        this.dynVertScratch[b + 2] = p[2];
        this.dynVertScratch[b + 3] = uvs[i][0];
        this.dynVertScratch[b + 4] = uvs[i][1];
        this.dynVertScratch[b + 5] = 0;
        this.dynVertScratch[b + 6] = 0;
        this.dynVertScratch[b + 7] = 0;
        this.dynVertScratch[b + 8] = 0;
        this.dynVertScratch[b + 9] = 1;
        this.dynVertScratch[b + 10] = rgba[0] / 255;
        this.dynVertScratch[b + 11] = rgba[1] / 255;
        this.dynVertScratch[b + 12] = rgba[2] / 255;
        this.dynVertScratch[b + 13] = rgba[3] / 255;
        this.dynVertScratch[b + 14] = p[0];
        this.dynVertScratch[b + 15] = p[1];
        this.dynVertScratch[b + 16] = p[2];
        this.dynVertScratch[b + 17] = 0;
        this.dynVertScratch[b + 18] = 0;
        this.dynVertScratch[b + 19] = 1;
      }
      this.dynIdxScratch[0] = 0;
      this.dynIdxScratch[1] = 1;
      this.dynIdxScratch[2] = 2;
      this.dynIdxScratch[3] = 0;
      this.dynIdxScratch[4] = 2;
      this.dynIdxScratch[5] = 3;
      gl.bindVertexArray(this.dynVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.dynVbo);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.dynVertScratch.subarray(0, 4 * 20));
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.dynIbo);
      gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, this.dynIdxScratch.subarray(0, 6));
      this.executor.setEntityTransformAndLighting(
        this.identityMat,
        0,
        [1, 1, 1],
        [0, 0, 0],
        [0, 0, 1]
      );
      const shader = Shaders.getShader(shaderName, false);
      this.executor.setDeformUniforms(shader.deforms);
      for (const stage of shader.stages) {
        this.executor.bindStageState(stage, shader, timeSec, rgba, false);
        const tex = this.textures.getTexture(stage.map, stage.clamp);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);
        this.stats.drawCalls++;
        this.stats.tris += 2;
      }
    }
  };

  // src/main.ts
  function decodeBase64ToUint8(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      out[i] = bin.charCodeAt(i);
    }
    return out;
  }
  async function bootstrapQuake3Arena() {
    const glCanvas = document.getElementById("gl-canvas");
    const uiCanvas = document.getElementById("ui-canvas");
    const vfsBadge = document.getElementById("vfs-status-badge");
    const mapSelector = document.getElementById("map-selector");
    const btnAddBot = document.getElementById("btn-add-bot");
    const btnLoadPk3 = document.getElementById("btn-load-pk3");
    const btnFetchOa = document.getElementById("btn-fetch-oa");
    const btnToggleConsole = document.getElementById("btn-toggle-console");
    const fileInput = document.getElementById("pk3-file-input");
    const dropOverlay = document.getElementById("pk3-drop-overlay");
    const resizeCanvases = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      glCanvas.width = Math.floor(window.innerWidth * dpr);
      glCanvas.height = Math.floor(window.innerHeight * dpr);
      uiCanvas.width = window.innerWidth;
      uiCanvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resizeCanvases);
    resizeCanvases();
    Cmd.print("^1================================================================");
    Cmd.print("^3QUAKE III ARENA (id Tech 3 v1.32c) \u2014 HTML5 / WebGL2 Engine");
    Cmd.print("^1================================================================");
    const updateVfsBadge = () => {
      vfsBadge.textContent = `VFS: ${VFS.getMountedPaksSummary()}`;
      updateMapDropdown();
    };
    VFS.onChange(updateVfsBadge);
    if (window.location.protocol !== "file:") {
      for (const [url, name, prio] of [
        ["./assets/baseq3/pak1_starter.pk3", "pak1_starter.pk3", 3],
        ["./assets/baseoa/pak0_nkoa.pk3", "pak0_nkoa.pk3", 8],
        ["./assets/baseq3/pak0.pk3", "pak0.pk3", 20]
      ]) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const buf = await res.arrayBuffer();
            VFS.mountPk3(name, buf, prio, false);
          }
        } catch {
        }
      }
    }
    if (VFS.listFiles("maps/", ".bsp").length === 0 && EMBEDDED_PAK0_BASE64.length > 0) {
      VFS.mountPk3("pak0.pk3", decodeBase64ToUint8(EMBEDDED_PAK0_BASE64), 10, false);
    }
    await VFS.loadCachedPk3sFromIdb();
    loadAllQvmModules();
    const renderer = new Q3Renderer(glCanvas);
    const arena = new Q3GameArena(renderer);
    const hud = new CgHudAndConsole(uiCanvas);
    function updateMapDropdown() {
      const bspFiles = VFS.listFiles("maps/", ".bsp");
      if (bspFiles.length === 0) return;
      const currentVal = mapSelector.value || "q3dm17";
      mapSelector.innerHTML = "";
      const mapTitles = {
        q3dm17: "q3dm17 \u2014 The Longest Yard (Original 1999)",
        q3dm7: "q3dm7 \u2014 Temple of Retribution (Original 1999)",
        q3dm1: "q3dm1 \u2014 Arena Gate (Original 1999)",
        q3tourney2: "q3tourney2 \u2014 The Proving Grounds (Original 1999)",
        q3dm6: "q3dm6 \u2014 The Campgrounds"
      };
      for (const f of bspFiles) {
        const mName = f.replace(/^maps\//i, "").replace(/\.bsp$/i, "");
        const opt = document.createElement("option");
        opt.value = mName;
        opt.textContent = mapTitles[mName] || `${mName} (.BSP)`;
        mapSelector.appendChild(opt);
      }
      if ([...mapSelector.options].some((o) => o.value === currentVal)) {
        mapSelector.value = currentVal;
      }
    }
    updateVfsBadge();
    Cmd.addCommand("map", (args) => {
      if (args.length < 2) {
        Cmd.print(`^3Usage: /map <mapname> (Available: ${VFS.listFiles("maps/", ".bsp").join(", ")})`);
        return;
      }
      arena.loadMap(args[1]);
      mapSelector.value = arena.mapName;
    });
    Cmd.addCommand("devmap", (args) => {
      if (args.length >= 2) {
        arena.loadMap(args[1]);
        mapSelector.value = arena.mapName;
      }
    });
    Cmd.addCommand("addbot", (args) => {
      const botName = args[1];
      const skill = Number.parseInt(args[2] || "3", 10) || 3;
      arena.addBot(botName, void 0, skill);
    });
    Cmd.addCommand("give", (args) => {
      const local = arena.clients[0];
      if (!local) return;
      const what = (args[1] || "all").toLowerCase();
      if (what === "all" || what === "weapons") {
        local.ps.weaponsMask = 1022;
        for (let w = 1; w <= 9; w++) local.ps.ammo[w] = 200;
        local.ps.health = 200;
        local.ps.armor = 200;
      }
      if (what === "quad" || what === "all") {
        local.ps.powerups[1 /* PW_QUAD */] = arena.timeMs + 3e4;
        Sound.queueAnnouncement("Quad Damage");
      }
      Cmd.print("^2Give: All Weapons, 200 Health, 200 Armor & Quad Damage granted.");
    });
    Cmd.addCommand("noclip", () => {
      const local = arena.clients[0];
      if (!local) return;
      local.ps.pm_type = local.ps.pm_type === 1 /* PM_NOCLIP */ ? 0 /* PM_NORMAL */ : 1 /* PM_NOCLIP */;
      Cmd.print(`^3noclip ${local.ps.pm_type === 1 /* PM_NOCLIP */ ? "ON" : "OFF"}`);
    });
    Cmd.addCommand("kill", () => {
      const local = arena.clients[0];
      if (local) {
        arena.applyDamage(local, null, 999, local.ps.origin, [0, 0, 1], "SELF");
      }
    });
    arena.loadMap("q3dm17");
    const keysDown = /* @__PURE__ */ new Set();
    let mouseButtons = 0;
    const viewAngles = [0, 45, 0];
    let desiredWeapon = 5 /* WP_ROCKET_LAUNCHER */;
    if (arena.clients[0]) {
      arena.clients[0].ps.weaponsMask |= 1 << 5 /* WP_ROCKET_LAUNCHER */ | 1 << 7 /* WP_RAILGUN */ | 1 << 8 /* WP_PLASMAGUN */ | 1 << 6 /* WP_LIGHTNING */ | 1 << 3 /* WP_SHOTGUN */;
      arena.clients[0].ps.ammo[5 /* WP_ROCKET_LAUNCHER */] = 25;
      arena.clients[0].ps.ammo[7 /* WP_RAILGUN */] = 15;
      arena.clients[0].ps.ammo[8 /* WP_PLASMAGUN */] = 80;
      arena.clients[0].ps.ammo[6 /* WP_LIGHTNING */] = 120;
      arena.clients[0].ps.ammo[3 /* WP_SHOTGUN */] = 20;
      arena.clients[0].ps.weapon = 5 /* WP_ROCKET_LAUNCHER */;
      viewAngles[0] = arena.clients[0].ps.viewangles[0];
      viewAngles[1] = arena.clients[0].ps.viewangles[1];
    }
    glCanvas.addEventListener("mousedown", (e) => {
      Sound.initOnUserGesture();
      if (hud.consoleOpen) return;
      if (document.pointerLockElement !== glCanvas) {
        glCanvas.requestPointerLock?.();
      }
      if (e.button === 0) {
        mouseButtons |= BUTTON_ATTACK;
      }
    });
    window.addEventListener("mouseup", (e) => {
      if (e.button === 0) {
        mouseButtons &= ~BUTTON_ATTACK;
      }
    });
    window.addEventListener("mousemove", (e) => {
      if (document.pointerLockElement !== glCanvas || hud.consoleOpen) return;
      const sens = Cvars.variableValue("sensitivity") || 3.5;
      const mYaw = Cvars.variableValue("m_yaw") || 0.022;
      const mPitch = Cvars.variableValue("m_pitch") || 0.022;
      viewAngles[1] = (viewAngles[1] - e.movementX * sens * mYaw) % 360;
      viewAngles[0] = Math.max(
        -89,
        Math.min(89, viewAngles[0] + e.movementY * sens * mPitch)
      );
    });
    window.addEventListener("wheel", (e) => {
      if (hud.consoleOpen) return;
      const local = arena.clients[0];
      if (!local) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      let cur = local.ps.weapon;
      for (let i = 1; i <= 9; i++) {
        cur = ((cur - 1 + dir * i) % 9 + 9) % 9 + 1;
        if (local.ps.weaponsMask & 1 << cur) {
          desiredWeapon = cur;
          break;
        }
      }
    });
    window.addEventListener("keydown", (e) => {
      if (hud.handleConsoleKeyDown(e)) return;
      if (e.code === "Tab") {
        e.preventDefault();
        hud.scoreboardOpen = true;
        return;
      }
      keysDown.add(e.code);
      if (e.code.startsWith("Digit")) {
        const num = Number.parseInt(e.code.replace("Digit", ""), 10);
        if (num >= 1 && num <= 9) {
          desiredWeapon = num;
        }
      }
    });
    window.addEventListener("keyup", (e) => {
      if (e.code === "Tab") {
        hud.scoreboardOpen = false;
      }
      keysDown.delete(e.code);
    });
    mapSelector.addEventListener("change", () => {
      arena.loadMap(mapSelector.value);
      if (arena.clients[0]) {
        viewAngles[1] = arena.clients[0].ps.viewangles[1];
      }
      glCanvas.focus();
    });
    btnAddBot.addEventListener("click", () => {
      arena.addBot();
    });
    btnToggleConsole.addEventListener("click", () => {
      hud.consoleOpen = !hud.consoleOpen;
    });
    btnLoadPk3.addEventListener("click", () => {
      fileInput.click();
    });
    btnFetchOa.addEventListener("click", async () => {
      btnFetchOa.textContent = "\u23F3 Loading NK-OA...";
      await VFS.fetchNeonKnightOAAssets((st) => {
        vfsBadge.textContent = st;
      });
      Shaders.loadAllFromVFS();
      updateVfsBadge();
      btnFetchOa.textContent = "\u2713 NK-OA Loaded";
    });
    const handleUploadedFiles = async (fileList) => {
      if (!fileList || fileList.length === 0) return;
      let bspToLoad = null;
      for (const file of Array.from(fileList)) {
        const buf = new Uint8Array(await file.arrayBuffer());
        const lower = file.name.toLowerCase();
        if (lower.endsWith(".pk3") || lower.endsWith(".zip")) {
          VFS.mountPk3(file.name, buf, 25, true);
          const mapsInPak = VFS.listFiles("maps/", ".bsp");
          if (mapsInPak.length > 0) {
            bspToLoad = mapsInPak[0];
          }
        } else if (lower.endsWith(".bsp")) {
          const path = `maps/${lower}`;
          VFS.writeFile(path, buf);
          bspToLoad = path;
        } else if (lower.endsWith(".shader")) {
          VFS.writeFile(`scripts/${lower}`, buf);
        } else if (lower.endsWith(".md3")) {
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
    fileInput.addEventListener("change", () => {
      handleUploadedFiles(fileInput.files);
    });
    window.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropOverlay.classList.add("active");
    });
    window.addEventListener("dragleave", (e) => {
      if (e.relatedTarget === null) {
        dropOverlay.classList.remove("active");
      }
    });
    window.addEventListener("drop", (e) => {
      e.preventDefault();
      dropOverlay.classList.remove("active");
      handleUploadedFiles(e.dataTransfer?.files || null);
    });
    let lastFrameTime = performance.now();
    let accumulatorMs = 0;
    const FIXED_STEP_MS = 8;
    const frameLoop = (now) => {
      const dtMs = Math.min(100, Math.max(1, now - lastFrameTime));
      lastFrameTime = now;
      accumulatorMs += dtMs;
      let forwardmove = 0;
      let rightmove = 0;
      let upmove = 0;
      let buttons = mouseButtons;
      if (!hud.consoleOpen) {
        if (keysDown.has("KeyW") || keysDown.has("ArrowUp")) forwardmove += 127;
        if (keysDown.has("KeyS") || keysDown.has("ArrowDown")) forwardmove -= 127;
        if (keysDown.has("KeyD") || keysDown.has("ArrowRight")) rightmove += 127;
        if (keysDown.has("KeyA") || keysDown.has("ArrowLeft")) rightmove -= 127;
        if (keysDown.has("Space")) upmove += 127;
        if (keysDown.has("ControlLeft") || keysDown.has("KeyC")) upmove -= 127;
        if (keysDown.has("ShiftLeft")) buttons |= BUTTON_WALKING;
      }
      const userCmd = {
        serverTime: arena.timeMs,
        angles: [viewAngles[0], viewAngles[1], viewAngles[2]],
        buttons,
        weapon: desiredWeapon,
        forwardmove,
        rightmove,
        upmove
      };
      while (accumulatorMs >= FIXED_STEP_MS) {
        arena.stepArena(FIXED_STEP_MS, userCmd);
        accumulatorMs -= FIXED_STEP_MS;
      }
      const local = arena.clients[0];
      if (local) {
        const eyeOrigin = [
          local.ps.origin[0],
          local.ps.origin[1],
          local.ps.origin[2] + local.ps.viewheight
        ];
        Sound.updateListener(eyeOrigin, local.ps.viewangles);
        arena.buildRenderScene();
        renderer.renderScene(eyeOrigin, local.ps.viewangles, arena.timeMs * 1e-3);
      }
      hud.render(arena);
      requestAnimationFrame(frameLoop);
    };
    requestAnimationFrame(frameLoop);
  }
  bootstrapQuake3Arena().catch((err2) => {
    console.error("Fatal Quake 3 Engine Error:", err2);
  });
})();
