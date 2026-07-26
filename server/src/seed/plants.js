// Katalog tanaman bawaan — hidroponik populer Indonesia
// phases: [{ name, days, ph_min, ph_max, ppm_min, ppm_max }]
// Fase standar: Semai → Vegetatif → Panen (pindah tanam = akhir fase Semai)
export const seedPlants = [
  {
    name: 'Selada',
    phases: [
      { name: 'Semai', days: 10, ph_min: 5.5, ph_max: 6.5, ppm_min: 400, ppm_max: 600 },
      { name: 'Vegetatif', days: 25, ph_min: 5.5, ph_max: 6.5, ppm_min: 700, ppm_max: 1000 },
      { name: 'Panen', days: 7, ph_min: 5.5, ph_max: 6.5, ppm_min: 800, ppm_max: 1100 },
    ],
    tips: 'Suka suhu sejuk (18–24°C). Jaga PPM rendah di awal agar tidak pahit.',
  },
  {
    name: 'Pakcoy',
    phases: [
      { name: 'Semai', days: 10, ph_min: 5.5, ph_max: 6.5, ppm_min: 500, ppm_max: 700 },
      { name: 'Vegetatif', days: 25, ph_min: 5.8, ph_max: 6.5, ppm_min: 900, ppm_max: 1200 },
      { name: 'Panen', days: 7, ph_min: 5.8, ph_max: 6.5, ppm_min: 1000, ppm_max: 1300 },
    ],
    tips: 'Cepat tumbuh, ±35–40 hari dari semai. Waspadai kutu daun.',
  },
  {
    name: 'Kangkung',
    phases: [
      { name: 'Semai', days: 7, ph_min: 5.5, ph_max: 6.5, ppm_min: 500, ppm_max: 800 },
      { name: 'Vegetatif', days: 18, ph_min: 5.5, ph_max: 6.5, ppm_min: 800, ppm_max: 1200 },
      { name: 'Panen', days: 7, ph_min: 5.5, ph_max: 6.5, ppm_min: 900, ppm_max: 1300 },
    ],
    tips: 'Dapat dipanen potong berulang (panen bertahap). Suka air banyak.',
  },
  {
    name: 'Bayam',
    phases: [
      { name: 'Semai', days: 7, ph_min: 6.0, ph_max: 7.0, ppm_min: 500, ppm_max: 800 },
      { name: 'Vegetatif', days: 20, ph_min: 6.0, ph_max: 7.0, ppm_min: 900, ppm_max: 1300 },
      { name: 'Panen', days: 7, ph_min: 6.0, ph_max: 7.0, ppm_min: 1000, ppm_max: 1400 },
    ],
    tips: 'Toleran pH lebih tinggi. Panen muda untuk tekstur lembut.',
  },
  {
    name: 'Sawi',
    phases: [
      { name: 'Semai', days: 8, ph_min: 5.5, ph_max: 6.5, ppm_min: 500, ppm_max: 700 },
      { name: 'Vegetatif', days: 25, ph_min: 5.5, ph_max: 6.5, ppm_min: 900, ppm_max: 1200 },
      { name: 'Panen', days: 7, ph_min: 5.5, ph_max: 6.5, ppm_min: 1000, ppm_max: 1300 },
    ],
    tips: 'Mirip pakcoy. Jaga larutan tetap segar, ganti tiap 1–2 minggu.',
  },
  {
    name: 'Seledri',
    phases: [
      { name: 'Semai', days: 14, ph_min: 5.8, ph_max: 6.5, ppm_min: 600, ppm_max: 900 },
      { name: 'Vegetatif', days: 45, ph_min: 5.8, ph_max: 6.5, ppm_min: 1000, ppm_max: 1500 },
      { name: 'Panen', days: 10, ph_min: 5.8, ph_max: 6.5, ppm_min: 1200, ppm_max: 1600 },
    ],
    tips: 'Lambat berkecambah, bersabar. Bisa panen tangkai bertahap.',
  },
  {
    name: 'Kailan',
    phases: [
      { name: 'Semai', days: 9, ph_min: 5.5, ph_max: 6.5, ppm_min: 500, ppm_max: 800 },
      { name: 'Vegetatif', days: 28, ph_min: 5.5, ph_max: 6.5, ppm_min: 900, ppm_max: 1300 },
      { name: 'Panen', days: 7, ph_min: 5.5, ph_max: 6.5, ppm_min: 1000, ppm_max: 1400 },
    ],
    tips: 'Suka cahaya penuh. Panen saat kuncup bunga belum mekar.',
  },
  {
    name: 'Tomat Cherry',
    phases: [
      { name: 'Semai', days: 14, ph_min: 5.5, ph_max: 6.5, ppm_min: 600, ppm_max: 900 },
      { name: 'Vegetatif', days: 40, ph_min: 5.8, ph_max: 6.3, ppm_min: 1400, ppm_max: 2000 },
      { name: 'Panen', days: 30, ph_min: 5.8, ph_max: 6.3, ppm_min: 1800, ppm_max: 2400 },
    ],
    tips: 'Butuh penyangga & pemangkasan tunas air. PPM tinggi saat berbuah.',
  },
  {
    name: 'Cabai',
    phases: [
      { name: 'Semai', days: 14, ph_min: 5.8, ph_max: 6.5, ppm_min: 600, ppm_max: 900 },
      { name: 'Vegetatif', days: 45, ph_min: 5.8, ph_max: 6.5, ppm_min: 1200, ppm_max: 1800 },
      { name: 'Panen', days: 40, ph_min: 5.8, ph_max: 6.5, ppm_min: 1600, ppm_max: 2200 },
    ],
    tips: 'Panen berulang hingga ±1 bulan lebih. Goyang bunga untuk membantu penyerbukan.',
  },
  {
    name: 'Kemangi',
    phases: [
      { name: 'Semai', days: 8, ph_min: 5.5, ph_max: 6.5, ppm_min: 400, ppm_max: 700 },
      { name: 'Vegetatif', days: 25, ph_min: 5.5, ph_max: 6.5, ppm_min: 700, ppm_max: 1000 },
      { name: 'Panen', days: 14, ph_min: 5.5, ph_max: 6.5, ppm_min: 700, ppm_max: 1000 },
    ],
    tips: 'Petik pucuk rutin agar bercabang banyak. Panen bertahap.',
  },
  {
    name: 'Mint',
    phases: [
      { name: 'Semai', days: 10, ph_min: 5.5, ph_max: 6.5, ppm_min: 400, ppm_max: 700 },
      { name: 'Vegetatif', days: 25, ph_min: 5.5, ph_max: 6.5, ppm_min: 700, ppm_max: 1000 },
      { name: 'Panen', days: 21, ph_min: 5.5, ph_max: 6.5, ppm_min: 700, ppm_max: 1000 },
    ],
    tips: 'Sangat mudah. Pangkas rutin agar tidak liar.',
  },
  {
    name: 'Bawang Daun',
    phases: [
      { name: 'Semai', days: 10, ph_min: 6.0, ph_max: 7.0, ppm_min: 500, ppm_max: 800 },
      { name: 'Vegetatif', days: 30, ph_min: 6.0, ph_max: 7.0, ppm_min: 900, ppm_max: 1300 },
      { name: 'Panen', days: 14, ph_min: 6.0, ph_max: 7.0, ppm_min: 1000, ppm_max: 1400 },
    ],
    tips: 'Bisa dari sisa akar dapur. Panen potong bertahap.',
  },
  {
    name: 'Brokoli',
    phases: [
      { name: 'Semai', days: 10, ph_min: 6.0, ph_max: 6.8, ppm_min: 700, ppm_max: 1000 },
      { name: 'Vegetatif', days: 45, ph_min: 6.0, ph_max: 6.8, ppm_min: 1400, ppm_max: 2000 },
      { name: 'Panen', days: 10, ph_min: 6.0, ph_max: 6.8, ppm_min: 1600, ppm_max: 2100 },
    ],
    tips: 'Butuh nutrisi kuat & suhu tidak terlalu panas.',
  },
  {
    name: 'Timun',
    phases: [
      { name: 'Semai', days: 7, ph_min: 5.5, ph_max: 6.5, ppm_min: 700, ppm_max: 1000 },
      { name: 'Vegetatif', days: 30, ph_min: 5.5, ph_max: 6.5, ppm_min: 1200, ppm_max: 1700 },
      { name: 'Panen', days: 21, ph_min: 5.5, ph_max: 6.5, ppm_min: 1400, ppm_max: 1800 },
    ],
    tips: 'Merambat — sediakan ajir/tali. Panen buah muda terus-menerus.',
  },
  {
    name: 'Stroberi',
    phases: [
      { name: 'Semai', days: 21, ph_min: 5.5, ph_max: 6.2, ppm_min: 600, ppm_max: 900 },
      { name: 'Vegetatif', days: 50, ph_min: 5.5, ph_max: 6.2, ppm_min: 800, ppm_max: 1200 },
      { name: 'Panen', days: 30, ph_min: 5.5, ph_max: 6.2, ppm_min: 1000, ppm_max: 1400 },
    ],
    tips: 'Sensitif pH tinggi. Jaga kelembapan buah agar tidak busuk.',
  },
];
