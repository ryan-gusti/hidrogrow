# Product Requirements Document (PRD)

## HidroGrow — Aplikasi Manajemen Hidroponik Rumahan

| | |
|---|---|
| **Versi Dokumen** | 1.4 |
| **Tanggal** | 26 Juli 2026 |
| **Status** | Terimplementasi (semua fase) |
| **Platform** | Web-based (mobile-friendly / responsive, PWA), berjalan penuh secara lokal |

> **Perubahan v1.1:** Stack final Vue 3 + Express + SQLite (full lokal, tanpa layanan cloud). Penyesuaian: tanpa Google OAuth (F-1.1), reset password diganti ganti password via profil (F-1.3), notifikasi push diganti notifikasi lokal (F-5.3). Lihat Bagian 9 & 12.
>
> **Perubahan v1.2:** Autentikasi memakai **username** (bukan email) agar lebih mudah — tidak ada kebutuhan email sama sekali di aplikasi.
>
> **Perubahan v1.3:** Menghapus **registrasi publik** dan **mode tamu**. Aplikasi memakai **akun default** yang dibuat otomatis saat database kosong (username `admin`, password `admin123` — dapat diubah via env `DEFAULT_USERNAME`/`DEFAULT_PASSWORD` atau di Pengaturan). Repositori: https://github.com/ryan-gusti/hidrogrow
>
> **Perubahan v1.4:** Frontend diganti dengan **design system "Anthropic"**: palette beige hangat (#f5f4ed) + aksen terakota (#c96442), tipografi serif display, shell responsif (sidebar desktop / appbar+bottom-nav mobile), FAB, bottom-sheet, toast, dan **grafik SVG custom** (tren pH/PPM & batang panen) menggantikan Chart.js. Token desain dibekukan di `client/src/design.css`.

---

## 1. Ringkasan Produk

HidroGrow adalah aplikasi berbasis web yang dirancang mobile-first untuk membantu **hobiis hidroponik rumahan** mengelola kebun mereka secara terstruktur. Aplikasi berfokus pada tiga hal utama: **manajemen jadwal tanam & nutrisi**, **pencatatan & laporan panen**, serta **pengingat (reminder) otomatis** — semuanya dengan input manual, tanpa ketergantungan pada perangkat IoT.

### 1.1 Problem Statement

Hobiis hidroponik rumahan umumnya:
- Lupa jadwal penting seperti waktu semai, pindah tanam, ganti larutan nutrisi, dan cek pH/PPM, yang berujung pada tanaman gagal atau hasil tidak optimal.
- Mencatat kegiatan kebun secara tersebar (buku tulis, notes HP, atau tidak sama sekali), sehingga sulit belajar dari siklus tanam sebelumnya.
- Tidak punya gambaran hasil panen dari waktu ke waktu untuk mengevaluasi metode mana yang berhasil.

### 1.2 Solusi

Satu aplikasi web ringan yang bisa dibuka dari HP kapan saja untuk:
1. Merencanakan dan melacak siklus tanam per batch/lubang tanam.
2. Menerima pengingat otomatis untuk tugas rutin kebun.
3. Mencatat panen dan melihat laporan sederhana yang mudah dipahami.

### 1.3 Sasaran Pengguna (Target Users)

- **Primer:** Hobiis hidroponik rumahan (pemula s.d. menengah), umumnya menanam sayuran daun (selada, pakcoy, kangkung, bayam) dengan sistem sederhana (wick, NFT mini, DFT, rakit apung).
- **Karakteristik:** Menggunakan smartphone sebagai perangkat utama, waktu terbatas (kebun dikelola di sela aktivitas harian), tidak memiliki sensor otomatis.

---

## 2. Tujuan & Metrik Keberhasilan

### 2.1 Tujuan Produk

1. Mengurangi kegagalan tanam akibat lupa perawatan rutin.
2. Menjadi "buku catatan kebun digital" yang lengkap dan mudah diakses.
3. Memberi insight sederhana agar hobiis bisa meningkatkan hasil panen dari siklus ke siklus.

### 2.2 Metrik Keberhasilan (Success Metrics)

| Metrik | Target (6 bulan pasca-rilis) |
|---|---|
| Pengguna aktif mingguan (WAU) | ≥ 60% dari pengguna terdaftar |
| Reminder yang ditindaklanjuti (ditandai selesai) | ≥ 70% |
| Pengguna yang menyelesaikan minimal 1 siklus tanam penuh (semai → panen tercatat) | ≥ 50% |
| Retensi 30 hari | ≥ 40% |
| Waktu muat halaman di jaringan 3G/4G | < 3 detik |

---

## 3. Ruang Lingkup (Scope)

### 3.1 Dalam Lingkup (In Scope) — MVP

- Manajemen profil kebun & instalasi hidroponik (manual).
- Manajemen tanaman & siklus tanam (batch).
- Jadwal & manajemen nutrisi (pencatatan manual pH, PPM/TDS, penggantian larutan).
- Pengingat/reminder tugas rutin dengan notifikasi.
- Pencatatan panen & laporan/statistik sederhana.
- Katalog tanaman dasar dengan preset jadwal (template).
- Desain responsive mobile-first + PWA (installable, notifikasi push).

### 3.2 Di Luar Lingkup (Out of Scope) — untuk saat ini

- Integrasi sensor/IoT (pH meter otomatis, TDS otomatis, dsb.).
- Marketplace / fitur jual-beli hasil panen.
- Fitur sosial/komunitas (forum, sharing publik).
- Aplikasi native (iOS/Android) — cukup PWA.
- Multi-user per kebun / kolaborasi tim.

---

## 4. Fitur & Kebutuhan Fungsional

### 4.1 Onboarding & Akun

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-1.1 | Login via username/password dengan akun default otomatis (v1.3: tanpa registrasi publik) | Must |
| F-1.2 | Onboarding singkat: buat profil kebun (nama, jenis sistem, jumlah lubang tanam) | Must |
| F-1.3 | Ganti password dari halaman profil (v1.1: tanpa email karena tidak ada server email) | Must |
| ~~F-1.4~~ | ~~Mode tamu~~ — **dihapus di v1.3** | — |

### 4.2 Manajemen Kebun & Instalasi

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-2.1 | Pengguna dapat membuat lebih dari satu instalasi (misal: "NFT Teras", "Wick Dapur") | Must |
| F-2.2 | Setiap instalasi memiliki atribut: jenis sistem, kapasitas lubang, volume tandon (liter) | Must |
| F-2.3 | Visualisasi sederhana status lubang tanam (kosong / semai / vegetatif / siap panen) | Should |

### 4.3 Manajemen Siklus Tanam (Batch)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-3.1 | Membuat batch tanam: pilih tanaman, tanggal semai, jumlah bibit, instalasi tujuan | Must |
| F-3.2 | Fase otomatis dihitung dari tanggal semai berdasarkan template tanaman: Semai → Pindah Tanam → Vegetatif → Panen (estimasi) | Must |
| F-3.3 | Pengguna dapat menyesuaikan durasi tiap fase per batch | Should |
| F-3.4 | Timeline visual per batch (hari ke-berapa, fase saat ini, estimasi panen) | Must |
| F-3.5 | Catatan harian per batch: teks + foto (progres tanaman, masalah hama, dll.) | Should |
| F-3.6 | Menandai batch gagal beserta alasan (untuk pembelajaran) | Should |

### 4.4 Manajemen Nutrisi & Pengecekan Air (Input Manual)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-4.1 | Log pengecekan manual: tanggal, pH, PPM/TDS, suhu air (opsional), volume ditambah | Must |
| F-4.2 | Target rentang pH & PPM per fase per tanaman (dari template, bisa diubah) | Must |
| F-4.3 | Indikator visual jika nilai tercatat di luar rentang target (merah/kuning/hijau) | Must |
| F-4.4 | Kalkulator nutrisi AB Mix sederhana: input volume tandon & target PPM → rekomendasi ml pekatan A & B | Should |
| F-4.5 | Riwayat & grafik tren pH dan PPM per instalasi | Should |
| F-4.6 | Log penggantian/penambahan larutan (kuras total vs top-up) | Must |

### 4.5 Pengingat & Notifikasi (Reminder)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-5.1 | Reminder otomatis dibuat dari template tanaman saat batch dibuat (semai, pindah tanam, estimasi panen) | Must |
| F-5.2 | Reminder rutin yang dapat dikustomisasi: cek pH/PPM (misal tiap 2 hari), ganti larutan (misal tiap 7–14 hari), bersihkan tandon | Must |
| F-5.3 | Notifikasi lokal via Notification API saat aplikasi dibuka/berjalan + badge jumlah tugas (v1.1: tanpa push server/email karena berjalan full lokal) | Must |
| F-5.4 | Halaman "Tugas Hari Ini" sebagai landing utama: daftar tugas dengan tombol tandai selesai | Must |
| F-5.5 | Snooze / tunda reminder (nanti malam, besok) | Should |
| F-5.6 | Tugas yang ditandai selesai otomatis tercatat sebagai log (misal selesai "cek pH" → buka form log pH) | Should |

### 4.6 Calendar View (Kalender Kebun) ⭐ Fitur Inti

Tampilan kalender menjadi pusat perencanaan dan pemantauan seluruh kegiatan kebun.

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-C.1 | Tampilan kalender bulanan (default) dan mingguan, dioptimalkan untuk layar HP | Must |
| F-C.2 | Semua event tampil di kalender: jadwal semai, pindah tanam, estimasi panen, reminder cek air nutrisi (pH/PPM), ganti/kuras larutan | Must |
| F-C.3 | Tambah jadwal langsung dari kalender: tap tanggal → pilih jenis event (Mulai Semai / Pindah Tanam / Cek Nutrisi / Ganti Larutan / Lainnya) | Must |
| F-C.4 | Saat menambah "Mulai Semai" dari kalender → otomatis membuat batch baru; event pindah tanam & estimasi panen langsung ter-plot di tanggal berikutnya sesuai template tanaman | Must |
| F-C.5 | Reminder cek air nutrisi berulang (recurring) tampil di kalender, misal setiap 2 hari; interval dapat diatur | Must |
| F-C.6 | Kode warna per jenis event (semai = hijau, pindah tanam = biru, cek nutrisi = kuning, panen = oranye) + filter per instalasi/batch | Should |
| F-C.7 | Tap event → detail + aksi cepat: tandai selesai, geser tanggal (reschedule), atau langsung isi log (misal isi pH/PPM dari event cek nutrisi) | Must |
| F-C.8 | Menggeser event pindah tanam/panen otomatis menyesuaikan reminder terkait di batch tersebut | Should |
| F-C.9 | Indikator titik (dot) pada tanggal yang memiliki event; badge jumlah tugas belum selesai | Should |
| F-C.10 | Sinkronisasi dua arah: event yang dibuat dari kalender muncul di "Hari Ini" & timeline batch, dan sebaliknya | Must |

### 4.7 Pencatatan & Laporan Panen

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-6.1 | Catat panen per batch: tanggal, jumlah (pcs/ikat), berat (gram), foto, catatan kualitas | Must |
| F-6.2 | Mendukung panen bertahap (multiple harvest per batch, misal kangkung potong) | Should |
| F-6.3 | Dashboard laporan: total panen per bulan, per jenis tanaman, per instalasi | Must |
| F-6.4 | Perbandingan antar siklus: durasi tanam aktual vs estimasi, hasil per batch | Should |
| F-6.5 | Ekspor data panen ke CSV | Could |
| F-6.6 | Ringkasan biaya sederhana (opsional input biaya benih/nutrisi) vs nilai panen | Could |

### 4.8 Katalog Tanaman & Template

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-7.1 | Katalog bawaan ± 15 tanaman populer hidroponik Indonesia (selada, pakcoy, kangkung, bayam, sawi, seledri, kailan, tomat cherry, cabai, dll.) | Must |
| F-7.2 | Setiap tanaman memiliki template: durasi fase, target pH & PPM per fase, tips singkat | Must |
| F-7.3 | Pengguna dapat membuat tanaman/template kustom | Should |

---

## 5. Kebutuhan Non-Fungsional

| Kategori | Kebutuhan |
|---|---|
| **Responsivitas** | Mobile-first, layout optimal di 360–430 px; tetap nyaman di tablet/desktop. Target sentuh minimal 44×44 px. |
| **PWA** | Installable ke home screen, service worker untuk cache aset & API, notifikasi lokal (Notification API). |
| **Offline** | Data terakhir dapat dibaca offline; input log dapat disimpan lokal dan disinkronkan saat online (offline-first untuk form log). |
| **Performa** | First Contentful Paint < 2 dtk di 4G; ukuran bundle awal < 300 KB (gzip). |
| **Keamanan** | HTTPS wajib; password di-hash (bcrypt/argon2); data pengguna terisolasi per akun. |
| **Privasi** | Data milik pengguna; fitur hapus akun beserta seluruh data. |
| **Bahasa** | Bahasa Indonesia (default); struktur siap i18n. |
| **Aksesibilitas** | Kontras memenuhi WCAG AA; dapat digunakan satu tangan (navigasi bawah). |

---

## 6. Alur Pengguna Utama (Key User Flows)

### 6.1 Memulai Batch Tanam Baru
1. Buka aplikasi → tab **Tanam** → tombol "+ Batch Baru".
2. Pilih tanaman dari katalog (misal: Pakcoy) → isi tanggal semai, jumlah bibit, pilih instalasi.
3. Sistem membuat timeline fase + reminder otomatis (pindah tanam H+10, estimasi panen H+35, cek pH tiap 2 hari).
4. Batch muncul di dashboard dengan indikator "Hari ke-1 — Fase Semai".

### 6.2 Rutinitas Harian
1. Notifikasi push pagi: "3 tugas hari ini di kebunmu 🌱".
2. Buka app → halaman **Hari Ini** menampilkan: Cek pH NFT Teras, Top-up air, Pindah tanam Pakcoy Batch #2.
3. Tap "Cek pH" → form cepat (pH, PPM) → simpan → tugas otomatis selesai, nilai masuk grafik.

### 6.3 Merencanakan Jadwal dari Kalender
1. Buka tab **Kalender** → tampilan bulan berjalan dengan dot berwarna di tanggal-tanggal yang ada kegiatan.
2. Tap tanggal 1 Agustus → pilih "Mulai Semai" → pilih tanaman Selada, jumlah 20 bibit.
3. Kalender otomatis menampilkan: Pindah Tanam ~11 Agustus (biru), Estimasi Panen ~5 September (oranye), dan reminder Cek Nutrisi berulang tiap 2 hari (kuning).
4. Ternyata tanggal 11 Agustus pengguna sibuk → tap event → geser ke 12 Agustus → reminder terkait ikut menyesuaikan.
5. Notifikasi push muncul di setiap tanggal event; tap event "Cek Nutrisi" → langsung isi pH & PPM → event tertandai selesai.

### 6.4 Panen & Evaluasi
1. Reminder "Estimasi panen Pakcoy Batch #2" muncul.
2. Pengguna mencatat panen: 18 pcs, 1.450 gram, foto.
3. Batch ditutup → data masuk laporan; pengguna melihat perbandingan: "Batch ini 3 hari lebih cepat & 12% lebih berat dari batch sebelumnya."

---

## 7. Struktur Informasi & Navigasi (Mobile)

Navigasi bawah (bottom nav) dengan 5 tab utama:

1. **Hari Ini** — daftar tugas & reminder (halaman default).
2. **Kalender** — calendar view bulanan/mingguan: semua jadwal semai, pindah tanam, cek nutrisi, dan panen; tambah jadwal langsung dari sini.
3. **Tanam** — daftar batch aktif, timeline, katalog tanaman.
4. **Log** — riwayat pH/PPM, grafik tren, log nutrisi.
5. **Laporan** — statistik panen, riwayat batch selesai.

Tombol aksi cepat (FAB) untuk: catat pH/PPM, catat panen, batch baru.

---

## 8. Model Data (High-Level)

- **User** (id, nama, username)
- **Installation** (id, user_id, nama, jenis_sistem, kapasitas_lubang, volume_tandon)
- **PlantTemplate** (id, nama, fase[] {nama, durasi_hari, ph_min/max, ppm_min/max}, tips)
- **Batch** (id, installation_id, plant_template_id, tanggal_semai, jumlah, status, fase_aktual[])
- **NutrientLog** (id, installation_id, tanggal, ph, ppm, suhu_air, volume_tambah, tipe {cek|topup|kuras})
- **Task/Reminder** (id, batch_id/installation_id, jenis, jadwal, recurrence, status, snoozed_until)
- **HarvestLog** (id, batch_id, tanggal, jumlah, berat_gram, foto_url, catatan)
- **BatchNote** (id, batch_id, tanggal, teks, foto_url)

---

## 9. Teknologi Final (v1.1 — Full Lokal, Tanpa Layanan Cloud)

| Lapisan | Teknologi |
|---|---|
| Frontend | Vue 3 + Vite, Vue Router, Pinia, **design system Anthropic** (`design.css` — token, komponen, responsif), PWA (`vite-plugin-pwa`/Workbox), grafik SVG custom (tanpa library chart) |
| Backend | Node.js + Express (REST API), JWT untuk sesi |
| Database | SQLite lokal via modul bawaan `node:sqlite` (file `server/data/hidrogrow.db`) |
| Autentikasi | Username/password, hash bcrypt (bcryptjs). Akun default otomatis (`admin`/`admin123`, dapat dioverride via env). Tanpa registrasi publik, tanpa OAuth |
| Notifikasi | Notification API lokal saat aplikasi dibuka + badge tugas (tanpa push server) |
| Penyimpanan foto | Filesystem lokal `server/uploads/` (multer) dengan kompresi sisi klien (canvas) |
| Menjalankan | `npm install` → `npm run dev` (server :3000 + client :5173) atau `npm run build && npm start` (satu proses di :3000) |

Alasan: pengguna menginginkan aplikasi berjalan penuh secara lokal tanpa dependensi cloud/kredensial eksternal.

---

## 10. Rencana Rilis (Roadmap)

### Fase 1 — MVP (± 6–8 minggu)
- Akun & onboarding, manajemen instalasi
- Batch tanam + timeline fase + katalog 15 tanaman
- Log manual pH/PPM + indikator rentang
- Reminder otomatis & kustom + push notification
- **Calendar view** bulanan/mingguan: tambah jadwal semai & pindah tanam dari kalender, reminder cek nutrisi tampil di kalender
- Halaman "Hari Ini"
- Catat panen + laporan dasar

### Fase 2 — Peningkatan (± 4–6 minggu)
- Grafik tren pH/PPM, kalkulator AB Mix
- Panen bertahap, perbandingan antar siklus
- Catatan harian + foto per batch
- Snooze reminder, template kustom

### Fase 3 — Opsional / Masa Depan
- Ekspor CSV, ringkasan biaya vs hasil
- Mode tamu
- (Jangka panjang) integrasi IoT & fitur komunitas — di luar scope saat ini

---

## 11. Asumsi & Risiko

**Asumsi**
- Pengguna bersedia input data manual 1–3 menit per hari.
- Pengguna memiliki alat ukur dasar (pH meter & TDS meter manual).
- Browser pengguna mendukung PWA & push notification (mayoritas Chrome Android).

**Risiko & Mitigasi**

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Push notification tidak andal di iOS Safari | Reminder terlewat | Notifikasi lokal + badge di halaman "Hari Ini" (v1.1: tanpa push server) |
| Pengguna malas input manual | Data kosong, nilai app menurun | Form super cepat (≤3 field), quick action dari notifikasi |
| Template tanaman tidak akurat untuk semua kondisi | Estimasi meleset | Semua durasi & target bisa disesuaikan per batch |
| Scope creep ke arah IoT/marketplace | MVP molor | PRD ini mengunci scope; fitur lain masuk backlog Fase 3+ |

---

## 12. Pertanyaan Terbuka (Open Questions) — Terjawab v1.1

1. Apakah perlu dukungan multi-bahasa (Inggris) sejak awal, atau cukup Bahasa Indonesia? → **Bahasa Indonesia saja**; struktur UI siap untuk i18n di masa depan.
2. Berapa batas jumlah instalasi/batch per pengguna gratis (jika kelak ada model berbayar)? → **Tanpa batas**; aplikasi full lokal, tidak ada model berbayar saat ini.
3. Apakah foto panen/batch perlu batasan ukuran/jumlah untuk mengontrol biaya storage? → **Batas 5 MB/file** + kompresi sisi klien; storage lokal sehingga tidak ada biaya.
4. Perlukah backup/ekspor seluruh data pengguna sejak MVP? → **Ekspor CSV panen tersedia**; backup penuh cukup dengan menyalin file `server/data/hidrogrow.db`.

---

## 13. Status Implementasi (v1.1)

Seluruh fitur Fase 1–3 telah terimplementasi:

- **Auth & akun:** login username+password dengan akun default otomatis (bcrypt+JWT), ganti password, hapus akun beserta data
- **Instalasi:** multi-instalasi, atribut jenis sistem/kapasitas/volume tandon, visualisasi status lubang (F-2.3)
- **Batch:** timeline fase otomatis dari template, override durasi per batch (F-3.3), PhaseBar visual (F-3.4), catatan harian + foto (F-3.5), tandai gagal + alasan (F-3.6)
- **Nutrisi:** log cek/topup/kuras (F-4.1, F-4.6), target rentang per fase (F-4.2), indikator merah/kuning/hijau (F-4.3), kalkulator AB Mix (F-4.4), grafik tren pH/PPM (F-4.5)
- **Reminder:** auto dari template (F-5.1), recurring interval dapat diatur (F-5.2), notifikasi lokal + badge (F-5.3), halaman Hari Ini (F-5.4), snooze nanti malam/besok/tanggal (F-5.5), selesai → buka form log (F-5.6)
- **Kalender (F-C.1 s.d. F-C.10):** bulanan/mingguan, semua jenis event + dot berwarna, tambah jadwal dari tanggal, "Mulai Semai" → batch otomatis ter-plot, recurring tampil di kalender, kode warna + filter instalasi, detail event + selesai/geser/isi log, geser pindah/panen menyesuaikan reminder terkait, badge tugas, sinkron dua arah dengan Hari Ini & timeline batch
- **Panen & laporan:** catat panen + foto (F-6.1), panen bertahap (F-6.2), dashboard per bulan/tanaman/instalasi (F-6.3), perbandingan siklus + insight otomatis (F-6.4), ekspor CSV (F-6.5), ringkasan biaya per batch & total (F-6.6)
- **Katalog:** 15 tanaman bawaan (F-7.1), template fase + target pH/PPM + tips (F-7.2), tanaman kustom (F-7.3)
- **Non-fungsional:** mobile-first 360–430px, target sentuh ≥44px, PWA installable + service worker, offline-first form log (antrean sinkronisasi), bundle awal ±54 KB gzip (< 300 KB), bcrypt, data terisolasi per akun, hapus akun + data, Bahasa Indonesia

### Cara Menjalankan

```bash
npm install
npm run dev        # development: server :3000 + client :5173 (proxy)
# atau produksi (satu proses):
npm run build && npm start   # buka http://localhost:3000
npm test           # 18 test API (vitest + supertest)
```
