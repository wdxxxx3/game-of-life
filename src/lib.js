(() => {
const $ = (id) => document.getElementById(id);
const app = window.LifeApp;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (n) => (n < 1e15 ? Math.round(n).toLocaleString('zh-CN') : n.toExponential(2));

const CATS = [
  ['all', '全部', ''],
  ['still', '静物', '永远不变的图样，是生命游戏里的“岩石”。很多机器靠它们吃掉多余的滑翔机。'],
  ['osc', '振荡器', '每隔固定的代数（周期）回到原样。已知的周期从 2 一直到一千多亿。'],
  ['ship', '飞船', '过一个周期后形状复原，但整体挪了位置。速度用光速 c 来衡量，c 指每代移动一格：滑翔机是 c/4，轻量级飞船是 c/2。'],
  ['meth', '长寿者', 'Methuselah：起初只有寥寥几个细胞，却要折腾成百上千代才安定下来。名字来自圣经里活了 969 岁的玛土撒拉。'],
  ['gun', '枪', '定期射出飞船的振荡器。1970 年高斯帕滑翔机枪的发现，回答了康威“有限的图样能否无限增长”的悬赏问题。'],
  ['puffer', '喷烟者与耙', '边走边留下残骸的东西叫喷烟者；只留下飞船的那种，叫耙。'],
  ['breeder', '繁殖者与增长', '人口不止线性增长，而是按平方增长：会造枪的喷烟者，或会不断扩张的结构。'],
  ['circuit', '信号与计算', '把滑翔机当作比特，用反射器和食者搭出逻辑门、存储器，甚至一台图灵机。生命游戏是图灵完备的：任何能算的东西，它都能算。'],
  ['synth', '滑翔机合成', '只靠滑翔机相撞，几乎能造出任何东西。这一类给出具体的“配方”。'],
  ['misc', '奇观', '素数筛、无限旅馆、锯齿增长……各种难以归类的奇妙装置。'],
  ['giant', '巨型构造', '要跑几百万甚至几十亿代才看得出门道，正是 HashLife 的用武之地。载入并运行时会自动把速度调到每帧 2^8 代。'],
  ['rules', '其他规则', '不是康威的 B3/S23，而是 HighLife、昼与夜、Morley 等“类生命”规则下的图样。载入时会自动切换规则。'],
];
const CAT_NAME = Object.fromEntries(CATS.map((c) => [c[0], c[1]]));

let data = null, cur = 'all', sel = null, loading = null;
const lib = $('lib');

// ---------- rendering a quadtree into a small canvas ----------
const th = new HashLife();
const BG = [8, 11, 15], CELL = [242, 192, 99];
function paint(canvas, hlI, root, view, maxZ = 12) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = Math.max(1, Math.round(canvas.clientWidth * dpr)), H = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== W) canvas.width = W; if (canvas.height !== H) canvas.height = H;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(W, H), buf = new Uint32Array(img.data.buffer);
  buf.fill((255 << 24) | (BG[2] << 16) | (BG[1] << 8) | BG[0]);
  const b = view || hlI.bbox(root);
  if (b) {
    const w = b.x1 - b.x0 + (view ? 0 : 1), h = b.y1 - b.y0 + (view ? 0 : 1);
    const z = Math.min(Math.min(W / w, H / h) * (view ? 1 : 0.86), maxZ * dpr);
    const vx0 = b.x0 + w / 2 - W / 2 / z, vy0 = b.y0 + h / 2 - H / 2 / z, vx1 = vx0 + W / z, vy1 = vy0 + H / z;
    const gap = z >= 5 ? 1 : 0;
    const NW = hlI.nw, NE = hlI.ne, SW = hlI.sw, SE = hlI.se, POP = hlI.pop, LV = hlI.lv;
    const walk = (n, x, y, s) => {
      if (POP[n] === 0 || x >= vx1 || y >= vy1 || x + s <= vx0 || y + s <= vy0) return;
      if (LV[n] === 0 || s * z <= 1) {
        let sx0 = Math.max(0, Math.floor((x - vx0) * z)), sy0 = Math.max(0, Math.floor((y - vy0) * z));
        let sx1 = Math.min(W, Math.max(sx0 + 1, Math.floor((x + s - vx0) * z) - gap)), sy1 = Math.min(H, Math.max(sy0 + 1, Math.floor((y + s - vy0) * z) - gap));
        const a = Math.min(1, 0.55 + (POP[n] / (s * s)) * 2);
        const c = (255 << 24) | (((BG[2] + (CELL[2] - BG[2]) * a) | 0) << 16) | (((BG[1] + (CELL[1] - BG[1]) * a) | 0) << 8) | ((BG[0] + (CELL[0] - BG[0]) * a) | 0);
        for (let yy = sy0; yy < sy1; yy++) { const o = yy * W; for (let xx = sx0; xx < sx1; xx++) buf[o + xx] = c; }
        return;
      }
      const hh = s / 2;
      walk(NW[n], x, y, hh); walk(NE[n], x + hh, y, hh); walk(SW[n], x, y + hh, hh); walk(SE[n], x + hh, y + hh, hh);
    };
    const half = 2 ** (LV[root] - 1);
    walk(root, -half, -half, 2 * half);
  }
  ctx.putImageData(img, 0, 0);
}
function buildRoot(hlI, e) {
  if (e.fmt === 'mc') return hlI.fromMacrocell(e.data).root;
  return hlI.fromCells(PatternIO.parse(e.data).cells);
}

// ---------- thumbnails, drawn lazily as cards scroll into view ----------
const queue = [];
let pumping = false;
function pump() {
  if (pumping) return; pumping = true;
  const step = () => {
    const t0 = performance.now();
    while (queue.length && performance.now() - t0 < 30) {
      const { e, canvas } = queue.shift();
      if (canvas.dataset.done) continue;
      try { paint(canvas, th, buildRoot(th, e)); } catch (_) { /* leave blank */ }
      canvas.dataset.done = '1';
      if (th.count > 1500000) th.gc([]);
    }
    if (queue.length) setTimeout(step, 0); else pumping = false;
  };
  setTimeout(step, 0);
}
const io = 'IntersectionObserver' in window ? new IntersectionObserver((ents) => {
  for (const en of ents) if (en.isIntersecting) { io.unobserve(en.target); queue.push({ e: en.target._entry, canvas: en.target }); }
  pump();
}, { root: $('libList'), rootMargin: '300px' }) : null;

// ---------- list ----------
function sizeText(e) { return `${fmt(e.w)}×${fmt(e.h)} · ${fmt(e.pop)} 细胞`; }
function buildList() {
  const grid = $('libGrid'); grid.innerHTML = '';
  for (const e of data) {
    const b = document.createElement('button');
    b.className = 'card'; b.type = 'button';
    b.innerHTML = `<canvas aria-hidden="true"></canvas><span class="meta"><b>${esc(e.name)}</b><i>${esc(sizeText(e))}${e.rule !== 'B3/S23' ? ' · ' + esc(e.rule) : ''}</i></span>`;
    b.onclick = () => select(e);
    e.el = b;
    const c = b.querySelector('canvas'); c._entry = e;
    grid.appendChild(b);
    if (io) io.observe(c); else queue.push({ e, canvas: c });
  }
  const empty = document.createElement('p'); empty.id = 'libEmpty'; empty.textContent = '没有找到匹配的图样。'; empty.hidden = true;
  grid.appendChild(empty);
  const counts = {}; data.forEach((e) => (counts[e.cat] = (counts[e.cat] || 0) + 1)); counts.all = data.length;
  const nav = $('libCats'); nav.innerHTML = '';
  for (const [k, name] of CATS) {
    if (!counts[k]) continue;
    const b = document.createElement('button'); b.type = 'button'; b.dataset.cat = k;
    b.innerHTML = `${name} <small>${counts[k]}</small>`;
    b.onclick = () => { cur = k; filter(); $('libList').scrollTop = 0; };
    nav.appendChild(b);
  }
  $('libCount').textContent = data.length + ' 个';
  pump();
  filter();
  if (innerWidth > 860 && !sel) select(data[0]);
}
function filter() {
  const q = $('libSearch').value.trim().toLowerCase();
  let shown = 0;
  for (const e of data) {
    const okCat = cur === 'all' || e.cat === cur;
    const okQ = !q || (e.name + ' ' + e.en + ' ' + e.note + ' ' + e.rule + ' ' + CAT_NAME[e.cat]).toLowerCase().includes(q);
    e.el.hidden = !(okCat && okQ); if (!e.el.hidden) shown++;
  }
  $('libEmpty').hidden = shown > 0;
  document.querySelectorAll('#libCats button').forEach((b) => b.classList.toggle('on', b.dataset.cat === cur));
  const c = CATS.find((x) => x[0] === cur);
  $('libIntro').textContent = c ? c[2] : '';
}
$('libSearch').addEventListener('input', filter);

// ---------- detail + live preview ----------
const pv = new HashLife();
let pvTimer = 0, pvRoot = -1, pvGen = 0, pvView = null, pvJ = 0;
function stopPreview() { clearTimeout(pvTimer); pvTimer = 0; }
function select(e) {
  sel = e;
  data.forEach((x) => x.el.classList.toggle('sel', x === e));
  lib.classList.add('detail');
  const d = $('libDetail');
  const giant = e.cat === 'giant';
  d.innerHTML = `
    <button class="ghost back" type="button" id="libBack">← 返回列表</button>
    <div id="pvWrap"><canvas id="pv" aria-label="动态预览"></canvas><span id="pvGen"></span></div>
    <div><h3>${esc(e.name)}</h3><div class="en">${esc(e.en)}</div></div>
    ${e.note ? `<p class="note">${esc(e.note)}</p>` : ''}
    <div class="actions">
      <button class="primary" type="button" id="libRun"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l12-7.5z"/></svg>载入并运行</button>
      <button class="ghost" type="button" id="libLoad">只载入</button>
    </div>
    <dl>
      <dt>分类</dt><dd>${esc(CAT_NAME[e.cat])}</dd>
      <dt>规则</dt><dd>${esc(e.rule)}</dd>
      <dt>尺寸</dt><dd>${fmt(e.w)} × ${fmt(e.h)}</dd>
      <dt>细胞</dt><dd>${fmt(e.pop)}</dd>
      <dt>来源</dt><dd>${esc(e.src)}</dd>
    </dl>
    ${e.comments ? `<details><summary>原始注释（英文）</summary><pre>${esc(e.comments)}</pre></details>` : ''}
  `;
  $('libBack').onclick = () => { lib.classList.remove('detail'); stopPreview(); };
  $('libLoad').onclick = () => load(e, false);
  $('libRun').onclick = () => load(e, true);
  // live preview
  stopPreview();
  pv.setRule(e.rule);
  if (pv.count > 1000000) pv.gc([]);
  try { pvRoot = buildRoot(pv, e); } catch (_) { pvRoot = -1; return; }
  pvGen = 0;
  const pad = (b) => { const w = b.x1 - b.x0 + 1, h = b.y1 - b.y0 + 1, W = Math.max(w * 1.25, 16), H = Math.max(h * 1.25, 12), cx = b.x0 + w / 2, cy = b.y0 + h / 2; return { x0: cx - W / 2, x1: cx + W / 2, y0: cy - H / 2, y1: cy + H / 2 }; };
  pvView = pad(pv.bbox(pvRoot));
  const span = Math.max(e.w, e.h);
  pvJ = giant ? Math.max(4, Math.min(12, Math.round(Math.log2(span)) - 4)) : span > 400 ? 2 : 0;
  const follow = e.cat === 'ship';
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ticks = 0;
  const tick = () => {
    const c = $('pv'); if (!c || lib.hidden) return;
    paint(c, pv, pvRoot, pvView, 16);
    $('pvGen').textContent = '第 ' + fmt(pvGen) + ' 代';
    if (reduce) return;
    const t0 = performance.now();
    pvRoot = pv.advance(pvRoot, pvJ); pvGen += 2 ** pvJ; ticks++;
    if (pv.pop[pvRoot] < 20000 || ticks % 16 === 0) {
      const b = pv.bbox(pvRoot), v = pvView;
      if (b) {
        const vw = v.x1 - v.x0, vh = v.y1 - v.y0, cx = (b.x0 + b.x1 + 1) / 2, cy = (b.y0 + b.y1 + 1) / 2;
        const fits = b.x1 - b.x0 + 1 <= vw * 0.9 && b.y1 - b.y0 + 1 <= vh * 0.9;
        const out = b.x0 < v.x0 || b.x1 + 1 > v.x1 || b.y0 < v.y0 || b.y1 + 1 > v.y1;
        if (follow && fits) pvView = { x0: cx - vw / 2, x1: cx + vw / 2, y0: cy - vh / 2, y1: cy + vh / 2 };
        else if (out) pvView = pad({ x0: Math.min(v.x0, b.x0), y0: Math.min(v.y0, b.y0), x1: Math.max(v.x1, b.x1), y1: Math.max(v.y1, b.y1) });
      }
    }
    if (pv.count > 1500000) { [pvRoot] = pv.gc([pvRoot]); }
    const spent = performance.now() - t0;
    pvTimer = setTimeout(tick, Math.max(16, (follow ? 60 : 80) - spent));
  };
  tick();
}
function load(e, run) {
  stopPreview();
  const ok = e.fmt === 'mc' ? app.loadMacrocell(e.data, e.name, e.rule) : (app.setRule(e.rule, true), app.loadPattern(e.data, e.name));
  if (!ok) return;
  close();
  if (run) { if (e.cat === 'giant') app.setSpeed(14); app.setRunning(true); }
  app.toast('已载入：' + e.name);
}

// ---------- data ----------
let built = false;
function ensure() {
  if (data) return Promise.resolve(data);
  if (!loading) loading = fetch('patterns.json').then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((j) => (data = j.map((e) => ({ ...e, cat: e.cat === 'growth' ? 'breeder' : e.cat }))))
    .catch((err) => { loading = null; throw err; });
  return loading;
}
setTimeout(() => ensure().catch(() => {}), 1500);

// ---------- open / close ----------
function open() {
  window.LifeRead && LifeRead.close();
  lib.hidden = false; $('bMenu').classList.add('on');
  app.openDrawer(false);
  if (!built) ensure().then(() => { if (!built) { built = true; buildList(); } })
    .catch(() => { $('libGrid').innerHTML = '<p id="libEmpty">图样库没有载入成功。请检查网络后重新打开。</p>'; });
  if (sel && lib.classList.contains('detail')) select(sel);
  setTimeout(() => innerWidth > 860 && $('libSearch').focus(), 50);
}
function close() { lib.hidden = true; $('bMenu').classList.remove('on'); stopPreview(); }
$('bMenu').onclick = () => (lib.hidden ? open() : close());
$('libClose').onclick = close;
$('libSearch').addEventListener('keydown', (ev) => { if (ev.key === 'Escape') close(); });
window.LifeLib = { open, close, toggle: () => (lib.hidden ? open() : close()), ensure, paint, buildRoot, load, CAT_NAME };
})();
