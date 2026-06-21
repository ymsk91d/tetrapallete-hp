/* ===== TetraPallete TOP (Concept C / bold colorful motion) ===== */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var PAL = ['#FF6FA5', '#F5921E', '#3FA9F5', '#33C892', '#B97BF0', '#F7B500'];

  /* ---- base UI ---- */
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  var hd = $('#hd');
  function onScroll() { if (hd) hd.classList.toggle('scrolled', window.scrollY > 40); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  var tog = $('#navtog'), nav = $('#nav');
  if (tog && nav) {
    tog.addEventListener('click', function () {
      var o = nav.classList.toggle('open'); tog.classList.toggle('open', o); tog.setAttribute('aria-expanded', o ? 'true' : 'false');
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); tog.classList.remove('open'); tog.setAttribute('aria-expanded', 'false'); }); });
  }

  var vids = $$('.vid');
  function stopVid(v) {
    if (!v.classList.contains('is-playing')) return;
    if (v._poster != null) v.innerHTML = v._poster; // restore thumbnail / play button / label
    v.classList.remove('is-playing');
  }
  vids.forEach(function (v) {
    v.addEventListener('click', function () {
      var id = v.getAttribute('data-yt');
      if (!id) { v.animate([{ transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 300 }); return; }
      if (v.classList.contains('is-playing')) return; // already playing this one
      if (v._poster == null) v._poster = v.innerHTML; // cache original markup on first play
      vids.forEach(stopVid); // only one plays at a time — stop any other
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      f.title = 'movie'; f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true;
      v.innerHTML = ''; v.appendChild(f);
      v.classList.add('is-playing');
    });
  });

  /* video works filter (video.html): .vtab[data-filter] toggles #works .vid[data-cat] */
  var vtabs = $$('.vtab');
  if (vtabs.length) {
    vtabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        vtabs.forEach(function (t) { t.classList.remove('is-active'); });
        tab.classList.add('is-active');
        var f = tab.getAttribute('data-filter');
        $$('#works .vid').forEach(function (v) {
          v.style.display = (f === 'all' || v.getAttribute('data-cat') === f) ? '' : 'none';
        });
      });
    });
  }

  /* contact form (contact.html): client-side validation only — sending not wired yet */
  var cform = $('#contactForm');
  if (cform) {
    cform.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!cform.checkValidity()) { cform.reportValidity(); return; }
      window.alert('送信機能は現在準備中です。お手数ですが tetra.pallete@gmail.com・お電話（03-6912-4276）・LINE よりご連絡ください。');
    });
  }

  var loader = $('#loader');
  function hideLoader() { if (loader) loader.classList.add('is-hidden'); }

  /* Scroll inertia / momentum removed entirely — plain native scroll (instant, no afterglow).
     In-page anchors stay smooth via CSS scroll-behavior + scroll-padding-top. */

  /* ---- background: WebGL fluid (real fluid motion), low-emission + cursor-only ---- */
  if (!reduce) initFluid();

  /* Real fluid sim via webgl-fluid-enhanced for the liquid motion the brand wants.
     White-out mitigation (the dye buffer is ADDITIVE, so heavy same-spot overlap can clip
     toward white — worst on slow grinding): keep per-splat dye LOW (brightness/splatRadius),
     fade FAST (high densityDissipation), and emit only along cursor travel (distance gate),
     so quick moves spread color across fresh cells (the look you liked) and a still/slow
     cursor barely adds dye. No bloom, no auto-emission, no mix-blend-mode dependency. */
  function initFluid() {
    var lib = window.WebGLFluidEnhanced && window.WebGLFluidEnhanced.default;
    var el = $('#fluid');
    if (!lib || !el) return;
    try {
      var sim = new lib(el), cv = null;
      var PALETTES = [
        ['#FF6FA8', '#FF8FC7', '#FFB04D', '#FF9B6B', '#B47CFF', '#C9A0FF', '#FFD24D', '#BFE2FF', '#BDF0DA'], // 鮮やかパステル
        ['#FF9EC6', '#FFC98A', '#9AD3FF', '#9CE9C6', '#CDA9FF', '#FFE08A'],                                  // 淡いパステル(導入時)
        ['#FF8A5C', '#FFA64D', '#FF6F8F', '#FFBE5C', '#FF9B6B', '#FFD27A'],                                  // 暖色のみ
        ['#FF6FA5', '#F5921E', '#3FA9F5', '#33C892', '#B97BF0', '#F7B500']                                   // ビビッド(ブランド色)
      ];
      // live-tunable fluid config (the tuning panel edits these)
      var CFG = {
        brightness: 0.09, curl: 22, splatRadius: 0.25, densityDissipation: 1.7, velocityDissipation: 0.2,
        pressure: 0.35, pressureIterations: 28, splatForce: 3600,
        bloom: false, bloomIntensity: 0, sunrays: false, shading: true, colorful: false, colorUpdateSpeed: 13,
        dyeResolution: 640, simResolution: 160, paletteIndex: 3
      };
      // cursor handler params (live-tunable)
      var P = { GATE: 16, MIN_SPEED: 0.16, FORCE: 1.4, STEPS: 18 };
      // persist tuning across reloads
      var STORE_KEY = 'tetraFluidTune_v1';
      try {
        var saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
        if (saved) {
          if (saved.CFG) for (var sk in saved.CFG) { if (Object.prototype.hasOwnProperty.call(CFG, sk)) CFG[sk] = saved.CFG[sk]; }
          if (saved.P) for (var sp in saved.P) { if (Object.prototype.hasOwnProperty.call(P, sp)) P[sp] = saved.P[sp]; }
          if (typeof saved.opacity === 'number') el.style.opacity = saved.opacity;
        }
      } catch (e) {}
      function saveStore() {
        try { localStorage.setItem(STORE_KEY, JSON.stringify({ CFG: CFG, P: P, opacity: parseFloat(getComputedStyle(el).opacity) })); } catch (e) {}
      }
      function applyCfg() {
        sim.setConfig({
          transparent: true, hover: false,
          colorPalette: PALETTES[CFG.paletteIndex] || PALETTES[0],
          brightness: CFG.brightness, curl: CFG.curl, splatRadius: CFG.splatRadius,
          densityDissipation: CFG.densityDissipation, velocityDissipation: CFG.velocityDissipation,
          pressure: CFG.pressure, pressureIterations: CFG.pressureIterations, splatForce: CFG.splatForce,
          bloom: CFG.bloom, bloomIntensity: CFG.bloomIntensity, sunrays: CFG.sunrays,
          shading: CFG.shading, colorful: CFG.colorful, colorUpdateSpeed: CFG.colorUpdateSpeed,
          dyeResolution: CFG.dyeResolution, simResolution: CFG.simResolution
        });
      }
      // structural options (bloom/shading/sunrays/colorful/resolutions) need a fresh sim to take effect
      function reinit() {
        try { sim.stop(); } catch (e) {}
        sim = new lib(el);
        applyCfg();
        sim.start();
        var cs = el.querySelectorAll('canvas');
        cv = cs[cs.length - 1];
        for (var i = 0; i < cs.length; i++) { if (cs[i] !== cv && cs[i].parentNode) cs[i].parentNode.removeChild(cs[i]); }
      }
      applyCfg();
      sim.start();
      cv = el.querySelector('canvas');

      // cursor-only, distance-gated + speed-gated + path-interpolated. No auto-emission.
      (function () {
        var lastX = null, lastY = null, lastT = 0;
        var pX = 0, pY = 0, pending = false, rafOn = false;
        function onMove(e) {
          if (!cv) return;
          pX = e.clientX; pY = e.clientY; pending = true;
          if (!rafOn) { rafOn = true; requestAnimationFrame(flush); }
        }
        function flush() {
          rafOn = false; if (!pending || !cv) return; pending = false;
          var r = cv.getBoundingClientRect(); if (r.width === 0) return;
          var x = pX - r.left, y = pY - r.top, now = performance.now();
          if (lastX === null) { lastX = x; lastY = y; lastT = now; return; }
          var dx = x - lastX, dy = y - lastY, dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < P.GATE) return;
          if (dist / Math.max(1, now - lastT) < P.MIN_SPEED) { lastX = x; lastY = y; lastT = now; return; }
          var steps = Math.min(P.STEPS, Math.max(1, Math.round(dist / P.GATE)));
          var sx = dx / steps, sy = dy / steps, scaleX = cv.width / r.width;
          var fx = sx * P.FORCE, fy = sy * P.FORCE;
          for (var i = 1; i <= steps; i++) {
            sim.splatAtLocation((lastX + sx * i) * scaleX, lastY + sy * i, fx, -fy);
          }
          lastX = x; lastY = y; lastT = now;
        }
        function reset() { lastX = null; lastY = null; }
        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('pointerdown', onMove, { passive: true });
        window.addEventListener('pointerout', reset, { passive: true });
        window.addEventListener('blur', reset, { passive: true });
        document.addEventListener('visibilitychange', function () { if (document.hidden) reset(); });
      })();

      // buildTunePanel(el, CFG, P, applyCfg, reinit, saveStore, STORE_KEY); // dev tuning panel — disabled for public release (baked defaults are in CFG/P above)
    } catch (e) {}
  }

  /* ---- live tuning panel (dev): full controls for the fluid, removed before publishing ---- */
  function buildTunePanel(fluidEl, CFG, P, applyCfg, reinit, saveStore, STORE_KEY) {
    if (document.getElementById('tunepanel')) return;
    // live sliders (instant): CFG ones call applyCfg, P ones just update the handler
    var specs = [
      { k: 'brightness', t: '吐出量(発色)', min: 0.02, max: 0.6, step: 0.01, o: CFG, cfg: true },
      { k: 'densityDissipation', t: '消える速さ', min: 0.5, max: 5, step: 0.1, o: CFG, cfg: true },
      { k: 'velocityDissipation', t: '速度減衰', min: 0.1, max: 1.5, step: 0.05, o: CFG, cfg: true },
      { k: 'curl', t: '渦の強さ', min: 0, max: 40, step: 1, o: CFG, cfg: true },
      { k: 'splatRadius', t: 'にじみ半径', min: 0.05, max: 0.4, step: 0.01, o: CFG, cfg: true },
      { k: 'pressure', t: '圧力(渦の締まり)', min: 0, max: 1.5, step: 0.05, o: CFG, cfg: true },
      { k: 'pressureIterations', t: '圧力反復', min: 1, max: 40, step: 1, o: CFG, cfg: true },
      { k: 'splatForce', t: 'splatForce', min: 1000, max: 8000, step: 100, o: CFG, cfg: true },
      { k: 'bloomIntensity', t: 'bloom強さ', min: 0, max: 2, step: 0.05, o: CFG, cfg: true },
      { k: 'colorUpdateSpeed', t: '色変化速度', min: 1, max: 40, step: 1, o: CFG, cfg: true },
      { k: 'FORCE', t: '注入速度', min: 0.2, max: 4, step: 0.1, o: P },
      { k: 'MIN_SPEED', t: '低速カット', min: 0, max: 0.5, step: 0.01, o: P },
      { k: 'GATE', t: '噴出間隔', min: 3, max: 16, step: 1, o: P },
      { k: 'STEPS', t: '最大噴出数', min: 4, max: 40, step: 1, o: P }
    ];
    var toggles = [
      { k: 'bloom', t: 'bloom(発光)' }, { k: 'shading', t: 'shading(陰影)' },
      { k: 'sunrays', t: 'sunrays(光線)' }, { k: 'colorful', t: 'colorful(虹色変化)' }
    ];
    var dyeOpts = [256, 512, 640, 768, 1024], simOpts = [64, 96, 110, 128, 160, 256];
    var palLabels = ['鮮やかパステル', '淡いパステル', '暖色のみ', 'ビビッド'];

    var css = 'position:fixed;left:14px;bottom:14px;z-index:99999;width:248px;max-height:88vh;overflow:auto;font:12px/1.35 system-ui,sans-serif;color:#fff;background:rgba(24,22,28,.92);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.15);border-radius:12px;padding:12px 13px;box-shadow:0 10px 30px rgba(0,0,0,.4)';
    var panel = document.createElement('div');
    panel.id = 'tunepanel'; panel.setAttribute('style', css);
    var lbl = 'display:block;margin:7px 0 2px;opacity:.85';
    var rng = 'width:100%;accent-color:#FF8FC7';
    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><b style="font-size:12px">🎛 流体調整 <span style="opacity:.6;font-weight:400">(公開前に消す)</span></b><button id="tpHide" style="background:none;border:none;color:#fff;cursor:pointer;font-size:15px;line-height:1">×</button></div>';
    html += '<div style="opacity:.5;margin:4px 0 2px;font-size:11px">▼ リアルタイム</div>';
    specs.forEach(function (s) {
      html += '<label style="' + lbl + '">' + s.t + ' <span id="tpv_' + s.k + '" style="float:right;opacity:.7">' + s.o[s.k] + '</span></label>' +
        '<input id="tp_' + s.k + '" type="range" min="' + s.min + '" max="' + s.max + '" step="' + s.step + '" value="' + s.o[s.k] + '" style="' + rng + '">';
    });
    var op = parseFloat(getComputedStyle(fluidEl).opacity) || 0.82;
    html += '<label style="' + lbl + '">全体の濃さ <span id="tpv_op" style="float:right;opacity:.7">' + op + '</span></label><input id="tp_op" type="range" min="0.3" max="1" step="0.02" value="' + op + '" style="' + rng + '">';
    html += '<label style="' + lbl + '">パレット</label><select id="tp_pal" style="width:100%;background:#2a2630;color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:6px;padding:4px">';
    palLabels.forEach(function (n, i) { html += '<option value="' + i + '"' + (i === CFG.paletteIndex ? ' selected' : '') + '>' + n + '</option>'; });
    html += '</select>';
    html += '<div style="opacity:.5;margin:11px 0 2px;font-size:11px">▼ 構造（「再生成」で反映）</div>';
    toggles.forEach(function (s) {
      html += '<label style="display:flex;align-items:center;gap:6px;margin:4px 0;opacity:.9"><input id="tp_' + s.k + '" type="checkbox"' + (CFG[s.k] ? ' checked' : '') + '>' + s.t + '</label>';
    });
    html += '<label style="' + lbl + '">dye解像度(精細さ)</label><select id="tp_dye" style="width:100%;background:#2a2630;color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:6px;padding:4px">';
    dyeOpts.forEach(function (n) { html += '<option value="' + n + '"' + (n === CFG.dyeResolution ? ' selected' : '') + '>' + n + '</option>'; });
    html += '</select>';
    html += '<label style="' + lbl + '">sim解像度(流れの粒度)</label><select id="tp_sim" style="width:100%;background:#2a2630;color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:6px;padding:4px">';
    simOpts.forEach(function (n) { html += '<option value="' + n + '"' + (n === CFG.simResolution ? ' selected' : '') + '>' + n + '</option>'; });
    html += '</select>';
    html += '<button id="tpRe" style="margin-top:9px;width:100%;padding:7px;border:0;border-radius:8px;background:#7FB8FF;color:#13243a;font-weight:700;cursor:pointer">構造を再生成</button>';
    html += '<div style="display:flex;gap:6px;margin-top:7px"><button id="tpCopy" style="flex:1;padding:7px;border:0;border-radius:8px;background:#FF8FC7;color:#3a1f2c;font-weight:700;cursor:pointer">現在値をコピー</button><button id="tpReset" style="padding:7px 10px;border:1px solid rgba(255,255,255,.25);border-radius:8px;background:transparent;color:#fff;cursor:pointer">初期化</button></div>';
    html += '<div style="opacity:.5;font-size:10px;margin-top:5px">設定はこの端末に自動保存されます</div>';
    html += '<textarea id="tpOut" readonly style="margin-top:7px;width:100%;height:64px;font:11px monospace;background:rgba(0,0,0,.35);color:#cfe;border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:5px;resize:none;display:none"></textarea>';
    panel.innerHTML = html;
    document.body.appendChild(panel);

    var reopen = document.createElement('button');
    reopen.id = 'tpOpen'; reopen.textContent = '🎛';
    reopen.setAttribute('style', 'position:fixed;left:14px;bottom:14px;z-index:99999;width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(24,22,28,.9);color:#fff;font-size:18px;cursor:pointer;display:none;box-shadow:0 6px 18px rgba(0,0,0,.35)');
    document.body.appendChild(reopen);

    function fmt() {
      return 'CFG brightness:' + CFG.brightness + ' densityDissipation:' + CFG.densityDissipation + ' velocityDissipation:' + CFG.velocityDissipation + ' curl:' + CFG.curl + ' splatRadius:' + CFG.splatRadius +
        ' pressure:' + CFG.pressure + ' pressureIterations:' + CFG.pressureIterations + ' splatForce:' + CFG.splatForce +
        ' bloom:' + CFG.bloom + ' bloomIntensity:' + CFG.bloomIntensity + ' sunrays:' + CFG.sunrays + ' shading:' + CFG.shading + ' colorful:' + CFG.colorful + ' colorUpdateSpeed:' + CFG.colorUpdateSpeed +
        ' dyeResolution:' + CFG.dyeResolution + ' simResolution:' + CFG.simResolution + ' paletteIndex:' + CFG.paletteIndex +
        '\nHANDLER FORCE:' + P.FORCE + ' MIN_SPEED:' + P.MIN_SPEED + ' GATE:' + P.GATE + ' STEPS:' + P.STEPS +
        '\nopacity:' + parseFloat(getComputedStyle(fluidEl).opacity).toFixed(2);
    }
    specs.forEach(function (s) {
      var input = document.getElementById('tp_' + s.k), out = document.getElementById('tpv_' + s.k);
      input.addEventListener('input', function () {
        var val = parseFloat(input.value);
        s.o[s.k] = (s.step >= 1) ? Math.round(val) : val;
        out.textContent = s.o[s.k];
        if (s.cfg) applyCfg();
        saveStore();
      }, { passive: true });
    });
    var opIn = document.getElementById('tp_op'), opOut = document.getElementById('tpv_op');
    opIn.addEventListener('input', function () { fluidEl.style.opacity = opIn.value; opOut.textContent = opIn.value; saveStore(); }, { passive: true });
    document.getElementById('tp_pal').addEventListener('change', function () { CFG.paletteIndex = parseInt(this.value, 10); applyCfg(); saveStore(); }, { passive: true });
    toggles.forEach(function (s) {
      document.getElementById('tp_' + s.k).addEventListener('change', function () { CFG[s.k] = this.checked; reinit(); saveStore(); }, { passive: true });
    });
    document.getElementById('tp_dye').addEventListener('change', function () { CFG.dyeResolution = parseInt(this.value, 10); reinit(); saveStore(); }, { passive: true });
    document.getElementById('tp_sim').addEventListener('change', function () { CFG.simResolution = parseInt(this.value, 10); reinit(); saveStore(); }, { passive: true });
    document.getElementById('tpRe').addEventListener('click', function () { reinit(); }, { passive: true });
    document.getElementById('tpReset').addEventListener('click', function () { try { localStorage.removeItem(STORE_KEY); } catch (e) {} location.reload(); }, { passive: true });
    document.getElementById('tpCopy').addEventListener('click', function () {
      var ta = document.getElementById('tpOut'); ta.style.display = 'block'; ta.value = fmt(); ta.select();
      try { navigator.clipboard.writeText(ta.value); } catch (e) { try { document.execCommand('copy'); } catch (e2) {} }
    });
    document.getElementById('tpHide').addEventListener('click', function () { panel.style.display = 'none'; reopen.style.display = 'block'; });
    reopen.addEventListener('click', function () { panel.style.display = 'block'; reopen.style.display = 'none'; });
  }

  /* ---- motion ---- */
  var motion = !!(window.gsap && window.ScrollTrigger) && !reduce;
  if (motion) { try { initMotion(); } catch (e) { fallback(); hideLoader(); } }
  else { fallback(); hideLoader(); }

  function fallback() {
    $$('.reveal-pop').forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
    $$('.count').forEach(function (el) {
      if ('IntersectionObserver' in window && !reduce) {
        new IntersectionObserver(function (es, io) { es.forEach(function (e) { if (e.isIntersecting) { countUp(el); io.disconnect(); } }); }, { threshold: .6 }).observe(el);
      } else { el.textContent = el.getAttribute('data-target') + (el.getAttribute('data-suffix') || ''); }
    });
  }
  function countUp(el) {
    var t = parseFloat(el.getAttribute('data-target')) || 0, sf = el.getAttribute('data-suffix') || '', d = 1300, s = null;
    function step(ts) { if (!s) s = ts; var p = Math.min((ts - s) / d, 1), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(t * e) + (p === 1 ? sf : ''); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }

  function initMotion() {
    var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('gsap');

    // Native scroll (no JS smooth-scroll): instant input response, no startup cushion.
    // JS inertia (Lenis) buffers the wheel through a rAF loop, which — combined with the
    // always-on WebGL fluid stealing frames — produced the "delay before it moves" feel.
    // In-page anchors stay smooth via CSS scroll-behavior + scroll-padding-top.

    function splitK(el) {
      var chars;
      if (window.SplitType) { chars = new window.SplitType(el, { types: 'chars' }).chars; }
      else { chars = el.textContent.split('').map(function (ch) { var s = document.createElement('span'); s.textContent = ch; s.style.display = 'inline-block'; el.appendChild(s); return s; }); if (chars.length) el.firstChild && el.removeChild(el.firstChild); }
      // refined: single-color kinetic (chars inherit the heading colour; no per-char rainbow)
      chars.forEach(function (c) { c.classList.add('ch'); });
      return chars;
    }

    /* hero kinetic */
    var heroH1 = $('.hero__h1[data-kinetic]');
    var heroChars = heroH1 ? splitK(heroH1) : [];
    gsap.set(heroChars, { yPercent: 115, opacity: 0 });

    /* section kinetic headings */
    $$('.sh__ja[data-kinetic], .aud__h[data-kinetic]').forEach(function (el) {
      var chars = splitK(el);
      gsap.set(chars, { yPercent: 115, opacity: 0 });
      gsap.to(chars, { yPercent: 0, opacity: 1, stagger: .035, duration: .7, ease: 'back.out(1.6)', scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
    });

    /* reveal-pop (exclude hero, handled in opening) */
    var rp = gsap.utils.toArray('.reveal-pop').filter(function (el) { return !el.closest('.hero'); });
    gsap.set(rp, { opacity: 0, y: 30, scale: .96 });
    ScrollTrigger.batch(rp, { start: 'top 88%', onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, scale: 1, duration: .7, stagger: .08, ease: 'back.out(1.5)', overwrite: true }); } });

    /* counts */
    $$('.count').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-target')) || 0, sf = el.getAttribute('data-suffix') || '', o = { v: 0 };
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () { gsap.to(o, { v: target, duration: 1.4, ease: 'power2.out', snap: { v: 1 }, onUpdate: function () { el.textContent = Math.round(o.v) + (o.v >= target ? sf : ''); } }); } });
    });

    /* opening timeline */
    var tl = gsap.timeline({ defaults: { ease: 'back.out(1.5)' } });
    tl.to('#loader', { autoAlpha: 0, duration: .5, delay: .9 })
      .to(heroChars, { yPercent: 0, opacity: 1, stagger: .05, duration: .85, ease: 'back.out(1.7)' }, '-=0.2')
      .to('.hero .reveal-pop', { opacity: 1, y: 0, scale: 1, stagger: .08, duration: .6 }, '-=0.45');

    /* magnetic + tilt (fine pointer) */
    if (window.matchMedia('(pointer:fine)').matches) {
      $$('.magnetic').forEach(function (b) {
        b.addEventListener('mousemove', function (e) { var r = b.getBoundingClientRect(); gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .3, y: (e.clientY - r.top - r.height / 2) * .4, duration: .4, ease: 'power3.out' }); });
        b.addEventListener('mouseleave', function () { gsap.to(b, { x: 0, y: 0, duration: .5, ease: 'elastic.out(1,.4)' }); });
      });
      $$('.tilt').forEach(function (card) {
        card.addEventListener('mousemove', function (e) { var r = card.getBoundingClientRect(); gsap.to(card, { rotateY: ((e.clientX - r.left) / r.width - .5) * 7, rotateX: -((e.clientY - r.top) / r.height - .5) * 7, y: -6, duration: .3, ease: 'power2.out', transformPerspective: 800 }); });
        card.addEventListener('mouseleave', function () { gsap.to(card, { rotateY: 0, rotateX: 0, y: 0, duration: .5, ease: 'power3.out' }); });
      });
    }
    ScrollTrigger.refresh();
  }

  /* ===== reactive confetti ===== */
  function reactiveConfetti() {
    var c = $('#confetti'); if (!c) return;
    var x = c.getContext('2d'), W, H, DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    var COL = ['#FFB45A', '#FF6FA5', '#3FA9F5', '#33C892', '#B97BF0', '#FFD24A'];
    var mx = -999, my = -999, ps = [];
    function rs() { W = window.innerWidth; H = window.innerHeight; c.width = W * DPR; c.height = H * DPR; x.setTransform(DPR, 0, 0, DPR, 0, 0); ps = []; var n = Math.min(56, Math.round(W / 26)); for (var i = 0; i < n; i++) ps.push(mk(true)); }
    function mk(init) { return { x: Math.random() * W, y: init ? Math.random() * H : -20, w: 7 + Math.random() * 8, h: 10 + Math.random() * 10, c: COL[(Math.random() * COL.length) | 0], rot: Math.random() * 7, vr: (Math.random() - .5) * .08, vy: .5 + Math.random() * 1.1, sway: .6 + Math.random() * 1.2, ph: Math.random() * 7, round: Math.random() > .6 }; }
    var t = 0, raf;
    function draw() {
      x.clearRect(0, 0, W, H); t += .012;
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i], dx = p.x - mx, dy = p.y - my, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 120) { var f = (120 - d) / 120 * 4; p.x += dx / d * f; p.y += dy / d * f; }
        p.y += p.vy; p.x += Math.sin(t + p.ph) * p.sway * .5; p.rot += p.vr;
        if (p.y > H + 20) { ps[i] = mk(false); continue; }
        x.save(); x.translate(p.x, p.y); x.rotate(p.rot); x.globalAlpha = .9; x.fillStyle = p.c;
        if (p.round) { x.beginPath(); x.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, 7); x.fill(); } else x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        x.restore();
      }
      raf = requestAnimationFrame(draw);
    }
    rs(); draw(); window.addEventListener('resize', rs);
    window.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });
  }
})();
