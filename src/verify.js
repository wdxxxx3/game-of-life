const {HashLife, PatternIO} = require('./engine.js');
const C = require('./classics.js');
const hl = new HashLife();
const norm = (n) => { const c = hl.cells(n); if (!c.length) return ''; let mx=Math.min(...c.map(a=>a[0])), my=Math.min(...c.map(a=>a[1])); return c.map(([x,y])=>(x-mx)+','+(y-my)).sort().join(';'); };
const abs = (n) => hl.cells(n).map(c=>c.join(',')).sort().join(';');
for (const p of C) {
  let r = hl.fromCells(PatternIO.parse(p.rle).cells); const r0 = r;
  const [k, v] = p.check; let ok = false, info = '';
  if (k === 'still') ok = abs(hl.advance(r,0)) === abs(r);
  else if (k === 'osc') { const s=[abs(r)]; for(let i=1;i<=v;i++){r=hl.advance(r,0); s.push(abs(r));} ok = s[v]===s[0] && s.slice(1,v).every(x=>x!==s[0]); }
  else if (k === 'ship') { const s0=norm(r), a0=abs(r); for(let i=0;i<v;i++) r=hl.advance(r,0); ok = norm(r)===s0 && abs(r)!==a0; }
  else if (k === 'meth') { const pops=[]; for(let i=0;i<v+400;i++){pops.push(hl.pop[r]); r=hl.advance(r,0);} let T=pops.length-1; while(T>2 && pops[T-1]===pops[T+1-0] || (T>2 && pops[T-2]===pops[T])) T--; info='settle~'+T; ok=Math.abs(T-v)<=6; }
  else if (k === 'gun') { const pops=[]; for(let i=0;i<v*6;i++){pops.push(hl.pop[r]); r=hl.advance(r,0);} const d1=pops[v*5]-pops[v*4], d2=pops[v*4]-pops[v*3]; ok = d1===d2 && d1>0; info='+'+d1+'/period'; }
  else if (k === 'grow') { const a=hl.pop[hl.advance(r,10)]; let b=hl.fromCells(PatternIO.parse(p.rle).cells); b=hl.advance(b,13); ok=hl.pop[b]>a*2; info=a+'->'+hl.pop[b]; }
  console.log((ok?'OK  ':'FAIL'), p.en, info);
}
