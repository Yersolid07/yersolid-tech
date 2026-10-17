/* ============================================================
   Wawi Kadio landing — interaksi nyata
   Prinsip: tanpa JS halaman tetap terbaca penuh (reveal = visible).
   ============================================================ */
(() => {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rupiah = (n) => 'Rp ' + n.toLocaleString('id-ID');

  /* ---------------- nav drawer (mobile) ---------------- */
  const toggle = document.querySelector('.nav-toggle');
  const drawer = document.getElementById('nav-drawer');
  if (toggle && drawer) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Buka menu' : 'Tutup menu');
      drawer.dataset.open = String(!open);
    });
    drawer.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        toggle.setAttribute('aria-expanded', 'false');
        drawer.dataset.open = 'false';
      }
    });
  }

  /* ---------------- POS: the live thing ---------------- */
  const pos = document.getElementById('pos');
  if (pos) {
    const items = [...pos.querySelectorAll('.pos-item')];
    const linesEl = document.getElementById('pos-lines');
    const emptyEl = document.getElementById('pos-empty');
    const countEl = document.getElementById('pos-count');
    const totalEl = document.getElementById('pos-total');
    const payEl = document.getElementById('pos-pay');
    const hintEl = document.getElementById('pos-hint');
    const kdsEl = document.getElementById('pos-kds');
    // nomor tiket berikutnya = nomor tertinggi yang sudah tampil + 1
    const highestTicket = () => {
      let max = 0;
      kdsEl.querySelectorAll('.kds-ticket').forEach((t) => {
        const m = (t.textContent || '').match(/#(\d+)/);
        if (m) max = Math.max(max, parseInt(m[1], 10));
      });
      return max;
    };
    const ticketNo = { v: highestTicket() + 1 };

    /** @type {Map<string,{name:string,price:number,qty:number,stock:string}>} */
    const order = new Map();

    const stockEl = (key) => document.querySelector(`.inv-row[data-stock="${key}"]`);
    const readStockRow = (key, btn) => {
      const row = stockEl(key);
      if (row) {
        const qtyEl = row.querySelector('[data-qty]');
        return { row, qtyEl, qty: qtyEl ? parseInt(qtyEl.textContent, 10) : NaN };
      }
      // tidak ada panel stok: pakai stok awal dari tombol menu sendiri,
      // supaya batas stok tetap dihormati dan tidak muncul "undefined".
      const awal = btn ? parseInt(btn.dataset.qty, 10) : NaN;
      return { row: null, qtyEl: null, qty: awal };
    };
    const setStockRow = (row, qtyEl, qty) => {
      if (!qtyEl) return;          // tidak ada panel stok di halaman ini
      qtyEl.textContent = String(Math.max(0, qty));
      row.classList.toggle('low', qty <= 6);
      const flag = row.querySelector('.inv-flag');
      if (flag) flag.textContent = qty <= 6 ? 'Menipis' : 'Aman';
    };
    const refreshInvAlert = () => {
      const alertEl = document.getElementById('inv-alert');
      if (!alertEl) return;
      const n = document.querySelectorAll('.inv-row.low').length;
      alertEl.textContent = n + ' menipis';
    };

    const render = () => {
      // hapus baris, sisakan elemen kosong
      [...linesEl.querySelectorAll('.pos-line')].forEach((n) => n.remove());

      let total = 0;
      let qtyAll = 0;
      for (const [, v] of order) {
        total += v.price * v.qty;
        qtyAll += v.qty;
      }

      if (order.size === 0) {
        if (emptyEl) emptyEl.hidden = false;
      } else if (emptyEl) {
        emptyEl.hidden = true;
        for (const [key, v] of order) {
          const line = document.createElement('div');
          line.className = 'pos-line fresh';
          line.innerHTML =
            `<span>${v.name} <span class="qty">×${v.qty}</span></span>` +
            `<span>${rupiah(v.price * v.qty)}</span>`;
          linesEl.appendChild(line);
          // tandai stok yang menipis pada baris pesanan
          line.dataset.key = key;
        }
      }

      countEl.textContent = qtyAll + ' item';
      totalEl.textContent = rupiah(total);
      payEl.disabled = order.size === 0;
      if (order.size === 0) hintEl.textContent = 'Letakkan pesanan untuk melihat tiket masuk.';
    };

    items.forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.stock;
        const name = btn.dataset.name || btn.textContent.trim().split('\n')[0];
        const price = parseInt(btn.dataset.price, 10);

        const st = readStockRow(key, btn);
        const inOrder = order.get(key)?.qty ?? 0;

        // hormati stok: tidak bisa memesan lebih dari sisa
        if (st && !Number.isNaN(st.qty) && inOrder >= st.qty) {
          hintEl.textContent = `Stok ${name} tinggal ${st.qty} porsi.`;
          return;
        }

        if (order.has(key)) order.get(key).qty += 1;
        else order.set(key, { name, price, qty: 1, stock: key });

        btn.setAttribute('aria-pressed', 'true');

        // stok ikut turun — ini klaim inti halaman
        if (st && !Number.isNaN(st.qty)) {
          setStockRow(st.row, st.qtyEl, st.qty - 1);
          refreshInvAlert();
        }

        render();
        hintEl.textContent = `${name} ditambahkan.`;
      });
    });

    // klik baris pesanan = batalkan satu
    linesEl.addEventListener('click', (e) => {
      const line = e.target.closest('.pos-line');
      if (!line || !line.dataset.key) return;
      const key = line.dataset.key;
      const v = order.get(key);
      if (!v) return;

      v.qty -= 1;
      const st = readStockRow(key, btn);
      if (st && !Number.isNaN(st.qty)) {
        setStockRow(st.row, st.qtyEl, st.qty + 1);
        refreshInvAlert();
      }
      if (v.qty <= 0) {
        order.delete(key);
        const btn = items.find((b) => b.dataset.stock === key);
        if (btn) btn.setAttribute('aria-pressed', 'false');
      }
      render();
    });

    // Kirim ke dapur = pesanan masuk ke alur cerita halaman ini
    payEl.addEventListener('click', () => {
      if (order.size === 0) return;

      const itemsArr = [...order.entries()].map(([, v]) => ({
        name: v.name,
        qty: v.qty,
        price: v.price,
      }));
      const total = itemsArr.reduce((a, it) => a + it.price * it.qty, 0);

      const summary = itemsArr
        .map((v) => `${v.name} · ${v.qty}`)
        .join(' + ')
        .slice(0, 30);

      const no = ticketNo.v;
      const ticket = document.createElement('span');
      ticket.className = 'kds-ticket' + (reduce ? '' : ' fresh');
      ticket.dataset.state = 'new';
      ticket.textContent = `#${no} ${summary}`;
      ticketNo.v += 1;

      // tiket lama berhenti jadi "baru"
      kdsEl.querySelectorAll('.kds-ticket[data-state="new"]').forEach((t) => {
        t.dataset.state = 'old';
      });
      kdsEl.prepend(ticket);

      // kirim ke alur cerita: dapur, stok, dan laporan bereaksi
      if (window.YT_STORY) {
        window.YT_STORY.push({ no, items: itemsArr, total });
      }

      hintEl.textContent = `Pesanan #${no} terkirim. Gulir ke bawah untuk melihatnya masuk dapur.`;
      order.clear();
      items.forEach((b) => b.setAttribute('aria-pressed', 'false'));
      render();

      // kembalikan stok ke angka awal supaya halaman bisa dicoba lagi
      document.querySelectorAll('.inv-row[data-stock]').forEach((row) => {
        const qtyEl = row.querySelector('[data-qty]');
        const base = row.dataset.base;
        if (qtyEl && base) {
          qtyEl.textContent = base;
          row.classList.toggle('low', parseInt(base, 10) <= 6);
          const flag = row.querySelector('.inv-flag');
          if (flag) flag.textContent = parseInt(base, 10) <= 6 ? 'Menipis' : 'Aman';
        }
      });
      refreshInvAlert();
    });

    // simpan angka stok awal
    document.querySelectorAll('.inv-row[data-stock]').forEach((row) => {
      const q = row.querySelector('[data-qty]');
      if (q) row.dataset.base = q.textContent.trim();
    });

    // mulai dengan pesanan nyata supaya layar menunjukkan produk sedang bekerja,
    // bukan state kosong yang terbaca sebagai belum jadi
    const seed = [
      ['beras', items.find((b) => b.dataset.stock === 'beras')],
      ['goroho', items.find((b) => b.dataset.stock === 'goroho')],
      ['kopi', items.find((b) => b.dataset.stock === 'kopi')],
    ];
    seed.forEach(([key, btn]) => {
      if (!btn) return;
      order.set(key, {
        name: btn.dataset.name,
        price: parseInt(btn.dataset.price, 10),
        qty: key === 'beras' ? 2 : 1,
        stock: key,
      });
      btn.setAttribute('aria-pressed', 'true');
      const st = readStockRow(key, btn);
      if (st && !Number.isNaN(st.qty)) {
        setStockRow(st.row, st.qtyEl, st.qty - (key === 'beras' ? 2 : 1));
      }
    });
    refreshInvAlert();
    render();
    hintEl.textContent = 'Meja 4 — siap dikirim ke dapur.';
  }

  /* ---------------- reservasi: pilih meja ---------------- */
  const grid = document.getElementById('resv-grid');
  if (grid) {
    const countEl = document.getElementById('resv-count');
    grid.addEventListener('click', (e) => {
      const slot = e.target.closest('.resv-slot');
      if (!slot) return;
      const state = slot.dataset.state;
      if (state === 'booked') return; // tidak bisa memilih yang terisi

      // hanya satu pilihan
      grid.querySelectorAll('.resv-slot[data-state="picked"]').forEach((s) => {
        s.dataset.state = 'free';
      });
      slot.dataset.state = state === 'picked' ? 'free' : 'picked';
      if (countEl) {
        const booked = grid.querySelectorAll('.resv-slot[data-state="booked"]').length;
        countEl.textContent = booked + ' terisi';
      }
    });
  }

  /* ---------------- reveal on scroll ---------------- */
  const reveals = [...document.querySelectorAll('.reveal')];
  if (reveals.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      reveals.forEach((el) => el.classList.add('in'));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add('in');
              io.unobserve(en.target);
            }
          });
        },
        { threshold: 0, rootMargin: '0px 0px -8% 0px' }
      );
      reveals.forEach((el) => io.observe(el));
    }
  }

  /* ---------------- aktifkan tautan sesuai posisi ---------------- */
  const links = [...document.querySelectorAll('.nav-links a')];
  const sections = links
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    const io2 = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          links.forEach((a) =>
            a.setAttribute(
              'aria-current',
              a.getAttribute('href') === '#' + en.target.id ? 'true' : 'false'
            )
          );
        });
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );
    sections.forEach((s) => io2.observe(s));
  }
})();
