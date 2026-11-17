/* Soulvved · Google Analytics 4 with a cookie choice.
   1) Put your measurement ID below (Google Analytics > Admin > Data streams > your web stream > "G-XXXXXXXXXX").
   2) Until an ID is set, nothing loads and no banner is shown.
   Google's script only loads AFTER the visitor presses Accept. The choice is remembered in this browser (localStorage "sv_ga").
   Lives in the site root (not /assets) so a changed ID is never held back by the 1-year cache of /assets. */
(function () {
  'use strict';
  var GA_ID = 'G-XXXXXXXXXX';          // <-- your GA4 measurement ID
  var DEMOGRAPHICS = true;             // true: Accept also allows Google's ad signals, which is what makes age group, gender and interests appear in GA4 reports
  var PRIVACY = '/safety-privacy';     // page that explains this (add the Terms / cookie text there)
  var KEY = 'sv_ga', d = document, w = window, loaded = false;
  if (!/^G-[A-Z0-9]{6,}$/.test(GA_ID) || GA_ID === 'G-XXXXXXXXXX') { w.svEvent = function () {}; return; }
  var get = function () { try { return localStorage.getItem(KEY) } catch (e) { return null } };
  var set = function (v) { try { localStorage.setItem(KEY, v) } catch (e) {} };
  function load() {
    if (loaded) return; loaded = true;
    w.dataLayer = w.dataLayer || [];
    w.gtag = function () { w.dataLayer.push(arguments) };
    var g = DEMOGRAPHICS ? 'granted' : 'denied';
    gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: g, ad_user_data: g, ad_personalization: g });
    gtag('js', new Date()); gtag('config', GA_ID);
    var s = d.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID; d.head.appendChild(s);
  }
  /* custom events from the page: svEvent('generate_lead', {method:'early_member'}); does nothing unless the visitor accepted */
  w.svEvent = function (n, p) { if (loaded && w.gtag) gtag('event', n, p || {}) };
  /* footer link or button can call this to let people change their mind */
  w.svCookies = function () { show(true) };
  function css() {
    if (d.getElementById('svc-css')) return;
    var s = d.createElement('style'); s.id = 'svc-css';
    s.textContent =
      '.svc{position:fixed;left:16px;bottom:16px;z-index:1400;width:min(420px,calc(100vw - 32px));box-sizing:border-box;padding:16px 18px;border-radius:16px;font:400 14px/1.5 Inter,Poppins,system-ui,sans-serif;background:#fff;color:#0a0a14;border:1px solid #e2e0f5;box-shadow:0 14px 40px rgba(46,26,140,.22);opacity:0;transform:translateY(14px);transition:opacity .3s,transform .3s}' +
      '.svc.on{opacity:1;transform:none}.svc p{margin:0 0 12px}.svc a{color:#5b4bff;font-weight:600}' +
      '.svc-b{display:flex;gap:10px;flex-wrap:wrap}.svc button{font:600 14px/1 inherit;font-family:inherit;border-radius:99px;padding:11px 18px;cursor:pointer;border:2px solid #5b4bff;min-height:42px}' +
      '.svc-y{background:#5b4bff;color:#fff}.svc-n{background:transparent;color:#5b4bff}.svc button:focus-visible{outline:3px solid #8a7dff;outline-offset:2px}' +
      'html.dark .svc,body.dark .svc{background:#150d33;color:#f5f2ff;border-color:#2f1b8f}html.dark .svc a,body.dark .svc a,html.dark .svc-n,body.dark .svc-n{color:#9c8cff}html.dark .svc button,body.dark .svc button{border-color:#9c8cff}html.dark .svc-y,body.dark .svc-y{background:#9c8cff;color:#0a0615}' +
      'body.genz .svc{background:#120a2b;color:#fff;border:3px solid #fff;border-radius:0;box-shadow:6px 6px 0 #2f1b8f}body.genz .svc a{color:#ffd23f}body.genz .svc button{border-radius:0;border:3px solid #fff;color:#fff;background:transparent}body.genz .svc-y{background:#ffd23f;color:#17131f;border-color:#fff}' +
      '@media(max-width:600px){.svc{left:10px;right:10px;bottom:10px;width:auto}}@media(prefers-reduced-motion:reduce){.svc{transition:none}}';
    d.head.appendChild(s);
  }
  function show(force) {
    if (d.getElementById('svc')) return;
    css();
    var b = d.createElement('div'); b.id = 'svc'; b.className = 'svc'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Cookie choice');
    b.innerHTML = '<p>We use Google Analytics cookies to see where visitors come from and what they like, so we can make Soulvved better. No names or emails are shared with it. <a href="' + PRIVACY + '">Read more</a></p>' +
      '<div class="svc-b"><button type="button" class="svc-y">Accept</button><button type="button" class="svc-n">No thanks</button></div>';
    d.body.appendChild(b);
    var done = function (v) { set(v); b.classList.remove('on'); setTimeout(function () { b.remove() }, 350); if (v === '1') load(); };
    b.querySelector('.svc-y').onclick = function () { done('1') };
    b.querySelector('.svc-n').onclick = function () { done('0') };
    requestAnimationFrame(function () { requestAnimationFrame(function () { b.classList.add('on') }) });
  }
  function start() {
    var c = get();
    if (c === '1') { load(); return; }
    if (c === '0') return;
    /* ask only once the page is really showing (after the loading screen), never on top of it */
    var t0 = Date.now();
    (function wait() {
      var h = d.documentElement;
      if ((h.classList.contains('gzl') && !h.classList.contains('lo')) && Date.now() - t0 < 30000) return void setTimeout(wait, 500);
      setTimeout(show, 1500);
    })();
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start); else start();
})();
