(() => {
const $ = (id) => document.getElementById(id);
const hl = new HashLife();

const DEMOS = [
  { name: '高斯帕滑翔机枪', note: '1970 年第一支“枪”，证明人口可以无限增长', rle: 'x = 36, y = 9, rule = B3/S23\n24bo$22bobo$12b2o6b2o12b2o$11bo3bo4b2o12b2o$2o8bo5bo3b2o$2o8bo3bob2o4bobo$10bo5bo7bo$11bo3bo$12b2o!' },
  { name: 'R-五格骨牌', note: '5 个细胞，1103 代后才安定', rle: 'x = 3, y = 3\nb2o$2o$bo!' },
  { name: '橡子 Acorn', note: '7 个细胞，跑 5206 代', rle: 'x = 7, y = 3\nbo$3bo$2o2b3o!' },
  { name: '滑翔机', note: '最小的飞船，每 4 代斜走一格', rle: 'x = 3, y = 3\nbo$2bo$3o!' },
  { name: '轻量级飞船', note: 'LWSS，以 c/2 的速度横行', rle: 'x = 5, y = 4\nbo2bo$o4b$o3bo$4o!' },
  { name: '脉冲星', note: '周期 3 的振荡器', rle: 'x = 13, y = 13\n2b3o3b3o2b2$o4bobo4bo$o4bobo4bo$o4bobo4bo$2b3o3b3o2b2$2b3o3b3o2b$o4bobo4bo$o4bobo4bo$o4bobo4bo2$2b3o3b3o!' },
  { name: '十五项', note: 'Pentadecathlon，周期 15', rle: 'x = 10, y = 3\n2bo4bo2b$2ob4ob2o$2bo4bo!' },
  { name: '顽固者 Diehard', note: '130 代后全部消失', rle: 'x = 8, y = 3\n6bob$2o6b$bo3b3o!' },
  { name: 'π 七格骨牌', note: '7 个细胞，约 170 代后归于平静', rle: 'x = 3, y = 3\n3o$obo$obo!' },
  { name: '单行无限增长', note: '一行 39 格，长成两列繁殖的“开关引擎”', rle: 'x = 39, y = 1\n8ob5o3b3o6b7ob5o!' },
];

const RULES = [
  { name: '生命游戏', rule: 'B3/S23' },
  { name: 'HighLife', rule: 'B36/S23' },
  { name: '昼与夜', rule: 'B3678/S34678' },
  { name: '种子', rule: 'B2/S' },
  { name: '不死生命', rule: 'B3/S012345678' },
  { name: '迷宫', rule: 'B3/S12345' },
  { name: '复制者', rule: 'B1357/S1357' },
  { name: '2x2', rule: 'B36/S125' },
  { name: '变形虫', rule: 'B35678/S5678' },
  { name: 'Morley', rule: 'B368/S245' },
  { name: '珊瑚', rule: 'B3/S45678' },
  { name: '34 生命', rule: 'B34/S34' },
];

const SPEEDS = [1, 2, 4, 8, 15, 30, 60].map((v) => ({ perSec: v, j: 0, label: v + ' 代/秒' }));
for (let j = 1; j <= 30; j++) SPEEDS.push({ j, perFrame: true, label: '每帧 2^' + j });

const S = {
  root: hl.newRoot(), gen: 0, running: false, speed: 4, tool: 'draw',
  history: [], base: -1, baseGen: 0, dirty: true, name: '',
  cx: 0, cy: 0, zoom: 10, // zoom = device pixels per cell
  needsDraw: true, mouse: null,
};

const canvas = $('stage'), ctx = canvas.getContext('2d', { alpha: false });
let W = 0, H = 0, dpr = 1;
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = Math.round(canvas.clientWidth * dpr); H = Math.round(canvas.clientHeight * dpr);
  canvas.width = W; canvas.height = H; S.needsDraw = true;
}
window.addEventListener('resize', resize);

// ---------- toast ----------
let toastT = 0;
function toast(msg, err) {
  const t = $('toast'); t.textContent = msg; t.classList.toggle('err', !!err); t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400);
}

// ---------- state changes ----------
function pushHistory() {
  S.history.push({ root: S.root, gen: S.gen });
  if (S.history.length > 400) S.history.shift();
}
function markBase() { if (S.dirty) { S.base = S.root; S.baseGen = S.gen; S.dirty = false; } }
function stepOnce(j) {
  markBase(); pushHistory();
  S.root = hl.advance(S.root, j); S.gen += 2 ** j; S.needsDraw = true;
  maybeGC();
}
function maybeGC() {
  if (hl.count < 3_000_000) return;
  const roots = [S.root, S.base, ...S.history.map((h) => h.root)];
  const m = hl.gc(roots);
  S.root = m[0]; S.base = m[1]; S.history.forEach((h, i) => (h.root = m[i + 2]));
}
function back() {
  setRunning(false);
  const h = S.history.pop();
  if (!h) { toast('已经没有可以回退的步骤'); return; }
  S.root = h.root; S.gen = h.gen; S.needsDraw = true;
}
function resetToBase() {
  setRunning(false);
  if (S.base < 0) { toast('还没有运行过'); return; }
  pushHistory(); S.root = S.base; S.gen = S.baseGen; S.needsDraw = true;
  toast('回到第 ' + fmt(S.gen) + ' 代');
}
function edited() { S.dirty = true; S.needsDraw = true; }
function setRunning(on) {
  S.running = on; acc = 0;
  $('bPlay').innerHTML = on
    ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg><span class="lbl">暂停</span>'
    : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l12-7.5z"/></svg><span class="lbl">播放</span>';
}
function setSpeed(i) {
  S.speed = Math.max(0, Math.min(SPEEDS.length - 1, i));
  $('speed').value = S.speed; $('speedLbl').textContent = SPEEDS[S.speed].label;
}
function setTool(t) {
  S.tool = t; $('bDraw').classList.toggle('on', t === 'draw'); $('bPan').classList.toggle('on', t === 'pan');
  canvas.classList.toggle('pan', t === 'pan');
}
function setRule(str, quiet) {
  const r = hl.setRule(str);
  if (!r) { toast('看不懂这条规则。请写成 B3/S23 这样的格式', true); return false; }
  if (r.error === 'B0') { toast('暂不支持 B0 规则（空白处会自己诞生细胞）', true); return false; }
  $('ruleIn').value = r.canon; $('sRule').textContent = r.canon;
  document.querySelectorAll('#rules .chip').forEach((c) => c.classList.toggle('on', c.dataset.rule === r.canon));
  if (!quiet) toast('规则已切换为 ' + r.canon);
  S.needsDraw = true;
  return true;
}

function loadPattern(text, nameHint) {
  const { cells, meta } = PatternIO.parse(text);
  if (!cells.length) { toast('没有在文本里找到细胞。请检查 RLE 格式', true); return false; }
  if (meta.rule) { if (!setRule(meta.rule, true)) return false; }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of cells) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const ox = Math.floor((x0 + x1) / 2), oy = Math.floor((y0 + y1) / 2);
  setRunning(false); pushHistory();
  S.root = hl.fromCells(cells.map(([x, y]) => [x - ox, y - oy]));
  S.gen = 0; S.base = -1; S.dirty = true;
  S.name = meta.name || nameHint || '';
  $('sName').textContent = S.name;
  fit();
  return true;
}
function loadMacrocell(text, name, rule) {
  if (rule && !setRule(rule, true)) return false;
  setRunning(false); pushHistory();
  S.root = hl.fromMacrocell(text).root;
  S.gen = 0; S.base = -1; S.dirty = true;
  S.name = name || ''; $('sName').textContent = S.name;
  fit();
  return true;
}

// ---------- view ----------
function fit() {
  const b = hl.bbox(S.root);
  if (!b) { S.cx = 0; S.cy = 0; S.zoom = 10 * dpr; S.needsDraw = true; return; }
  const w = b.x1 - b.x0 + 1, h = b.y1 - b.y0 + 1;
  S.cx = b.x0 + w / 2; S.cy = b.y0 + h / 2;
  const z = Math.min((W * 0.8) / w, (H * 0.62) / h);
  S.zoom = clampZoom(z >= 1 ? Math.min(z, 28 * dpr) : 2 ** Math.floor(Math.log2(z)));
  S.needsDraw = true;
}
const clampZoom = (z) => Math.max(2 ** -50, Math.min(z, 80 * dpr));
function toWorld(px, py) { return [S.cx + (px * dpr - W / 2) / S.zoom, S.cy + (py * dpr - H / 2) / S.zoom]; }
function zoomAt(px, py, f) {
  const [wx, wy] = toWorld(px, py);
  S.zoom = clampZoom(S.zoom * f);
  S.cx = wx - (px * dpr - W / 2) / S.zoom; S.cy = wy - (py * dpr - H / 2) / S.zoom;
  S.needsDraw = true;
}

// ---------- rendering ----------
const BG = [10, 13, 18], CELL = [242, 192, 99];
let img = null, buf = null;
function render() {
  const z = S.zoom, vx0 = S.cx - W / 2 / z, vy0 = S.cy - H / 2 / z, vx1 = S.cx + W / 2 / z, vy1 = S.cy + H / 2 / z;
  const root = S.root, L = hl.lv[root], half = 2 ** (L - 1);
  const NW = hl.nw, NE = hl.ne, SW = hl.sw, SE = hl.se, POP = hl.pop, LV = hl.lv;
  if (z >= 2) {
    ctx.fillStyle = '#0a0d12'; ctx.fillRect(0, 0, W, H);
    if (z >= 6) drawGrid(vx0, vy0, vx1, vy1);
    const gap = z >= 6 ? Math.max(1, z * 0.1) : 0;
    let n = 0;
    ctx.beginPath();
    const walk = (node, x, y, s) => {
      if (POP[node] === 0 || x >= vx1 || y >= vy1 || x + s <= vx0 || y + s <= vy0) return;
      if (LV[node] === 0) { ctx.rect((x - vx0) * z + gap / 2, (y - vy0) * z + gap / 2, z - gap, z - gap); n++; return; }
      const h = s / 2;
      walk(NW[node], x, y, h); walk(NE[node], x + h, y, h); walk(SW[node], x, y + h, h); walk(SE[node], x + h, y + h, h);
    };
    walk(root, -half, -half, 2 * half);
    ctx.fillStyle = '#f2c063';
    if (z >= 8 && n < 4000) { ctx.shadowColor = 'rgba(242,192,99,0.55)'; ctx.shadowBlur = Math.min(14, z * 0.6); }
    ctx.fill(); ctx.shadowBlur = 0;
  } else {
    if (!img || img.width !== W || img.height !== H) { img = ctx.createImageData(W, H); buf = new Uint32Array(img.data.buffer); }
    const bg = (255 << 24) | (BG[2] << 16) | (BG[1] << 8) | BG[0];
    buf.fill(bg);
    const plot = (sx0, sy0, sx1, sy1, d) => {
      sx0 = Math.max(0, Math.floor(sx0)); sy0 = Math.max(0, Math.floor(sy0));
      sx1 = Math.min(W, Math.max(sx0 + 1, Math.floor(sx1))); sy1 = Math.min(H, Math.max(sy0 + 1, Math.floor(sy1)));
      const a = Math.min(1, 0.6 + d * 2);
      const r = BG[0] + (CELL[0] - BG[0]) * a, g = BG[1] + (CELL[1] - BG[1]) * a, b = BG[2] + (CELL[2] - BG[2]) * a;
      const c = (255 << 24) | ((b | 0) << 16) | ((g | 0) << 8) | (r | 0);
      for (let yy = sy0; yy < sy1; yy++) { const o = yy * W; for (let xx = sx0; xx < sx1; xx++) buf[o + xx] = c; }
    };
    const walk = (node, x, y, s) => {
      if (POP[node] === 0 || x >= vx1 || y >= vy1 || x + s <= vx0 || y + s <= vy0) return;
      if (LV[node] === 0 || s * z <= 1) { plot((x - vx0) * z, (y - vy0) * z, (x + s - vx0) * z, (y + s - vy0) * z, POP[node] / (s * s)); return; }
      const h = s / 2;
      walk(NW[node], x, y, h); walk(NE[node], x + h, y, h); walk(SW[node], x, y + h, h); walk(SE[node], x + h, y + h, h);
    };
    walk(root, -half, -half, 2 * half);
    ctx.putImageData(img, 0, 0);
  }
}
function drawGrid(vx0, vy0, vx1, vy1) {
  const z = S.zoom;
  const minor = new Path2D(), major = new Path2D();
  for (let x = Math.floor(vx0); x <= vx1; x++) { const sx = Math.round((x - vx0) * z) + 0.5; (x % 10 === 0 ? major : minor).rect(sx, 0, 0, H); }
  for (let y = Math.floor(vy0); y <= vy1; y++) { const sy = Math.round((y - vy0) * z) + 0.5; (y % 10 === 0 ? major : minor).rect(0, sy, W, 0); }
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(150,170,200,0.06)'; ctx.stroke(minor);
  ctx.strokeStyle = 'rgba(150,170,200,0.14)'; ctx.stroke(major);
}

// ---------- stats ----------
const fmt = (n) => (n < 1e15 ? Math.round(n).toLocaleString('zh-CN') : n.toExponential(3));
let lastStats = 0;
function stats(t) {
  if (t - lastStats < 90) return; lastStats = t;
  $('sGen').textContent = fmt(S.gen);
  $('sPop').textContent = fmt(hl.pop[S.root]);
  const cellPx = S.zoom / dpr;
  $('sZoom').textContent = cellPx >= 1 ? '1 格 = ' + (+cellPx.toFixed(1)) + ' 像素' : '1 像素 = ' + fmt(1 / cellPx) + ' 格';
  if (S.mouse) { const [x, y] = toWorld(S.mouse[0], S.mouse[1]); $('sPos').textContent = Math.floor(x) + ', ' + Math.floor(y); }
}

// ---------- main loop ----------
let acc = 0, lastT = 0;
function frame(t) {
  const dt = Math.min(0.25, (t - (lastT || t)) / 1000); lastT = t;
  if (S.running) {
    const sp = SPEEDS[S.speed];
    if (sp.perFrame) stepOnce(sp.j);
    else {
      acc += dt * sp.perSec;
      let n = Math.min(4, Math.floor(acc)); acc -= n;
      while (n-- > 0) stepOnce(0);
    }
  }
  if (S.needsDraw) { render(); S.needsDraw = false; }
  stats(t);
  requestAnimationFrame(frame);
}

// ---------- pointer input ----------
const pointers = new Map();
let gesture = null; // {type:'draw'|'pan'|'pinch', ...}
function cellAt(px, py) { const [x, y] = toWorld(px, py); return [Math.floor(x), Math.floor(y)]; }
function paintLine(a, b, v) {
  let [x0, y0] = a; const [x1, y1] = b;
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, guard = 0;
  while (guard++ < 20000) {
    S.root = hl.setCell(S.root, x0, y0, v);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
  edited();
}
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, [e.offsetX, e.offsetY]);
  if (pointers.size === 2) {
    const [p, q] = [...pointers.values()];
    gesture = { type: 'pinch', d: Math.hypot(p[0] - q[0], p[1] - q[1]), m: [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2] };
    return;
  }
  if (pointers.size > 2) return;
  const panBtn = e.button === 1 || e.button === 2 || S.tool === 'pan';
  if (panBtn) { gesture = { type: 'pan', last: [e.offsetX, e.offsetY] }; canvas.classList.add('panning'); return; }
  if (S.zoom < 1) { toast('放大一些才能绘制单个细胞'); gesture = { type: 'pan', last: [e.offsetX, e.offsetY] }; return; }
  const c = cellAt(e.offsetX, e.offsetY);
  const v = hl.getCell(S.root, c[0], c[1]) ? 0 : 1;
  pushHistory();
  gesture = { type: 'draw', last: c, v };
  paintLine(c, c, v);
});
canvas.addEventListener('pointermove', (e) => {
  S.mouse = [e.offsetX, e.offsetY];
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, [e.offsetX, e.offsetY]);
  if (!gesture) return;
  if (gesture.type === 'pinch' && pointers.size >= 2) {
    const [p, q] = [...pointers.values()];
    const d = Math.hypot(p[0] - q[0], p[1] - q[1]), m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    S.cx -= ((m[0] - gesture.m[0]) * dpr) / S.zoom; S.cy -= ((m[1] - gesture.m[1]) * dpr) / S.zoom;
    if (gesture.d > 0) zoomAt(m[0], m[1], d / gesture.d);
    gesture.d = d; gesture.m = m; S.needsDraw = true;
  } else if (gesture.type === 'pan') {
    S.cx -= ((e.offsetX - gesture.last[0]) * dpr) / S.zoom; S.cy -= ((e.offsetY - gesture.last[1]) * dpr) / S.zoom;
    gesture.last = [e.offsetX, e.offsetY]; S.needsDraw = true;
  } else if (gesture.type === 'draw') {
    const c = cellAt(e.offsetX, e.offsetY);
    if (c[0] !== gesture.last[0] || c[1] !== gesture.last[1]) { paintLine(gesture.last, c, gesture.v); gesture.last = c; }
  }
});
const endPointer = (e) => {
  pointers.delete(e.pointerId);
  if (pointers.size === 0) { gesture = null; canvas.classList.remove('panning'); }
  else if (gesture && gesture.type === 'pinch') { const [p] = [...pointers.values()]; gesture = { type: 'pan', last: p }; }
};
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('pointerleave', () => { S.mouse = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const k = e.ctrlKey ? 0.01 : 0.0018;
  zoomAt(e.offsetX, e.offsetY, Math.exp(-e.deltaY * k));
}, { passive: false });

// ---------- controls ----------
$('bPlay').onclick = () => setRunning(!S.running);
$('bStep').onclick = () => { setRunning(false); stepOnce(SPEEDS[S.speed].j); };
$('bBack').onclick = back;
$('bReset').onclick = resetToBase;
$('speed').oninput = (e) => setSpeed(+e.target.value);
$('bDraw').onclick = () => setTool('draw');
$('bPan').onclick = () => setTool('pan');
$('bFit').onclick = fit;
const drawer = $('drawer');
const openDrawer = (on) => { if (on) { window.LifeLib && LifeLib.close(); window.LifeRead && LifeRead.close(); } drawer.hidden = !on; $('bSettings').classList.toggle('on', on); document.body.classList.toggle('drawer-open', on); };
$('bSettings').onclick = () => openDrawer(drawer.hidden);
$('bClose').onclick = () => openDrawer(false);
$('bLoad').onclick = () => { if (loadPattern($('rleIn').value)) toast('已载入'); };
$('bCopy').onclick = () => {
  const pop = hl.pop[S.root];
  if (pop === 0) { toast('画面是空的'); return; }
  if (pop > 400000) { toast('图样太大（超过 40 万个细胞），无法导出', true); return; }
  const text = PatternIO.write(hl.cells(S.root), hl.rule.canon, S.name);
  $('rleIn').value = text;
  const done = () => toast('RLE 已复制到剪贴板');
  const fail = () => { $('rleIn').select(); toast('已放进上面的文本框，请手动复制'); };
  try { navigator.clipboard.writeText(text).then(done, fail); } catch (_) { fail(); }
};
$('bRule').onclick = () => setRule($('ruleIn').value);
$('ruleIn').addEventListener('keydown', (e) => { if (e.key === 'Enter') setRule(e.target.value); });
$('bClear').onclick = () => { setRunning(false); pushHistory(); S.root = hl.newRoot(); S.gen = 0; S.base = -1; S.name = ''; $('sName').textContent = ''; edited(); };
$('bSoup').onclick = () => {
  pushHistory();
  const vw = W / S.zoom, vh = H / S.zoom;
  const w = Math.max(16, Math.min(320, Math.floor(vw * 0.6))), h = Math.max(16, Math.min(320, Math.floor(vh * 0.6)));
  const x0 = Math.floor(S.cx - w / 2), y0 = Math.floor(S.cy - h / 2);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (Math.random() < 0.35) S.root = hl.setCell(S.root, x0 + x, y0 + y, 1);
  edited(); toast(`随机撒了 ${w}×${h} 的一片，密度 35%`);
};

for (const r of RULES) {
  const b = document.createElement('button');
  b.className = 'chip'; b.dataset.rule = r.rule;
  b.innerHTML = `${r.name}<small>${r.rule}</small>`;
  b.onclick = () => setRule(r.rule);
  $('rules').appendChild(b);
}

window.addEventListener('paste', (e) => {
  if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
  const text = e.clipboardData && e.clipboardData.getData('text');
  if (text && loadPattern(text)) toast('已从剪贴板载入');
});
window.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); back(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (k === ' ') { e.preventDefault(); setRunning(!S.running); }
  else if (k === 'n') { setRunning(false); stepOnce(SPEEDS[S.speed].j); }
  else if (k === 'r') resetToBase();
  else if (k === 'f') fit();
  else if (k === 'd') setTool('draw');
  else if (k === 'm' || k === 'h') setTool('pan');
  else if (k === '[') setSpeed(S.speed - 1);
  else if (k === ']') setSpeed(S.speed + 1);
  else if (k === '=' || k === '+') zoomAt(canvas.clientWidth / 2, canvas.clientHeight / 2, 1.5);
  else if (k === '-') zoomAt(canvas.clientWidth / 2, canvas.clientHeight / 2, 1 / 1.5);
  else if (k === 'escape') { openDrawer(false); window.LifeLib && LifeLib.close(); window.LifeRead && LifeRead.close(); }
  else if (k === 'b') window.LifeRead && LifeRead.toggle();
  else if (k === 'l') window.LifeLib && LifeLib.toggle();
});

// ---------- boot ----------
resize();
setTool('draw'); setSpeed(4); setRule('B3/S23', true);
loadPattern(DEMOS[0].rle, DEMOS[0].name);
const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
setRunning(!reduce);
requestAnimationFrame(frame);
window.__life = { S, hl };
window.LifeApp = { S, hl, setSpeed, setRule, loadPattern, loadMacrocell, setRunning, toast, openDrawer, dpr: () => dpr };
})();
