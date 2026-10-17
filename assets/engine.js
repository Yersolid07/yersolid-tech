/* ============================================================
   ORDER ENGINE — state model dari referensi, dirapikan.

   Aturan interaksi (dari referensi, dipertahankan penuh):
   1. Stok tidak pernah di-reset. Terpakai = hilang selama sesi.
   2. Menu habis tidak bisa diklik; kartu bergetar sebagai penolakan.
   3. Banyak pesanan berjalan paralel, masing-masing punya timer sendiri.
   4. Bagian dapur & seterusnya terkunci sampai ada pesanan.
   5. Rail tahap menyala mengikuti posisi scroll.

   Yang diperbaiki dari referensi:
   - Semua aturan hidup di satu store, bukan variabel lepas.
   - Timer memakai delta waktu, jadi tab yang di-background tidak
     melompat-lompat atau membeku.
   - Render tidak menulis ulang seluruh DOM tiap 250 ms (referensi
     memanggil innerHTML setiap tick -> tiket berkedip & animasi mati).
   - Angka "habis" dihitung dari stok awal, tidak pernah reset.
   ============================================================ */
(() => {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rp = (n) => 'Rp ' + n.toLocaleString('id-ID');

  /* ---------------- data menu: dari DB staging Wawi Kadio ---------------- */
  const MENU = [
    { id: 'nasi', n: 'Nasi Goreng Roa', p: 25000, stock: 12 },
    { id: 'goroho', n: 'goroho stick 20', p: 20000, stock: 8 },
    { id: 'kentang', n: 'Kentang goreng', p: 18000, stock: 10 },
    { id: 'kopi', n: 'Kopi susu Besar', p: 15000, stock: 15 },
    { id: 'jus', n: 'Jus Alpukat', p: 15000, stock: 6 },
  ];

  // tahap: new -> cook (6 detik) -> ready -> paid
  const COOK_MS = 6000;

  const store = {
    menu: MENU.map((m) => ({ ...m })),
    cart: {},          // id -> qty (belum dikirim)
    orders: [],        // semua pesanan
    ticketNo: 118,
    listeners: [],

    on(fn) { this.listeners.push(fn); },
    emit() { this.listeners.forEach((fn) => fn(this)); },

    // stok tersisa = stok awal - terjual - di keranjang.
    // Terjual TIDAK pernah dikembalikan, sesuai aturan: stok tidak reset.
    sold(id) {
      return this.orders.reduce(
        (a, o) => a + o.items.filter((i) => i.id === id).reduce((x, i) => x + i.q, 0),
        0
      );
    },
    inCart(id) { return this.cart[id] || 0; },
    left(id) {
      const m = this.menu.find((x) => x.id === id);
      if (!m) return 0;
      return Math.max(0, m.stock - this.sold(id) - this.inCart(id));
    },

    add(id) {
      if (this.left(id) <= 0) return { ok: false, reason: 'out' };
      this.cart[id] = (this.cart[id] || 0) + 1;
      this.emit();
      return { ok: true };
    },
    sub(id) {
      this.cart[id] = Math.max(0, (this.cart[id] || 0) - 1);
      if (!this.cart[id]) delete this.cart[id];
      this.emit();
    },
    clearCart() { this.cart = {}; this.emit(); },

    cartItems() {
      return Object.entries(this.cart)
        .filter(([, q]) => q > 0)
        .map(([id, q]) => {
          const m = this.menu.find((x) => x.id === id);
          return { id, n: m.n, p: m.p, q };
        });
    },
    cartTotal() {
      return this.cartItems().reduce((a, i) => a + i.p * i.q, 0);
    },
    cartCount() {
      return this.cartItems().reduce((a, i) => a + i.q, 0);
    },

    send() {
      const items = this.cartItems();
      if (!items.length) return null;
      const no = ++this.ticketNo;
      const order = {
        no,
        items,
        total: items.reduce((a, i) => a + i.p * i.q, 0),
        stage: 'new',
        t0: Date.now(),
        progress: 0,
      };
      this.orders.push(order);
      this.cart = {};
      this.emit();
      return order;
    },

    serve(no) {
      const o = this.orders.find((x) => x.no === no);
      if (!o || o.stage !== 'ready') return;
      o.stage = 'paid';
      this.emit();
    },

    // dipanggil tiap tick; pakai waktu nyata supaya tidak melompat
    tick(now) {
      let changed = false;
      this.orders.forEach((o) => {
        if (o.stage === 'new' && now - o.t0 > 1600) {
          o.stage = 'cook';
          o.t0 = now;
          o.progress = 0;
          changed = true;
        } else if (o.stage === 'cook') {
          const p = Math.min((now - o.t0) / COOK_MS, 1);
          if (Math.abs(p - o.progress) > 0.004) {
            o.progress = p;
            changed = true;
          }
          if (p >= 1) {
            o.stage = 'ready';
            o.progress = 1;
            changed = true;
          }
        }
      });
      return changed;
    },

    stats() {
      const paid = this.orders.filter((o) => o.stage === 'paid');
      const total = paid.reduce((a, o) => a + o.total, 0);
      const tally = {};
      paid.forEach((o) => o.items.forEach((i) => { tally[i.n] = (tally[i.n] || 0) + i.q; }));
      return {
        paidCount: paid.length,
        total,
        avg: paid.length ? Math.round(total / paid.length) : 0,
        sent: this.orders.length,
        dishes: paid.reduce(
          (a, o) => a + o.items.reduce((x, i) => x + i.q, 0),
          0
        ),
        top: Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 3),
      };
    },
  };

  window.YT_STORE = store;

  /* ---------------- elemen ---------------- */
  const $ = (s) => document.querySelector(s);
  const menuEl = $('#pos-menu');
  const linesEl = $('#pos-lines');
  const cntEl = $('#pos-count');
  const totEl = $('#pos-total');
  const sendEl = $('#pos-pay');
  const boardEl = $('#kds-board');
  const lockEl = $('#dapur-lock');
  const railEls = () => document.querySelectorAll('.rail-step[data-step]');

  const toastEl = (() => {
    const el = document.createElement('div');
    el.className = 'kds-toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
    return el;
  })();
  let toastT = null;
  const toast = (t) => {
    toastEl.textContent = t;
    toastEl.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('on'), 2800);
  };

  /* ---------------- render keranjang & menu ---------------- */
  const renderCart = () => {
    const items = store.cartItems();
    if (linesEl) {
      linesEl.innerHTML = items.length
        ? items
            .map(
              (i) => `
        <div class="pos-line">
          <span class="pos-line-n">${i.n}</span>
          <button type="button" class="pos-step" data-sub="${i.id}" aria-label="Kurangi ${i.n}">−</button>
          <b class="pos-line-q">${i.q}</b>
          <button type="button" class="pos-step" data-add="${i.id}" aria-label="Tambah ${i.n}">+</button>
        </div>`
            )
            .join('')
        : '<p class="pos-empty">Ketuk menu di sebelah kiri.</p>';
    }
    if (cntEl) cntEl.textContent = store.cartCount() + ' item';
    if (totEl) totEl.textContent = rp(store.cartTotal());
    if (sendEl) sendEl.disabled = store.cartCount() === 0;
  };

  const renderMenuStock = () => {
    if (!menuEl) return;
    menuEl.querySelectorAll('.pos-item').forEach((btn) => {
      const id = btn.dataset.add;
      const m = store.menu.find((x) => x.id === id);
      if (!m) return;
      const l = store.left(id);
      const badge = btn.querySelector('.pos-stock');
      if (badge) {
        badge.textContent = l <= 0 ? 'Habis' : l <= 3 ? 'Sisa ' + l : l + ' porsi';
      }
      btn.dataset.state = l <= 0 ? 'out' : l <= 3 ? 'low' : 'ok';
      btn.setAttribute('aria-disabled', l <= 0 ? 'true' : 'false');
    });
  };

  /* ---------------- render papan dapur ---------------- */
  const COLS = [
    ['new', 'Masuk', 'Menunggu dikerjakan'],
    ['cook', 'Dimasak', 'Tukang masak menandai tiket'],
    ['ready', 'Siap', 'Siap diantar ke meja'],
  ];

  const ticketHTML = (o, col) => `
    <div class="kds-ticket" data-s="${col}" data-no="${o.no}">
      <div class="kds-ticket-top">
        <span class="kds-ticket-no">#${o.no}</span>
        <span class="kds-ticket-sum">${rp(o.total)}</span>
      </div>
      <ul class="kds-ticket-items">
        ${o.items.map((i) => `<li><span>${i.n}</span><b>×${i.q}</b></li>`).join('')}
      </ul>
      ${
        col === 'cook'
          ? `<div class="kds-time">
               <span class="kds-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(o.progress * 100)}"><i style="width:${Math.round(o.progress * 100)}%"></i></span>
               <span>sisa ${Math.max(1, Math.round((1 - o.progress) * (COOK_MS / 1000)))} dtk</span>
             </div>`
          : ''
      }
      ${col === 'ready' ? `<button type="button" class="kds-serve" data-serve="${o.no}">Antar &amp; bayar</button>` : ''}
    </div>`;

  let lastBoardKey = '';

  const renderBoard = () => {
    if (!boardEl) return;
    const key = store.orders.map((o) => o.no + o.stage).join('|');
    // render struktural hanya saat komposisi berubah -> tidak berkedip
    if (key !== lastBoardKey) {
      lastBoardKey = key;
      boardEl.innerHTML = COLS.map(([k, label, hint]) => {
        const list = store.orders.filter((o) => o.stage === k);
        return `
        <div class="kds-col" data-col="${k}"${k === 'cook' && list.length ? ' class="kds-col is-busy" data-col="cook"' : ''}>
          <div class="kds-col-head">
            <span>${label}</span>
            ${k === 'cook' ? '<span class="kds-steam" aria-hidden="true"><i></i><i></i><i></i></span>' : ''}
            <span class="kds-col-count">${list.length}</span>
          </div>
          ${
            list.length
              ? list.map((o) => ticketHTML(o, k)).join('')
              : `<div class="kds-empty">${hint}</div>`
          }
        </div>`;
      }).join('');
    } else {
      // hanya progres di dalam tiket yang diperbarui
      store.orders.forEach((o) => {
        if (o.stage !== 'cook') return;
        const el = boardEl.querySelector(`.kds-ticket[data-no="${o.no}"]`);
        if (!el) return;
        const bar = el.querySelector('.kds-bar > i');
        if (bar) bar.style.width = Math.round(o.progress * 100) + '%';
        const lbl = el.querySelector('.kds-time > span:last-child');
        if (lbl) lbl.textContent = 'sisa ' + Math.max(1, Math.round((1 - o.progress) * (COOK_MS / 1000))) + ' dtk';
        if (bar) bar.parentElement.setAttribute('aria-valuenow', String(Math.round(o.progress * 100)));
      });
    }

    // teks pesanan aktif di rail
    const railActive = $('#rail-active');
    if (railActive) {
      const cur = store.orders.filter((o) => o.stage !== 'paid').slice(-1)[0] || store.orders.slice(-1)[0];
      const label = { new: 'Masuk dapur', cook: 'Dimasak', ready: 'Siap diantar', paid: 'Lunas' };
      railActive.textContent = cur ? '#' + cur.no + ' · ' + label[cur.stage] : 'Belum ada';
    }

    // kunci terbuka setelah ada pesanan
    if (lockEl) {
      const locked = store.orders.length === 0;
      lockEl.classList.toggle('off', !locked);
      lockEl.setAttribute('aria-hidden', locked ? 'false' : 'true');
    }
  };

  /* ---------------- laporan ---------------- */
  const revEl = $('#rep-total');
  const cntRepEl = $('#rep-count');
  const avgEl = $('#rep-avg');
  const sentEl = $('#rep-sent');
  const barsEl = $('#rep-bars');
  const itemsEl = $('#rep-items');
  const stockEl = $('#rep-stock');
  const wokEl = $('#wok-card');
  const wokTitle = $('#wok-title');
  const wokSub = $('#wok-sub');

  const countTo = (el, to) => {
    if (!el) return;
    const from = Number(el.dataset.v || 0);
    el.dataset.v = String(to);
    if (from === to || reduce) {
      el.textContent = rp(to);
      return;
    }
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min((t - t0) / 850, 1);
      el.textContent = rp(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const renderReport = () => {
    const s = store.stats();
    countTo(revEl, s.total);
    if (cntRepEl) cntRepEl.textContent = String(s.paidCount);
    if (avgEl) avgEl.textContent = rp(s.avg);
    if (sentEl) sentEl.textContent = String(s.sent);
    if (itemsEl) itemsEl.textContent = String(s.dishes);
    if (stockEl) {
      stockEl.innerHTML = store.menu
        .map((m) => {
          const l = store.left(m.id);
          return `<div class="rep-stock-row" data-low="${l > 0 && l <= 3}" data-out="${l === 0}">
            <span class="rep-stock-name">${m.n}</span>
            <b>${l === 0 ? 'habis' : l + ' porsi'}</b>
          </div>`;
        })
        .join('');
    }

    // wajan menyala hanya saat ada yang benar-benar dimasak
    const cooking = store.orders.filter((o) => o.stage === 'cook');
    if (wokEl) {
      wokEl.dataset.cooking = cooking.length ? 'true' : 'false';
      if (wokTitle) {
        wokTitle.textContent = cooking.length
          ? 'Memasak #' + cooking.map((o) => o.no).join(', #')
          : store.orders.some((o) => o.stage === 'ready')
            ? 'Matang. Siap diantar.'
            : 'Wajan menunggu';
      }
      if (wokSub) {
        wokSub.textContent = cooking.length
          ? 'Api menyala. Sebentar lagi tiketnya hijau.'
          : store.orders.some((o) => o.stage === 'ready')
            ? 'Pesanan sudah matang dan menunggu diantar.'
            : 'Kirim pesanan, api menyala.';
      }
    }

    if (barsEl) {
      const max = s.top[0] ? s.top[0][1] : 1;
      barsEl.innerHTML = s.top.length
        ? s.top
            .map(
              ([n, q]) => `
          <div class="rep-row">
            <span>${n}</span>
            <span class="rep-track"><i style="width:${Math.round((q / max) * 100)}%"></i></span>
            <b>${q}</b>
          </div>`
            )
            .join('')
        : '<p class="kds-empty" style="padding:10px 0">Belum ada pesanan lunas.</p>';
    }
  };

  /* ---------------- rail: menyala mengikuti scroll ---------------- */
  const setRail = (n) => {
    railEls().forEach((el) => {
      const k = Number(el.dataset.step);
      el.classList.toggle('is-now', k === n);
      el.classList.toggle('is-done', k < n && store.orders.length > 0);
    });
  };

  if ('IntersectionObserver' in window) {
    // halaman kita pakai id section; pasang data-scene DULU, baru ambil daftarnya
    const map = [
      ['kasir', 1],
      ['dapur', 2],
      ['laporan', 3],
    ];
    map.forEach(([id, n]) => {
      const el = document.getElementById(id);
      if (el) el.dataset.scene = String(n);
    });

    const scenes = document.querySelectorAll('[data-scene]');
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          setRail(Number(e.target.dataset.scene));
        });
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );
    scenes.forEach((s) => io.observe(s));
  }

  /* ---------------- event ---------------- */
  if (menuEl) {
    menuEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-add]');
      if (!btn) return;
      const res = store.add(btn.dataset.add);
      if (!res.ok) {
        // menu habis: goyang, jangan diam saja
        if (!reduce) {
          btn.animate(
            [
              { transform: 'translateX(0)' },
              { transform: 'translateX(-6px)' },
              { transform: 'translateX(6px)' },
              { transform: 'translateX(0)' },
            ],
            { duration: 340, easing: 'ease-in-out' }
          );
        }
        toast('Stok habis. Tidak bisa dijual.');
      }
    });
  }

  if (linesEl) {
    linesEl.addEventListener('click', (e) => {
      const add = e.target.closest('[data-add]');
      const sub = e.target.closest('[data-sub]');
      if (add) {
        const res = store.add(add.dataset.add);
        if (!res.ok) toast('Stok habis. Tidak bisa dijual.');
      }
      if (sub) store.sub(sub.dataset.sub);
    });
  }

  if (sendEl) {
    sendEl.addEventListener('click', () => {
      const o = store.send();
      if (!o) return;
      toast(`Pesanan #${o.no} terkirim ke dapur`);
      const target = document.querySelector('[data-scene="2"]');
      if (target) setTimeout(() => target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }), 500);
    });
  }

  const demoBtn = $('#pos-demo');
  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      store.add('nasi');
      store.add('nasi');
      store.add('kopi');
      const o = store.send();
      if (o) toast(`Contoh pesanan #${o.no} dibuat`);
    });
  }

  if (boardEl) {
    boardEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-serve]');
      if (!b) return;
      store.serve(Number(b.dataset.serve));
      toast('Pesanan lunas. Masuk laporan.');
      // Tandai angka yang baru berubah supaya pengunjung melihat sebab-akibatnya,
      // bukan sekadar angka yang tiba-tiba beda. (pola dari referensi: .flash)
      requestAnimationFrame(() => {
        document.querySelectorAll('.report-num, .rep-total, #rep-stock, .rep-kpi b').forEach((el) => {
          el.classList.remove('baru');
          void el.offsetWidth;   // paksa reflow agar animasi bisa diulang
          el.classList.add('baru');
        });
      });
    });
  }

  /* ---------------- daur render & tick ---------------- */
  const fullRender = () => {
    renderCart();
    renderMenuStock();
    renderBoard();
    renderReport();
  };
  store.on(fullRender);
  fullRender();

  let raf = null;
  const loop = () => {
    if (store.tick(Date.now())) {
      renderBoard();
      renderReport();
    }
    raf = requestAnimationFrame(loop);
  };
  if (!reduce) raf = requestAnimationFrame(loop);

  // tab disembunyikan: hentikan loop, hitung ulang saat kembali
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    } else if (!reduce && !raf) {
      raf = requestAnimationFrame(loop);
    }
  });
})();
