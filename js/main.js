/* ===== TetraPallete TOP ===== */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* year */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* header scrolled state */
  var header = document.getElementById('siteHeader');
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 40); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* mobile nav */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open'); toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* scroll reveal */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.16 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* count up */
  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-target')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1400, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * ease) + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counts = document.querySelectorAll('.count');
  if ('IntersectionObserver' in window && !reduce) {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCount(e.target); io2.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counts.forEach(function (el) { io2.observe(el); });
  } else {
    counts.forEach(function (el) { el.textContent = el.getAttribute('data-target') + (el.getAttribute('data-suffix') || ''); });
  }

  /* parallax blobs */
  if (!reduce) {
    var px = document.querySelectorAll('[data-parallax]');
    window.addEventListener('scroll', function () {
      var sy = window.scrollY;
      px.forEach(function (el) {
        var k = parseFloat(el.getAttribute('data-parallax')) || 0.2;
        el.style.transform = 'translate3d(0,' + (sy * k) + 'px,0)';
      });
    }, { passive: true });
  }

  /* movie filter */
  var tabs = document.querySelectorAll('.movie__tabs .tab');
  var videos = document.querySelectorAll('#movieGrid .video');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('is-active'); });
      tab.classList.add('is-active');
      var f = tab.getAttribute('data-filter');
      videos.forEach(function (v) {
        var show = (f === 'all' || v.getAttribute('data-cat') === f);
        v.style.display = show ? '' : 'none';
      });
    });
  });

  /* video click-to-load (YouTube ready). Set data-yt="VIDEO_ID" later. */
  videos.forEach(function (v) {
    v.addEventListener('click', function () {
      var id = v.getAttribute('data-yt');
      if (!id) {
        v.classList.add('shake');
        setTimeout(function () { v.classList.remove('shake'); }, 500);
        return;
      }
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      f.title = 'movie';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      f.allowFullscreen = true;
      v.innerHTML = '';
      v.appendChild(f);
    });
  });

  /* contact form (submission endpoint TBD) */
  var cform = document.getElementById('contactForm');
  if (cform) {
    cform.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!cform.checkValidity()) { cform.reportValidity(); return; }
      window.alert('送信機能は現在準備中です。お手数ですが tetra.pallete@gmail.com・お電話（03-6912-4276）・LINE よりご連絡ください。');
    });
  }

  /* confetti canvas (tasteful, performance-aware) */
  var canvas = document.getElementById('confetti');
  if (canvas && !reduce) {
    var ctx = canvas.getContext('2d');
    var W, H, DPR = Math.min(window.devicePixelRatio || 1, 2);
    var COLORS = ['#FFB45A', '#FF9DC5', '#8FD3FF', '#9FE7C4', '#C9AEF5', '#FFD86B'];
    var pieces = [];
    function resize() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var count = Math.min(60, Math.round(W / 22));
      pieces = [];
      for (var i = 0; i < count; i++) pieces.push(makePiece(true));
    }
    function makePiece(initial) {
      return {
        x: Math.random() * W,
        y: initial ? Math.random() * H : -20,
        w: 6 + Math.random() * 7,
        h: 9 + Math.random() * 9,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.05,
        vy: 0.4 + Math.random() * 0.9,
        sway: 0.6 + Math.random() * 1.1,
        phase: Math.random() * Math.PI * 2,
        round: Math.random() > 0.6
      };
    }
    var t = 0, raf;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      t += 0.01;
      for (var i = 0; i < pieces.length; i++) {
        var p = pieces[i];
        p.y += p.vy;
        p.x += Math.sin(t + p.phase) * p.sway * 0.4;
        p.rot += p.vr;
        if (p.y > H + 20) { pieces[i] = makePiece(false); continue; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = p.c;
        if (p.round) {
          ctx.beginPath(); ctx.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    }
    resize();
    draw();
    window.addEventListener('resize', resize);
    // pause when hero off-screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { if (!raf) draw(); }
          else { cancelAnimationFrame(raf); raf = null; }
        });
      }, { threshold: 0 }).observe(canvas);
    }
  }
})();
