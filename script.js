const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const A=[["What does Soulvved mean?","Soul plus Wed. Two V shapes join to make a W, and the name reads as solved: finding your match, solved, together."],["How are the two logins connected?","The prospect invites parents with a code or link. Both accounts then share one shortlist, with labels showing who liked what."],["Does one subscription really cover both?","Yes. A single family plan includes the prospect's login and the parents' login."],["Can parents force a match?","No. A match needs the prospect's like. Parent likes act as strong suggestions."],["Is the parent chat safe?","It unlocks only after a mutual match, with reporting, blocking and moderation. Phone numbers stay hidden until both families agree."],["Who sees my data?","Only linked family members and your matches, within the limits you set."]];
const FH=A.map((a,i)=>`<div class="q${i?'':' open'}"><button aria-expanded="${!i}">${a[0]}</button><div><p>${a[1]}</p></div></div>`).join('');$('#faq2').innerHTML=FH;
$$('.q button').forEach(b=>b.onclick=()=>{const q=b.parentNode,o=q.classList.contains('open');$$('.q').forEach(x=>{x.classList.remove('open');x.firstChild.setAttribute('aria-expanded',false)});if(!o){q.classList.add('open');b.setAttribute('aria-expanded',true)}});
/* ---- Test API (testv1): OTP flow against the Soulvved backend ---- */
/* Browsers block direct calls from other origins (CORS), so off soulvved.com we go through the same-origin /api proxy (see vercel.json rewrites). */
const SV_API=/(^|\.)soulvved\.com$/.test(location.hostname)?'':'/api',SV={};
function svPick(o,ks){if(o==null)return;if(typeof o!=='object')return;for(const k of ks)if(o[k]!==undefined)return o[k];for(const k in o)if(o[k]&&typeof o[k]==='object'){const r=svPick(o[k],ks);if(r!==undefined)return r}}
function svLog(t,x){const p=$('#apil');if(p)p.textContent+=t+'\n'+(typeof x==='string'?x:JSON.stringify(x,null,1))+'\n\n'}
async function svApi(path,o){o=o||{};const h={'Accept':'application/json'};if(o.body)h['Content-Type']='application/json';if(o.auth&&SV.access)h.Authorization='Bearer '+SV.access;
 let r,t;try{r=await fetch(SV_API+path,{method:o.method||'GET',headers:h,body:o.body?JSON.stringify(o.body):undefined});t=await r.text()}catch(e){svLog(path,'Network/CORS error: '+e.message);throw new Error('Could not reach the server. Please try again.')}
 let j;try{j=JSON.parse(t)}catch(e){j=t}
 svLog((o.method||'GET')+' '+path+' → '+r.status,path==='/auth/verify-otp'||path==='/auth/refresh'?'(tokens hidden)':j);
 if(!r.ok){const d=j&&j.detail;throw new Error(typeof d==='string'?d:Array.isArray(d)&&d[0]&&d[0].msg?d[0].msg:'Request failed ('+r.status+').')}
 return j}
const d=$('#dlg');$$('[data-join]').forEach(b=>b.onclick=()=>{$('#fm').hidden=false;$('#otpb').hidden=true;$('#ok').hidden=true;$('#fs').hidden=true;d.showModal()});
$('#cl').onclick=()=>d.close();d.onclick=e=>{if(e.target==d)d.close()};
$('#f').onsubmit=e=>{e.preventDefault();const f=e.target,nm=f.n.value.trim().replace(/\s+/g,' '),em=f.e.value.trim(),fs=$('#fs');
 const bad=!nm?'Please enter your name.':!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)?'Please enter a valid email address.':'';
 if(bad){fs.textContent=bad;fs.hidden=false;(!nm?f.n:f.e).focus();return}
 let ph=f.p.value.replace(/[\s\-()]/g,'').replace(/^(\+91|91|0)(?=\d{10}$)/,'');
 if(!/^\d{10}$/.test(ph)){fs.textContent='Please enter a valid 10-digit mobile number.';fs.hidden=false;f.p.focus();return}
 fs.hidden=true;const b=f.querySelector('button');b.disabled=true;b.textContent='Sending OTP…';
 svApi('/auth/send-otp',{method:'POST',body:{phone:ph}}).then(r=>{
  SV.phone=ph;SV.name=nm;SV.email=em;SV.role=f.r.value;
  const o=svPick(r,['otp','code','OTP'])??(typeof r==='string'?r:JSON.stringify(r));
  $('#otpv').textContent=o;const ex=svPick(r,['expires_in']);$('#otpx').textContent=ex?'Expires in '+Math.round(ex/60*10)/10+' min.':'';$('#fm').hidden=true;$('#otpb').hidden=false;$('#fo').o.value='';$('#fo').o.focus();
 }).catch(er=>{fs.textContent=er.message;fs.hidden=false}).finally(()=>{b.disabled=false;b.textContent='Join the waitlist'})};
$('#fo').onsubmit=async e=>{e.preventDefault();const f=e.target,os=$('#os'),b=f.querySelector('button'),otp=f.o.value.trim();
 if(!otp){os.textContent='Please enter the OTP.';os.hidden=false;f.o.focus();return}
 os.hidden=true;b.disabled=true;b.textContent='Verifying…';
 try{
  const v=await svApi('/auth/verify-otp',{method:'POST',body:{phone:SV.phone,otp}});
  SV.access=svPick(v,['access_token','accessToken','token']);SV.refresh=svPick(v,['refresh_token','refreshToken']);
  if(!SV.refresh)throw new Error('Verified, but the server sent no refresh token.');
  const r=await svApi('/auth/refresh',{method:'POST',body:{refresh_token:SV.refresh}});
  SV.access=svPick(r,['access_token','accessToken','token'])||SV.access;
  window.svEvent&&svEvent('generate_lead',{method:'early_member'});
  $('#okt').textContent='Welcome, '+SV.name.split(' ')[0]+'!';$('#otpb').hidden=true;$('#ok').hidden=false;$('#usn').textContent='…';$('#usm').hidden=true;
  try{const c=await svApi('/admin/users/count',{auth:true});const n=svPick(c,['count','total','total_users','users','total_registered_users']);
   $('#usn').textContent=(n!==undefined&&typeof n!=='object')?n:JSON.stringify(c)}
  catch(er){$('#usn').textContent='—';$('#usm').textContent=er.message;$('#usm').hidden=false}
 }catch(er){os.textContent=er.message;os.hidden=false}
 finally{b.disabled=false;b.textContent='Verify OTP'}};

/* ---- Loading screen (Moonfall V6) ----
   The words, coin and wipe are a pure CSS timeline that starts at first paint (see the markup right after #gload),
   so it ALWAYS runs its full ~5 s, even if the page is ready sooner. JS only cleans up afterwards and re-starts it when GenZ is toggled on. */
const gLoad=$('#gload'),hEl=document.documentElement;
let gRun=hEl.classList.contains('gzl');                              // true when the page was opened with the loader already running
let p3=0;function loadP3(){if(p3)return;p3=1;const x=document.createElement('script');x.src='assets/phone3d.js';x.onload=()=>{if(window.P3D)P3D.onTap=()=>nextStep()};document.body.appendChild(x)}
function gEnd(){document.documentElement.classList.add('lo');if(!B.classList.contains('genz'))loadP3();if(!gRun)return;gRun=false;hEl.classList.remove('gzl');B.classList.remove('gzl-on');if(gLoad)gLoad.classList.remove('run')}   // unlock scrolling, hide the loader
/* The loader is a CSS timeline (words speed up, then slow down, then the logo holds). The heavy work (3D chai, notes, phone 3D) starts while the words slow down; the wipe only starts once the logo has been shown for 1 s AND that work is done (hard cap 10 s). */
window.__warm=window.__warm||[];
function runWarm(){if(document.body.classList.contains('genz'))__warm.forEach((f,i)=>setTimeout(f,i*1100));else loadP3()}
function ldReady(){const b=document.body;if(b.classList.contains('genz'))return !!(window.CHAI&&CHAI.mounted)&&!!(window.NOTES&&NOTES.mounted);return !!(window.P3D&&(P3D.ready||P3D.failed))}
function armLoader(){const R=window.__reel&&__reel.info,t0=R?R.t0:performance.now(),logoAt=R?R.logoAt:5150,warmAt=Math.max(1800,R?R.brakeAt:3000);setTimeout(runWarm,Math.max(0,warmAt-(performance.now()-t0)));
 (function chk(){const t=performance.now()-t0,min=logoAt+1000;if(t>=min&&(ldReady()||t>min+(hEl.classList.contains('ldt-genz')?3500:2500))){setTimeout(()=>{document.documentElement.classList.add('lo');if(gLoad)gLoad.classList.add('out')},ldReady()?300:0);setTimeout(gEnd,1500);return}setTimeout(chk,100)})()}
if(gLoad)gLoad.addEventListener('animationend',e=>{if(e.animationName==='glout')gEnd()});   // the wipe finished
if(gRun)armLoader();else{setTimeout(runWarm,800);try{if(localStorage.getItem('gz')!=='1')loadP3()}catch(e){loadP3()}}
function startLoader(th){if(gRun||!gLoad)return;gRun=true;hEl.classList.remove('ldt-light','ldt-dark','ldt-genz');hEl.classList.add('gzl','ldt-'+(th||'genz'));B.classList.add('gzl-on');
 document.documentElement.classList.remove('lo');gLoad.classList.remove('run','out');void gLoad.offsetWidth;gLoad.classList.add('run');if(window.__reel)__reel.start();armLoader()}   // restart the CSS timeline in GenZ colours
/* ---- GenZ Mode ---- */
const B=document.body,gzT=$('#gz'),mp=$('#mp');
function confetti(){const em=['✦','◆','●','✦'];for(let i=0;i<26;i++){const s=document.createElement('span');s.className='cf';s.textContent=em[i%em.length];s.style.color=['#9c8cff','#ffffff','#4b34c9','#ff6bd6'][i%4];s.style.fontSize=(14+Math.random()*16)+'px';s.style.cssText=`--x:${(Math.random()-.5)*innerWidth}px;--y:${(Math.random()-.3)*innerHeight*.9}px;--r:${Math.random()*720}deg`;B.appendChild(s);setTimeout(()=>s.remove(),1200)}}
let initG=true;
function setG(on,burst){B.classList.toggle('genz',on);if(!on&&!initG){sT=null;scrollTo({top:0,behavior:'instant'});requestAnimationFrame(()=>scrollTo({top:0,behavior:'instant'}))}   /* leaving GenZ always restarts the normal page from the top */
 gzT.checked=on;if(on)gKick();try{localStorage.setItem('gz',on?1:0)}catch(_){}if(on&&burst)confetti();if(!on){stopM();(window.requestIdleCallback||setTimeout)(()=>setTimeout(loadP3,500),{timeout:1500})}}
gzT.onchange=()=>{window.svEvent&&svEvent('genz_mode',{state:gzT.checked?'on':'off'});startLoader(gzT.checked?'genz':(B.classList.contains('dark')?'dark':'light'));setG(gzT.checked,true)};   /* the loader covers the switch in both directions, so the page rebuilds behind it */
/* GenZ toggle: drag the little profile card right (or tap / press Space). Everything visual is CSS driven by --p (0 off .. 1 on); the real work still happens in gzT.onchange / setG above. */
(function(){const sw=gzT&&gzT.closest('.sw');if(!sw)return;let p=0,drag=null;
 const set=v=>{const was=sw.classList.contains('full');p=v;sw.style.setProperty('--p',v);sw.classList.toggle('full',v>.95);sw.classList.toggle('idle',v<.02);if(!was&&v>.95){sw.classList.add('mm');clearTimeout(sw._mm);sw._mm=setTimeout(()=>sw.classList.remove('mm'),1500)}};
 const sync=()=>{if(!drag)set(gzT.checked?1:0)};set(gzT.checked?1:0);
 const trav=()=>(sw.clientWidth-sw.querySelector('.mc').offsetWidth-2*6)*(sw.getBoundingClientRect().width/sw.offsetWidth);
 const commit=on=>{gzT.checked=on;set(on?1:0);gzT.dispatchEvent(new Event('change',{bubbles:true}))};
 sw.addEventListener('pointerdown',e=>{if(e.button>0)return;drag={x:e.clientX,p,moved:false,t:performance.now()};try{sw.setPointerCapture(e.pointerId)}catch(_){}});
 sw.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x;if(!drag.moved&&Math.abs(dx)>4){drag.moved=true;sw.classList.add('drag')}if(drag.moved)set(Math.max(0,Math.min(1,drag.p+dx/trav())))});
 const end=e=>{if(!drag)return;const d=drag;drag=null;sw.classList.remove('drag');let on;
  if(!d.moved)on=!gzT.checked;else{const v=(e.clientX-d.x)/(performance.now()-d.t);on=Math.abs(v)>.5?v>0:p>.5}
  if(on!==gzT.checked)commit(on);else set(on?1:0)};
 sw.addEventListener('pointerup',end);sw.addEventListener('pointercancel',end);
 sw.addEventListener('click',e=>{if(e.target!==gzT)e.preventDefault()});   /* a click on the switch itself is handled above (else the label would flip it twice); the separate "GenZ Mode" text label still works */
 gzT.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();commit(!gzT.checked)}});
 gzT.addEventListener('change',sync);                                    /* the text label "GenZ Mode" also toggles it */
 new MutationObserver(sync).observe(B,{attributes:true,attributeFilter:['class']});   /* setG() from saved state / other code */
 requestAnimationFrame(sync)})();
try{if(localStorage.getItem('gz')=='1')setG(true)}catch(_){}
initG=false;
if(!location.hash){scrollTo(0,0);addEventListener('pageshow',e=>{if(e.persisted)scrollTo(0,0)})}
let lt=0;addEventListener('pointermove',e=>{if(!B.classList.contains('genz')||Date.now()-lt<70)return;lt=Date.now();const s=document.createElement('span');s.className='sp';s.textContent=['✦','◆','·'][Math.random()*3|0];s.style.color=['#9c8cff','#fff','#6c5ce7'][Math.random()*3|0];s.style.left=e.clientX+'px';s.style.top=e.clientY+'px';B.appendChild(s);setTimeout(()=>s.remove(),800)});
/* floating music player: tiny synthesized lofi loops (no audio files needed) */
const TR=[['Lofi mom-approved beats',[0,3,5,7,10],420,196],['Wedding bells (lofi remix)',[0,4,7,9,12],340,220],['Main character energy',[0,2,7,9,14],260,174]];
let ac,tm,st=0,tk=0;
function note(f,t,v){const o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.5);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+.5)}
function beat(){const[,sc,,root]=TR[tk],t=ac.currentTime;note(root*2**(sc[Math.random()*sc.length|0]/12),t,.07);if(st++%4==0)note(root/2,t,.12)}
function play(){ac=ac||new(window.AudioContext||window.webkitAudioContext)();ac.resume();clearInterval(tm);tm=setInterval(beat,TR[tk][2]);mp.classList.add('on');$('#pp').textContent='⏸'}
function stopM(){clearInterval(tm);mp.classList.remove('on');$('#pp').textContent='▶'}
$('#pp').onclick=()=>mp.classList.contains('on')?stopM():play();
$('#nx').onclick=()=>{tk=(tk+1)%TR.length;$('#tn').textContent=TR[tk][0];if(mp.classList.contains('on'))play()};

/* ---- Dark Mode (kept when GenZ Mode is toggled, restored when it is left) ---- */
const dkT=$('#dk');
function setD(on,save){document.documentElement.classList.add('nt-sw');B.classList.toggle('dark',on);requestAnimationFrame(()=>requestAnimationFrame(()=>document.documentElement.classList.remove('nt-sw')));dkT.checked=on;if(save)try{localStorage.setItem('dk',on?1:0)}catch(_){}}   // save only when the visitor used the toggle, so "no choice yet" keeps following the system
dkT.onchange=()=>setD(dkT.checked,true);
/* Auto theme: no saved choice -> follow the device setting (and keep following it if it changes) */
(()=>{let saved=null;try{saved=localStorage.getItem('dk')}catch(_){}
 const mq=matchMedia('(prefers-color-scheme: dark)');
 setD(saved===null?mq.matches:saved==='1');
 if(saved===null)(mq.addEventListener?mq.addEventListener.bind(mq,'change'):mq.addListener.bind(mq))(e=>{let s=null;try{s=localStorage.getItem('dk')}catch(_){}if(s===null)setD(e.matches)})})();
/* Logo: back to section 1 of whichever mode is showing */
const lgk=$('.lgk');if(lgk)lgk.addEventListener('click',e=>{e.preventDefault();if(B.classList.contains('genz'))sGo(0);else scrollTo({top:0,behavior:'smooth'})});

/* =====================================================================
   v2 Light / Dark page (identical behaviour in both themes)
   ===================================================================== */
const IC={spark:'<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/>',pad:'<path d="M6 11h4M8 9v4"/><path d="M15 12h.01M18 10h.01"/><path d="M17.3 5H6.7a4 4 0 0 0-4 3.6C2.6 9.4 2 14.5 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.4-1.4A2 2 0 0 1 9.8 16h4.4a2 2 0 0 1 1.4.6L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.5-.6-6.6-.7-7.4A4 4 0 0 0 17.3 5z"/>',film:'<rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/>',bolt:'<path d="M13 2L3 14h9l-1 8 10-12h-9z"/>',check:'<circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/>',flag:'<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>',clip:'<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',eye:'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',chat:'<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 4 11.5a8.5 8.5 0 0 1 8.5-8.5H13a8.5 8.5 0 0 1 8 8z"/>',lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',star:'<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/>',mark:'<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',bell:'<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',cal:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'};
const ico=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;
$$('[data-ic]').forEach(e=>e.innerHTML=ico(e.dataset.ic));
const touch=matchMedia('(hover:none)').matches;
if(touch)$('.n-copy+.n-scene .n-hint').textContent='Tap ✕ ★ ♥ to try the cards';
const FP=[['heart','Swipe discovery','Like, pass or shortlist with a smooth card stack.','Cards adapt to your preferences, so every swipe is worth your time.'],['target','Preference matching','Age, career, location, values and deal-breakers.','Set it once. Suggestions improve as you refine what matters.'],['eye',"Parents' picks",'See the profiles your parents liked and shortlisted.','Kept in their own tab and clearly labelled, never pushed on you.'],['chat','Match chat','Chat opens only after a mutual match.','Moderated, with report and block built in.'],['lock','Privacy controls','Pause your profile or choose what is visible.','You decide who sees what, and when.'],['star','Compatibility score','See why two people fit before you swipe.','A breakdown across values, lifestyle and goals.']];
const FQ=[['file','Detailed profiles','Family background, education, career and horoscope.','Everything a family looks at, in one structured view.'],['mark','Shortlist for your child','Like and shortlist; your child sees it all.','Every pick is labelled, so nothing feels hidden.'],['bell','Match alerts','Know the moment your child matches, and with whom.','An instant notification with the matched profile.'],['users','Parent-to-parent chat','Families talk once a match exists.','Private and moderated, unlocked only after a match.'],['cal','Meeting scheduler','Plan the first family meeting in a tap.','Propose times and confirm in one place.'],['shield','Verification','Request background checks and verified badges.','Added trust before the families meet.']];
const SETS=[{h:'Features built for <em class="gt">you</em>',l:'Everything you need to find someone who fits, at your own pace.',d:FP},{h:'Features built for <em class="gt">parents</em>',l:'Depth, clarity and a say in the decision, without taking over.',d:FQ}];
{const grid=$('#fg'),fh=$('#fh'),sw=$('#fsw');let cur=-1;
const draw=k=>{const S=SETS[k];$('#ft2').innerHTML=S.h;$('#ft3').textContent=S.l;
 grid.innerHTML=S.d.map((f,i)=>`<div class="n-fin" style="--i:${i%3};--r:${Math.floor(i/3)}"><div class="n-flip" tabindex="0"><div class="n-fi"><div class="n-ff"><span class="n-no">0${i+1}</span><div class="n-ti">${ico(f[0])}</div><h3>${f[1]}</h3><em>↻ ${touch?'tap':'hover'} to flip</em></div><div class="n-fb"><h3>${f[1]}</h3><p>${f[2]}</p><small>${f[3]}</small></div></div></div></div>`).join('');
 grid.querySelectorAll('.n-flip').forEach(c=>c.addEventListener('click',()=>c.classList.toggle('flip')))};
const pick=k=>{if(k===cur)return;const first=cur<0;cur=k;sw.dataset.on=k;$$('#fsw button').forEach(b=>b.setAttribute('aria-selected',+b.dataset.k===k));
 if(first){draw(k);return}
 fh.classList.add('out');grid.classList.add('out');setTimeout(()=>{draw(k);fh.classList.remove('out');grid.classList.remove('out')},220)};
$$('#fsw button').forEach(b=>b.onclick=()=>pick(+b.dataset.k));
sw.addEventListener('keydown',e=>{if(e.key==='ArrowRight')pick(1);if(e.key==='ArrowLeft')pick(0)});
pick(0)}
/* 3D tilt + glare on hover */
$$('[data-tilt]').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;el.style.setProperty('--rx',((.5-y)*12).toFixed(2)+'deg');el.style.setProperty('--ry',((x-.5)*14).toFixed(2)+'deg');el.style.setProperty('--mx',(x*100).toFixed(1)+'%');el.style.setProperty('--my',(y*100).toFixed(1)+'%')});el.addEventListener('pointerleave',()=>{el.style.setProperty('--rx','0deg');el.style.setProperty('--ry','0deg')})});
$$('.n-role').forEach(r=>{const set=v=>$('#roles').dataset.hover=v;r.addEventListener('pointerenter',()=>set(r.dataset.who));r.addEventListener('pointerleave',()=>set(''))});
/* hero: interactive 3D card deck */
const scene=$('#scene'),world=$('#world'),cards=$$('#deck .n-pc');let order=[...cards],busy=false,auto=0,hov=false;
const place=()=>order.forEach((c,i)=>c.dataset.pos=i);
function burst(){for(let i=0;i<7;i++){const h=document.createElement('span');h.className='n-hb';h.textContent='♥';h.style.cssText=`--x:${((Math.random()-.5)*170).toFixed(0)}px;--d:${(Math.random()*.25).toFixed(2)}s;--s:${(.8+Math.random()).toFixed(2)}`;world.appendChild(h);setTimeout(()=>h.remove(),1400)}}
function swipe(dir){if(busy)return;busy=true;const top=order[0];top.classList.add('fly-'+dir);if(dir!='l')burst();setTimeout(()=>{order.push(order.shift());top.classList.add('nt');top.classList.remove('fly-'+dir);place();void top.offsetWidth;top.classList.remove('nt');busy=false},480)}
$$('.n-acts button').forEach(b=>b.onclick=()=>swipe(b.dataset.a));
scene.addEventListener('pointerenter',()=>hov=true);
scene.addEventListener('pointermove',e=>{const r=scene.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;world.style.transform=`rotateY(${(x*28).toFixed(1)}deg) rotateX(${(-y*20).toFixed(1)}deg)`});
scene.addEventListener('pointerleave',()=>{hov=false;world.style.transform=''});
setInterval(()=>{if(hov||document.hidden||B.classList.contains('genz')||!$('#n1').classList.contains('live'))return;swipe(['r','l','u','r'][auto++%4])},3600);
/* phone story: 360° turn + new screen at every scroll step */
const phone=$('#phone'),spin=$('#pspin'),ptilt=$('#ptilt'),pst=$('#pstage'),SC=$$('#phone .n-scr'),stp=$$('#steps i'),chs=$('#chips');
for(let z=-8;z<=8;z+=1.6){const e=document.createElement('i');e.className='n-edge';e.style.transform=`translateZ(${z.toFixed(1)}px)`;phone.appendChild(e)}
const CH=[[['✓','92% compatible'],['★','Preferences matched'],['♥','Swipe to like']],[['♥','Liked by Mom'],['★','Shortlisted by Dad'],['✓','One shared list']],[['♥',"It's a match"],['✦','Parents notified'],['✓','Chat unlocked']]];
const paint=i=>chs.innerHTML=CH[i].map((c,k)=>`<div class="n-chip pc${k+1}" style="--k:${k}"><i>${c[0]}</i>${c[1]}</div>`).join('');
let cur=-1,want=0,tmr;paint(0);
function show(i){SC.forEach((s,k)=>s.classList.toggle('on',k==i));stp.forEach((s,k)=>s.classList.toggle('on',k==i));paint(i);chs.classList.remove('hide')}
function goStep(i){want=i;if(window.P3D)P3D.pending=i;if(i===cur)return;const first=cur<0;cur=i;chs.classList.add('hide');
 if(window.P3D&&P3D.ready&&!first){show(i);return}
 if(window.P3D&&P3D.ready){clearTimeout(tmr);SC.forEach((s,k)=>s.classList.toggle('on',k==i));stp.forEach((s,k)=>s.classList.toggle('on',k==i));P3D.go(i,first,()=>show(want));return}spin.classList.remove('spin');void spin.offsetWidth;spin.classList.add('spin');clearTimeout(tmr);tmr=setTimeout(()=>show(want),first?60:720)}
const nextStep=()=>{const n=(cur+1)%3,t=$('#n'+(n+2));if(window.P3D&&P3D.ready&&t)t.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});else goStep(n)};
phone.onclick=nextStep;phone.onkeydown=e=>{if(e.key=='Enter'||e.key==' '){e.preventDefault();nextStep()}};
pst.addEventListener('pointermove',e=>{const r=pst.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;ptilt.style.transform=`rotateY(${(x*30).toFixed(1)}deg) rotateX(${(-y*18).toFixed(1)}deg)`});
pst.addEventListener('pointerleave',()=>ptilt.style.transform='');
/* sizing so the 3D pieces fit every screen */
function fitN(){const m=innerWidth<=860,sw=scene.clientWidth;if(sw){const ws=Math.min(1,sw/470);scene.style.setProperty('--ws',ws.toFixed(3));scene.style.height=Math.round(540*ws+34)+'px'}
 const pw=pst.clientWidth,ph=pst.clientHeight;if(pw){const ps=Math.max(.36,Math.min(1,(ph-(m?58:150))/580,pw/(m?300:340)));pst.style.setProperty('--ps',ps.toFixed(3))}
 if(window.P3D&&P3D.resize)P3D.resize()}
fitN();addEventListener('resize',fitN);
/* scroll reveal, scenes, dots, progress */
const rio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');rio.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
$$('#nm .rv').forEach(el=>rio.observe(el));
const nsecs=$$('#nm section'),nd=$$('#nd a');
const nio=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const i=nsecs.indexOf(e.target);B.dataset.scene=i;nd.forEach((d,j)=>d.classList.toggle('on',i==j));nsecs.forEach(s=>s.classList.toggle('live',s==e.target));if(e.target.dataset.step!==undefined&&!(window.P3D&&P3D.ready))goStep(+e.target.dataset.step);fitN()}),{rootMargin:innerWidth<=860?'-72% 0px -22% 0px':'-45% 0px -45% 0px',threshold:0});
nsecs.forEach(s=>nio.observe(s));
const pr=$('#progi');addEventListener('scroll',()=>{pr.style.transform=`scaleX(${Math.min(1,scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)).toFixed(4)})`},{passive:true});
/* moving spotlight: follows the pointer on desktop, drifts with scroll on touch screens */
const spot=$('#spot'),coarse=matchMedia('(pointer:coarse)').matches;let sx=innerWidth/2,sy=innerHeight/3,tx=sx,ty=sy,raf=0;
function glide(){sx+=(tx-sx)*.08;sy+=(ty-sy)*.08;spot.style.transform=`translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px)`;raf=Math.abs(tx-sx)+Math.abs(ty-sy)>.5?requestAnimationFrame(glide):0}
function aim(x,y){tx=x;ty=y;if(!raf)raf=requestAnimationFrame(glide)}
addEventListener('pointermove',e=>{if(!coarse&&!B.classList.contains('genz'))aim(e.clientX,e.clientY)});
function driftAim(){const f=scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight);aim(innerWidth*(.5+.38*Math.sin(f*Math.PI*6)),innerHeight*(.2+.6*((f*5)%1)))}
if(coarse){addEventListener('scroll',driftAim,{passive:true});driftAim()}else aim(innerWidth*.7,innerHeight*.35);

const cl=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
/* =====================================================================
   GenZ: hero + 3-scene story + rant booth
   ===================================================================== */
const navEl=$('nav'),gOn=()=>B.classList.contains('genz'),RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
/* every .gj heading is split into letters: hover = a little jerk */
function gSplit(el){const t=el.textContent;el.setAttribute('aria-label',t);
 (function walk(n){[...n.childNodes].forEach(c=>{if(c.nodeType===3){const f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(w=>{if(!w)return;if(/^\s+$/.test(w)){f.appendChild(document.createTextNode(' '));return}const wd=document.createElement('span');wd.className='wd';wd.setAttribute('aria-hidden','true');[...w].forEach(ch=>{const s=document.createElement('span');s.className='ch';s.textContent=ch;wd.appendChild(s)});f.appendChild(wd)});c.replaceWith(f)}else if(c.nodeType===1&&c.tagName!=='BR')walk(c)})})(el)}
$$('#gm .gj').forEach(gSplit);
const jerk=(c,k)=>{if(!c||!c.classList.contains('ch')||c._j)return;c._j=1;const r=n=>((Math.random()-.5)*n*k).toFixed(2);c.style.setProperty('--jx',r(.5)+'em');c.style.setProperty('--jy',r(.6)+'em');c.style.setProperty('--jr',r(50)+'deg');c.classList.add('j');setTimeout(()=>{c.classList.remove('j');c._j=0},520)};
if(!RM)document.addEventListener('pointerover',e=>{if(!gOn())return;const c=e.target.closest&&e.target.closest('.gj .ch');if(!c)return;jerk(c,1);jerk(c.previousElementSibling,.5);jerk(c.nextElementSibling,.5)});

/* hero: the family chat types itself out, loops, and only runs while on screen */
(()=>{const box=$('#gchat');if(!box||RM)return;const ms=$$('#gchat .msg'),hero=$('#g1');let on=false,tm=0,i=0;
 const vis=()=>gOn()&&!document.hidden&&hero.getBoundingClientRect().bottom>0;
 const hideAll=()=>ms.forEach(m=>{m.classList.add('hid');m.classList.remove('pop')});
 function step(){clearTimeout(tm);if(!on||!vis()){tm=setTimeout(step,900);return}
  if(i>=ms.length){tm=setTimeout(()=>{hideAll();i=0;step()},4200);return}
  const m=ms[i],side=m.classList.contains('me')?'me':m.classList.contains('sys')?'sys':'mom';
  const t=document.createElement('p');t.className='msg typ '+side;t.innerHTML='<b>'+m.querySelector('b').textContent+'</b><i>·</i><i>·</i><i>·</i>';box.appendChild(t);
  tm=setTimeout(()=>{t.remove();m.classList.remove('hid');m.classList.add('pop');box.appendChild(m);i++;tm=setTimeout(step,m.classList.contains('sys')?2600:1500)},side==='me'?700:1000)}
 hideAll();new IntersectionObserver(es=>{on=es[0].isIntersecting;if(on&&!tm)step()}).observe(hero);addEventListener('load',()=>{on=true;step()})})();

/* stickers: drag them around, tap to pop */
function gBurst(x,y,n,list){for(let k=0;k<n;k++){const s=document.createElement('span');s.className='cf';s.textContent=list[k%list.length];const a=k/n*Math.PI*2+Math.random();s.style.cssText=`left:${x}px;top:${y}px;color:${['#ffd23f','#ff2d55','#9c8cff','#fff'][k%4]};--x:${(Math.cos(a)*(60+Math.random()*60)).toFixed(0)}px;--y:${(Math.sin(a)*(60+Math.random()*60)).toFixed(0)}px;--r:${(Math.random()*540-270).toFixed(0)}deg`;B.appendChild(s);setTimeout(()=>s.remove(),1200)}}
const coarseP=matchMedia('(pointer:coarse)').matches;
$$('#gm .st').forEach(st=>{let sx=0,sy=0,dx=0,dy=0,mv=0,on=false;
 st.addEventListener('pointerdown',e=>{on=true;mv=0;sx=e.clientX-dx;sy=e.clientY-dy;st.setPointerCapture(e.pointerId);st.classList.add('drag');e.stopPropagation()});
 st.addEventListener('pointermove',e=>{if(!on||coarseP)return;const hr=$('#g1').getBoundingClientRect(),r=st.getBoundingClientRect();let nx=e.clientX-sx,ny=e.clientY-sy;nx=Math.min(Math.max(nx,dx-(r.left-hr.left)),dx+(hr.right-r.right));ny=Math.min(Math.max(ny,dy-(r.top-hr.top)),dy+(hr.bottom-r.bottom));mv=Math.max(mv,Math.hypot(nx-dx,ny-dy));dx=nx;dy=ny;st.style.setProperty('--dx',dx+'px');st.style.setProperty('--dy',dy+'px')});
 const end=()=>{if(!on)return;on=false;st.classList.remove('drag');if(mv<6){st.classList.remove('pop');void st.offsetWidth;st.classList.add('pop');const r=st.getBoundingClientRect();gBurst(r.left+r.width/2,r.top+r.height/2,8,['♥','✦','◆'])}};
 st.addEventListener('pointerup',end);st.addEventListener('pointercancel',end)});
/* click or tap anywhere on the hero: a small heart floats up */
$('#g1').addEventListener('pointerdown',e=>{if(!gOn()||RM||e.target.closest('button,a,.win,.st'))return;const h=document.createElement('i');h.className='pxh';h.style.left=e.clientX+'px';h.style.top=e.clientY+'px';h.style.setProperty('--x',((Math.random()-.5)*60).toFixed(0)+'px');B.appendChild(h);setTimeout(()=>h.remove(),1000)});

/* ---- story: one pinned stage, three scrapbook-brat scenes, a scan line sweeps up between them ---- */
const gs=$('#gstory'),gst=$('#gstage'),gcv=$('#gcv'),gcx=gcv.getContext('2d'),gsc=$$('.gs-sc'),ghn=$('#ghn'),gpips=$$('.gs-pips i'),gdots=$$('#gd a'),ganc=[0,.9,1.75];
const TRN=[[.1,.85],[.95,1.7]],STOT=1.8;
let gL=null,gRaf=0,gLast=-9,gDPR=1;
const ease=t=>.5-Math.cos(Math.PI*t)/2;
const rnd=n=>{n=Math.sin(n*127.1+311.7)*43758.5453;return n-Math.floor(n)};
function gLay(){if(!bImgOn){bImgOn=1;BIMG.onload=gKick;BIMG.src='assets/proposal.png'}const W=gst.clientWidth,H=gst.clientHeight;if(!W||!H)return;
 gDPR=Math.min(devicePixelRatio||1,touch?1.5:2);gcv.width=Math.round(W*gDPR);gcv.height=Math.round(H*gDPR);
 const nh=(navEl?navEl.offsetHeight:70),hud=44,m=W<=820&&H>W*.95,pad=Math.round(Math.max(18,W*(m?.05:.06)));
 const S=Math.floor(m?Math.min(W-pad*2,(H-nh-hud)*(H<700?.31:.4)):Math.min(W*.4,(H-nh-hud)*.8,640));
 const y=m?nh+14:Math.round(nh+((H-nh-hud)-S)/2);
 gL={W,H,S,y,pad,m,xs:m?[Math.round((W-S)/2),Math.round((W-S)/2),Math.round((W-S)/2)]:[W-pad-S,pad,W-pad-S]};
 gst.dataset.m=m?1:0;gst.style.setProperty('--s',S+'px');gst.style.setProperty('--pad',pad+'px');gst.style.setProperty('--ay',y+'px');gst.style.setProperty('--hud',hud+'px');
 gs.style.height=Math.round(H*(STOT+1))+'px';ganc.forEach((v,k)=>$('#g'+(k+2)).style.top=Math.round(v*H)+'px');gLast=-9;gDot=-1;gKick()}
/* story art: flat "brat" cards (bold colour, thick black outline, hard violet shadow) with scrapbook doodles, drawn on the canvas */
const BI='#16101F',BCARD=['#ff4d94','#f9c62b','#80e6b0'],BCAP=[['"beta, shortlist','dekh li?"','- mom, 9:41 pm'],['"she said yes.','i knew it."','- mom, 9:43 pm'],['group renamed:','send photos here 📸','- whatsapp, 9:50 pm']],BSTK=[['swipe','right'],['mom','approved'],['say','yes?']],BTILT=[3,-3,2.5];
const bhp=(x,cx,cy,s)=>{x.beginPath();x.moveTo(cx,cy+s*.95);x.bezierCurveTo(cx-s*1.25,cy+s*.2,cx-s*.95,cy-s*.85,cx,cy-s*.3);x.bezierCurveTo(cx+s*.95,cy-s*.85,cx+s*1.25,cy+s*.2,cx,cy+s*.95);x.closePath()};
const bsh=(x,f,w)=>{x.lineJoin=x.lineCap='round';x.lineWidth=w||1.3;x.strokeStyle=BI;if(f){x.fillStyle=f;x.fill()}x.stroke()};
const blimb=(x,pts,w,c)=>{x.lineJoin=x.lineCap='round';x.beginPath();x.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)x.lineTo(pts[i],pts[i+1]);x.strokeStyle=BI;x.lineWidth=w+2.6;x.stroke();x.strokeStyle=c;x.lineWidth=w;x.stroke()};
const bst=(x,cx,cy,r)=>{x.beginPath();x.moveTo(cx,cy-r);x.quadraticCurveTo(cx,cy,cx+r,cy);x.quadraticCurveTo(cx,cy,cx,cy+r);x.quadraticCurveTo(cx,cy,cx-r,cy);x.quadraticCurveTo(cx,cy,cx,cy-r)};
const bdia=(x,cx,cy,s)=>{x.beginPath();x.moveTo(cx-2*s,cy-3*s);x.lineTo(cx+2*s,cy-3*s);x.lineTo(cx+3.4*s,cy-.8*s);x.lineTo(cx,cy+3*s);x.lineTo(cx-3.4*s,cy-.8*s);x.closePath();bsh(x,'#bfefff',1)};
function bHeart(x){bhp(x,50,50,33);bsh(x,'#c8ff3d',2.4);x.strokeStyle=BI;x.lineWidth=1.4;x.beginPath();x.moveTo(30,36);x.quadraticCurveTo(33,30,39,30);x.stroke()}
const BIMG=new Image();let bImgOn=0;
function bProp(x){
 x.fillStyle=BI;x.fillRect(6,85.4,88,2.4);
 if(BIMG.complete&&BIMG.naturalWidth)x.drawImage(BIMG,12.5,-1,75,86)}
const RIMG=new Image();let rImgOn=0;
function bRing(x){if(!rImgOn){rImgOn=1;RIMG.onload=gKick;RIMG.src='assets/rings.png'}
 if(RIMG.complete&&RIMG.naturalWidth)x.drawImage(RIMG,-3.85,11,107.7,82.6)}
const BART=[bHeart,bProp,bRing];
/* doodle set: every scene gets its own mix (stars, spirals, arrows, sprigs, bolts, flowers, ticks) */
const ddP='#ff7ac6',ddY='#ffd23f',ddM='#7ff0b0',ddW='#fff',ddV='#a99bff';
const ddSt=(x,cx,cy,r,c,f)=>{x.beginPath();for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,q=k%2?r*.48:r;x[k?'lineTo':'moveTo'](cx+Math.cos(a)*q,cy+Math.sin(a)*q)}x.closePath();x.strokeStyle=c;if(f){x.fillStyle=c;x.fill()}x.stroke()};
const ddBurst=(x,cx,cy,r,c)=>{ddSt(x,cx,cy,r*.62,c);x.beginPath();for(let k=0;k<8;k++){const a=k*Math.PI/4+.2;x.moveTo(cx+Math.cos(a)*r*.82,cy+Math.sin(a)*r*.82);x.lineTo(cx+Math.cos(a)*r*1.18,cy+Math.sin(a)*r*1.18)}x.stroke()};
const ddSpi=(x,cx,cy,r,c)=>{x.beginPath();for(let t=0;t<=19;t+=.4){const q=r*t/19,a=t;x[t?'lineTo':'moveTo'](cx+Math.cos(a)*q,cy+Math.sin(a)*q)}x.strokeStyle=c;x.stroke()};
const ddArr=(x,x1,y1,qx,qy,x2,y2,c)=>{x.strokeStyle=c;x.beginPath();x.moveTo(x1,y1);x.quadraticCurveTo(qx,qy,x2,y2);x.stroke();const a=Math.atan2(y2-qy,x2-qx);x.beginPath();x.moveTo(x2+Math.cos(a+2.6)*4,y2+Math.sin(a+2.6)*4);x.lineTo(x2,y2);x.lineTo(x2+Math.cos(a-2.6)*4,y2+Math.sin(a-2.6)*4);x.stroke()};
const ddSpr=(x,x1,y1,x2,y2,c)=>{x.strokeStyle=c;x.fillStyle=c;x.beginPath();x.moveTo(x1,y1);x.lineTo(x2,y2);x.stroke();const a=Math.atan2(y2-y1,x2-x1);for(let k=1;k<=4;k++){const px=x1+(x2-x1)*k/5,py=y1+(y2-y1)*k/5;[-1,1].forEach(sd=>{x.beginPath();x.ellipse(px+Math.cos(a+sd*1.2)*2.2,py+Math.sin(a+sd*1.2)*2.2,2.6,.95,a+sd*.75,0,7);x.fill()})}};
const ddTri=(x,cx,cy,r,rot,c,f)=>{x.beginPath();for(let k=0;k<3;k++){const a=rot+k*2.0944;x[k?'lineTo':'moveTo'](cx+Math.cos(a)*r,cy+Math.sin(a)*r)}x.closePath();x.strokeStyle=c;if(f){x.fillStyle=c;x.fill()}x.stroke()};
const ddRing=(x,cx,cy,r,c)=>{x.strokeStyle=c;x.beginPath();x.arc(cx,cy,r,0,7);x.stroke();x.beginPath();x.arc(cx,cy,r*.5,0,7);x.stroke()};
const ddBolt=(x,cx,cy,s,c)=>{x.strokeStyle=c;x.beginPath();x.moveTo(cx+s*.3,cy-s*1.5);x.lineTo(cx-s*.7,cy+s*.1);x.lineTo(cx+s*.1,cy+s*.1);x.lineTo(cx-s*.3,cy+s*1.5);x.lineTo(cx+s*.8,cy-s*.3);x.lineTo(cx,cy-s*.3);x.closePath();x.stroke()};
const ddFlo=(x,cx,cy,r,c)=>{x.strokeStyle=c;for(let k=0;k<8;k++){const a=k*Math.PI/4;x.beginPath();x.arc(cx+Math.cos(a)*r*.62,cy+Math.sin(a)*r*.62,r*.38,0,7);x.stroke()}x.beginPath();x.arc(cx,cy,r*.3,0,7);x.fillStyle=c;x.fill()};
const ddTick=(x,cx,cy,r,c)=>{x.strokeStyle=c;x.beginPath();x.arc(cx,cy,r,0,7);x.stroke();x.beginPath();x.moveTo(cx-r*.45,cy);x.lineTo(cx-r*.1,cy+r*.38);x.lineTo(cx+r*.5,cy-r*.35);x.stroke()};
const ddDots=(x,a,c)=>{x.fillStyle=c;a.forEach(p=>{x.beginPath();x.arc(p[0],p[1],p[2]||.9,0,7);x.fill()})};
const DD={"arrow":"M6 80C28 34 60 22 90 26M76 12L91 26L74 36M6 80l10-3M6 80l4-10M13 86l9-8M36 92h.1M50 95h.1M64 95h.1","sprig":"M10 92C28 62 52 40 90 10M20.3 76.5Q23 67.2 16.7 59.9Q14.1 69.2 20.3 76.5ZM20.3 76.5Q29.2 80.4 37.3 75Q28.4 71.2 20.3 76.5ZM30.8 63.5Q34.3 55.3 28.7 48.3Q25.2 56.5 30.8 63.5ZM30.8 63.5Q38.5 68.1 46.2 63.5Q38.4 58.9 30.8 63.5ZM42.5 51Q46.6 43.8 41.6 37.2Q37.5 44.4 42.5 51ZM42.5 51Q49.1 56 56.3 51.9Q49.7 46.9 42.5 51ZM55.8 38.5Q60.3 32.3 55.6 26.3Q51.1 32.4 55.8 38.5ZM55.8 38.5Q61.3 43.7 67.9 39.9Q62.4 34.6 55.8 38.5ZM70.8 25.5Q75.5 20.3 71.1 14.9Q66.3 20.1 70.8 25.5ZM70.8 25.5Q75.3 30.9 81.3 27.2Q76.7 21.8 70.8 25.5ZM90 10Q97.2 9.4 99.4 2.6Q92.2 3.1 90 10Z","spiral":"M54 50L54.3 51.3L54.2 52.8L53.5 54.4L52.3 55.7L50.6 56.7L48.5 57.1L46.2 56.8L44 55.8L42.1 54.1L40.7 51.7L40.1 48.8L40.4 45.8L41.6 42.8L43.8 40.2L46.8 38.3L50.3 37.3L54.2 37.5L58 38.8L61.3 41.3L63.9 44.8L65.4 49L65.5 53.7L64.2 58.3L61.5 62.5L57.6 65.8L52.8 67.9L47.3 68.5L41.8 67.4L36.7 64.6L32.6 60.4L29.8 55L28.7 48.8L29.4 42.5L32.1 36.5L36.5 31.4L42.3 27.7L49.1 25.9L56.3 26.2L63.3 28.6L69.4 33.1L74 39.2L76.6 46.6L76.9 54.6L74.9 62.5L70.5 69.6L64.2 75.3L56.3 78.8L47.6 80L38.7 78.5L30.6 74.3L23.9 67.9L19.3 59.7L17.2 50.3L18.1 40.6L21.7 31.3L28.1 23.5L36.6 17.7L46.5 14.7L57.1 14.7L67.3 17.8L76.4 23.9L83.3 32.5L87.5 42.8L88.5 54.2L86.1 65.4L80.5 75.7L71.9 83.9L61.2 89.3L49.3 91.5L37 89.9","sparkle":"M50 6Q50 50 94 50Q50 50 50 94Q50 50 6 50Q50 50 50 6Z","burst":"M50 33L54.4 43.9L66.2 44.7L57.1 52.3L60 63.8L50 57.5L40 63.8L42.9 52.3L33.8 44.7L45.6 43.9ZM77 50L96 50M74.3 61.7L84.2 66.5M66.8 71.1L78.7 86M56 76.3L58.5 87M44 76.3L39.8 94.8M33.2 71.1L26.3 79.7M25.7 61.7L8.6 70M23 50L12 50M25.7 38.3L8.6 30M33.2 28.9L26.3 20.3M44 23.7L39.8 5.2M56 23.7L58.5 13M66.8 28.9L78.7 14M74.3 38.3L84.2 33.5","rings":"M8 50a42 42 0 1 0 84 0a42 42 0 1 0 -84 0M25 50a25 25 0 1 0 50 0a25 25 0 1 0 -50 0M50 50h.1","heart":"M50 88C8 58 4 30 27 21C40 17 48 25 50 32C52 25 60 17 73 21C96 30 92 58 50 88Z","asterisk":"M50 8V92M14 29L86 71M14 71L86 29","plus":"M50 18V82M18 50H82","loop":"M6 72C36 82 72 66 78 46C82 30 62 24 54 38C46 54 70 76 94 58","bubble":"M14 18H86a6 6 0 0 1 6 6V58a6 6 0 0 1-6 6H46L28 84V64H14a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6ZM32 41h.1M50 41h.1M68 41h.1","check":"M8 50a42 42 0 1 0 84 0a42 42 0 1 0 -84 0M30 52L45 67L72 36","gem":"M20 36L36 14H64L80 36L50 86ZM20 36H80M36 14L46 36L50 14M64 14L54 36L50 14M46 36L50 86M54 36L50 86","camera":"M10 30H30L36 20H64L70 30H90V82H10ZM33 56a17 17 0 1 0 34 0a17 17 0 1 0 -34 0M76 40h6"};
Object.assign(DD,{"toast":"M15.5 13.7 C21 12.5 46.2 18.8 50.5 22.4 C45 23.6 19.8 17.3 15.5 13.7 ZM15.5 13.7 C10.7 33.1 16 44.7 25.7 47.2 C35.4 49.6 45.6 41.8 50.5 22.4 M15.5 24 C23.2 28.5 36.8 31.9 45.6 31.5 M25.7 47.2 L17.3 81.1 M5.6 82.3 C11.4 79.7 23.1 82.6 27 87.7 C21.2 90.3 9.5 87.4 5.6 82.3 ZM49.5 22.4 C53.8 18.8 79 12.5 84.5 13.7 C80.2 17.3 55 23.6 49.5 22.4 ZM49.5 22.4 C54.4 41.8 64.6 49.6 74.3 47.2 C84 44.7 89.3 33.1 84.5 13.7 M54.4 31.5 C63.2 31.9 76.8 28.5 84.5 24 M74.3 47.2 L82.7 81.1 M73 87.7 C76.9 82.6 88.6 79.7 94.4 82.3 C90.5 87.4 78.8 90.3 73 87.7 ZM50 -1Q50 5 56 5Q50 5 50 11Q50 5 44 5Q50 5 50 -1ZM60 9.4Q60 13 63.6 13Q60 13 60 16.6Q60 13 56.4 13Q60 13 60 9.4Z","flour":"M4 86C20 94 36 74 50 72C66 70 70 56 62 52M62 50C51.6 41.2 55.6 34 62 39.2C68.4 34 72.4 41.2 62 50Z","tiny":"M82 38C76.8 33.6 78.8 30 82 32.6C85.2 30 87.2 33.6 82 38ZM90 49C86.1 45.7 87.6 43 90 45C92.4 43 93.9 45.7 90 49ZM76 52.6C72.6 49.7 73.9 47.4 76 49.1C78.1 47.4 79.4 49.7 76 52.6ZM94 32.2C91.1 29.8 92.2 27.8 94 29.2C95.8 27.8 96.9 29.8 94 32.2Z"});
function bdd(x,n,cx,cy,s,r,c,w){x.save();x.translate(cx,cy);x.rotate(r*Math.PI/180);x.scale(s/100,s/100);x.translate(-50,-50);x.strokeStyle=c;x.lineWidth=(w||.7)*100/s;x.lineCap=x.lineJoin='round';x.stroke(new Path2D(DD[n]));x.restore()}
function bdoodle(x,i){const C='#f3eee3',P='#ff4d94',L='#ff7ac6',V='#9c8cff',Y='#ffd23f';
 if(i===0){bdd(x,'arrow',46,50,30,8,C);bdd(x,'bubble',-55,20,20,-8,V);bdd(x,'sparkle',55,-46,12,0,C);bdd(x,'sparkle',-55,52,9,0,L);bdd(x,'plus',-57,-8,6,0,V)}
 else if(i===1){bdd(x,'toast',52,40,24,0,C,.6);bdd(x,'flour',50,-46,26,0,C,.6);bdd(x,'tiny',54,-48,26,0,P,.6)}
 else{bdd(x,'camera',-55,16,20,-8,L);bdd(x,'sparkle',55,-46,12,0,Y)}}
function gArt(i,c0,lineY,fromTop){
 const {S,y,xs}=gL,D=gDPR,x=gcx,u=S*D/100,cx=(xs[i]+S/2)*D,cy=(y+S/2)*D,W=gcv.width,H=gcv.height;
 x.save();x.beginPath();if(lineY==null)x.rect(0,0,W,H);else if(fromTop)x.rect(0,0,W,lineY);else x.rect(0,lineY,W,H-lineY);x.clip();
 x.translate(cx,cy);x.scale(u,u);bdoodle(x,i);
 x.rotate(BTILT[i]*Math.PI/180);
 x.fillStyle='#5b4bff';x.fillRect(-41,-41,86,86);x.fillStyle=BCARD[i];x.fillRect(-43,-43,86,86);x.lineWidth=1.1;x.strokeStyle=BI;x.strokeRect(-43,-43,86,86);
 x.save();x.translate(-39,-42);x.scale(.78,.78);BART[i](x);x.restore();
 x.save();x.translate(-36,-34);x.rotate(-.21);x.beginPath();x.arc(0,0,12,0,7);x.fillStyle='#fff';x.fill();x.lineWidth=1.1;x.strokeStyle=BI;x.stroke();x.fillStyle=BI;x.textAlign='center';x.textBaseline='middle';x.font=`800 ${BSTK[i][1].length>6?4.3:5.2}px "Bricolage Grotesque",Arial,sans-serif`;x.fillText(BSTK[i][0],0,-2.9);x.fillText(BSTK[i][1],0,3);x.restore();
 x.save();x.translate(2,41);x.rotate(-.035);x.fillStyle='#16101f';x.fillRect(-36,-9.2,76,19);x.fillStyle='#fff';x.fillRect(-38,-11.2,76,19);x.lineWidth=.9;x.strokeStyle=BI;x.strokeRect(-38,-11.2,76,19);x.fillStyle=BI;x.textAlign='left';x.textBaseline='middle';x.font='800 4.4px "Bricolage Grotesque",Arial,sans-serif';x.fillText(BCAP[i][0],-34,-7.2);x.fillText(BCAP[i][1],-34,-1.9);x.fillStyle='#6b6280';x.font='600 3px "Bricolage Grotesque",Arial,sans-serif';x.fillText(BCAP[i][2],-34,3.6);x.restore();
 x.restore()}
function gDraw(s,top){const W=gcv.width,H=gcv.height,x=gcx;x.clearRect(0,0,W,H);
 let k=-1,t=0;for(let j=0;j<2;j++)if(s>TRN[j][0]&&s<TRN[j][1]){k=j;t=(s-TRN[j][0])/(TRN[j][1]-TRN[j][0])}
 const hold=s<=TRN[0][0]?0:s<TRN[1][0]?1:2;let act=hold,lf=-1;
 if(k<0){gArt(hold,0,null,0,0);gsc.forEach((e,i)=>{e.classList.toggle('on',i===hold);e.style.clipPath='';e.firstChild.style.setProperty('--ty','0px')})}
 else{const e=ease(t),lineY=Math.round((1-e)*H);lf=1-e;act=e>.5?k+1:k;
  gArt(k,0,lineY,true);gArt(k+1,0,lineY,false);
  x.fillStyle='#f3eee3';x.fillRect(0,lineY-Math.round(gDPR),W,Math.round(2*gDPR));
  const Hh=gL.H;gsc.forEach((el,i)=>{el.classList.toggle('on',i===k||i===k+1);if(i===k){el.style.clipPath=`inset(0 0 ${Hh-lineY/gDPR}px 0)`;el.firstChild.style.setProperty('--ty',(-(1-lf)*Hh*.1).toFixed(1)+'px')}else if(i===k+1){el.style.clipPath=`inset(${lineY/gDPR}px 0 0 0)`;el.firstChild.style.setProperty('--ty',(lf*Hh*.22).toFixed(1)+'px')}else el.style.clipPath=''})}
 ghn.textContent='0'+(act+1);gpips.forEach((p,i)=>p.classList.toggle('on',i<=act));
}
gst.addEventListener('focusin',e=>{const sc=e.target.closest&&e.target.closest('.gs-sc');if(!sc||sc.classList.contains('on'))return;const a=$('#g'+(+sc.dataset.i+2));if(a)sGo(a.getBoundingClientRect().top+scrollY)});
function gAct(s){for(let j=0;j<2;j++)if(s>TRN[j][0]&&s<TRN[j][1])return ease((s-TRN[j][0])/(TRN[j][1]-TRN[j][0]))>.5?j+1:j;return s<=TRN[0][0]?0:s<TRN[1][0]?1:2}
let gDot=-1;
function gFrame(){gRaf=0;if(!gOn()||!gL)return;const r=gs.getBoundingClientRect(),s=cl(-r.top/gL.H,0,STOT),q=Math.round(s*4000)/4000;
 const d=r.top>gL.H*.5?0:r.bottom<gL.H*.55?4:gAct(s)+1;if(d!==gDot){gDot=d;gdots.forEach((a,i)=>a.classList.toggle('on',i===d))}
 if(q===gLast)return;gLast=q;gDraw(s,scrollY+r.top)}
function gKick(){if(!gRaf)gRaf=requestAnimationFrame(gFrame)}
addEventListener('scroll',gKick,{passive:true});let gRt=0;addEventListener('resize',()=>{if(!gOn())return;clearTimeout(gRt);gRt=setTimeout(()=>{const W=gst.clientWidth,H=gst.clientHeight;if(gL&&W===gL.W&&Math.abs(H-gL.H)<120)return;gLay()},150)});
new MutationObserver(()=>{if(gOn())gLay()}).observe(B,{attributes:true,attributeFilter:['class']});
if(gOn())gLay();
/* GenZ: inertial wheel scrolling + eased anchor jumps (touch keeps its native momentum) */
let sT=null,sRaf=0;
const sMax=()=>document.documentElement.scrollHeight-innerHeight;
function sTick(){sRaf=0;if(sT==null)return;const d=sT-scrollY;if(Math.abs(d)<.6){scrollTo({top:sT,behavior:'instant'});sT=null;return}scrollTo({top:scrollY+d*.11,behavior:'instant'});sRaf=requestAnimationFrame(sTick)}
const sGo=y=>{sT=cl(y,0,sMax());if(!sRaf)sRaf=requestAnimationFrame(sTick)};
let tpT=0;addEventListener('wheel',e=>{if(!B.classList.contains('genz')||touch||RM||e.ctrlKey||e.defaultPrevented)return;const nw=performance.now();if(e.deltaMode===0&&(e.deltaX!==0||Math.abs(e.deltaY)<50||!Number.isInteger(e.deltaY)||Math.abs(e.deltaY)%10)){tpT=nw+1200;sT=null;return}if(nw<tpT){tpT=nw+1200;return}if(e.deltaMode===0&&Math.abs(e.deltaY)%100&&Math.abs(e.deltaY)%120)return;if(e.target.closest&&e.target.closest('dialog,input,textarea,select'))return;const d=$('#dlg');if(d&&d.open)return;e.preventDefault();sGo((sT==null?scrollY:sT)+e.deltaY*(e.deltaMode===1?34:e.deltaMode===2?innerHeight:1))},{passive:false});
document.addEventListener('click',e=>{if(!B.classList.contains('genz'))return;const a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a||a.getAttribute('href').length<2)return;const t=$(a.getAttribute('href'));if(!t)return;e.preventDefault();sGo(t.getBoundingClientRect().top+scrollY)});
addEventListener('keydown',e=>{if(sT!=null&&['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))sT=null});
addEventListener('pointerdown',()=>{sT=null});

/* keep pinned stages clear of the (variable height) nav on every screen size */
const setNH=()=>document.documentElement.style.setProperty('--nh',(navEl?navEl.offsetHeight:70)+'px');
setNH();addEventListener('resize',setNH);addEventListener('load',setNH);new MutationObserver(setNH).observe(B,{attributes:true,attributeFilter:['class']});

/* Moonfall V2: links to the shared pages carry ?m=light|dark so the page opens in the matching theme
   (Light page -> light; Dark or GenZ -> dark). Rewritten whenever the mode changes. */
(()=>{const upd=()=>{const m=(B.classList.contains('dark')||B.classList.contains('genz'))?'dark':'light';$$('a[data-pg]').forEach(a=>{const u=a.getAttribute('data-h')||a.getAttribute('href');a.setAttribute('data-h',u);const p=u.split('#');a.setAttribute('href',p[0].split('?')[0]+'?m='+m+(p[1]?'#'+p[1]:''))})};
 upd();new MutationObserver(upd).observe(B,{attributes:true,attributeFilter:['class']})})();
/* Shared pages link to index.html#join: open the waitlist dialog straight away */
if(location.hash==='#join')setTimeout(()=>{const j=$('[data-join]');if(j)j.click()},600);

/* Moonfall V3: footer reveal. --fp (0..1) = how much of the footer has risen into view; drives its parallax rise + fade.
   The side section dots hide while the footer is on screen. "Back to top" behaves like the logo. */
(()=>{const f=$('#ft');if(!f)return;let tk=0;
 const run=()=>{tk=0;const r=f.getBoundingClientRect(),vh=innerHeight,p=Math.max(0,Math.min(1,(vh-r.top)/Math.max(1,Math.min(r.height,vh*.9))));f.style.setProperty('--fp',p.toFixed(3));B.classList.toggle('ftv',r.top<vh*.8)};
 const q=()=>{if(!tk)tk=requestAnimationFrame(run)};
 addEventListener('scroll',q,{passive:true});addEventListener('resize',q);run();
 const up=$('#ftup');if(up)up.addEventListener('click',e=>{e.preventDefault();if(B.classList.contains('genz'))sGo(0);else scrollTo({top:0,behavior:'smooth'})})})();

/* GenZ section 6 · sticky-note wall (assets/notes.js) loads when it is near the viewport */
(function(){const el=$('#nts');if(!el)return;let busy=0;
 function go(){if(!document.body.classList.contains('genz')||(window.NOTES&&NOTES.mounted))return;
  if(window.NOTES){NOTES.mount(el);return}
  if(busy)return;busy=1;const s=document.createElement('script');s.src='assets/notes.js';s.onload=()=>{busy=0;if(document.body.classList.contains('genz'))NOTES.mount(el)};s.onerror=()=>{busy=0};document.head.appendChild(s)}
 new IntersectionObserver(es=>{if(es[es.length-1].isIntersecting)go()},{rootMargin:'900px 0px'}).observe($('#g5')||el);
 (window.__warm=window.__warm||[]).push(go);
})();
/* Spill the tea · draft: what someone has typed is kept in this browser (localStorage, never sent anywhere) for 7 days, put back into the text field after a reload and
   deleted once the rant is sent. A small "Your draft is saved" note shows beside the glass while a draft waits. Works with both chai.js and chai2d.js through their DOM only. */
(function(){const K='sv_chai_draft',TTL=7*864e5,MAX=500;let ed=null,tm=0,sec=$('#g5');if(!sec)return;
 const rd=()=>{try{const d=JSON.parse(localStorage.getItem(K)||'null');if(d&&typeof d.t==='string'&&d.t.trim()&&Date.now()-d.ts<TTL)return d.t.slice(0,MAX);localStorage.removeItem(K)}catch(e){}return''};
 const hint=t=>{const h=sec.querySelector('.chai-hint');if(h)h.textContent=t?'Tap to spill · Your draft is saved':'Tap to spill'};
 const txt=()=>ed?ed.textContent.replace(/​/g,'').slice(0,MAX):'';
 function save(){clearTimeout(tm);tm=0;if(!ed)return;const t=txt();try{if(t.trim())localStorage.setItem(K,JSON.stringify({t,ts:Date.now()}));else localStorage.removeItem(K)}catch(e){}hint(t.trim())}
 let atEnd=false;
 function toEnd(){if(!ed||!atEnd)return;atEnd=false;const r=document.createRange();r.selectNodeContents(ed);r.collapse(false);const g=getSelection();g.removeAllRanges();g.addRange(r)}
 function restore(){const d=rd();if(!d)return;if(!ed.textContent.trim()){ed.textContent=d;ed.dispatchEvent(new Event('input',{bubbles:true}));atEnd=true}hint(true)}   /* first focus after a restore puts the cursor after the saved text */
 function find(){const e=sec.querySelector('.chai-ed');if(!e||ed)return!!ed;ed=e;e.addEventListener('input',()=>{atEnd=false;clearTimeout(tm);tm=setTimeout(save,500)});e.addEventListener('focus',()=>{toEnd();requestAnimationFrame(toEnd)});restore();return true}
 if(!find()){const mo=new MutationObserver(()=>{if(find())mo.disconnect()});mo.observe(sec,{childList:true,subtree:true})}
 document.addEventListener('chai:submit',()=>{clearTimeout(tm);tm=0;try{localStorage.removeItem(K)}catch(e){}hint(false)});
 addEventListener('pagehide',()=>{if(tm)save()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&tm)save()});
})();
/* GenZ section 5 · spill the tea: the 3D chai glass (assets/chai.js) loads only when this section is near the viewport; without WebGL the 2D version (assets/chai2d.js) takes over */
(function(){const sec=$('#g5');if(!sec)return;let busy=0,src='assets/chai.js';
 function mount(){if(CHAI.mount(sec)===false&&CHAI.failed&&src!=='assets/chai2d.js'){src='assets/chai2d.js';window.CHAI=null;go()}}
 function go(){if(!document.body.classList.contains('genz')||(window.CHAI&&CHAI.mounted))return;
  if(window.CHAI&&CHAI.mount){mount();return}
  if(busy)return;busy=1;const s=document.createElement('script');s.src=src;s.onload=()=>{busy=0;if(document.body.classList.contains('genz'))mount()};s.onerror=()=>{busy=0;if(src!=='assets/chai2d.js'){src='assets/chai2d.js';go()}};   /* 3D file failed to download: use the 2D glass */document.head.appendChild(s)}
 new IntersectionObserver(es=>{if(es[0].isIntersecting)go()},{rootMargin:'900px 0px'}).observe(sec);
 (window.__warm=window.__warm||[]).unshift(go);
})();

/* favicon follows the site mode: Light page = white-theme icon, Dark or GenZ page = dark-theme icon */
(function(){
  var L=document.querySelectorAll('link.fv');if(!L.length)return;
  function isDark(){var b=document.body,h=document.documentElement;return b.classList.contains('dark')||b.classList.contains('genz')||h.classList.contains('dark')}
  function apply(){var m=isDark()?'dark':'light';
    L.forEach(function(l){l.setAttribute('media',l.getAttribute('href').indexOf('-'+m+'-')>-1?'all':'not all')})}
  var pend=0;function q(){if(pend)return;pend=1;setTimeout(function(){pend=0;apply()},30)}
  apply();
  new MutationObserver(q).observe(document.body,{attributes:true,attributeFilter:['class']});
  new MutationObserver(q).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
})();

/* ===== Section 8: Shape modern matchmaking (Light/Dark) ===== */
(function(){if(!$('#pad'))return;const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad=$('#pad'),ta=$('#ta'),go=$('#go'),cnt=$('#cnt'),drift=$('#drift'),act=$('#act'),MAX=500;
let busy=false;
const size=n=>{const w=innerWidth<560?.78:1;return Math.round((n<90?30:n<200?26:n<330?22:19)*w)+'px'};
let e=0,raf=0;function glow(){e*=.93;pad.style.setProperty('--e',e.toFixed(3));raf=e>.01?requestAnimationFrame(glow):0}
function fit(){ta.style.height='auto';ta.style.height=Math.max(ta.offsetHeight&&innerWidth<560?300:340,ta.scrollHeight)+'px'}
function upd(){const n=ta.value.length,has=n>0;pad.style.setProperty('--fs',size(n));
 pad.classList.toggle('has',has);const was=go.disabled;go.disabled=busy||ta.value.trim().length<3;if(was&&!go.disabled&&!RM){go.classList.remove('pop');void go.offsetWidth;go.classList.add('pop')}
 cnt.classList.toggle('warn',n>450);cnt.textContent=n>450?(MAX-n)+' left':n+' / '+MAX;fit()}
ta.addEventListener('input',()=>{upd();if(!RM){e=Math.min(1,e+.18);if(!raf)raf=requestAnimationFrame(glow)}});
ta.addEventListener('focus',()=>pad.classList.add('live'));ta.addEventListener('blur',()=>{if(!ta.value)pad.classList.remove('live')});
ta.addEventListener('keydown',ev=>{if(ev.key==='Enter'&&(ev.ctrlKey||ev.metaKey)){ev.preventDefault();go.click()}});
upd();

/* "Let it out": every word floats up and drifts away, then a quiet thank-you appears in the same space */
go.onclick=async()=>{const text=ta.value.trim();if(busy||text.length<3)return;busy=true;go.disabled=true;act.classList.add('hide');
 /* the future API call hooks onto this event: POST the text to the backend */
 document.dispatchEvent(new CustomEvent('thoughts:submit',{detail:{text}}));
 if(!RM){
  drift.style.cssText='font-size:'+getComputedStyle(ta).fontSize+';padding:'+getComputedStyle(ta).padding+';height:'+ta.offsetHeight+'px;visibility:visible';
  drift.innerHTML='';const parts=ta.value.split(/(\s+)/);
  parts.forEach(p=>{if(/^\s+$/.test(p)){drift.appendChild(document.createTextNode(p));return}const s=document.createElement('span');s.textContent=p;drift.appendChild(s)});
  drift.scrollTop=ta.scrollTop;ta.style.color='transparent';pad.style.setProperty('--e','.9');e=.9;if(!raf)raf=requestAnimationFrame(glow);
  const words=[...drift.querySelectorAll('span')],N=words.length,R=pad.getBoundingClientRect();
  const anims=words.map((w,i)=>{const r=w.getBoundingClientRect(),dx=(Math.random()-.5)*120+((r.left+r.width/2)-(R.left+R.width/2))*.15,up=200+Math.random()*180+(r.top-R.top)*.5,rot=(Math.random()-.5)*30;
   return w.animate([{transform:'none',opacity:1,filter:'blur(0)'},{transform:'translate('+dx*.3+'px,-14px) scale(1.04)',opacity:1,offset:.15},{transform:'translate('+dx+'px,'+(-up)+'px) rotate('+rot+'deg) scale(.7)',opacity:0,filter:'blur(6px)'}],
    {duration:1300+Math.random()*500,delay:Math.min(900,i*(900/Math.max(1,N))),easing:'cubic-bezier(.4,0,.6,1)',fill:'both'}).finished});
  await Promise.all(anims);drift.style.visibility='hidden';drift.innerHTML=''}
 ta.value='';ta.style.color='';upd();pad.classList.add('thanks');
 act.classList.add('done')};
/* the thank-you stays until the visitor chooses to write another */
$('#again').onclick=()=>{pad.classList.remove('thanks');act.classList.remove('done','hide');busy=false;upd();ta.focus({preventScroll:true})};
})();

/* perf: mark which sections are on screen so off-screen animations pause */
{const nv=new IntersectionObserver(es=>es.forEach(e=>e.target.classList.toggle('nv',e.isIntersecting)),{rootMargin:'120px 0px'});$$('#nm section').forEach(s=>nv.observe(s))}

/* the 3D phone turns exactly with the scroll: one full turn between each pair of story steps, screen swaps while its back faces you */
{const n3=$('#n3'),n4=$('#n4');let busy=0;
 const clamp=x=>Math.max(0,Math.min(1,x));
 function drive(){busy=0;if(!(window.P3D&&P3D.ready&&P3D.drive)||B.classList.contains('genz'))return;
  const vh=innerHeight,W=Math.min(vh*.9,720),c=vh/2,t1=clamp((c-(n3.getBoundingClientRect().top-W/2))/W),t2=clamp((c-(n4.getBoundingClientRect().top-W/2))/W);
  const st=t1<.5?0:t2<.5?1:2;P3D.drive((t1+t2)*Math.PI*2);P3D.scr(st);
  /* steps, chips and the highlighted text always follow the same scroll position as the phone */
  if(st!==cur)goStep(st);const ss=[$('#n2'),n3,n4];if(ss[0].getBoundingClientRect().top<vh&&n4.getBoundingClientRect().bottom>0)ss.forEach((s,k)=>s.classList.toggle('live',k===st))}
 const kick=()=>{if(!busy){busy=1;requestAnimationFrame(drive)}};
 addEventListener('scroll',kick,{passive:true});addEventListener('resize',kick);
 const iv=setInterval(()=>{if(window.P3D&&P3D.ready){kick();clearInterval(iv)}},400)}

/* ===== Section 5: who-am-I switch, shared picks, self-flipping plan ===== */
{/* hovering a shared item lights up its partner on the other login */
const roles=$('#roles'),RM5=matchMedia('(prefers-reduced-motion: reduce)').matches;
$$('#roles li.sh').forEach(li=>{li.addEventListener('pointerenter',()=>roles.classList.add('shon'));li.addEventListener('pointerleave',()=>roles.classList.remove('shon'))});
/* "I am ...": the matching login steps forward and the button speaks to you */
$$('#who button').forEach(b=>b.onclick=()=>{const on=b.getAttribute('aria-checked')!=='true';$$('#who button').forEach(x=>x.setAttribute('aria-checked',x===b&&on));
 roles.dataset.pick=on?b.dataset.w:'';$('#cta').textContent=!on?'Be an early member':b.dataset.w==='p'?'Join early as a prospect':'Join early as a parent'});
/* soft spotlight follows the pointer */
$$('#n5 .n-role').forEach(r=>r.addEventListener('pointermove',e=>{const b=r.getBoundingClientRect();r.style.setProperty('--mx',(e.clientX-b.left)+'px');r.style.setProperty('--my',(e.clientY-b.top)+'px')}));
/* tap a shared item: a pick travels through the plan to the other login, and the count goes up */
let n=0;const orb=$('#orb'),oc=$('#oc');
const mid=el=>{const r=el.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]};
$$('#roles li.sh').forEach(li=>li.addEventListener('click',()=>{const other=$$('#roles li.sh').find(x=>x!==li),from=mid(li),via=mid(orb),to=mid(other);
 const done=()=>{other.classList.remove('pop');void other.offsetWidth;other.classList.add('pop');n++;oc.textContent=n;$('#ocw').textContent=n>1?'picks seen by both':'pick seen by both';orb.classList.add('picked');oc.classList.remove('bump');void oc.offsetWidth;oc.classList.add('bump')};
 if(RM5){done();return}
 const f=document.createElement('div');f.className='n-fly5';f.textContent='♥';f.style.left=from[0]+'px';f.style.top=from[1]+'px';document.body.appendChild(f);
 f.animate([{transform:'translate(0,0) scale(.6)',opacity:0},{transform:'translate(0,0) scale(1)',opacity:1,offset:.1},{transform:`translate(${via[0]-from[0]}px,${via[1]-from[1]}px) scale(1.3)`,offset:.5},{transform:`translate(${to[0]-from[0]}px,${to[1]-from[1]}px) scale(.8)`,opacity:1}],{duration:1200,easing:'cubic-bezier(.45,0,.25,1)'}).finished.then(()=>{f.remove();done()})}));
/* the plan flips to explain itself */
/* the plan flips by itself every 3 seconds (pauses on hover, off screen or in a background tab); a tap flips it too */
let ft=0,hov5=false,vis5=false;const tick=()=>{clearInterval(ft);ft=setInterval(()=>{if(!hov5&&vis5&&!document.hidden&&!RM5)orb.classList.toggle('flip')},3000)};
orb.onclick=()=>{orb.classList.toggle('flip');tick()};
orb.addEventListener('pointerenter',()=>hov5=true);orb.addEventListener('pointerleave',()=>hov5=false);
new IntersectionObserver(es=>{vis5=es[0].isIntersecting}).observe(orb);tick();
}
