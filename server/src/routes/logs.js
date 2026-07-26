import { Router } from 'express';
import { db, getTemplate, userOwnsInstallation, userOwnsBatch } from '../db.js';
import { isValidDate, currentPhase } from '../util.js';

const router = Router();

const LOG_TYPES = ['cek', 'topup', 'kuras'];

function validate(body) {
  const { installation_id, date, ph, ppm, water_temp, volume_added, type } = body || {};
  if (!userOwnsInstallation) return 'server error';
  if (!isValidDate(date)) return 'Tanggal tidak valid';
  if (!LOG_TYPES.includes(type)) return 'Tipe log tidak valid';
  for (const [k, v] of Object.entries({ ph, ppm, water_temp, volume_added })) {
    if (v != null && v !== '' && isNaN(v)) return `Nilai ${k} harus berupa angka`;
  }
  return null;
}

function withRangeFlag(log) {
  // Indikator merah/kuning/hijau: hijau dalam rentang, kuning mendekati batas, merah jauh di luar
  let range = null;
  if (log.batch_id) {
    const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(log.batch_id);
    if (batch) {
      const t = getTemplate(batch.plant_template_id);
      if (t) {
        const phase = currentPhase(batch, t, log.date);
        range = { ph_min: phase.ph_min, ph_max: phase.ph_max, ppm_min: phase.ppm_min, ppm_max: phase.ppm_max, phase: phase.name };
      }
    }
  }
  const flag = (value, min, max) => {
    if (value == null || min == null || max == null) return 'none';
    const span = max - min || 1;
    if (value >= min && value <= max) return 'green';
    if (value >= min - span * 0.1 && value <= max + span * 0.1) return 'yellow';
    return 'red';
  };
  return {
    ...log,
    range,
    ph_flag: range ? flag(log.ph, range.ph_min, range.ph_max) : 'none',
    ppm_flag: range ? flag(log.ppm, range.ppm_min, range.ppm_max) : 'none',
  };
}

router.get('/', (req, res) => {
  const { installation_id, batch_id, type, limit = 200 } = req.query;
  let sql = `SELECT l.* FROM nutrient_logs l JOIN installations i ON i.id = l.installation_id WHERE i.user_id = ?`;
  const params = [req.user.id];
  if (installation_id) { sql += ' AND l.installation_id = ?'; params.push(installation_id); }
  if (batch_id) { sql += ' AND l.batch_id = ?'; params.push(batch_id); }
  if (type) { sql += ' AND l.type = ?'; params.push(type); }
  sql += ' ORDER BY l.date DESC, l.id DESC LIMIT ?';
  params.push(Number(limit));
  res.json(db.prepare(sql).all(...params).map(withRangeFlag));
});

router.post('/', (req, res) => {
  const { installation_id, batch_id, date, ph, ppm, water_temp, volume_added, type = 'cek', note, photo } = req.body || {};
  if (!userOwnsInstallation(req.user.id, installation_id)) return res.status(400).json({ error: 'Instalasi tidak valid' });
  if (batch_id && !userOwnsBatch(req.user.id, batch_id)) return res.status(400).json({ error: 'Batch tidak valid' });
  const err = validate(req.body || {});
  if (err) return res.status(400).json({ error: err });
  if (ph == null && ppm == null && volume_added == null) {
    return res.status(400).json({ error: 'Isi minimal satu nilai (pH, PPM, atau volume)' });
  }
  const info = db
    .prepare(`INSERT INTO nutrient_logs (installation_id, batch_id, date, ph, ppm, water_temp, volume_added, type, note, photo)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(installation_id, batch_id || null, date, ph ?? null, ppm ?? null, water_temp ?? null, volume_added ?? null, type, note || null, photo || null);
  res.status(201).json(withRangeFlag(db.prepare('SELECT * FROM nutrient_logs WHERE id = ?').get(info.lastInsertRowid)));
});

router.delete('/:id', (req, res) => {
  const log = db
    .prepare(`SELECT l.* FROM nutrient_logs l JOIN installations i ON i.id = l.installation_id WHERE l.id = ? AND i.user_id = ?`)
    .get(req.params.id, req.user.id);
  if (!log) return res.status(404).json({ error: 'Log tidak ditemukan' });
  db.prepare('DELETE FROM nutrient_logs WHERE id = ?').run(log.id);
  res.json({ ok: true });
});

// Data tren pH/PPM untuk grafik
router.get('/trend', (req, res) => {
  const { installation_id } = req.query;
  if (!userOwnsInstallation(req.user.id, installation_id)) return res.status(400).json({ error: 'Instalasi tidak valid' });
  const rows = db
    .prepare(`SELECT date, ph, ppm FROM nutrient_logs WHERE installation_id = ? AND (ph IS NOT NULL OR ppm IS NOT NULL) ORDER BY date`)
    .all(installation_id);
  res.json(rows);
});

export default router;
