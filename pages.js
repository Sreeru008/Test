/* Soulvved shared pages: theme toggle, theme hand-off between pages, FAQ accordion. */
(function () {
  var h = document.documentElement;                                    // theme class lives on <html> here
  var t = document.getElementById('dk');                               // the Dark Mode switch (same markup as home)
  var cur = function () { return h.classList.contains('dark') ? 'dark' : 'light'; };
  /* Every internal link carries ?m=light|dark so the next page opens in the same theme. */
  function sync() {
    var m = cur();
    [].forEach.call(document.querySelectorAll('a[href]'), function (a) {
      var u = a.getAttribute('data-h') || a.getAttribute('href');
      if (!u || /^(https?:|mailto:|tel:|#)/.test(u)) return;           // external / anchors untouched
      a.setAttribute('data-h', u);                                     // remember the clean href
      var p = u.split('#'), base = p[0].split('?')[0];
      a.setAttribute('href', base + '?m=' + m + (p[1] ? '#' + p[1] : ''));
    });
  }
  if (t) {
    t.checked = h.classList.contains('dark');                          // reflect the theme chosen before paint
    t.onchange = function () {                                         // visitor used the toggle: apply + remember
      h.classList.toggle('dark', t.checked);
      try { localStorage.setItem('dk', t.checked ? 1 : 0); } catch (e) {}
      sync();
    };
  }
  sync();
  /* FAQ accordion: one open at a time */
  [].forEach.call(document.querySelectorAll('.q button'), function (b) {
    b.onclick = function () {
      var q = b.parentNode, open = q.classList.contains('open');
      [].forEach.call(document.querySelectorAll('.q'), function (x) { x.classList.remove('open'); x.firstChild.setAttribute('aria-expanded', false); });
      if (!open) { q.classList.add('open'); b.setAttribute('aria-expanded', true); }
    };
  });
  /* Footer reveal: --fp (0..1) = how far the footer has risen into view (drives its rise + fade) */
  var f = document.getElementById('ft'), tk = 0;
  if (f) {
    var run = function () {
      tk = 0;
      var r = f.getBoundingClientRect(), vh = innerHeight;
      f.style.setProperty('--fp', Math.max(0, Math.min(1, (vh - r.top) / Math.max(1, Math.min(r.height, vh * .9)))).toFixed(3));
    };
    var q = function () { if (!tk) tk = requestAnimationFrame(run); };
    addEventListener('scroll', q, { passive: true }); addEventListener('resize', q); run();
    var up = document.getElementById('ftup');
    if (up) up.addEventListener('click', function (e) { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); });
  }
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
