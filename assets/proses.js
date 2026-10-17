/* ============================================================
   PROSES — animasi yang menjelaskan keadaan, bukan hiasan.
   Bagian dari motion thesis: satu pesanan berjalan lewat empat tahap,
   dan pengunjung MELIHAT masaknya (uap, panas, waktu).
   ============================================================ */
(() => {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const story = window.YT_STORY;
  if (!story) return;

  /* ---------------- 1. kanvas uap (prosedural, murah) ---------------- */
  const canvas = document.getElementById('steam');
  let ctx = null;
  let parts = [];
  let raf = null;
  let running = false;
  let w = 0;
  let h = 0;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const sizeCanvas = () => {
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
  };

  const spawn = () => {
    if (!w || !h) return;
    parts.push({
      x: w / 2 + (Math.random() - 0.5) * 40,
      y: h / 2 - 18,
      r: 10 + Math.random() * 22,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.55 - Math.random() * 0.7,
      life: 1,
      decay: 0.0032 + Math.random() * 0.0036,
      warm: Math.random() > 0.42,
    });
    if (parts.length > 160) parts.shift();
  };

  const frame = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx += (Math.random() - 0.5) * 0.012;
      p.r += 0.16;
      p.life -= p.decay;
      if (p.life <= 0) {
        parts.splice(i, 1);
        continue;
      }
      const a = p.life * (p.warm ? 0.5 : 0.56);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, p.warm ? `rgba(255, 176, 96, ${a})` : `rgba(240, 246, 250, ${a})`);
      g.addColorStop(0.5, p.warm ? `rgba(255, 140, 70, ${a * 0.55})` : `rgba(214, 230, 240, ${a * 0.5})`);
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      // gumpalan kedua: memberi badan, bukan kabut datar
      ctx.beginPath();
      ctx.arc(p.x + p.r * 0.45, p.y - p.r * 0.35, p.r * 0.62, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  };

  const startSteam = () => {
    if (reduce || running || !canvas) return;
    sizeCanvas();
    running = true;
    const sp = setInterval(spawn, 70);
    canvas.dataset.timer = String(sp);
    frame();
  };

  const stopSteam = () => {
    if (!running) return;
    running = false;
    clearInterval(Number(canvas?.dataset.timer));
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    if (ctx) ctx.clearRect(0, 0, w, h);
    parts = [];
  };

  // hanya jalan saat terlihat: hemat baterai HP
  if (canvas && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && story.stage === 'masak') startSteam();
          else stopSteam();
        });
      },
      { threshold: 0.25 }
    ).observe(canvas);
  }
  window.addEventListener('resize', () => {
    if (running) sizeCanvas();
  });

  /* ---------------- 2. cincin masak + hitungan waktu ---------------- */
  const ring = document.getElementById('cook-ring');
  const count = document.getElementById('cook-count');
  const label = document.getElementById('cook-label');
  const core = document.getElementById('cook-core');

  let cookTimer = null;
  let cookStart = 0;

  const LABELS = {
    masuk: 'Menunggu dimasak',
    masak: 'Sedang dimasak',
    siap: 'Siap diantar',
    selesai: 'Sudah diantar',
  };

  const stopCook = () => {
    if (cookTimer) clearInterval(cookTimer);
    cookTimer = null;
  };

  const startCook = () => {
    stopCook();
    cookStart = Date.now();
    // 22 detik di panggung = contoh; setelah itu tahap tidak berpindah sendiri
    const total = 22000;
    cookTimer = setInterval(() => {
      const el = Date.now() - cookStart;
      const p = Math.min(el / total, 1);
      if (ring) ring.style.transform = `rotate(${p * 320}deg)`;
      if (count) {
        const s = Math.floor(el / 1000);
        count.textContent = `0:${String(s).padStart(2, '0')}`;
      }
      if (p >= 1) stopCook();
    }, 120);
  };

  const applyStage = () => {
    const st = story.stage;
    const has = !!story.ticket;

    if (label) label.textContent = has ? LABELS[st] : 'Menunggu pesanan';

    if (core) {
      const heat = { masuk: 0.35, masak: 1, siap: 0.5, selesai: 0.18 }[st] ?? 0.3;
      core.style.filter = `brightness(${0.65 + heat * 0.55}) saturate(${0.7 + heat * 0.6})`;
      core.style.transform = `scale(${0.9 + heat * 0.16})`;
    }

    if (st === 'masak' && !reduce) {
      startSteam();
      startCook();
    } else {
      stopSteam();
      stopCook();
      if (ring) ring.style.transform = st === 'siap' || st === 'selesai' ? 'rotate(320deg)' : 'rotate(0deg)';
      if (count) count.textContent = st === 'siap' || st === 'selesai' ? '0:22' : '0:00';
    }

    // jalur: isi track sampai tahap sekarang
    const order = { masuk: 0, masak: 1, siap: 2, selesai: 3 };
    const cur = order[st] ?? -1;
    document.querySelectorAll('.rail-step').forEach((step) => {
      const idx = order[step.dataset.stage] ?? -1;
      step.classList.toggle('is-now', idx === cur);
      step.classList.toggle('is-done', idx < cur);
      const fill = step.querySelector('.rail-fill');
      if (fill) fill.style.transform = `scaleX(${idx < cur ? 1 : 0})`;
    });

    // wajan mendingin setelah pesanan diantar
    const stageEl = document.querySelector('.cook-stage');
    if (stageEl) stageEl.dataset.cool = st === 'selesai' ? 'true' : 'false';
  };

  story.on(applyStage);

  /* ---------------- 3. tiket terbang: kasir -> dapur ---------------- */
  const pay = document.getElementById('pos-pay');
  const board = document.querySelector('.dapur-panel');

  if (pay && board && !reduce && window.gsap) {
    pay.addEventListener('click', () => {
      const storyTicket = window.YT_STORY.ticket;
      if (!storyTicket) return;

      const from = pay.getBoundingClientRect();
      const to = board.getBoundingClientRect();

      const ticket = document.createElement('div');
      ticket.className = 'flying-ticket';
      ticket.innerHTML = `<span class="ft-dot"></span>#${storyTicket.no} → dapur`;
      document.body.appendChild(ticket);

      // mulai dari tombol, terbang ke papan dapur (di luar viewport => scroll pelan)
      gsap.set(ticket, {
        x: from.left + from.width / 2 - 50,
        y: from.top + from.height / 2,
        scale: 0.9,
        opacity: 0,
      });

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.to(ticket, {
            scale: 1.18,
            opacity: 0,
            duration: 0.28,
            onComplete: () => ticket.remove(),
          });
        },
      });

      tl.to(ticket, { opacity: 1, scale: 1, duration: 0.22, ease: 'power2.out' })
        .to(
          ticket,
          {
            x: from.left + from.width / 2 - 50,
            y: Math.min(from.top + 90, window.innerHeight - 120),
            duration: 0.4,
            ease: 'power2.inOut',
          },
          '+=0.1'
        )
        // tanda bahwa tiket pergi ke dapur
        .to(ticket, { opacity: 0, y: '-=40', duration: 0.36, ease: 'power2.in' }, '+=0.12');
    });
  }

  /* ---------------- 4. angka laporan menghitung sungguhan ---------------- */
  const heroVals = () => {
    const el = document.getElementById('report-value');
    if (!el) return;
    const txt = el.textContent.replace(/[^\d]/g, '');
    const target = Number(txt) || 0;
    if (!target) return;
    if (reduce || !window.gsap) {
      el.textContent = 'Rp ' + target.toLocaleString('id-ID');
      return;
    }
    const o = { v: 0 };
    gsap.to(o, {
      v: target,
      duration: 0.9,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = 'Rp ' + Math.round(o.v).toLocaleString('id-ID');
      },
      onComplete: () => {
        el.textContent = 'Rp ' + target.toLocaleString('id-ID');
      },
    });
  };

  story.on(() => {
    if (story.orders.length) heroVals();
  });
})();
