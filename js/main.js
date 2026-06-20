/* ===== TetraPallete TOP ===== */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Base UI (always runs, no deps) ---------- */
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  var header = $('#siteHeader');
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 40); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var toggle = $('#navToggle'), nav = $('#nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('a', nav).forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open'); toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* movie filter */
  var tabs = $$('.movie__tabs .tab'), videos = $$('#movieGrid .video');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('is-active'); });
      tab.classList.add('is-active');
      var f = tab.getAttribute('data-filter');
      videos.forEach(function (v) {
        v.style.display = (f === 'all' || v.getAttribute('data-cat') === f) ? '' : 'none';
      });
    });
  });

  /* video click-to-load (YouTube ready) */
  $$('.video').forEach(function (v) {
    v.addEventListener('click', function () {
      var id = v.getAttribute('data-yt');
      if (!id) { v.classList.add('shake'); setTimeout(function () { v.classList.remove('shake'); }, 500); return; }
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      f.title = 'movie';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      f.allowFullscreen = true;
      v.innerHTML = ''; v.appendChild(f);
    });
  });

  /* contact form */
  var cform = $('#contactForm');
  if (cform) {
    cform.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!cform.checkValidity()) { cform.reportValidity(); return; }
      window.alert('送信機能は現在準備中です。お手数ですが tetra.pallete@gmail.com・お電話（03-6912-4276）・LINE よりご連絡ください。');
    });
  }

  /* confetti canvas (continuous, performance-aware) */
  initConfetti();

  /* ---------- Motion layer ---------- */
  var pre = $('#preloader');
  function hidePreloader() { if (pre) pre.classList.add('is-hidden'); }

  var motion = !!(window.gsap && window.ScrollTrigger) && !reduce;
  if (motion) {
    try { initMotion(); }
    catch (err) {
      document.documentElement.classList.remove('gsap');
      fallback(); hidePreloader();
    }
  } else {
    fallback();
    hidePreloader();
  }

  /* ===== fallback (no GSAP / reduced-motion): IntersectionObserver ===== */
  function fallback() {
    var reveals = $$('.reveal');
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.16 });
      reveals.forEach(function (el) { io.observe(el); });
      var io2 = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); io2.unobserve(e.target); } });
      }, { threshold: 0.6 });
      $$('.count').forEach(function (el) { io2.observe(el); });
      var px = $$('[data-parallax]');
      window.addEventListener('scroll', function () {
        var sy = window.scrollY;
        px.forEach(function (el) {
          el.style.transform = 'translate3d(0,' + (sy * (parseFloat(el.getAttribute('data-parallax')) || 0.2)) + 'px,0)';
        });
      }, { passive: true });
    } else {
      reveals.forEach(function (el) { el.classList.add('in'); });
      $$('.count').forEach(function (el) { el.textContent = el.getAttribute('data-target') + (el.getAttribute('data-suffix') || ''); });
    }
  }
  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-target')) || 0, suffix = el.getAttribute('data-suffix') || '', dur = 1400, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e) + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ===== GSAP/Lenis enhanced motion ===== */
  function initMotion() {
    var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('gsap');
    var finePointer = window.matchMedia('(pointer:fine)').matches;

    /* Lenis smooth scroll */
    if (window.Lenis) {
      var lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      $$('a[href^="#"]').forEach(function (a) {
        var id = a.getAttribute('href');
        if (id && id.length > 1) {
          a.addEventListener('click', function (e) {
            var t = document.querySelector(id);
            if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -70 }); }
          });
        }
      });
    }

    /* Opening timeline */
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to(pre, { autoAlpha: 0, duration: 0.5, delay: 0.25 });
    if ($('.hero__eyebrow')) tl.from('.hero__eyebrow', { y: 18, autoAlpha: 0, duration: 0.5 }, '-=0.1');
    if ($('.hero__title .line')) tl.fromTo('.hero__title .line', { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: 0.12, duration: 0.9 }, '-=0.25');
    if ($('.frame--hero')) tl.to('.frame--hero', { clipPath: 'inset(0 0 0% 0)', duration: 1.0, ease: 'power4.inOut' }, '-=0.65');
    if ($('.hero__lead')) tl.from('.hero__lead', { y: 18, autoAlpha: 0, duration: 0.5 }, '-=0.7');
    if ($('.hero__cta')) tl.from('.hero__cta', { y: 18, autoAlpha: 0, duration: 0.5 }, '-=0.5');

    /* Section heading word-reveal (SplitType, optional) */
    if (window.SplitType) {
      $$('.sec-head__ja').forEach(function (h) {
        try {
          var s = new window.SplitType(h, { types: 'words' });
          gsap.from(s.words, {
            yPercent: 80, autoAlpha: 0, stagger: 0.04, duration: 0.7,
            scrollTrigger: { trigger: h, start: 'top 85%', once: true }
          });
        } catch (e) {}
      });
    }

    /* Reveal batch (exclude artist cards in the horizontal track) */
    var revs = gsap.utils.toArray('.reveal').filter(function (el) { return !el.closest('.artist-track'); });
    gsap.set(revs, { opacity: 0, y: 40 });
    ScrollTrigger.batch(revs, {
      start: 'top 86%',
      onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', overwrite: true }); }
    });
    /* artist cards inside track: show immediately (pin provides the motion) */
    gsap.set('.artist-track .reveal', { opacity: 1, y: 0 });

    /* Count up on scroll */
    $$('.count').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-target')) || 0, suffix = el.getAttribute('data-suffix') || '', o = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: function () {
          gsap.to(o, {
            v: target, duration: 1.4, ease: 'power2.out', snap: { v: 1 },
            onUpdate: function () { el.textContent = Math.round(o.v) + (o.v >= target ? suffix : ''); }
          });
        }
      });
    });

    /* Parallax (hero decorative layers) */
    gsap.utils.toArray('[data-parallax]').forEach(function (el) {
      var k = parseFloat(el.getAttribute('data-parallax')) || 0.2;
      gsap.to(el, { yPercent: k * 55, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    });

    /* ARTISTS pinned horizontal scroll (desktop + fine pointer only) */
    var stage = $('.artists-stage'), track = $('.artist-track');
    if (stage && track) {
      var mm = gsap.matchMedia();
      mm.add('(min-width:901px)', function () {
        stage.classList.add('is-horizontal');
        ScrollTrigger.refresh();
        var amount = function () { return Math.max(0, track.scrollWidth - stage.clientWidth); };
        var tween = gsap.to(track, {
          x: function () { return -amount(); }, ease: 'none',
          scrollTrigger: {
            trigger: stage, start: 'top top', end: function () { return '+=' + amount(); },
            scrub: 0.6, pin: true, anticipatePin: 1, invalidateOnRefresh: true
          }
        });
        return function () { stage.classList.remove('is-horizontal'); tween && tween.scrollTrigger && tween.scrollTrigger.kill(); gsap.set(track, { clearProps: 'transform' }); };
      });
    }

    /* Magnetic CTAs (fine pointer) */
    if (finePointer) {
      $$('.btn--primary, .btn--line-lg').forEach(function (btn) {
        btn.addEventListener('mousemove', function (e) {
          var r = btn.getBoundingClientRect();
          gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.4, duration: 0.4, ease: 'power3.out' });
        });
        btn.addEventListener('mouseleave', function () { gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' }); });
      });

      /* Tilt cards */
      $$('.artist, .video').forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
          var r = card.getBoundingClientRect();
          card.classList.add('tilting');
          gsap.to(card, {
            rotateY: ((e.clientX - r.left) / r.width - 0.5) * 6,
            rotateX: -((e.clientY - r.top) / r.height - 0.5) * 6,
            y: -6, duration: 0.3, ease: 'power2.out', transformPerspective: 800
          });
        });
        card.addEventListener('mouseleave', function () {
          gsap.to(card, { rotateY: 0, rotateX: 0, y: 0, duration: 0.5, ease: 'power3.out', onComplete: function () { card.classList.remove('tilting'); } });
        });
      });
    }

    ScrollTrigger.refresh();
  }

  /* ===== Confetti ===== */
  function initConfetti() {
    var canvas = $('#confetti');
    if (!canvas || reduce) return;
    var ctx = canvas.getContext('2d');
    var W, H, DPR = Math.min(window.devicePixelRatio || 1, 2);
    var COLORS = ['#FFB45A', '#FF9DC5', '#8FD3FF', '#9FE7C4', '#C9AEF5', '#FFD86B'];
    var pieces = [];
    function resize() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * DPR; canvas.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var count = Math.min(60, Math.round(W / 22)); pieces = [];
      for (var i = 0; i < count; i++) pieces.push(makePiece(true));
    }
    function makePiece(init) {
      return { x: Math.random() * W, y: init ? Math.random() * H : -20, w: 6 + Math.random() * 7, h: 9 + Math.random() * 9,
        c: COLORS[(Math.random() * COLORS.length) | 0], rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.05,
        vy: 0.4 + Math.random() * 0.9, sway: 0.6 + Math.random() * 1.1, phase: Math.random() * Math.PI * 2, round: Math.random() > 0.6 };
    }
    var t = 0, raf;
    function draw() {
      ctx.clearRect(0, 0, W, H); t += 0.01;
      for (var i = 0; i < pieces.length; i++) {
        var p = pieces[i]; p.y += p.vy; p.x += Math.sin(t + p.phase) * p.sway * 0.4; p.rot += p.vr;
        if (p.y > H + 20) { pieces[i] = makePiece(false); continue; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = 0.85; ctx.fillStyle = p.c;
        if (p.round) { ctx.beginPath(); ctx.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    }
    resize(); draw(); window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { if (!raf) draw(); } else { cancelAnimationFrame(raf); raf = null; } });
      }, { threshold: 0 }).observe(canvas);
    }
  }
})();
