# AGENTS.md

HidroGrow — manajemen hidroponik rumahan, **full lokal** (Vue 3 + Express + SQLite). Lihat `prd.md` untuk spesifikasi produk.

## Commands

```bash
npm install              # install semua workspace
npm run dev              # dev: server :3000 + client :5173 (concurrently)
npm test                 # server API tests (vitest + supertest)
npm run build            # build client → client/dist
npm start                # produksi: server :3000 menyajikan API + client/dist
```

- **Dev: buka http://localhost:5173** (Vite, hot-reload, proxy /api & /uploads ke :3000). Port :3000 saat dev hanya API — jangan dibuka sebagai app (menyajikan build lama).
- **Prod:** `npm run build && npm start` → buka http://localhost:3000 (satu proses, Express serve SPA + API).
- Test tunggal: `npm test -w server -- -t "nama test"`.

## Stack & quirks (penting)

- **Node 26+ wajib.** Memakai modul bawaan `node:sqlite` (`DatabaseSync`) — **bukan** `better-sqlite3` (gagal kompilasi di Node 26). API sinkron: `db.prepare(...).run()/get()/all()`. `run()` mengembalikan `{ changes, lastInsertRowid }` (number).
- **Server ESM** (`"type":"module"`); dev pakai `node --watch`.
- **DB:** `server/data/hidrogrow.db` (WAL). Dibuat otomatis + seed 15 tanaman + akun default saat kosong. `server/data/` & `server/uploads/` di-gitignore.
- **Auth: username/password saja.** Akun default `admin`/`admin123` di-seed di `server/src/db.js` (override via env `DEFAULT_USERNAME`/`DEFAULT_PASSWORD`, `JWT_SECRET`). **Tidak ada endpoint register/guest** (dihapus v1.3). JWT 90 hari.
- `server/src/db.js` berisi skema + migrasi ringan (`ALTER TABLE users RENAME COLUMN email TO username`) + seed — semua jalan saat import.
- Reminder engine: `server/src/reminders.js` (`generateBatchTasks`, `completeTask` recurring, `rescheduleTask` geser task terkait). Kalender mematerialisasi recurring via `expandTaskOccurrences`.

## Client / frontend

- **Tailwind & Chart.js TIDAK dipakai** (dihapus). Sumber kebenaran visual = `client/src/design.css` (token Anthropic: beige #f5f4ed + terakota #c96442, serif display). Jangan tambahkan utility class Tailwind.
- **Grafik SVG custom**: `components/TrendChart.vue` (pH/PPM) & `components/BarChart.vue` (panen). Jangan reintroduce lib chart.
- `Frontend-Menarik-dari-PRD/*.html` = slicing referensi (read-only). Saat fix UI, cocokkan ke sini.
- PWA via `vite-plugin-pwa`; service worker auto-update.
- Offline-first: form log di-queue di localStorage (`client/src/api.js`) & disinkronkan saat online.

## Konvensi

- Semua teks UI Bahasa Indonesia.
- Komponen sheet (modal bawah) bungkus dirinya via `Sheet.vue` (Teleport) — bukan sheet-root global.
- `PhaseBar.vue` punya prop `padded` (default `true`, pakai padding `.phase-wrap` dari slicing). Set `:padded="false"` jika ditempatkan di dalam card yang sudah ber-padding (mis. `BatchDetailView`).
- Toast & buka sheet global: emit event `hg:toast` / `hg:open-sheet` di window, atau `@toast` dari komponen sheet ke parent.
- Refresh data cross-view: dispatch `window.dispatchEvent(new CustomEvent('hg:refresh'))`.

## Verifikasi sebelum selesai

1. `npm test` — 18 test API harus lolos.
2. `npm run build` — build client harus sukses (cek tidak ada import dinamis yang aneh).
3. Jika ubah auth/DB: hapus `server/data/` lalu restart untuk verifikasi seed akun default jalan.
