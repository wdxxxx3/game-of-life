(() => {
const $ = (id) => document.getElementById(id);
const app = window.LifeApp, L = window.LifeLib;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const panel = $('read');
let curId = null, sims = [];
const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- table of contents ----------
function buildToc() {
  const nav = $('readToc');
  const item = (id, kicker, title) => `<button type="button" data-id="${id}"><small>${esc(kicker)}</small><span>${esc(title)}</span></button>`;
  nav.innerHTML = `<h3>文章</h3>${ESSAYS.map((e) => item(e.id, e.kicker, e.title)).join('')}<h3>资料</h3>${item('books', BOOKS.length + ' 本', '书单与论文')}${item('links', LINKS.length + ' 个', '网上资源')}`;
  nav.querySelectorAll('button').forEach((b) => (b.onclick = () => show(b.dataset.id)));
}

// ---------- live figures ----------
function makeSim(fig, spec) {
  const hl = new HashLife();
  const canvas = fig.querySelector('canvas'), label = fig.querySelector('.gen');
  let root = -1, gen = 0, view = null, j = 0, timer = 0, visible = false, ticks = 0, follow = false, entry = null;
  const pad = (b) => { const w = b.x1 - b.x0 + 1, h = b.y1 - b.y0 + 1, W = Math.max(w * 1.2, 20), H = Math.max(h * 1.2, 12), cx = b.x0 + w / 2, cy = b.y0 + h / 2; return { x0: cx - W / 2, x1: cx + W / 2, y0: cy - H / 2, y1: cy + H / 2 }; };
  function seed() {
    gen = 0; ticks = 0;
    if (spec.soup) {
      hl.setRule(spec.soup);
      const cells = [];
      for (let y = 0; y < 40; y++) for (let x = 0; x < 64; x++) if (Math.random() < 0.38) cells.push([x - 32, y - 20]);
      root = hl.fromCells(cells); view = { x0: -48, x1: 48, y0: -30, y1: 30 }; j = 0;
    } else {
      entry = spec.entry; hl.setRule(entry.rule);
      root = L.buildRoot(hl, entry); view = pad(hl.bbox(root));
      const span = Math.max(entry.w, entry.h);
      j = entry.cat === 'giant' ? Math.max(4, Math.min(12, Math.round(Math.log2(span)) - 4)) : span > 400 ? 2 : 0;
      follow = entry.cat === 'ship';
    }
  }
  function frame() {
    L.paint(canvas, hl, root, view, 14);
    label.textContent = '第 ' + gen.toLocaleString('zh-CN') + ' 代';
  }
  function tick() {
    timer = 0;
    if (!visible || panel.hidden) return;
    const t0 = performance.now();
    root = hl.advance(root, j); gen += 2 ** j; ticks++;
    if (!spec.soup && (hl.pop[root] < 20000 || ticks % 16 === 0)) {
      const b = hl.bbox(root), v = view;
      if (b) {
        const vw = v.x1 - v.x0, vh = v.y1 - v.y0, cx = (b.x0 + b.x1 + 1) / 2, cy = (b.y0 + b.y1 + 1) / 2;
        const fits = b.x1 - b.x0 + 1 <= vw * 0.9 && b.y1 - b.y0 + 1 <= vh * 0.9;
        if (follow && fits) view = { x0: cx - vw / 2, x1: cx + vw / 2, y0: cy - vh / 2, y1: cy + vh / 2 };
        else if (b.x0 < v.x0 || b.x1 + 1 > v.x1 || b.y0 < v.y0 || b.y1 + 1 > v.y1) view = pad({ x0: Math.min(v.x0, b.x0), y0: Math.min(v.y0, b.y0), x1: Math.max(v.x1, b.x1), y1: Math.max(v.y1, b.y1) });
      }
    }
    if (hl.count > 1200000) [root] = hl.gc([root]);
    frame();
    // loop: start over when the pattern dies out or after a while
    if (hl.pop[root] === 0 || ticks > (spec.soup ? 900 : 2400)) { timer = setTimeout(() => { seed(); frame(); tick(); }, 1200); return; }
    timer = setTimeout(tick, Math.max(16, (spec.soup ? 70 : 80) - (performance.now() - t0)));
  }
  seed(); frame();
  return {
    setVisible(v) { visible = v; if (v && !timer && !reduce) timer = setTimeout(tick, 200); },
    reseed() { seed(); frame(); },
    stop() { visible = false; clearTimeout(timer); timer = 0; },
    rle() {
      const cells = hl.cells(root, 200000);
      return PatternIO.write(cells, hl.rule.canon);
    },
    get entry() { return entry; }, get rule() { return hl.rule.canon; },
  };
}

const io = 'IntersectionObserver' in window ? new IntersectionObserver((ents) => {
  for (const en of ents) { const s = en.target._sim; if (s) s.setVisible(en.isIntersecting); }
}, { root: $('readBody'), rootMargin: '0px' }) : null;

function stopAll() { sims.forEach((s) => s.stop()); sims = []; if (io) io.disconnect(); }

function mountFigures(data) {
  const byName = new Map();
  data.forEach((e) => { if (!byName.has(e.en)) byName.set(e.en, e); });
  const lower = new Map(data.map((e) => [e.en.toLowerCase(), e]));
  $('readBody').querySelectorAll('figure').forEach((fig) => {
    const name = fig.dataset.p, soup = fig.dataset.soup;
    const entry = name ? byName.get(name) || lower.get(name.toLowerCase()) : null;
    if (name && !entry) { fig.remove(); return; }
    const cap = fig.dataset.cap || (entry ? entry.name : soup);
    fig.innerHTML = `<div class="stage"><canvas aria-label="${esc(cap)}"></canvas><span class="gen"></span></div>
      <figcaption><span>${esc(cap)}</span><span class="acts">${soup ? '<button type="button" class="ghost sm" data-act="reseed">换一片</button>' : ''}<button type="button" class="ghost sm" data-act="open">在画布中打开</button></span></figcaption>`;
    const sim = makeSim(fig, soup ? { soup } : { entry });
    fig._sim = sim; sims.push(sim);
    fig.querySelector('.stage')._sim = sim;
    if (io) io.observe(fig.querySelector('.stage')); else sim.setVisible(true);
    fig.querySelectorAll('button').forEach((b) => (b.onclick = () => {
      if (b.dataset.act === 'reseed') { sim.reseed(); return; }
      if (entry) { close(); L.load(entry, true); }
      else { app.setRule(sim.rule, true); if (app.loadPattern(sim.rle(), '随机汤 · ' + sim.rule)) { close(); app.setRunning(true); } }
    }));
  });
}

// ---------- pages ----------
function show(id) {
  stopAll();
  curId = id;
  panel.classList.add('article');
  $('readToc').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
  const body = $('readBody');
  const back = '<button type="button" class="ghost back" id="readBack">← 目录</button>';
  if (id === 'books') {
    body.innerHTML = `<article>${back}<p class="kicker">书单与论文</p><h1>从哪里读起</h1>
      <p class="lede">按与生命游戏的关系由近到远排列。前五本是核心，读完它们，你就知道这个领域的大部分故事。</p>
      <ol class="books">${BOOKS.map((b) => `<li><div class="bt">${esc(b.t)}</div><div class="bo">${esc(b.o)}</div><div class="ba">${esc(b.a)} · ${esc(b.y)}</div><p>${esc(b.n)}</p></li>`).join('')}</ol></article>`;
  } else if (id === 'links') {
    body.innerHTML = `<article>${back}<p class="kicker">网上资源</p><h1>继续探索</h1>
      <ul class="links">${LINKS.map((l) => `<li><a href="${esc(l.u)}" target="_blank" rel="noopener">${esc(l.t)}</a><span class="url">${esc(l.u)}</span><p>${esc(l.n)}</p></li>`).join('')}</ul></article>`;
  } else {
    const i = ESSAYS.findIndex((e) => e.id === id), e = ESSAYS[i];
    const next = ESSAYS[i + 1];
    body.innerHTML = `<article>${back}<p class="kicker">${esc(e.kicker)}</p><h1>${esc(e.title)}</h1>${e.body}
      ${next ? `<button type="button" class="next" data-id="${next.id}"><small>下一篇</small><span>${esc(next.title)}</span></button>` : '<button type="button" class="next" data-id="books"><small>接下来</small><span>书单与论文</span></button>'}</article>`;
    body.querySelector('.next').onclick = (ev) => show(ev.currentTarget.dataset.id);
    L.ensure().then((d) => { if (curId === id) mountFigures(d); }).catch(() => {
      body.querySelectorAll('figure').forEach((f) => (f.innerHTML = '<p class="hint">图样没有载入成功，请检查网络后重新打开。</p>'));
    });
  }
  $('readBack').onclick = () => { panel.classList.remove('article'); stopAll(); };
  body.scrollTop = 0;
}

function open() {
  window.LifeLib && LifeLib.close();
  app.openDrawer(false);
  panel.hidden = false; $('bRead').classList.add('on');
  if (!$('readToc').children.length) buildToc();
  if (innerWidth > 860 || panel.classList.contains('article')) show(curId || ESSAYS[0].id);
}
function close() { panel.hidden = true; $('bRead').classList.remove('on'); stopAll(); }
$('bRead').onclick = () => (panel.hidden ? open() : close());
$('readClose').onclick = close;
window.LifeRead = { open, close, toggle: () => (panel.hidden ? open() : close()) };
})();
