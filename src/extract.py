import os, gzip, json, re, sys
ROOT='dl/g/golly-4.3-src/Patterns'
dirs=['Life','Life-Like','HashLife']
out=[]
for d in dirs:
  for dp,_,fs in os.walk(os.path.join(ROOT,d)):
    for f in sorted(fs):
      p=os.path.join(dp,f)
      if f.endswith(('.lua','.zip')): continue
      data=open(p,'rb').read()
      if f.endswith('.gz'): data=gzip.decompress(data); f=f[:-3]
      t=data.decode('latin-1')
      ext=f.rsplit('.',1)[1]
      rule=None
      m=re.search(r'rule\s*=\s*([^\s,]+)',t) if ext=='rle' else re.search(r'^#R\s*(\S+)',t,re.M)
      if m: rule=m.group(1)
      if ext=='lif' and re.search(r'^#N',t,re.M): rule='B3/S23'
      comments=[l[2:].strip() for l in t.split('\n') if l.startswith(('#C','#c','#D','#N')) and ext!='mc' or (ext=='mc' and l.startswith('#C'))]
      rel=os.path.relpath(p,ROOT)
      out.append(dict(path=rel,file=f,ext=ext,rule=rule,size=len(t),comments=comments[:12],text=t))
json.dump(out,open('golly_raw.json','w'))
for o in out: print(o['path'], o['ext'], o['rule'], o['size'], '|', ' / '.join(o['comments'])[:150])
