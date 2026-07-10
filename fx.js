/* ============================================================
   Harnoor Archive — interaction layer (fx)
   Each feature is isolated in try/catch so one failing never
   breaks the others. Honors reduced-motion and pointer type.
   ============================================================ */
(function () {
  'use strict';
  var reduce = false, fine = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  try { fine = matchMedia('(hover:hover) and (pointer:fine)').matches; } catch (e) {}

  function mk(tag, id) { var e = document.createElement(tag); if (id) e.id = id; return e; }

  /* 1 — scroll progress hairline */
  try {
    var bar = mk('div', 'fx-progress');
    document.body.appendChild(bar);
    var tick = false;
    function prog() {
      var d = document.documentElement;
      var max = d.scrollHeight - d.clientHeight;
      var p = max > 0 ? d.scrollTop / max : 0;
      bar.style.width = (p * 100) + '%';
      tick = false;
    }
    addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(prog); } }, { passive: true });
    addEventListener('resize', prog);
    prog();
  } catch (e) {}

  /* 2 — custom cursor (ring eases toward the pointer, dot is exact) */
  try {
    if (fine && !reduce) {
      var ring = mk('div', 'fx-ring'), dot = mk('div', 'fx-dot');
      document.body.appendChild(ring); document.body.appendChild(dot);
      var rx = innerWidth / 2, ry = innerHeight / 2, tx = rx, ty = ry, shown = false;
      addEventListener('mousemove', function (e) {
        tx = e.clientX; ty = e.clientY;
        dot.style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
        if (!shown) { shown = true; ring.classList.add('fx-on'); dot.classList.add('fx-on'); }
      });
      addEventListener('mouseout', function (e) {
        if (!e.relatedTarget) { shown = false; ring.classList.remove('fx-on'); dot.classList.remove('fx-on'); }
      });
      (function loop() {
        rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18;
        ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
        requestAnimationFrame(loop);
      })();
      var HOT = 'a,button,input,select,textarea,.cover-cta,.cta,.chip,.nav-search,.idx-item,.framework-item,.work-card,[role=button]';
      document.addEventListener('mouseover', function (e) { if (e.target.closest && e.target.closest(HOT)) ring.classList.add('fx-hot'); });
      document.addEventListener('mouseout', function (e) { if (e.target.closest && e.target.closest(HOT)) ring.classList.remove('fx-hot'); });
    }
  } catch (e) {}

  /* 3 — scroll reveal for static content (skips hero/cover/nav/footer) */
  try {
    if (!reduce && 'IntersectionObserver' in window) {
      var SEL = '.s-label,.s-heading,.s-desc,.abstract,.pq,.framework-item,.detail,.bio-body,.agenda-body,.route-stop,.work-card,.credential-static,.trained-line';
      var nodes = [].slice.call(document.querySelectorAll(SEL)).filter(function (n) {
        return !n.closest('.cover,.page-header,.hero,nav,footer,.cmdk,.cmdk-panel');
      });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('fx-in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      nodes.forEach(function (n, i) {
        n.classList.add('fx-reveal');
        n.style.transitionDelay = Math.min((i % 6) * 70, 350) + 'ms';
        io.observe(n);
      });
    }
  } catch (e) {}

  /* 4 — magnetic CTAs */
  try {
    if (fine && !reduce) {
      var mags = [].slice.call(document.querySelectorAll('.cover-cta,.cta,.back-link,.cover-back'));
      mags.forEach(function (m) {
        m.style.transition = 'transform .25s cubic-bezier(.2,.7,.2,1)';
        m.addEventListener('mousemove', function (e) {
          var r = m.getBoundingClientRect();
          var x = e.clientX - (r.left + r.width / 2);
          var y = e.clientY - (r.top + r.height / 2);
          m.style.transform = 'translate(' + (x * 0.22) + 'px,' + (y * 0.32) + 'px)';
        });
        m.addEventListener('mouseleave', function () { m.style.transform = ''; });
      });
    }
  } catch (e) {}

  /* 5 — homepage hero cursor glow */
  try {
    if (fine && !reduce) {
      var hb = document.querySelector('.hero-bg');
      if (hb) {
        var glow = mk('div'); glow.className = 'fx-hero-glow'; hb.appendChild(glow);
        var hero = document.querySelector('.hero') || hb;
        hero.addEventListener('mousemove', function (e) {
          var r = hero.getBoundingClientRect();
          glow.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
          glow.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
          glow.classList.add('fx-on');
        });
        hero.addEventListener('mouseleave', function () { glow.classList.remove('fx-on'); });
      }
    }
  } catch (e) {}

  /* 6 — Index hover preview (floats the piece's cover near the cursor) */
  try {
    if (fine && !reduce) {
      var COVERS = {
        'lv-belonging.html': 'images/photos/lv-pedestal.jpg',
        'dressed-as-someone-else.html': 'images/photos/bee-tie.jpg',
        'a-room-that-knows-you.html': 'images/photos/como-terrace.jpg',
        'the-customer-is-always-right.html': 'images/photos/chateau-car.jpg',
        'the-price-is-the-product.html': 'images/photos/price-stilllife.jpg',
        'ny-capital-ecosystem.html': 'images/photos/villa-skyline.jpg',
        'gradus.html': 'images/photos/library-study.jpg',
        'motive-context.html': 'images/photos/boutique-night.jpg',
        'the-witches-they-didnt-burn.html': 'images/photos/bordeaux-candle.jpg'
      };
      var pv = null, curImg = null;
      document.addEventListener('mouseover', function (e) {
        var a = e.target.closest && e.target.closest('a.idx-item');
        if (!a) return;
        var href = (a.getAttribute('href') || '').split('/').pop().split('#')[0].split('?')[0];
        var img = COVERS[href];
        if (!img) return;
        if (!pv) { pv = mk('div', 'fx-preview'); document.body.appendChild(pv); }
        if (curImg !== img) { curImg = img; pv.style.backgroundImage = 'url("' + img + '")'; }
        pv.style.left = e.clientX + 'px'; pv.style.top = e.clientY + 'px';
        pv.classList.add('fx-show');
      });
      document.addEventListener('mousemove', function (e) {
        if (pv && pv.classList.contains('fx-show')) { pv.style.left = e.clientX + 'px'; pv.style.top = e.clientY + 'px'; }
      });
      document.addEventListener('mouseout', function (e) {
        var a = e.target.closest && e.target.closest('a.idx-item');
        if (a && pv && !(a.contains(e.relatedTarget))) { pv.classList.remove('fx-show'); curImg = null; }
      });
    }
  } catch (e) {}
})();
