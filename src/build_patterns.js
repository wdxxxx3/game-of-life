const fs = require('fs');
const {HashLife, PatternIO} = require('./engine.js');
const raw = JSON.parse(fs.readFileSync('../golly_raw.json'));
const ZH = require('./golly_zh.js'), C = require('./classics.js');
const hl = new HashLife();
function parseLif(t) {
  const cells = []; let bx = 0, by = 0, y = 0, rule = null;
  for (const ln of t.replace(/\r/g,'').split('\n')) {
    if (ln.startsWith('#P')) { const m = ln.trim().split(/\s+/); bx = +(m[1]||0); by = +(m[2]||0); y = 0; continue; }
    if (ln.startsWith('#R')) { rule = ln.slice(2).trim(); continue; }
    if (ln.startsWith('#')) continue;
    for (let x = 0; x < ln.length; x++) if (ln[x] === '*') cells.push([bx + x, by + y]);
    y++;
  }
  return { cells, rule };
}
const out = []; const skipped = [];
let n = 0;
for (const c of C) {
  const cells = PatternIO.parse(c.rle).cells, r = hl.fromCells(cells), b = hl.bbox(r);
  out.push({ id: 'c' + (n++), cat: c.cat, name: c.name, en: c.en, note: c.desc, rule: 'B3/S23', fmt: 'rle', data: PatternIO.write(cells, 'B3/S23'), w: b.x1-b.x0+1, h: b.y1-b.y0+1, pop: cells.length, src: '经典' });
}
for (const o of raw) {
  const key = o.path.replace(/\.gz$/, '');
  const z = ZH[key]; if (!z) { skipped.push(key); continue; }
  let rule = o.rule || 'B3/S23', data, fmt, root;
  if (o.ext === 'mc') { const m = hl.fromMacrocell(o.text); root = m.root; fmt = 'mc'; data = o.text; rule = m.rule || 'B3/S23'; }
  else if (o.ext === 'lif') { const p = parseLif(o.text); rule = p.rule || 'B3/S23'; root = hl.fromCells(p.cells); fmt = 'rle'; data = PatternIO.write(p.cells, HashLife.parseRule(rule).canon); }
  else { const p = PatternIO.parse(o.text); root = hl.fromCells(p.cells); fmt = 'rle'; data = o.text; }
  const pr = HashLife.parseRule(rule);
  if (!pr || pr.error) { skipped.push(key + ' (rule ' + rule + ')'); continue; }
  const b = hl.bbox(root);
  const comments = o.comments.filter((x, i) => !(i === 0 && /\.(rle|mc|lif)(\.gz)?$/.test(x)) && !/^XRLE/.test(x));
  out.push({ id: 'g' + (n++), cat: z[0], name: z[1], en: o.file.replace(/\.(rle|mc|lif)$/, '').replace(/[-_]/g, ' '), note: z[2], rule: pr.canon, fmt, data, w: b.x1-b.x0+1, h: b.y1-b.y0+1, pop: hl.pop[root], src: 'Golly 4.3 · ' + key, comments: comments.join('\n').trim() });
  if (hl.count > 2e6) hl.gc([]);
}
fs.writeFileSync('patterns.json', JSON.stringify(out));
const cats = {}; out.forEach(o => cats[o.cat] = (cats[o.cat]||0)+1);
console.log(out.length, cats, 'bytes', fs.statSync('patterns.json').size);
console.log('skipped', skipped);
