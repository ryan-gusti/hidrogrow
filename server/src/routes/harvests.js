import { Router } from 'express';
import { db, userOwnsBatch } from '../db.js';
import { isValidDate } from '../util.js';

const router = Router();

// Mendukung panen bertahap: satu batch dapat memiliki banyak harvest log
router.get('/', (req, res) => {
  const { batch_id } = req.query;
  let sql = `SELECT h.* FROM harvest_logs h
             JOIN batches b ON b.id = h.batch_id
             JOIN installations i ON i.id = b.installation_id
             WHERE i.user_id = ?`;
  const params = [req.user.id];
  if (batch_id) { sql += ' AND h.batch_id = ?'; params.push(batch_id); }
  sql += ' ORDER BY h.date DESC, h.id DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/', (req, res) => {
  const { batch_id, date, quantity, unit = 'pcs', weight_grams, photo, notes } = req.body || {};
  if (!userOwnsBatch(req.user.id, batch_id)) return res.status(400).json({ error: 'Batch tidak valid' });
  if (!isValidDate(date)) return res.status(400).json({ error: 'Tanggal tidak valid' });
  if ((quantity == null || quantity === '') && (weight_grams == null || weight_grams === '')) {
    return res.status(400).json({ error: 'Isi jumlah atau berat panen' });
  }
  for (const [k, v] of Object.entries({ quantity, weight_grams })) {
    if (v != null && v !== '' && (isNaN(v) || v < 0)) return res.status(400).json({ error: `Nilai ${k} tidak valid` });
  }
  const info = db
    .prepare(`INSERT INTO harvest_logs (batch_id, date, quantity, unit, weight_grams, photo, notes)
              VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(batch_id, date, quantity ?? null, unit, weight_grams ?? null, photo || null, notes || null);
  res.status(201).json(db.prepare('SELECT * FROM harvest_logs WHERE id = ?').get(info.lastInsertRowid));
});

router.delete('/:id', (req, res) => {
  const h = db
    .prepare(`SELECT h.id FROM harvest_logs h
              JOIN batches b ON b.id = h.batch_id
              JOIN installations i ON i.id = b.installation_id
              WHERE h.id = ? AND i.user_id = ?`)
    .get(req.params.id, req.user.id);
  if (!h) return res.status(404).json({ error: 'Catatan panen tidak ditemukan' });
  db.prepare('DELETE FROM harvest_logs WHERE id = ?').run(h.id);
  res.json({ ok: true });
});

export default router;
