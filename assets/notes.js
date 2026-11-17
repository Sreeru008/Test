/* NOTES — sticky notes of approved rants (GenZ mode).
   Desktop: a pile of overlapping notes beside the chai glass. Everything else: a note pad.
   Under every note the next one is already there; tap a note and it peels off and flies away as a sheet of paper
   (rigid sheet with anisotropic air drag, centre-of-pressure torque, a gust and gravity), revealing the next.
   Data: GET {window.SOLVVED_API}/rants/featured if SOLVVED_API is set, else data/notes.json.
   Accepted shapes: [{id,text,color?,font?}] or {sample?:bool, notes:[…]}. Text is always inserted as plain text.
   Layout mode comes from CSS (--m: overlay | pad). Use: NOTES.mount(document.getElementById('nts')). */
(function(){'use strict';
const N=window.NOTES={mounted:false};
/* ten hands: [family, size factor, weight] — each note keeps one hand, chosen from its id */
const FONTS=[['SV Hello Baby',1.1,400],['SV Greats Sundays',.97,400],['SV Stay With Me',1.36,400],['SV Honey Script',1.5,400],['SV Honey Script SB',1.58,400],['SV Snoopy',1.01,400],['SV Overlays',.99,400],['SV Billabong',1.23,400],['Caveat',1.2,600],['Kalam',1,400]];
const COLS=['#FFADA3','#FDC472','#F9D667','#FCF3A4','#86E0A3','#E4E4E4','#FDBBF2','#D8B8FF','#82C9FF','#73D6F0'];
const MAXLEN=500,SHORT=140;   /* a rant is stored whole (up to 500); on the wall it is cut to about 140 characters with … and opens in full when tapped */
const cut=(t,n)=>t.length>n?t.slice(0,n-1).replace(/\s+\S*$/,'').replace(/[\s,;:.!?-]+$/,'')+'…':t;
/* built-in copy of data/notes.json, used when that file cannot be fetched (for example when the page is opened straight from a folder) */
const STARTER={"sample":true,"notes":[{"id":"s01","text":"Their sales team calls nonstop all day, basically guilt-tripping me into buying upgrades I never asked for."},{"id":"s02","text":"Aunty asked my salary before my name. Ma'am, at least say hello first."},{"id":"s03","text":"Half the people on here are just window shopping and treat marriage apps like casual Tinder hookups."},{"id":"s04","text":"Biodata said 'fair, slim, homely'. Are we meeting a person or buying a sofa?"},{"id":"s05","text":"People accept my request and then never reply, which honestly makes me think they are fake bots."},{"id":"s06","text":"First question: 'What does your father do?' I am right here. Ask about me."},{"id":"s07","text":"Talking to parent-managed accounts feels like a job interview where they only care about my CTC and property."},{"id":"s08","text":"Rejected because I 'laugh too loudly'. I'm keeping the laugh."},{"id":"s09","text":"So many fake profiles with stolen photos are just trying to pitch shady crypto scams in the chat."},{"id":"s10","text":"'Adjusting nature' is on every biodata. So who is doing all this adjusting?"},{"id":"s11","text":"Even after I filter out specific criteria, the app keeps shoving the exact same rejected profiles back."},{"id":"s12","text":"I just want my parents and me looking at the same shortlist. That's it. That's the rant."}]};
const hash=s=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const rnd=seed=>{let r=seed%2147483647||7;return()=>(r=r*16807%2147483647)/2147483647};
function clean(list){const out=[],seen={};
 (Array.isArray(list)?list:[]).forEach((n,i)=>{if(!n)return;let t=String(typeof n==='string'?n:n.text||'').replace(/\s+/g,' ').trim();if(!t)return;
  t=cut(t,MAXLEN);const id=String(n.id!=null?n.id:'n'+i+hash(t));if(seen[id])return;seen[id]=1;
  out.push({id,text:t,short:cut(t,SHORT),fi:Number.isInteger(n.font)?((n.font%FONTS.length)+FONTS.length)%FONTS.length:null,col:typeof n.color==='string'&&/^#[0-9a-f]{3,8}$/i.test(n.color)?n.color:null,h:hash(id)})});
 return out}
/* ---- who sits where, and what each note looks like ----
   The wall always starts as the 12 sample rants. Real rants (API, in the order it returns them; oldest first is best)
   replace samples one by one in a fixed random order, so the 1st real rant takes one random sample's place, the 2nd another, ... the 12th the last.
   Rant 13 onwards is added on top (spread through the wall at a position taken from its id).
   Looks: handwriting and colour come from two shuffled decks of 10, dealt along the wall positions, so neighbours never repeat and every
   hand/colour is used before any repeats. Positions 0-11 keep the same look whether the sample or a real rant sits there. */
const deal=(len,seed,k)=>{const R=rnd(seed),out=[];while(out.length<len){let d,t=0;do{d=[...Array(k).keys()];for(let i=k-1;i>0;i--){const j=Math.floor(R()*(i+1)),x=d[i];d[i]=d[j];d[j]=x}t++}
  while(t<40&&out.length&&d.slice(0,3).some(v=>out.slice(-3).includes(v)));out.push(...d)}return out.slice(0,len)};
function compose(samples,real){
 const base=samples.slice(),n=base.length,R=rnd(20260611),order=[...Array(n).keys()];
 for(let i=n-1;i>0;i--){const j=Math.floor(R()*(i+1)),t=order[i];order[i]=order[j];order[j]=t}
 const out=base.map(x=>x),extra=[],pos=out.map((_,i)=>i);
 real.forEach((r,i)=>{if(i<n)out[order[i]]=r;else extra.push(r)});
 const F=deal(n,11,FONTS.length),C=deal(n,23,COLS.length);
 const look=(x,i)=>{const y=Object.assign({},x);y.font=FONTS[x.fi!=null?x.fi:F[i]];y.col=x.col||COLS[C[i]];return y};
 const res=out.map((x,i)=>look(x,i));
 /* rant 13 onwards: dropped in at a spot taken from its id; hand and colour are picked at random among those NOT used by the 3 notes either side */
 extra.forEach(x=>{const at=x.h%(res.length+1),R=rnd(x.h+99),near=res.slice(Math.max(0,at-3),at+3);
  const pick=(all,used,ov)=>{if(ov!=null)return ov;let c=all.filter(v=>!used.includes(v));if(!c.length)c=all;return c[Math.floor(R()*c.length)]};
  const fi=pick([...Array(FONTS.length).keys()],near.map(m=>FONTS.indexOf(m.font)),x.fi),col=x.col||pick(COLS,near.map(m=>m.col),null);
  res.splice(at,0,Object.assign({},x,{font:FONTS[fi],col}))});
 return res}
function load(){
 const api=window.SOLVVED_API,get=u=>fetch(u,{headers:{Accept:'application/json'}}).then(r=>r.ok?r.json():Promise.reject()).then(d=>clean(Array.isArray(d)?d:d.notes||d.items));
 const samples=get('data/notes.json').catch(()=>clean(STARTER.notes)),real=api?get(String(api).replace(/\/$/,'')+'/rants/featured').catch(()=>[]):Promise.resolve([]);
 return Promise.all([samples,real]).then(r=>({notes:compose(r[0].length?r[0]:clean(STARTER.notes),r[1])}))
}
/* paper flight: rigid square sheet, anisotropic quadratic air drag, centre-of-pressure torque, gust + gravity */
function makeFlight(L,r0,dir,rand){
 const S={t:0,ph:0,a:0,av:0,b:0,bv:0,c:r0,cv:0,x:0,y:0,z:0,vx:0,vy:0,vz:0,nz:1};
 const g=1700,Kn=g/(330*330),Kt=Kn*.05,GX=dir*(260+rand()*260),GY=-(620+rand()*260),GZ=90+rand()*70,ph1=rand()*6.28,ph2=rand()*6.28;
 S.step=function(dt){S.t+=dt;
  if(S.ph===0){/* peel: the gust lifts the free bottom edge, the glue strip at the top holds, then lets go */
   S.av+=(58-5*S.av)*dt;S.a+=S.av*dt;
   if(S.a>.85){S.ph=1;const h=L/2,cs=Math.cos(S.c),sn=Math.sin(S.c),dy=h*(Math.cos(S.a)-1),dz=h*Math.sin(S.a),wy=-h*Math.sin(S.a)*S.av,wz=h*Math.cos(S.a)*S.av;
    S.x=-sn*dy;S.y=cs*dy;S.z=dz;S.vx=-sn*wy+GX*.35;S.vy=cs*wy+GY*.45;S.vz=wz+GZ*.5;S.bv=dir*(1.5+rand()*2);S.cv=dir*(.6+rand()*1.2);S.t1=S.t}
   return}
  const tt=S.t-S.t1,e=Math.exp(-tt/.5),Wx=GX*e+70*Math.sin(tt*2.1+ph1),Wy=GY*e+40*Math.sin(tt*1.7+ph2),Wz=GZ*e;
  const ca=Math.cos(S.a),sa=Math.sin(S.a),cb=Math.cos(S.b),sb=Math.sin(S.b),cc=Math.cos(S.c),sc=Math.sin(S.c);
  /* sheet axes in world: R = Rz(c) Rx(a) Ry(b) */
  const rot=(x,y,z)=>{const x1=x*cb+z*sb,z1=-x*sb+z*cb,y2=y*ca-z1*sa,z2=y*sa+z1*ca;return[x1*cc-y2*sc,x1*sc+y2*cc,z2]};
  const n=rot(0,0,1),ex=rot(1,0,0),ey=rot(0,1,0);
  const wx=Wx-S.vx,wy=Wy-S.vy,wz=Wz-S.vz,wm=Math.hypot(wx,wy,wz)+1e-6,wn=wx*n[0]+wy*n[1]+wz*n[2];
  const tx=wx-wn*n[0],ty=wy-wn*n[1],tz=wz-wn*n[2],fn=Kn*wn*Math.abs(wn);
  S.vx+=(fn*n[0]+Kt*wm*tx)*dt;S.vy+=(g+fn*n[1]+Kt*wm*ty)*dt;S.vz+=(fn*n[2]+Kt*wm*tz)*dt;
  S.x+=S.vx*dt;S.y+=S.vy*dt;S.vz-=1.6*S.vz*dt;S.z+=S.vz*dt;if(S.z<0){S.z=0;if(S.vz<0)S.vz=-S.vz*.2}
  /* centre of pressure sits toward the leading edge: lever r = -lam*L*t_hat, torque = r x Fn */
  const lam=.22*L/wm,rx=-lam*tx,ry=-lam*ty,rz=-lam*tz,Fx=fn*n[0],Fy=fn*n[1],Fz=fn*n[2];
  const Tx=ry*Fz-rz*Fy,Ty=rz*Fx-rx*Fz,Tz=rx*Fy-ry*Fx,k=12/(L*L)*1.0;
  S.av+=(k*(Tx*ex[0]+Ty*ex[1]+Tz*ex[2])-1.1*S.av)*dt;S.bv+=(k*(Tx*ey[0]+Ty*ey[1]+Tz*ey[2])-1.1*S.bv)*dt;S.cv+=(-.5*S.cv)*dt;
  S.a+=S.av*dt;S.b+=S.bv*dt;S.c+=S.cv*dt;S.nz=n[2]};
 return S}
N.mount=function(root){
 if(N.mounted||!root)return;N.mounted=true;
 const wall=root.querySelector('.nts-wall'),foot=root.querySelector('.nts-f'),RM=matchMedia('(prefers-reduced-motion: reduce)').matches,sec=root.closest('section');
 if(!document.getElementById('nts-fonts')){const l=document.createElement('link');l.id='nts-fonts';l.rel='stylesheet';
  l.href='https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Kalam&display=swap';document.head.appendChild(l);
  const st=document.createElement('style');st.id='nts-fonts-local';
  st.textContent=[['SV Hello Baby','hello-baby'],['SV Greats Sundays','greats-sundays'],['SV Stay With Me','stay-with-me'],['SV Honey Script','honey-script-light'],['SV Honey Script SB','honey-script-semibold'],['SV Snoopy','snoopy'],['SV Overlays','overlays'],['SV Billabong','billabong']].map(f=>'@font-face{font-family:"'+f[0]+'";src:url("assets/fonts/'+f[1]+'.woff") format("woff");font-display:swap}').join('');document.head.appendChild(st)}
 const air=document.createElement('div');air.className='nts-air';air.setAttribute('aria-hidden','true');document.body.appendChild(air);
 let notes=[],ptr=0,slots=[],mode='',L=180,depth=2,lastCol=-1;
 function placed(){const m={};slots.forEach(s=>s.stack.forEach(e=>{m[e._n.id]=1}));return m}
 function next(){const used=placed();for(let i=0;i<notes.length;i++){const n=notes[ptr++%notes.length];if(!used[n.id])return n}
  /* fewer notes than places: reuse one that is not showing on top right now */
  const tops={};slots.forEach(s=>{if(s.stack[0])tops[s.stack[0]._n.id]=1});for(let i=0;i<notes.length;i++){const n=notes[ptr++%notes.length];if(!tops[n.id])return n}return notes[ptr++%notes.length]}
 function fit(el){const t=el._t,box=t.parentNode,s0=L*.15*el._n.font[1];let hi=s0,lo=9;t.style.fontSize=hi+'px';
  if(t.scrollHeight<=box.clientHeight&&t.scrollWidth<=box.clientWidth)return;
  for(let k=0;k<7&&hi-lo>.75;k++){const m=(hi+lo)/2;t.style.fontSize=m+'px';if(t.scrollHeight>box.clientHeight||t.scrollWidth>box.clientWidth)hi=m;else lo=m}
  t.style.fontSize=lo+'px'}
 /* fitting measures layout, so at build time it runs a few notes per tick instead of all at once */
 const fq=[];let fqT=0;
 function fitSoon(el){fq.push(el);if(!fqT)fqT=setTimeout(runFq,0)}
 function runFq(){fqT=0;const t0=performance.now();while(fq.length&&performance.now()-t0<5){const e=fq.shift();if(e.isConnected)fit(e)}if(fq.length)fqT=setTimeout(runFq,20)}
 function make(n){
  const el=document.createElement('button');el.type='button';el.className='nt';el._n=n;
  const c=n.col;
  el.style.cssText='width:'+L+'px;height:'+L+'px;--c:'+c+';font-family:"'+n.font[0]+'","Segoe Print","Bradley Hand","Comic Sans MS",cursive;font-weight:'+n.font[2];
  el.innerHTML='<i class="nt-sh"></i><span class="nt-face"><span class="nt-body"><span class="nt-t"></span></span></span>';
  el._t=el.querySelector('.nt-t');el._t.textContent=n.short||n.text;return el}
 /* position of the k-th note in a slot's stack (0 = on top) */
 function pose(slot,el,k){
  const pad=mode==='pad',x=slot.x+(pad?k*2.4:k?slot.ux:0),y=slot.y+(pad?k*3:k?slot.uy:0),r=slot.r+(pad?k*.55:k?slot.ur:0);
  el.style.left=x+'px';el.style.top=y+'px';el.style.zIndex=slot.z*10+(depth-k);el.style.setProperty('--r',r+'deg');el._r=r;
  if(k===0){el.tabIndex=0;el.removeAttribute('aria-hidden');el.classList.add('top');el.setAttribute('aria-label','Rant: '+(el._n.short||el._n.text)+' Press to read the full note.')}
  else{el.tabIndex=-1;el.setAttribute('aria-hidden','true');el.classList.remove('top')}}
 function add(slot,defer){const el=make(next());el.addEventListener('click',()=>{if(slot.stack[0]===el)open(slot)});wall.appendChild(el);slot.stack.push(el);pose(slot,el,slot.stack.length-1);defer?fitSoon(el):fit(el)}
 /* ---- flight ---- */
 const flying=[];let raf=0,last=0;
 function tick(now){raf=0;const dt=Math.min(.04,(now-last)/1000||.016);last=now;if(!N.manual)advance(dt);if(flying.length)raf=requestAnimationFrame(tick)}
 function advance(dt){const vh=innerHeight,vw=innerWidth;
  for(let i=flying.length-1;i>=0;i--){const f=flying[i],S=f.S;let left=dt;while(left>1e-5){const d=Math.min(left,1/120);S.step(d);left-=d}
   const el=f.el,deg=57.2958;
   if(S.ph===0)el.style.transform='rotateZ('+S.c*deg+'deg) translateY('+(-f.L/2)+'px) rotateX('+S.a*deg+'deg) translateY('+f.L/2+'px)';
   else{el.style.transform='translate3d('+S.x+'px,'+S.y+'px,'+S.z+'px) rotateZ('+S.c*deg+'deg) rotateX('+S.a*deg+'deg) rotateY('+S.b*deg+'deg)';el.classList.toggle('bk',S.nz<0)}
   const h=S.ph?S.z:f.L*.5*Math.sin(S.a),sh=f.sh;
   sh.style.transform='translate('+(S.x-h*.22)+'px,'+(S.y+h*.34)+'px) rotate('+S.c*deg+'deg) scale('+Math.max(.15,Math.abs(Math.cos(S.b)))+','+Math.max(.15,Math.abs(Math.cos(S.a)))+')';
   sh.style.opacity=Math.max(0,.34*(1-h/420));sh.style.filter='blur('+(7+h*.07)+'px)';
   const life=S.t>4.2?Math.max(0,1-(S.t-4.2)/.5):1;if(life<1)f.wrap.style.opacity=life;
   if(f.y0+S.y>vh+f.L||f.x0+S.x<-2*f.L||f.x0+S.x>vw+2*f.L||life<=0){f.wrap.remove();flying.splice(i,1)}}}
 /* send a sheet (already taken out of the wall) off on the wind from where it is on screen */
 function launch(el,cx,cy,size,rot,dir){
  const wrap=document.createElement('div');wrap.className='nts-fly';wrap.style.cssText='left:'+(cx-size/2)+'px;top:'+(cy-size/2)+'px;width:'+size+'px;height:'+size+'px';
  const sh=document.createElement('i');sh.className='nts-shd';wrap.appendChild(sh);
  el.classList.remove('top');el.classList.add('air');el.disabled=true;el.tabIndex=-1;el.setAttribute('aria-hidden','true');el.style.left=el.style.top='0';el.style.zIndex=2;wrap.appendChild(el);air.appendChild(wrap);
  flying.push({el,wrap,sh,L:size,x0:cx,y0:cy,S:makeFlight(size,rot*Math.PI/180,dir,Math.random)});
  if(!raf){last=performance.now();raf=requestAnimationFrame(tick)}}
 /* ---- reading a note ----
    Tap a note: it comes off the pile, tumbles toward you and slaps flat against the screen like a paper blown onto a window, full rant readable (up to 500 characters;
    scrolls inside the note if it cannot fit). Only the ✕ (or Esc) closes it; then a gust peels it off the glass and carries it away. */
 let view=null;
 function open(slot){
  const el=slot.stack[0];if(!el||el._gone||view)return;el._gone=true;
  const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,n=el._n,r0=el._r||0;
  slot.stack.shift();slot.stack.forEach((e,k)=>pose(slot,e,k));add(slot);el.remove();
  const vw=innerWidth,vh=innerHeight,B=Math.round(Math.max(240,Math.min(600,vw*.9,vh*.8)));
  const ov=document.createElement('div');ov.className='nts-view';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Rant');
  ov.innerHTML='<div class="nts-dim"></div><div class="nts-big" style="width:'+B+'px;height:'+B+'px;margin:'+(-B/2)+'px 0 0 '+(-B/2)+'px"><div class="nt nt-big" style="width:'+B+'px;height:'+B+'px"><i class="nt-sh"></i><span class="nt-face"><span class="nt-body" tabindex="0"><span class="nt-t"></span></span></span></div><button type="button" class="nts-x" aria-label="Close this note">✕</button></div>';
  const hold=ov.querySelector('.nts-big'),big=ov.querySelector('.nt'),body=ov.querySelector('.nt-body'),t=ov.querySelector('.nt-t'),x=ov.querySelector('.nts-x'),dim=ov.querySelector('.nts-dim');
  big.style.setProperty('--c',n.col);big.style.fontFamily='"'+n.font[0]+'","Segoe Print","Bradley Hand","Comic Sans MS",cursive';big.style.fontWeight=n.font[2];big._n=n;big._r=-1.5;
  t.textContent=n.text;air.style.zIndex='';document.body.appendChild(ov);document.documentElement.classList.add('nt-open');
  /* biggest size that fits; never below a readable size, then the note scrolls inside */
  const min=Math.max(13,Math.min(17,B*.03))*Math.min(1.35,n.font[1]);let hi=B*.105*n.font[1],lo=min;t.style.fontSize=hi+'px';
  if(t.scrollHeight>body.clientHeight||t.scrollWidth>body.clientWidth){for(let k=0;k<8&&hi-lo>.5;k++){const m=(hi+lo)/2;t.style.fontSize=m+'px';if(t.scrollHeight>body.clientHeight||t.scrollWidth>body.clientWidth)hi=m;else lo=m}t.style.fontSize=lo+'px'}
  if(t.scrollHeight>body.clientHeight+1)body.classList.add('scr');else body.removeAttribute('tabindex');
  const dx=cx-vw/2,dy=cy-vh/2,s0=r.width/B,side=dx>0?-1:1;
  if(RM||!hold.animate){dim.style.opacity=1}
  else{dim.animate([{opacity:0},{opacity:1}],{duration:500,fill:'both',easing:'ease-out'});
   hold.animate([
    {transform:'translate('+dx+'px,'+dy+'px) scale('+s0+') rotateZ('+r0+'deg)',offset:0,easing:'cubic-bezier(.3,0,.5,1)'},
    {transform:'translate('+dx*.72+'px,'+(dy*.7-60)+'px) scale('+(s0+(1-s0)*.22)+') rotateZ('+(r0+side*14)+'deg) rotateX(48deg) rotateY('+side*-30+'deg)',offset:.3,easing:'ease-in-out'},
    {transform:'translate('+dx*.25+'px,'+(dy*.28-28)+'px) scale('+(s0+(1-s0)*.62)+') rotateZ('+side*-9+'deg) rotateX(-26deg) rotateY('+side*22+'deg)',offset:.62,easing:'cubic-bezier(.5,0,.9,.6)'},
    {transform:'translate(0,0) scale(1.05) rotateZ(-3deg) rotateX(7deg) rotateY('+side*-5+'deg)',offset:.84,easing:'ease-out'},
    {transform:'translate(0,0) scale(.985) rotateZ(-1deg) rotateX(0deg) rotateY(0deg)',offset:.92,easing:'ease-in-out'},
    {transform:'translate(0,0) scale(1) rotateZ(-1.5deg)',offset:1}],{duration:950,fill:'both'});
   x.animate([{opacity:0,transform:'scale(.6)'},{opacity:1,transform:'scale(1)'}],{delay:850,duration:220,fill:'both',easing:'cubic-bezier(.2,1.4,.4,1)'})}
  const stop=e=>{e.stopPropagation();if(e.type==='wheel'&&!(body.classList.contains('scr')&&body.contains(e.target)))e.preventDefault()};
  ov.addEventListener('wheel',stop,{passive:false});ov.addEventListener('touchmove',e=>{e.stopPropagation();if(!(body.classList.contains('scr')&&body.contains(e.target)))e.preventDefault()},{passive:false});
  ['touchstart','touchend','pointerdown','mousedown','click'].forEach(k=>ov.addEventListener(k,e=>e.stopPropagation()));
  const key=e=>{if(!view)return;e.stopPropagation();if(e.key==='Escape'){e.preventDefault();close()}
   else if(e.key==='Tab'){e.preventDefault();(document.activeElement===x&&body.classList.contains('scr')?body:x).focus()}
   else if(document.activeElement!==body&&[' ','ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(e.key)&&!(e.key===' '&&document.activeElement===x))e.preventDefault()};
  addEventListener('keydown',key,true);
  x.addEventListener('click',close);x.focus({preventScroll:true});
  view={ov,close};
  function close(){if(!view)return;view=null;removeEventListener('keydown',key,true);document.documentElement.classList.remove('nt-open');
   const top=slots.map(s=>s.stack[0]).find(e=>e&&e.isConnected);if(top)top.focus({preventScroll:true});
   if(RM||!hold.animate){ov.remove();return}
   const b=hold.getBoundingClientRect();x.remove();body.scrollTop=0;body.classList.remove('scr');
   big.style.transform='';launch(big,b.left+b.width/2,b.top+b.height/2,B,-1.5,Math.random()<.5?-1:1);
   air.style.zIndex=1501;ov.style.pointerEvents='none';dim.animate([{opacity:1},{opacity:0}],{duration:650,fill:'both',easing:'ease-in'}).onfinish=()=>{ov.remove();setTimeout(()=>{if(!view&&!flying.length)air.style.zIndex=''},4000)}}}
 /* ---- the visitor's own rant ----
    Called by the chai (assets/chai.js / chai2d.js) right after a rant is sent: the rant flies up as a note and sticks to the screen until ✕ (or Esc);
    then it is blown off the screen, a thank-you pop-up shows (button, Esc, or 8 s), and only then done() runs (the chai drains and the glass stands up). */
 N.rant=function(text,from,done){
  let fin=0;const end=()=>{if(!fin){fin=1;try{done&&done()}catch(e){}}};
  text=cut(String(text||'').replace(/\s+/g,' ').trim(),MAXLEN);if(!text||view){thanks(end);return}
  const font=FONTS[Math.floor(Math.random()*FONTS.length)],col=COLS[Math.floor(Math.random()*COLS.length)];
  let r=from&&from.getBoundingClientRect?from.getBoundingClientRect():null;const vw=innerWidth,vh=innerHeight;if(!r||!r.width)r={left:vw/2,top:vh*.62,width:0,height:0};
  const cx=Math.max(0,Math.min(vw,r.left+r.width/2)),cy=Math.max(0,Math.min(vh,r.top+r.height/2)),B=Math.round(Math.max(240,Math.min(600,vw*.9,vh*.8)));
  const ov=document.createElement('div');ov.className='nts-view';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Your rant');
  ov.innerHTML='<div class="nts-dim"></div><div class="nts-big" style="width:'+B+'px;height:'+B+'px;margin:'+(-B/2)+'px 0 0 '+(-B/2)+'px"><div class="nt nt-big" style="width:'+B+'px;height:'+B+'px"><i class="nt-sh"></i><span class="nt-face"><span class="nt-body" tabindex="0"><span class="nt-t"></span></span></span></div><button type="button" class="nts-x" aria-label="Close your note">✕</button></div>';
  const hold=ov.querySelector('.nts-big'),big=ov.querySelector('.nt'),body=ov.querySelector('.nt-body'),t=ov.querySelector('.nt-t'),x=ov.querySelector('.nts-x'),dim=ov.querySelector('.nts-dim');
  big.style.setProperty('--c',col);big.style.fontFamily='"'+font[0]+'","Segoe Print","Bradley Hand","Comic Sans MS",cursive';big.style.fontWeight=font[2];
  t.textContent=text;air.style.zIndex='';document.body.appendChild(ov);document.documentElement.classList.add('nt-open');
  const fitT=()=>{body.classList.remove('scr');const min=Math.max(13,Math.min(17,B*.03))*Math.min(1.35,font[1]);let hi=B*.105*font[1],lo=min;t.style.fontSize=hi+'px';
   if(t.scrollHeight>body.clientHeight||t.scrollWidth>body.clientWidth){for(let k=0;k<8&&hi-lo>.5;k++){const m=(hi+lo)/2;t.style.fontSize=m+'px';if(t.scrollHeight>body.clientHeight||t.scrollWidth>body.clientWidth)hi=m;else lo=m}t.style.fontSize=lo+'px'}
   if(t.scrollHeight>body.clientHeight+1){body.classList.add('scr');body.tabIndex=0}else body.removeAttribute('tabindex')};
  fitT();if(document.fonts&&document.fonts.load)document.fonts.load('20px "'+font[0]+'"').then(()=>{if(view&&view.ov===ov)fitT()}).catch(()=>{});
  const dx=cx-vw/2,dy=cy-vh/2,s0=Math.min(.3,90/B),side=dx>0?-1:1,r0=6;
  if(RM||!hold.animate){dim.style.opacity=1}
  else{dim.animate([{opacity:0},{opacity:1}],{duration:500,fill:'both',easing:'ease-out'});
   hold.animate([
    {transform:'translate('+dx+'px,'+dy+'px) scale('+s0+') rotateZ('+r0+'deg)',opacity:0,offset:0,easing:'cubic-bezier(.3,0,.5,1)'},
    {opacity:1,offset:.08},
    {transform:'translate('+dx*.72+'px,'+(dy*.7-60)+'px) scale('+(s0+(1-s0)*.22)+') rotateZ('+(r0+side*14)+'deg) rotateX(48deg) rotateY('+side*-30+'deg)',offset:.3,easing:'ease-in-out'},
    {transform:'translate('+dx*.25+'px,'+(dy*.28-28)+'px) scale('+(s0+(1-s0)*.62)+') rotateZ('+side*-9+'deg) rotateX(-26deg) rotateY('+side*22+'deg)',offset:.62,easing:'cubic-bezier(.5,0,.9,.6)'},
    {transform:'translate(0,0) scale(1.05) rotateZ(-3deg) rotateX(7deg) rotateY('+side*-5+'deg)',offset:.84,easing:'ease-out'},
    {transform:'translate(0,0) scale(.985) rotateZ(-1deg) rotateX(0deg) rotateY(0deg)',offset:.92,easing:'ease-in-out'},
    {transform:'translate(0,0) scale(1) rotateZ(-1.5deg)',opacity:1,offset:1}],{duration:1050,fill:'both'});
   x.animate([{opacity:0,transform:'scale(.6)'},{opacity:1,transform:'scale(1)'}],{delay:950,duration:220,fill:'both',easing:'cubic-bezier(.2,1.4,.4,1)'})}
  ov.addEventListener('wheel',e=>{e.stopPropagation();if(!(body.classList.contains('scr')&&body.contains(e.target)))e.preventDefault()},{passive:false});
  ov.addEventListener('touchmove',e=>{e.stopPropagation();if(!(body.classList.contains('scr')&&body.contains(e.target)))e.preventDefault()},{passive:false});
  ['touchstart','touchend','pointerdown','mousedown','click'].forEach(k=>ov.addEventListener(k,e=>e.stopPropagation()));
  const key=e=>{if(!view||view.ov!==ov)return;e.stopPropagation();if(e.key==='Escape'){e.preventDefault();close()}
   else if(e.key==='Tab'){e.preventDefault();(document.activeElement===x&&body.classList.contains('scr')?body:x).focus()}
   else if(document.activeElement!==body&&[' ','ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(e.key)&&!(e.key===' '&&document.activeElement===x))e.preventDefault()};
  addEventListener('keydown',key,true);x.addEventListener('click',close);x.focus({preventScroll:true});
  view={ov,close};
  function close(){if(!view||view.ov!==ov)return;view=null;removeEventListener('keydown',key,true);document.documentElement.classList.remove('nt-open');
   if(RM||!hold.animate){ov.remove();thanks(end);return}
   const b=hold.getBoundingClientRect();x.remove();body.scrollTop=0;body.classList.remove('scr');
   hold.getAnimations().forEach(a=>a.cancel());big.style.transform='';big._n={};launch(big,b.left+b.width/2,b.top+b.height/2,B,-1.5,Math.random()<.5?-1:1);
   air.style.zIndex=1501;ov.style.pointerEvents='none';dim.animate([{opacity:1},{opacity:0}],{duration:650,fill:'both',easing:'ease-in'}).onfinish=()=>{ov.remove()};
   setTimeout(()=>thanks(end),1500)}
 };
 function thanks(done){
  const ov=document.createElement('div');ov.className='rthx-w';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-labelledby','rthxh');
  ov.innerHTML='<div class="rthx"><b id="rthxh">Rant received. Thank you!</b><span>We take every rant seriously. Our team reads each one, and if we love yours, it goes up in Hot Takes.</span><button type="button" class="rthx-ok">Got it</button><i></i></div>';
  document.body.appendChild(ov);const ok=ov.querySelector('.rthx-ok');ok.focus({preventScroll:true});let gone=0;
  const stop=e=>{e.stopPropagation();if(e.type==='wheel'||e.type==='touchmove')e.preventDefault()};
  ov.addEventListener('wheel',stop,{passive:false});ov.addEventListener('touchmove',stop,{passive:false});['touchstart','touchend','pointerdown','mousedown','click'].forEach(k=>ov.addEventListener(k,e=>e.stopPropagation()));
  const key=e=>{if(gone)return;e.stopPropagation();if(e.key==='Escape'){e.preventDefault();close()}else if(e.key==='Tab'){e.preventDefault();ok.focus()}
   else if([' ','ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(e.key)&&!(e.key===' '&&document.activeElement===ok))e.preventDefault()};
  const tm=setTimeout(close,8000);addEventListener('keydown',key,true);ok.addEventListener('click',close);
  function close(){if(gone)return;gone=1;clearTimeout(tm);removeEventListener('keydown',key,true);ov.classList.add('out');
   setTimeout(()=>{ov.remove();if(!view&&!flying.length)air.style.zIndex='';else setTimeout(()=>{if(!view&&!flying.length)air.style.zIndex=''},4000);done()},200)}
 }
 function build(){
  mode=getComputedStyle(root).getPropertyValue('--m').trim()==='overlay'?'overlay':'pad';wall.innerHTML='';slots=[];ptr=0;lastCol=-1;
  const cw=wall.clientWidth,R=rnd(hash(mode+Math.round(cw/40))+notes.length*7);
  if(mode==='pad'){depth=Math.min(5,Math.max(1,notes.length));L=Math.round(Math.min(cw*.8,300));wall.style.height=L+34+'px';
   slots.push({x:(cw-L)/2-5,y:6,r:-2,z:1,ux:0,uy:0,ur:0,stack:[]})}
  else{depth=2;wall.style.height='';const ch=wall.clientHeight,C=cw>=560?3:2,rows=C===3?2:ch>=540?4:ch>=360?3:2;L=Math.round(Math.max(120,Math.min(C===3?300:210,cw*(C===3?.37:.58),ch/(C===3?1.92:rows*.7+.3))));const sp=C===3?Math.min(ch-L,L*1.2):ch-L,y0=(ch-L-sp)/2;   /* wide desktop = layout A: 3 columns x 2 rows of bigger notes */
   const zs=[];for(let i=0;i<rows*C;i++)zs.push(i+1);for(let i=zs.length-1;i>0;i--){const j=Math.floor(R()*(i+1)),t=zs[i];zs[i]=zs[j];zs[j]=t}
   for(let r=0;r<rows;r++)for(let c=0;c<C;c++){const sh=(r%2?1:-1)*L*(C===3?.015:.05),gx=C>1?c*(cw-L)/(C-1):0,jx=(R()-.5)*L*(C===3?.05:.16);
    slots.push({x:Math.max(0,Math.min(cw-L,gx+jx+sh)),y:y0+(rows>1?r*sp/(rows-1):0)+(R()-.5)*L*.08,r:+((R()-.5)*14).toFixed(1),z:zs[r*C+c],ux:(R()-.5)*14,uy:(R()-.5)*12,ur:+((R()-.5)*9).toFixed(1),stack:[]})}
   if(slots.length>notes.length)slots.length=notes.length}
  for(let k=0;k<depth;k++)slots.forEach(s=>{if(s.stack.length<depth&&(k===0||notes.length>1))add(s,true)});
 }
 load().then(d=>{notes=d.notes;if(!notes.length){if(sec)sec.hidden=true;root.hidden=true;return}
  build();
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>slots.forEach(s=>s.stack.forEach(fitSoon)));
  let w=innerWidth,h=innerHeight,tm=0;addEventListener('resize',()=>{clearTimeout(tm);tm=setTimeout(()=>{const m=getComputedStyle(root).getPropertyValue('--m').trim()==='overlay'?'overlay':'pad';
   if(Math.abs(innerWidth-w)>2||m!==mode||(m==='overlay'&&Math.abs(innerHeight-h)>40)){w=innerWidth;h=innerHeight;build()}},180)});
 });
 N.debug={get list(){return notes.map(n=>[n.id,n.font[0],n.col])},sim(t){for(let i=0;i<Math.round(t*60);i++)advance(1/60)},get flights(){return flying.map(f=>[+f.S.t.toFixed(2),Math.round(f.x0+f.S.x),Math.round(f.y0+f.S.y),Math.round(f.S.z)])},get slots(){return slots},get mode(){return mode},get count(){return notes.length},get flying(){return flying.length},get L(){return L},get view(){return view}};
};
})();
