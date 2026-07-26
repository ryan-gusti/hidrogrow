# HidroGrow — design handoff (post-implementation)

Status: **terimplementasi** (26 Juli 2026). Slicing di `Frontend-Menarik-dari-PRD/*.html` sudah diport ke Vue 3 + design system.

## Sumber kebenaran

| Yang | File |
|---|---|
| Token & kelas desain (frozen) | `client/src/design.css` |
| Slicing referensi (read-only) | `Frontend-Menarik-dari-PRD/*.html` |
| Shell app | `client/src/App.vue` |
| Komponen | `client/src/components/*.vue` |
| View per route | `client/src/views/*.vue` |
| Aset | `client/public/assets/{hero-nft,kebun-sap,pakcoy}.jpg` |

Token (warna beige/terakota, serif display, oklch event, radius/shadow/motion) dibekulkan verbatim dari slicing ke `design.css`. **Jangan substitusi warna/typografi framework default. Tidak ada Tailwind.**

## Pemetaan screen → route

| Slicing | Route | View | Catatan |
|---|---|---|---|
| `index.html` | `/` | `TodayView.vue` | Hari Ini: greeting, stat, hero instalasi, tugas, upcoming |
| `kalender.html` | `/kalender` | `CalendarView.vue` | Bulanan/mingguan, dot, badge, tambah jadwal, geser |
| `tanam.html` | `/tanam` | `GrowView.vue` | Batch aktif + katalog; detail di `/tanam/:id` (`BatchDetailView.vue`) |
| `log.html` | `/log` | `LogsView.vue` | Reading cards, grafik tren SVG, riwayat, kalkulator AB Mix |
| `laporan.html` | `/laporan` | `ReportsView.vue` | Insight, grafik batang SVG, per-tanaman, biaya, CSV |
| — | `/login` | `LoginView.vue` | Auth (tidak ada di slicing) |
| — | `/onboarding` | `OnboardingView.vue` | Buat instalasi pertama |
| — | `/pengaturan` | `SettingsView.vue` | Profil, instalasi, notifikasi, password, hapus akun |

## Shell & komponen

- **App.vue**: sidebar (desktop ≥1024px) + appbar/bottom-nav (mobile) + FAB terakota + container sheet/toast global.
- **Sheet.vue**: bottom-sheet via Teleport (bukan sheet-root global). Semua sheet membungkus dirinya sendiri.
- **Grafik SVG custom**: `TrendChart.vue` (pH/PPM) & `BarChart.vue` (panen). **Jangan reintroduce lib chart.**
- **PhaseBar.vue**: prop `padded` (default `true` → pakai padding `.phase-wrap` `0 14px 14px` dari slicing). Set `:padded="false"` jika ditempatkan di dalam card yang sudah ber-padding (mis. `BatchDetailView`).

## Interaksi & state

- State didukung: default, hover, focus, active, disabled, loading, empty, error, success.
- Toast global: dispatch `window` event `hg:toast`.
- Refresh data cross-view: dispatch `window` event `hg:refresh`.
- Offline-first: form log di-queue di `localStorage` (`client/src/api.js`), disinkronkan saat online.

## Responsif

- ≥1024px: sidebar 268px + konten; sheet jadi modal tengah 540px; grid multi-kolom.
- 720–1023px: grid 2–3 kolom untuk batch/katalog/stat.
- ≤719px (mobile): appbar + bottom-nav + FAB; sheet bottom-sheet. Target 360–430px, sentuh ≥44px.

## Aturan fidelity (saat edit UI)

1. Cocokkan ke `Frontend-Menarik-dari-PRD/*.html` dulu — itu kontrak visual.
2. Token & kelas ambil dari `design.css`; jangan hardcode warna/spacing inline.
3. Pertahankan teks Bahasa Indonesia asli dari slicing.
4. Jangan flatten modul domain (batch card, kalender, reading card) jadi card generik.
5. Jika ambigu, ikuti perilaku slicing, bukan pola baru.
