// HashLife engine for two-state outer-totalistic rules (B/S notation).
// Nodes are hash-consed quadtrees stored in typed arrays; index 0/1 are dead/alive leaves.
class HashLife {
  constructor() {
    this.cap = 1 << 16;
    this.nw = new Int32Array(this.cap); this.ne = new Int32Array(this.cap);
    this.sw = new Int32Array(this.cap); this.se = new Int32Array(this.cap);
    this.lv = new Uint8Array(this.cap); this.pop = new Float64Array(this.cap);
    this.res = new Int32Array(this.cap).fill(-1);
    this.hbits = 17; this.hash = new Int32Array(1 << this.hbits).fill(-1);
    this.count = 2; this.lv[0] = 0; this.pop[0] = 0; this.lv[1] = 0; this.pop[1] = 1;
    this.emptyCache = [0];
    this.stepJ = 0;
    this.table = new Uint8Array(65536);
    this.setRule('B3/S23');
  }

  static parseRule(str) {
    let s = String(str).trim().toUpperCase().replace(/\s+/g, '');
    let b = null, sv = null, m;
    if ((m = s.match(/^B([0-8]*)\/?S?([0-8]*)$/))) { b = m[1]; sv = m[2]; }
    else if ((m = s.match(/^S([0-8]*)\/?B([0-8]*)$/))) { sv = m[1]; b = m[2]; }
    else if ((m = s.match(/^([0-8]*)\/([0-8]*)$/))) { sv = m[1]; b = m[2]; } // classic S/B form like 23/3
    else return null;
    const birth = new Array(9).fill(false), survive = new Array(9).fill(false);
    for (const ch of b) birth[+ch] = true;
    for (const ch of sv) survive[+ch] = true;
    if (birth[0]) return { error: 'B0' };
    const canon = 'B' + [...new Set(b)].sort().join('') + '/S' + [...new Set(sv)].sort().join('');
    return { birth, survive, canon };
  }

  setRule(str) {
    const r = HashLife.parseRule(str);
    if (!r || r.error) return r;
    this.rule = r;
    const t = this.table;
    for (let p = 0; p < 65536; p++) {
      let out = 0;
      const cells = [[1, 1, 0], [2, 1, 1], [1, 2, 2], [2, 2, 3]];
      for (const [cx, cy, bit] of cells) {
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (dx || dy) n += (p >> ((cy + dy) * 4 + cx + dx)) & 1;
        }
        const alive = (p >> (cy * 4 + cx)) & 1;
        if (alive ? r.survive[n] : r.birth[n]) out |= 1 << bit;
      }
      t[p] = out;
    }
    this.clearResults();
    return r;
  }

  clearResults() { this.res.fill(-1, 0, this.count); }

  grow() {
    const nc = this.cap * 2;
    const g = (A, T, fill) => { const b = new T(nc); if (fill !== undefined) b.fill(fill); b.set(A); return b; };
    this.nw = g(this.nw, Int32Array); this.ne = g(this.ne, Int32Array);
    this.sw = g(this.sw, Int32Array); this.se = g(this.se, Int32Array);
    this.lv = g(this.lv, Uint8Array); this.pop = g(this.pop, Float64Array);
    this.res = g(this.res, Int32Array, -1);
    this.cap = nc;
  }

  rehash(bits) {
    this.hbits = bits; const H = this.hash = new Int32Array(1 << bits).fill(-1);
    const mask = (1 << bits) - 1;
    for (let i = 2; i < this.count; i++) {
      let h = this.h4(this.nw[i], this.ne[i], this.sw[i], this.se[i]) & mask;
      while (H[h] !== -1) h = (h + 1) & mask;
      H[h] = i;
    }
  }

  h4(a, b, c, d) {
    let h = Math.imul(a, 0x9E3779B1) ^ Math.imul(b + 0x7F4A7C15, 0x85EBCA77) ^ Math.imul(c + 0x165667B1, 0xC2B2AE3D) ^ Math.imul(d + 0x27D4EB2F, 0x1B873593);
    h ^= h >>> 15; h = Math.imul(h, 0x2C1B3C6D); h ^= h >>> 12;
    return h >>> 0;
  }

  join(a, b, c, d) {
    const mask = (1 << this.hbits) - 1, H = this.hash;
    let h = this.h4(a, b, c, d) & mask, i;
    while ((i = H[h]) !== -1) {
      if (this.nw[i] === a && this.ne[i] === b && this.sw[i] === c && this.se[i] === d) return i;
      h = (h + 1) & mask;
    }
    if (this.count >= this.cap) this.grow();
    i = this.count++;
    this.nw[i] = a; this.ne[i] = b; this.sw[i] = c; this.se[i] = d;
    this.lv[i] = this.lv[a] + 1;
    this.pop[i] = this.pop[a] + this.pop[b] + this.pop[c] + this.pop[d];
    this.res[i] = -1;
    H[h] = i;
    if (this.count * 2 > H.length) this.rehash(this.hbits + 1);
    return i;
  }

  empty(L) {
    while (this.emptyCache.length <= L) {
      const e = this.emptyCache[this.emptyCache.length - 1];
      this.emptyCache.push(this.join(e, e, e, e));
    }
    return this.emptyCache[L];
  }

  centre(x) { return this.join(this.se[this.nw[x]], this.sw[this.ne[x]], this.ne[this.sw[x]], this.nw[this.se[x]]); }

  base(n) {
    const a = this.nw[n], b = this.ne[n], c = this.sw[n], d = this.se[n];
    const NW = this.nw, NE = this.ne, SW = this.sw, SE = this.se;
    const p =
      NW[a] | NE[a] << 1 | NW[b] << 2 | NE[b] << 3 |
      SW[a] << 4 | SE[a] << 5 | SW[b] << 6 | SE[b] << 7 |
      NW[c] << 8 | NE[c] << 9 | NW[d] << 10 | NE[d] << 11 |
      SW[c] << 12 | SE[c] << 13 | SW[d] << 14 | SE[d] << 15;
    const r = this.table[p];
    return this.join(r & 1, (r >> 1) & 1, (r >> 2) & 1, (r >> 3) & 1);
  }

  // Advance the centre of node n by 2^min(stepJ, L-2) generations; returns level L-1 node.
  step(n) {
    const cached = this.res[n];
    if (cached >= 0) return cached;
    const L = this.lv[n];
    let r;
    if (this.pop[n] === 0) r = this.empty(L - 1);
    else if (L === 2) r = this.base(n);
    else {
      const NW = this.nw, NE = this.ne, SW = this.sw, SE = this.se;
      const a = NW[n], b = NE[n], c = SW[n], d = SE[n];
      const n00 = a, n02 = b, n20 = c, n22 = d;
      const n01 = this.join(NE[a], NW[b], SE[a], SW[b]);
      const n10 = this.join(SW[a], SE[a], NW[c], NE[c]);
      const n11 = this.join(SE[a], SW[b], NE[c], NW[d]);
      const n12 = this.join(SW[b], SE[b], NW[d], NE[d]);
      const n21 = this.join(NE[c], NW[d], SE[c], SW[d]);
      const f = this.stepJ >= L - 2 ? (x) => this.step(x) : (x) => this.centre(x);
      const r00 = f(n00), r01 = f(n01), r02 = f(n02), r10 = f(n10), r11 = f(n11), r12 = f(n12), r20 = f(n20), r21 = f(n21), r22 = f(n22);
      r = this.join(
        this.step(this.join(r00, r01, r10, r11)),
        this.step(this.join(r01, r02, r11, r12)),
        this.step(this.join(r10, r11, r20, r21)),
        this.step(this.join(r11, r12, r21, r22)));
    }
    this.res[n] = r;
    return r;
  }

  expand(n) {
    const L = this.lv[n], e = this.empty(L - 1);
    return this.join(
      this.join(e, e, e, this.nw[n]), this.join(e, e, this.ne[n], e),
      this.join(e, this.sw[n], e, e), this.join(this.se[n], e, e, e));
  }

  isCentred(n) {
    const L = this.lv[n];
    if (L < 2) return false;
    const inner = this.pop[this.se[this.nw[n]]] + this.pop[this.sw[this.ne[n]]] + this.pop[this.ne[this.sw[n]]] + this.pop[this.nw[this.se[n]]];
    return inner === this.pop[n];
  }

  // Advance a centred root by 2^j generations. Returns the new root (centred at origin).
  advance(root, j) {
    if (j !== this.stepJ) { this.stepJ = j; this.clearResults(); }
    while (this.lv[root] < j + 3 || !this.isCentred(root)) root = this.expand(root);
    root = this.expand(root);
    return this.step(root);
  }

  // Root convention: node of level L covers [-2^(L-1), 2^(L-1)) on both axes.
  newRoot(L = 3) { return this.empty(L); }

  fits(root, x, y) { const h = 2 ** (this.lv[root] - 1); return x >= -h && x < h && y >= -h && y < h; }

  setCell(root, x, y, v) {
    while (!this.fits(root, x, y)) root = this.expand(root);
    const h = 2 ** (this.lv[root] - 1);
    return this._set(root, x + h, y + h, v ? 1 : 0);
  }
  _set(n, x, y, v) {
    const L = this.lv[n];
    if (L === 0) return v;
    const h = 2 ** (L - 1);
    let a = this.nw[n], b = this.ne[n], c = this.sw[n], d = this.se[n];
    if (y < h) { if (x < h) a = this._set(a, x, y, v); else b = this._set(b, x - h, y, v); }
    else { if (x < h) c = this._set(c, x, y - h, v); else d = this._set(d, x - h, y - h, v); }
    return this.join(a, b, c, d);
  }

  getCell(root, x, y) {
    if (!this.fits(root, x, y)) return 0;
    let n = root, h = 2 ** (this.lv[root] - 1); x += h; y += h;
    while (this.lv[n] > 0) {
      if (this.pop[n] === 0) return 0;
      h = 2 ** (this.lv[n] - 1);
      if (y < h) { if (x < h) n = this.nw[n]; else { n = this.ne[n]; x -= h; } }
      else { y -= h; if (x < h) n = this.sw[n]; else { n = this.se[n]; x -= h; } }
    }
    return n;
  }

  // Build a root from a list of [x, y] cells efficiently.
  fromCells(cells) {
    let root = this.newRoot(3);
    if (!cells.length) return root;
    let m = 1;
    for (const [x, y] of cells) m = Math.max(m, Math.abs(x) + 1, Math.abs(y) + 1);
    let L = 3; while (2 ** (L - 1) < m) L++;
    const h = 2 ** (L - 1);
    const pts = cells.map(([x, y]) => [x + h, y + h]);
    const build = (L, ox, oy, list) => {
      if (!list.length) return this.empty(L);
      if (L === 0) return 1;
      const s = 2 ** (L - 1), q = [[], [], [], []];
      for (const p of list) q[(p[1] >= oy + s ? 2 : 0) + (p[0] >= ox + s ? 1 : 0)].push(p);
      return this.join(build(L - 1, ox, oy, q[0]), build(L - 1, ox + s, oy, q[1]), build(L - 1, ox, oy + s, q[2]), build(L - 1, ox + s, oy + s, q[3]));
    };
    return build(L, 0, 0, pts);
  }

  // Build a root from Golly macrocell text (two-state only).
  fromMacrocell(text) {
    const nodes = [0];
    let rule = null, last = 0;
    const leaf8 = (rows) => {
      const bit = (x, y) => (rows[y] && rows[y][x]) ? 1 : 0;
      const lvl = (L, x, y) => {
        if (L === 0) return bit(x, y);
        const h = 1 << (L - 1);
        return this.join(lvl(L - 1, x, y), lvl(L - 1, x + h, y), lvl(L - 1, x, y + h), lvl(L - 1, x + h, y + h));
      };
      return lvl(3, 0, 0);
    };
    for (const raw of String(text).split('\n')) {
      const ln = raw.trim();
      if (!ln || ln[0] === '[') continue;
      if (ln[0] === '#') { if (ln[1] === 'R') rule = ln.slice(2).trim(); continue; }
      let id;
      if (ln[0] === '.' || ln[0] === '*' || ln[0] === '$') {
        const rows = ln.split('$').map((r) => [...r].map((c) => c === '*'));
        id = leaf8(rows);
      } else {
        const [L, a, b, c, d] = ln.split(/\s+/).map(Number);
        const k = (i) => (i === 0 ? this.empty(L - 1) : nodes[i]);
        id = this.join(k(a), k(b), k(c), k(d));
      }
      nodes.push(id); last = id;
    }
    let root = last;
    while (this.lv[root] < 3) root = this.expand(root);
    return { root, rule };
  }

  // Exact bounding box via memoised extreme searches.
  bbox(root) {
    if (this.pop[root] === 0) return null;
    const ext = (pick, combine) => {
      const memo = new Map();
      const f = (n) => {
        if (this.pop[n] === 0) return Infinity;
        if (this.lv[n] === 0) return 0;
        let v = memo.get(n); if (v !== undefined) return v;
        v = pick(n, f, 2 ** (this.lv[n] - 1));
        memo.set(n, v); return v;
      };
      return f(root);
    };
    const minX = ext((n, f, h) => { const l = Math.min(f(this.nw[n]), f(this.sw[n])); return l < Infinity ? l : h + Math.min(f(this.ne[n]), f(this.se[n])); });
    const minY = ext((n, f, h) => { const t = Math.min(f(this.nw[n]), f(this.ne[n])); return t < Infinity ? t : h + Math.min(f(this.sw[n]), f(this.se[n])); });
    // max: distance from far edge
    const maxXd = ext((n, f, h) => { const r = Math.min(f(this.ne[n]), f(this.se[n])); return r < Infinity ? r : h + Math.min(f(this.nw[n]), f(this.sw[n])); });
    const maxYd = ext((n, f, h) => { const b = Math.min(f(this.sw[n]), f(this.se[n])); return b < Infinity ? b : h + Math.min(f(this.nw[n]), f(this.ne[n])); });
    const H = 2 ** (this.lv[root] - 1);
    return { x0: minX - H, y0: minY - H, x1: H - 1 - maxXd, y1: H - 1 - maxYd };
  }

  // List live cells (absolute coords). Stops after `limit` cells.
  cells(root, limit = 1e6) {
    const out = [], H = 2 ** (this.lv[root] - 1);
    const walk = (n, x, y) => {
      if (this.pop[n] === 0 || out.length >= limit) return;
      if (this.lv[n] === 0) { out.push([x - H, y - H]); return; }
      const s = 2 ** (this.lv[n] - 1);
      walk(this.nw[n], x, y); walk(this.ne[n], x + s, y); walk(this.sw[n], x, y + s); walk(this.se[n], x + s, y + s);
    };
    walk(root, 0, 0);
    return out;
  }

  // Compact memory, keeping only nodes reachable from `roots`. Returns remapped roots.
  gc(roots) {
    const mark = new Uint8Array(this.count); mark[0] = mark[1] = 1;
    const stack = roots.filter((r) => r >= 0);
    while (stack.length) {
      const n = stack.pop();
      if (mark[n]) continue;
      mark[n] = 1;
      stack.push(this.nw[n], this.ne[n], this.sw[n], this.se[n]);
    }
    const map = new Int32Array(this.count).fill(-1); map[0] = 0; map[1] = 1;
    let k = 2;
    for (let i = 2; i < this.count; i++) {
      if (!mark[i]) continue;
      map[i] = k;
      this.nw[k] = map[this.nw[i]]; this.ne[k] = map[this.ne[i]]; this.sw[k] = map[this.sw[i]]; this.se[k] = map[this.se[i]];
      this.lv[k] = this.lv[i]; this.pop[k] = this.pop[i];
      k++;
    }
    this.count = k;
    this.res.fill(-1);
    this.emptyCache = [0];
    this.rehash(Math.max(17, Math.ceil(Math.log2(k * 2 + 1)) + 1));
    return roots.map((r) => (r >= 0 ? map[r] : r));
  }
}

// RLE / plaintext parsing and writing
const PatternIO = {
  parse(text) {
    text = String(text).replace(/\r/g, '');
    const lines = text.split('\n');
    const meta = { name: '', comments: [], rule: null };
    const isRLE = /(^|\n)\s*x\s*=/.test(text) || /^[\s0-9bo$!.A-Za-z]*!\s*$/m.test(text.replace(/^#.*$/gm, '').trim()) && /[0-9]*[bo$]/.test(text);
    const cells = [];
    if (isRLE) {
      let body = '';
      for (const ln of lines) {
        const t = ln.trim();
        if (t.startsWith('#')) {
          const tag = t.slice(0, 2), rest = t.slice(2).trim();
          if (tag === '#N') meta.name = rest; else if (tag === '#C' || tag === '#c') meta.comments.push(rest); else if (tag === '#O') meta.author = rest;
          continue;
        }
        if (/^x\s*=/.test(t)) {
          const m = t.match(/rule\s*=\s*([^,\s]+)/i); if (m) meta.rule = m[1];
          continue;
        }
        body += t;
      }
      let x = 0, y = 0, num = '';
      for (const ch of body) {
        if (ch >= '0' && ch <= '9') { num += ch; continue; }
        const n = num ? parseInt(num, 10) : 1; num = '';
        if (ch === 'b' || ch === '.') x += n;
        else if (ch === '$') { y += n; x = 0; }
        else if (ch === '!') break;
        else if (/[A-Za-z]/.test(ch)) { for (let i = 0; i < n; i++) cells.push([x + i, y]); x += n; }
      }
    } else {
      let y = 0;
      for (const ln of lines) {
        if (ln.startsWith('!')) { const r = ln.slice(1).trim(); if (/^Name:/i.test(r)) meta.name = r.replace(/^Name:\s*/i, ''); else if (r) meta.comments.push(r); continue; }
        if (!ln.trim() && !cells.length) continue;
        for (let x = 0; x < ln.length; x++) if (ln[x] === 'O' || ln[x] === 'o' || ln[x] === '*' || ln[x] === 'X') cells.push([x, y]);
        y++;
      }
    }
    return { cells, meta };
  },

  write(cells, rule, name) {
    if (!cells.length) return 'x = 0, y = 0, rule = ' + rule + '\n!';
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of cells) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
    const rows = new Map();
    for (const [x, y] of cells) { const r = rows.get(y) || []; r.push(x); rows.set(y, r); }
    let out = '', line = '';
    const emit = (tok) => { if (line.length + tok.length > 70) { out += line + '\n'; line = ''; } line += tok; };
    const run = (n, c) => (n > 1 ? n : '') + c;
    let pendingRows = 0;
    for (let y = y0; y <= y1; y++) {
      const r = rows.get(y);
      if (!r) { pendingRows++; continue; }
      if (y > y0) emit(run(pendingRows + 1, '$'));
      pendingRows = 0;
      r.sort((a, b) => a - b);
      let cx = x0, i = 0;
      while (i < r.length) {
        let j = i; while (j + 1 < r.length && r[j + 1] === r[j] + 1) j++;
        if (r[i] > cx) emit(run(r[i] - cx, 'b'));
        emit(run(j - i + 1, 'o'));
        cx = r[j] + 1; i = j + 1;
      }
    }
    emit('!');
    out += line;
    return (name ? '#N ' + name + '\n' : '') + `x = ${x1 - x0 + 1}, y = ${y1 - y0 + 1}, rule = ${rule}\n` + out;
  },
};

if (typeof module !== 'undefined') module.exports = { HashLife, PatternIO };
