/* CHAI — "Spill the tea" for section 5 (vanilla JS, 2D canvas, no libraries).
   An inked, 3D-shaded chai glass stands on the left. Tap it: it tips over as a rigid body pivoting on its base edge,
   the chai pours over the lip (weir law), falls as drops, and spreads over the page as a thin-film fluid.
   Once the puddle settles it becomes a writing surface (text wraps to the puddle's shape), with a submit button
   then the rant flies up as a sticky note and a thank-you pop-up follows; then the chai drains and the glass stands up again.
   Use: <section><canvas></canvas></section> + CHAI.mount(section). Listen for the "chai:submit" event (detail.text). */
(function(){'use strict';
const CH=window.CHAI={mounted:false};
class ThinFilm{
 constructor(nx,nz,dx,o){this.nx=nx;this.nz=nz;this.dx=dx;this.A=o.A;this.B=o.B;this.hp=o.hp;this.p=o.p||3;this.tx=o.tx;this.tz=o.tz;
  this.h=new Float32Array(nx*nz);this.z=new Float32Array(nx*nz);this.dh=new Float32Array(nx*nz);this.hmax=0;this.active=0}
 add(x,z,vol,rad){const{nx,nz,dx,h}=this,cx=x/dx,cz=z/dx,R=Math.max(1.2,rad/dx),r=Math.ceil(R*1.6);let s=0;const w=[];
  for(let k=-r;k<=r;k++)for(let i=-r;i<=r;i++){const gx=Math.round(cx)+i,gz=Math.round(cz)+k;if(gx<0||gz<0||gx>=nx||gz>=nz)continue;const d2=((gx-cx)**2+(gz-cz)**2)/(R*R),v=Math.exp(-d2*1.6);w.push(gx,gz,v);s+=v}
  if(!s)return;const k=vol/(dx*dx)/s;for(let n=0;n<w.length;n+=3)h[w[n+1]*nx+w[n]]+=w[n+2]*k;this.active=1}
 step(dt){const{nx,nz,dx,A,B,hp,tx,tz,h,dh,p,z}=this;dh.fill(0);let hm=0;
  for(let k=0;k<nz;k++){const row=k*nx;for(let i=0;i<nx-1;i++){const a=row+i,b=a+1,hl=h[a],hr=h[b],up=hl>hr?hl:hr;if(up>hm)hm=up;if(up<hp)continue;
    let w=Math.pow(up,p)*(A*(hl-hr+z[a]-z[b])/dx+B*tx)*dt/dx;if(w>0){const c=.24*hl;if(w>c)w=c}else{const c=.24*hr;if(-w>c)w=-c}dh[a]-=w;dh[b]+=w}}
  for(let k=0;k<nz-1;k++){const row=k*nx;for(let i=0;i<nx;i++){const a=row+i,b=a+nx,hl=h[a],hr=h[b],up=hl>hr?hl:hr;if(up<hp)continue;
    let w=Math.pow(up,p)*(A*(hl-hr+z[a]-z[b])/dx+B*tz)*dt/dx;if(w>0){const c=.24*hl;if(w>c)w=c}else{const c=.24*hr;if(-w>c)w=-c}dh[a]-=w;dh[b]+=w}}
  for(let i=0;i<h.length;i++)h[i]+=dh[i];this.hmax=hm}
 /* advance by dt (sec) with a stable internal step; returns substeps used */
 advance(dt){let n=0,left=dt;while(left>1e-6&&n<60){const hm=Math.max(this.hmax,1e-3),d1=.18*this.dx*this.dx/(this.A*Math.pow(hm,this.p)+1e-9),d2=.4*this.dx/(this.B*Math.pow(hm,this.p-1)+1e-9),d=Math.min(left,d1,d2,.004);this.step(d);left-=d;n++}return n}
 stats(){const{nx,nz,dx,h,hp}=this;let a=0,v=0,sx=0,sz=0,mn=1e9,mx=-1e9,mnz=1e9,mxz=-1e9;for(let k=0;k<nz;k++)for(let i=0;i<nx;i++){const q=h[k*nx+i];v+=q;if(q>=hp){a++;sx+=i;sz+=k;if(i<mn)mn=i;if(i>mx)mx=i;if(k<mnz)mnz=k;if(k>mxz)mxz=k}}return{area:a*dx*dx,vol:v*dx*dx,cx:a?sx/a*dx:0,cz:a?sz/a*dx:0,x0:mn*dx,x1:mx*dx,z0:mnz*dx,z1:mxz*dx}}
}
function noise(seed){let r=seed;const R=()=>(r=(r*16807)%2147483647)/2147483647,w=[];for(let i=0;i<7;i++)w.push([R()*6.28,R()*6.28,.5+R()*2.2,.5+R()*2.2,R()*6.28]);
 return(u,v)=>{let s=0;for(const q of w)s+=Math.sin(u*q[2]*6.28+q[0]+Math.sin(v*q[3]*6.28+q[4]))*Math.cos(v*q[3]*6.28+q[1]);return s/7}}
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const INK='#1b0f08',CHAI='#d08a50',CHAI_D='#b9713a',CHAI_L='#eab98a',CREAM='#fff1dc';

CH.mount=function(sec,opt){
 if(CH.mounted)return;CH.mounted=true;opt=opt||{};
 const MAX=opt.max||500,RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const cv=sec.querySelector('canvas'),x=cv.getContext('2d');
 const el=(t,c,h)=>{const e=document.createElement(t);e.className=c;if(h)e.innerHTML=h;sec.appendChild(e);return e};
 const hit=el('button','chai-hit');hit.type='button';hit.setAttribute('aria-label','Tip the chai glass over');
 const hint=el('p','chai-hint','Tap to spill');
 const pad=el('div','chai-pad','<i class="chai-fl"></i><i class="chai-fr"></i><div class="chai-ed" role="textbox" aria-multiline="true" aria-label="Write your thoughts on the spilled chai" data-ph="Spill it here... no gatekeeping, just pure honesty"></div>');
 const fl=pad.children[0],fr=pad.children[1],ed=pad.children[2];
 const bar=el('div','chai-bar','<span class="chai-n">0/'+MAX+'</span><button type="button" class="chai-go">Serve it hot</button>');
 const cnt=bar.children[0],go=bar.children[1];
 const thx=el('div','chai-thx','<b>Tea served. Thank you!</b><span>Your thoughts landed safely.</span><i></i>');thx.setAttribute('role','status');
 const live=el('p','vh');live.setAttribute('aria-live','polite');
 pad.hidden=bar.hidden=thx.hidden=true;
 try{ed.contentEditable='plaintext-only'}catch(e){}if(ed.contentEditable!=='plaintext-only')ed.contentEditable='true';
 ed.spellcheck=false;

 /* ---------- layout ---------- */
 let W=0,H=0,DPR=1,c=10,S=1,nx=0,nz=0,film,g=200,R0=0,R1=0,pv0=0,fy=0,wide=true,VF=.4,seed=12345+((Math.random()*9e4)|0);
 let bl,bl2,l1,l2,seen,nH=0;
 const AL=Math.atan(.26/.42),TR=Math.PI/2-Math.atan(.13),FILL=.8;
 let A0=0;
 function layout(){
  W=sec.clientWidth;H=sec.clientHeight;DPR=Math.min(2,window.devicePixelRatio||1);cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);
  wide=W>H*1.05;c=Math.max(W,H)/110;const capE=sec.querySelector('.chai-cap'),capB=capE?capE.offsetTop+capE.offsetHeight:56;nx=Math.ceil(W/c)+1;nz=Math.ceil(H/c)+1;S=c/.06;
  g=clamp(Math.min(H*.3,W*.3),110,250);R0=.26*g;R1=.39*g;
  const gx=wide?Math.max(R1+28,W*.085):R1+20;pv0=gx+R0;fy=wide?Math.max(H*.5+g*.42,capB+g*1.45):Math.max(capB+g*1.45,H*.28);
  const mx=(pv0+g)/c,mz=fy/c;let a,b,d,e;
  let RL=nx;{const av=document.querySelector('[data-chai-avoid]');if(wide&&av&&av.offsetWidth){const r=av.getBoundingClientRect(),q=sec.getBoundingClientRect();if(r.top<q.bottom-60&&r.bottom>q.top+60&&r.left-q.left>W*.45)RL=(r.left-q.left)/c}}
  if(wide){a=mx-7;b=RL<nx?RL-5:nx-7;d=capB/c+2;e=nz-5.5}else{a=1.5;b=nx-2.5;d=Math.max(capB/c+2,mz-5);e=nz-12}
  const cx=(a+b)/2,cz=(d+e)/2,rx=(b-a)/2,rz=(e-d)/2,N=noise(seed);
  film=new ThinFilm(nx,nz,.06,{A:8,B:0,hp:.012,p:1.5,tx:1,tz:0});
  for(let k=0;k<nz;k++)for(let i=0;i<nx;i++){const u=(i-cx)/rx,v=(k-cz)/rz;film.z[k*nx+i]=(i<2||k<capB/c+1||i>RL-4||k>nz-4)?1:(wide?.05:.11)*u*u*u*u+.05*v*v*v*v+.02*N(i/nz,k/nz)}
  const tx=cx-mx,tz=cz-(mz+1),tl=Math.hypot(tx,tz)||1;film.tx=tx/tl;film.tz=tz/tl;
  VF=.0245*4*rx*rz*.0036;
  bl=new Float32Array(nx*nz);bl2=new Float32Array(nx*nz);nH=nx*nz;l1=new Int32Array(nH*2);l2=new Int32Array(nH*2);seen=new Uint8Array(nH*2);
  const w=.03*g,bb=.07*g,yl=FILL*g,rl=R0+(R1-R0)*FILL-w;A0=(R0-w+rl)*(yl-bb);
  hit.style.cssText='left:'+(gx-R1-8)+'px;top:'+(fy-g-R1*.25-8)+'px;width:'+(2*R1+16)+'px;height:'+(g+R1*.25+R0*.25+16)+'px';
  hint.style.left=(gx+R1+14)+'px';hint.style.top=(fy-g-10)+'px';
 }

 /* ---------- state ---------- */
 let barH_=58,state='idle',th=0,om=0,slide=0,slV=0,landed=false,f=1,psi=0,psiV=0,tp=-1,acc=0,t=0,path=null,dirty=true,lvC=0,lvD=[0,1],thT=0;
 const drops=[];
 const gpt=(lx,ly)=>{const rx=lx-R0,cs=Math.cos(th),sn=Math.sin(th);return[pv0+slide+rx*cs+ly*sn,fy-(-rx*sn+ly*cs)]};
 function clipArea(P,dx,dy,cc){/* area of polygon P where p.d >= cc */let a=0,n=P.length,out=[];
  for(let i=0;i<n;i++){const p=P[i],q=P[(i+1)%n],sp=p[0]*dx+p[1]*dy-cc,sq=q[0]*dx+q[1]*dy-cc;if(sp>=0)out.push(p);if((sp>=0)!==(sq>=0)){const u=sp/(sp-sq);out.push([p[0]+(q[0]-p[0])*u,p[1]+(q[1]-p[1])*u])}}
  for(let i=0;i<out.length;i++){const p=out[i],q=out[(i+1)%out.length];a+=p[0]*q[1]-q[0]*p[1]}return Math.abs(a)/2}
 function liquid(dt){/* free surface under (slosh-tilted) gravity; pours over the lip by the weir law Q ~ head^1.5 */
  const w=.03*g,bb=.07*g,P=[gpt(-R0+w,bb),gpt(R0-w,bb),gpt(R1-w,g),gpt(-R1+w,g)],dx=-Math.sin(psi),dy=Math.cos(psi);
  let lo=1e9,hi=-1e9;for(const p of P){const s=p[0]*dx+p[1]*dy;if(s<lo)lo=s;if(s>hi)hi=s}
  const tar=f*A0,top=lo;let a=lo,b=hi;for(let i=0;i<22;i++){const m=(a+b)/2;if(clipArea(P,dx,dy,m)>tar)a=m;else b=m}
  lvC=(a+b)/2;lvD=[dx,dy];if(f<=0||!dt)return;
  const p2=P[2],p3=P[3],s2=p2[0]*dx+p2[1]*dy,s3=p3[0]*dx+p3[1]*dy,lip=s2>s3?p2:p3,head=Math.max(s2,s3)-lvC;
  let df=0;if(head>0)df=14*Math.pow(head/g,1.5)*dt;if(landed&&f<.05)df=Math.max(df,.4*dt);
  df=Math.min(df,f);if(df<=0)return;f-=df;if(tp<0)tp=0;acc+=df*520;
  const GP=g*20,v0=Math.min(Math.sqrt(2*GP*Math.max(head,0)),g*3.2),ax=Math.sin(th),ay=-Math.cos(th),lvx=-om*(lip[1]-fy),lvy=om*(lip[0]-pv0-slide);
  while(acc>=1){acc--;const j=Math.random(),k=Math.random();drops.push({x:lip[0]-ax*j*.06*g+(k-.5)*4,y:lip[1]-ay*j*.06*g-k*.05*g,vx:lvx+ax*v0*(.6+.5*k)+(j-.5)*30,vy:lvy+ay*v0*(.6+.5*k),fl:fy+(-.04+.3*Math.random()*Math.random())*g+(landed?.1*g*Math.random():0),v:1/520,r:(.036+.034*k)*g,s:0})}
 }
 function physics(dt){
  if(state==='tip'){
   if(!landed){om+=30.8*Math.sin(th-AL)*dt;th+=om*dt;if(th<0){th=0;om=0}
    if(th>=TR){th=TR;if(om>.7){if(!slV)slV=g*.55;om=-om*.3}else{om=0;landed=true}}}
   slide+=slV*dt;slV*=Math.exp(-5*dt);
   const tg=clamp(om*.1,-.45,.45);psiV+=(-70*(psi-tg)-9*psiV)*dt;psi+=psiV*dt;
   liquid(dt);
  }else if(state==='stand'){
   om+=(-55*th-10*om)*dt;th+=om*dt;slide*=Math.exp(-6*dt);if(th<0){th=0;om=Math.abs(om)*.25}
   if(th<.15)f=Math.min(1,f+dt*1.1);psi=0;liquid(0);
   if(th<.004&&Math.abs(om)<.05&&f>=1){th=0;om=0;slide=0;state='idle';hit.hidden=false;hint.hidden=false;live.textContent='The glass is full again.'}
  }
  /* drops: ballistic, land on the page and feed the film */
  const GP=g*20;for(let i=drops.length-1;i>=0;i--){const d=drops[i];d.vy+=GP*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;
   if(d.y>=d.fl){drops.splice(i,1);const X=clamp(d.x,c*2,W-c*2),Y=clamp(d.fl,c*2,H-c*2);
    if(d.s)film.add(X/S,Y/S,.0011+.0012*Math.random(),.1);else{film.add(X/S,Y/S,d.v*VF,.13);
     if(Math.random()<.045){const a=Math.random();drops.push({x:X,y:Y-2,vx:(a*1.9-.55)*g*1.5,vy:-(.5+Math.random())*g*1.5,fl:Y+(Math.random()-.4)*g*.9,v:0,r:(.02+.016*a)*g,s:1})}}
    dirty=true}}
  /* film: spreads, drifts with the pour's momentum (decaying), then the contact line freezes */
  if(tp>=0&&(state==='tip')){tp+=dt;film.B=4.5*Math.exp(-tp/.9);const m=clamp((4.6-tp)/1.6,0,1);if(m>0){film.advance(2*dt*m);dirty=true}
   if(tp>4.7&&!drops.length&&f<=0)settle()}
  if(state==='drain'){const k=Math.pow(.012,dt),h=film.h;let mx=0;for(let i=0;i<h.length;i++){h[i]*=k;if(h[i]>mx)mx=h[i]}dirty=true;
   if(mx<.004){h.fill(0);film.hmax=0;path=null;state='stand';om=0}}
 }

 /* ---------- puddle outline: marching squares on the blurred height field, chained into smooth closed loops ---------- */
 const LV=.0055;
 function contour(){
  const h=film.h;let any=0;
  for(let p=0;p<2;p++){const s=p?bl:h,d=p?bl2:bl;for(let k=0;k<nz;k++)for(let i=0;i<nx;i++){const n=k*nx+i;let v=s[n]*4,w=4;if(i>0){v+=s[n-1];w++}if(i<nx-1){v+=s[n+1];w++}if(k>0){v+=s[n-nx];w++}if(k<nz-1){v+=s[n+nx];w++}d[n]=v/w}}
  const b=bl2;l1.fill(-1);l2.fill(-1);seen.fill(0);
  const link=(p,q)=>{if(l1[p]<0)l1[p]=q;else l2[p]=q;if(l1[q]<0)l1[q]=p;else l2[q]=p;any=1};
  for(let k=0;k<nz-1;k++)for(let i=0;i<nx-1;i++){const n=k*nx+i,q=(b[n]>LV?1:0)|(b[n+1]>LV?2:0)|(b[n+nx+1]>LV?4:0)|(b[n+nx]>LV?8:0);if(!q||q===15)continue;
   const T=n,Bm=n+nx,L=nH+n,R=nH+n+1;
   switch(q){case 1:case 14:link(L,T);break;case 2:case 13:link(T,R);break;case 3:case 12:link(L,R);break;case 4:case 11:link(R,Bm);break;case 6:case 9:link(T,Bm);break;case 7:case 8:link(L,Bm);break;case 5:link(L,T);link(R,Bm);break;case 10:link(T,R);link(L,Bm);break}}
  if(!any){path=null;return}
  const pt=e=>{if(e<nH){const i=e%nx,k=(e/nx)|0,a=b[e],d=b[e+1],u=(LV-a)/(d-a||1e-9);return[(i+clamp(u,0,1))*c,k*c]}const n=e-nH,i=n%nx,k=(n/nx)|0,a=b[n],d=b[n+nx],u=(LV-a)/(d-a||1e-9);return[i*c,(k+clamp(u,0,1))*c]};
  const P=new Path2D();
  for(let e0=0;e0<nH*2;e0++){if(l1[e0]<0||seen[e0])continue;const lp=[];let e=e0,pr=-1;
   while(e>=0&&!seen[e]){seen[e]=1;lp.push(pt(e));const nxt=l1[e]!==pr?l1[e]:l2[e];pr=e;e=nxt}
   const n=lp.length;if(n<3)continue;
   let m0=[(lp[n-1][0]+lp[0][0])/2,(lp[n-1][1]+lp[0][1])/2];P.moveTo(m0[0],m0[1]);
   for(let i=0;i<n;i++){const a=lp[i],d=lp[(i+1)%n];P.quadraticCurveTo(a[0],a[1],(a[0]+d[0])/2,(a[1]+d[1])/2)}P.closePath()}
  path=P;
 }

 /* ---------- drawing ---------- */
 function drawPuddle(){
  if(!path)return;
  x.fillStyle=CHAI;x.fill(path,'evenodd');
  x.save();x.clip(path,'evenodd');
  x.save();x.translate(-c*.3,-c*.42);x.strokeStyle='rgba(120,58,20,.5)';x.lineWidth=c*1.15;x.stroke(path);x.restore();
  x.save();x.translate(c*.55,c*.7);x.strokeStyle='rgba(255,238,208,.85)';x.lineWidth=Math.max(3,c*.3);x.lineCap='round';x.setLineDash([c*3.4,c*5.2,c*.9,c*8.5]);x.stroke(path);x.restore();
  x.restore();
  x.strokeStyle=INK;x.lineWidth=Math.max(2.5,g*.014);x.lineJoin='round';x.stroke(path);
 }
 function drawDrops(){
  if(!drops.length)return;const lw=Math.max(2,g*.011);
  x.fillStyle=INK;x.beginPath();for(const d of drops){x.moveTo(d.x+d.r+lw,d.y);x.arc(d.x,d.y,d.r+lw,0,6.2832)}x.fill();
  x.fillStyle=CHAI;x.beginPath();for(const d of drops){x.moveTo(d.x+d.r,d.y);x.arc(d.x,d.y,d.r,0,6.2832)}x.fill();
  x.fillStyle='rgba(255,238,208,.75)';x.beginPath();for(const d of drops){if(d.r<g*.03)continue;x.moveTo(d.x,d.y);x.arc(d.x-d.r*.32,d.y-d.r*.34,d.r*.22,0,6.2832)}x.fill();
 }
 function drawGlass(){
  const k=clamp(th/TR,0,1),e=lerp(.2,.4,k),lw=Math.max(2.5,g*.016),Rt=u=>R0+(R1-R0)*u;
  /* contact shadow on the page */
  x.save();x.fillStyle='rgba(0,0,0,.34)';x.beginPath();x.ellipse(pv0+slide+lerp(-R0,g*.5,k),fy+lerp(R0*.06,g*.02,k),lerp(R0*1.3,g*.66,k),lerp(R0*.3,g*.09,k),0,0,6.2832);x.fill();x.restore();
  x.save();x.translate(pv0+slide,fy);x.rotate(th);x.translate(-R0,0);
  const sil=new Path2D();sil.moveTo(-R1,-g);sil.ellipse(0,-g,R1,R1*e,0,Math.PI,2*Math.PI);sil.lineTo(R0,0);sil.ellipse(0,0,R0,R0*.2,0,0,Math.PI);sil.closePath();
  const mouth=new Path2D();mouth.ellipse(0,-g,R1,R1*e,0,0,6.2832);
  /* glass body */
  x.fillStyle='rgba(206,233,246,.26)';x.fill(sil);
  x.fillStyle='rgba(190,226,242,.38)';x.fill(mouth);
  /* chai inside: clip to the glass, fill the world-space half-plane below the free surface */
  if(f>.002){x.save();x.clip(sil);const T=x.getTransform();x.setTransform(DPR,0,0,DPR,0,0);
   const dx=lvD[0],dy=lvD[1],ox=dx*lvC,oy=dy*lvC,px=-dy,py=dx,B=4000;
   x.fillStyle=CHAI;x.beginPath();x.moveTo(ox+px*B,oy+py*B);x.lineTo(ox-px*B,oy-py*B);x.lineTo(ox-px*B+dx*B,oy-py*B+dy*B);x.lineTo(ox+px*B+dx*B,oy+py*B+dy*B);x.closePath();x.fill();
   x.strokeStyle='rgba(27,15,8,.55)';x.lineWidth=lw*.7;x.beginPath();x.moveTo(ox+px*B,oy+py*B);x.lineTo(ox-px*B,oy-py*B);x.stroke();
   x.setTransform(T);
   if(th<.3){const hl=clamp(fy-lvC,0,g),u=hl/g;x.globalAlpha=1-th/.3;x.fillStyle=CHAI_L;x.beginPath();x.ellipse(0,-hl,Rt(u)-lw*.5,(Rt(u))*e*.92,0,0,6.2832);x.fill();x.strokeStyle='rgba(27,15,8,.5)';x.lineWidth=lw*.6;x.stroke();x.globalAlpha=1}
   x.restore()}
  /* base band + fluted facets with 3D shading */
  x.save();x.clip(sil);
  const FT=.6,nf=7,ang=j=>(-90+j*180/nf)*Math.PI/180;
  for(let j=0;j<nf;j++){const a0=Math.sin(ang(j)),a1=Math.sin(ang(j+1)),mid=(j+.5)/nf,sh=mid<.5?'rgba(255,255,255,'+(.2*(1-mid*2)).toFixed(3)+')':'rgba(60,20,0,'+(.3*(mid*2-1)).toFixed(3)+')';
   const fp=new Path2D();fp.moveTo(a0*R0,R0*.25);fp.lineTo(a0*Rt(FT),-FT*g);fp.quadraticCurveTo((a0+a1)/2*Rt(FT),-(FT+.075)*g,a1*Rt(FT),-FT*g);fp.lineTo(a1*R0,R0*.25);fp.closePath();
   x.fillStyle=sh;x.fill(fp);x.strokeStyle='rgba(27,15,8,.62)';x.lineWidth=lw*.62;x.stroke(fp)}
  x.fillStyle='#bdb8c9';x.beginPath();x.rect(-R1,-.07*g,2*R1,g);x.fill();
  x.fillStyle='rgba(255,255,255,.35)';x.beginPath();x.rect(-R1,-.07*g,R1*.75,g);x.fill();
  x.strokeStyle=INK;x.lineWidth=lw*.8;x.beginPath();x.moveTo(-R1,-.07*g);x.quadraticCurveTo(0,-.07*g+R0*.34,R1,-.07*g);x.stroke();
  /* highlights */
  x.strokeStyle='rgba(255,255,255,.7)';x.lineCap='round';x.lineWidth=g*.03;x.beginPath();x.moveTo(-Rt(.66)*.8,-.66*g);x.lineTo(-Rt(.9)*.8,-.9*g);x.stroke();
  x.lineWidth=g*.022;x.beginPath();x.moveTo(-Rt(.16)*.72,-.16*g);x.lineTo(-Rt(.42)*.72,-.42*g);x.stroke();
  x.restore();
  /* ink outline + rim */
  x.lineJoin='round';x.strokeStyle=CREAM;x.lineWidth=lw*2.3;x.stroke(sil);
  x.strokeStyle=INK;x.lineWidth=lw;x.stroke(sil);x.stroke(mouth);
  x.lineWidth=lw*.5;x.strokeStyle='rgba(27,15,8,.6)';x.beginPath();x.ellipse(0,-g,R1-lw*1.6,R1*e-lw*1.4,0,0,6.2832);x.stroke();
  x.restore();
 }
 function drawSteam(){
  const a=clamp(1-th/.25,0,1)*clamp((f-.8)/.2,0,1);if(a<=0)return;const cx=pv0-R0,ty=fy-g-R1*.2;
  x.save();x.lineCap='round';x.lineWidth=Math.max(2,g*.014);
  for(let j=0;j<3;j++){const ph=t*1.6+j*2.1,ox=(j-1)*R1*.5,L=g*(.34+.08*Math.sin(t*.9+j));
   const gr=x.createLinearGradient(0,ty,0,ty-L);gr.addColorStop(0,'rgba(255,241,220,0)');gr.addColorStop(.3,'rgba(255,241,220,'+(.75*a)+')');gr.addColorStop(1,'rgba(255,241,220,0)');x.strokeStyle=gr;
   x.beginPath();for(let i=0;i<=14;i++){const u=i/14,X=cx+ox+Math.sin(u*5+ph)*g*.05*(.4+u),Y=ty-u*L;i?x.lineTo(X,Y):x.moveTo(X,Y)}x.stroke()}
  x.restore();
 }
 function render(){
  if(dirty&&(state==='tip'||state==='drain'||!path)){contour()}dirty=false;
  x.setTransform(DPR,0,0,DPR,0,0);x.clearRect(0,0,W,H);
  drawPuddle();drawGlass();drawDrops();drawSteam();
 }

 /* ---------- writing surface: text wraps to the puddle (CSS shape-outside floats built from the film mask) ---------- */
 function settle(){
  state='write';contour();
  const b=bl2,rows=[];let x0=1e9,x1=-1e9,k0=-1,k1=-1;
  const gr=pv0+slide+g*1.02+R1*.42+14,gt=fy-2*R1-14,gb=fy+16;
  for(let k=0;k<nz;k++){let best=0,bs=0,run=0;for(let i=0;i<=nx;i++){if(i<nx&&b[k*nx+i]>LV*1.6)run++;else{if(run>best){best=run;bs=i-run}run=0}}
   let L=bs*c,R=(bs+best)*c;const y=k*c;if(y>gt&&y<gb)L=Math.max(L,gr);
   if(R-L>c*9){rows.push([k,L,R]);if(k0<0)k0=k;k1=k;if(L<x0)x0=L;if(R>x1)x1=R}else rows.push(null)}
  if(k0<0){return}
  const PX=Math.max(18,c*2.2),top=(k0+1.6)*c,bot=(k1-1.2)*c,hgt=bot-top,wid=x1-x0,half=wid/2,barH=58;
  let lp='0 0',rp='100% 0',bx=x0+half,bw=0,pL=half+2,pR=-2;
  lp+=','+(half+2)+'px 0';rp+=',-2px 0';
  for(let k=k0;k<=k1;k++){const r=rows[k],y=k*c-top;if(y<0||y>hgt)continue;
   let L=half+2,R=-2;if(r&&y<hgt-barH&&r[2]-r[1]-2*PX>Math.min(190,wid*.45)){L=clamp(r[1]+PX-x0,0,half-20);R=clamp(r[2]-PX-x0-half,20,half)}
   if(r&&y>=hgt-barH*.8&&r[2]-r[1]>bw){bw=r[2]-r[1];bx=(r[1]+r[2])/2}
   const op=L<half,pop=pL<half;if(op!==pop){const yy=(y-(op?0:c*.5)).toFixed(1);lp+=','+(op?half+2:pL).toFixed(1)+'px '+yy+'px';rp+=','+(op?-2:pR).toFixed(1)+'px '+yy+'px'}
   lp+=','+L.toFixed(1)+'px '+y.toFixed(1)+'px';rp+=','+R.toFixed(1)+'px '+y.toFixed(1)+'px';pL=L;pR=R}
  lp+=','+(half+2)+'px 100%,0 100%';rp+=',-2px 100%,100% 100%';
  pad.style.cssText='left:'+x0+'px;top:'+top+'px;width:'+wid+'px;height:'+hgt+'px';
  fl.style.shapeOutside=fl.style.webkitShapeOutside='polygon('+lp+')';fr.style.shapeOutside=fr.style.webkitShapeOutside='polygon('+rp+')';
  ed.style.fontSize='';pad.hidden=false;bar.hidden=false;
  bar.style.left=bx+'px';bar.style.top=(bot-barH+8)+'px';
  fit();live.textContent='The chai has spilled. Write your thoughts on it, then press Serve it hot.';
  if(matchMedia('(hover:hover) and (pointer:fine)').matches)try{ed.focus({preventScroll:true})}catch(e){}
 }
 function centre(){const av=pad.clientHeight-barH_;for(let i=0;i<2;i++){const r=document.createRange();r.selectNodeContents(ed);let h=ed.firstChild?r.getBoundingClientRect().height:0;if(!h)h=parseFloat(getComputedStyle(ed).lineHeight)*1.5||40;if(!i)ed.style.paddingTop='0px';ed.style.paddingTop=Math.max(0,(av-h)/2)+'px'}}
 function fit(){ed.style.fontSize='';ed.style.paddingTop='0px';let s=parseFloat(getComputedStyle(ed).fontSize);if(!ed.firstChild)return centre();const r=document.createRange();r.selectNodeContents(ed);
  const over=()=>r.getBoundingClientRect().bottom-pad.getBoundingClientRect().top>pad.clientHeight-barH_;
  while(over()&&s>11){s-=1;ed.style.fontSize=s+'px'}centre()}
 function txt(){return ed.textContent.replace(/​/g,'')}
 ed.addEventListener('input',()=>{let v=txt();if(!v.trim()&&!v.length||v==='\n')ed.innerHTML='';
  if(v.length>MAX){ed.textContent=v.slice(0,MAX);const r=document.createRange();r.selectNodeContents(ed);r.collapse(false);const s=getSelection();s.removeAllRanges();s.addRange(r);v=txt()}
  cnt.textContent=v.length+'/'+MAX;cnt.classList.toggle('full',v.length>=MAX);fit()});
 ed.addEventListener('paste',e=>{e.preventDefault();const s=(e.clipboardData||window.clipboardData).getData('text/plain');document.execCommand('insertText',false,s)});
 ed.addEventListener('drop',e=>e.preventDefault());
 pad.addEventListener('pointerdown',e=>{if(e.target!==ed){e.preventDefault();ed.focus()}});
 go.addEventListener('click',submit);
 function submit(){
  if(state!=='write')return;const v=txt().trim();
  if(!v){bar.classList.remove('shake');void bar.offsetWidth;bar.classList.add('shake');ed.focus();return}
  sec.dispatchEvent(new CustomEvent('chai:submit',{bubbles:true,detail:{text:v}}));
  state='thanks';pad.hidden=bar.hidden=true;ed.innerHTML='';cnt.textContent='0/'+MAX;cnt.classList.remove('full');ed.blur();
  /* the rant flies up as a sticky note (assets/notes.js), then a thank-you pop-up; the chai drains only after that. Without notes.js: the old 5-second thanks note. */
  const fin=()=>{if(state!=='thanks')return;thx.hidden=true;thx.classList.remove('on');state='drain';vis=true;if(RM)sim(4);wake()};
  clearTimeout(thT);
  if(window.NOTES&&NOTES.rant&&NOTES.mounted)NOTES.rant(v,sec,fin);
  else{thx.hidden=false;thx.classList.remove('on');void thx.offsetWidth;thx.classList.add('on');thT=setTimeout(fin,5000)}
 }
 function tap(){
  if(state!=='idle')return;vis=true;state='tip';landed=false;om=1.25*Math.sqrt(2*30.8*(1-Math.cos(AL)));slV=0;tp=-1;acc=0;psi=psiV=0;
  hit.hidden=true;hint.hidden=true;live.textContent='The glass tips over and the chai spills across the page.';
  if(RM)sim(8);wake();
 }
 hit.addEventListener('click',tap);

 /* ---------- loop ---------- */
 let raf=0,last=0,vis=false,manual=false;
 function step(dt){t+=dt;physics(dt)}
 function sim(sec_){const n=Math.round(sec_*60);for(let i=0;i<n;i++)step(1/60);dirty=true;render()}
 function frame(now){raf=0;if(!vis||manual)return;const dt=Math.min(.033,(now-last)/1000||.016);last=now;
  if(dt>0){let left=dt;while(left>1e-5){const d=Math.min(left,1/120);step(d);left-=d}}
  render();if(state!=='write'&&state!=='thanks'||drops.length)raf=requestAnimationFrame(frame);else{render()}}
 function wake(){if(!raf&&vis&&!manual){last=performance.now();raf=requestAnimationFrame(frame)}}
 new IntersectionObserver(es=>{vis=es[es.length-1].isIntersecting;if(vis)wake()},{rootMargin:'80px 0px'}).observe(sec);
 function reset(){clearTimeout(thT);state='idle';th=om=slide=slV=0;f=1;psi=psiV=0;tp=-1;drops.length=0;path=null;pad.hidden=bar.hidden=thx.hidden=true;hit.hidden=hint.hidden=false;layout();liquid(0);dirty=true;render();wake()}
 let lw_=0;addEventListener('resize',()=>{const w=sec.clientWidth;if(state==='idle'||Math.abs(w-lw_)>2){lw_=w;reset()}});
 lw_=sec.clientWidth;layout();liquid(0);render();
 CH.reset=reset;
 CH.debug={tap,sim,submit,ed,get state(){return state},get f(){return f},get th(){return th},get film(){return film},set manual(v){manual=v;if(!v)wake()}};
};
})();
