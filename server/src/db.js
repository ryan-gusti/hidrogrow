import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { seedPlants } from './seed/plants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(process.env.DB_PATH || path.join(DATA_DIR, 'hidrogrow.db'));

db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_guest INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS installations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  system_type TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 0,
  reservoir_volume REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS plant_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phases TEXT NOT NULL, -- JSON: [{name, days, ph_min, ph_max, ppm_min, ppm_max}]
  tips TEXT DEFAULT '',
  is_custom INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  installation_id INTEGER NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
  plant_template_id INTEGER NOT NULL REFERENCES plant_templates(id),
  name TEXT NOT NULL,
  sow_date TEXT NOT NULL, -- YYYY-MM-DD
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active', -- active | done | failed
  fail_reason TEXT,
  phase_overrides TEXT, -- JSON array of days per phase index
  check_interval INTEGER NOT NULL DEFAULT 2, -- recurring cek nutrisi (hari)
  replace_interval INTEGER NOT NULL DEFAULT 14, -- recurring ganti larutan (hari)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS nutrient_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  installation_id INTEGER NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
  batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  ph REAL,
  ppm REAL,
  water_temp REAL,
  volume_added REAL,
  type TEXT NOT NULL DEFAULT 'cek', -- cek | topup | kuras
  note TEXT,
  photo TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
  installation_id INTEGER REFERENCES installations(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- semai | pindah | panen | cek_nutrisi | ganti_larutan | bersih_tandon | lainnya
  title TEXT NOT NULL,
  due_date TEXT NOT NULL, -- YYYY-MM-DD
  recurrence_days INTEGER,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | done
  snoozed_until TEXT, -- YYYY-MM-DD
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS harvest_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  quantity REAL,
  unit TEXT DEFAULT 'pcs',
  weight_grams REAL,
  photo TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS batch_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  text TEXT NOT NULL,
  photo TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS costs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON tasks(user_id, due_date, status);
CREATE INDEX IF NOT EXISTS idx_batches_inst ON batches(installation_id, status);
CREATE INDEX IF NOT EXISTS idx_logs_inst_date ON nutrient_logs(installation_id, date);
`);

// Migrasi ringan: versi awal memakai kolom email → ganti ke username
const userCols = db.prepare(`PRAGMA table_info(users)`).all().map((c) => c.name);
if (userCols.includes('email') && !userCols.includes('username')) {
  db.exec('ALTER TABLE users RENAME COLUMN email TO username');
}

// Migrasi: tambah kolom photo ke nutrient_logs jika belum ada
const logCols = db.prepare(`PRAGMA table_info(nutrient_logs)`).all().map((c) => c.name);
if (!logCols.includes('photo')) {
  db.exec('ALTER TABLE nutrient_logs ADD COLUMN photo TEXT');
}

// Akun default (v1.3: tanpa registrasi publik) — dibuat sekali saat DB kosong
const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
if (userCount === 0) {
  const defaultUsername = (process.env.DEFAULT_USERNAME || 'admin').toLowerCase();
  const defaultPassword = process.env.DEFAULT_PASSWORD || 'admin123';
  db.prepare('INSERT INTO users (name, username, password_hash) VALUES (?, ?, ?)').run(
    'Admin', defaultUsername, bcrypt.hashSync(defaultPassword, 10)
  );
  console.log(`Akun default dibuat — username: ${defaultUsername}`);
}

// Seed katalog tanaman bawaan jika belum ada
const count = db.prepare('SELECT COUNT(*) AS c FROM plant_templates WHERE is_custom = 0').get().c;
if (count === 0) {
  const insert = db.prepare(
    'INSERT INTO plant_templates (user_id, name, phases, tips, is_custom) VALUES (NULL, ?, ?, ?, 0)'
  );
  for (const p of seedPlants) {
    insert.run(p.name, JSON.stringify(p.phases), p.tips || '');
  }
}

export function getTemplate(id) {
  const row = db.prepare('SELECT * FROM plant_templates WHERE id = ?').get(id);
  if (!row) return null;
  return { ...row, phases: JSON.parse(row.phases) };
}

export function userOwnsInstallation(userId, installationId) {
  return db.prepare('SELECT id FROM installations WHERE id = ? AND user_id = ?').get(installationId, userId);
}

export function userOwnsBatch(userId, batchId) {
  return db
    .prepare(
      `SELECT b.* FROM batches b
       JOIN installations i ON i.id = b.installation_id
       WHERE b.id = ? AND i.user_id = ?`
    )
    .get(batchId, userId);
}
