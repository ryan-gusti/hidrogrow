import { Router } from 'express';
import { db, userOwnsBatch } from '../db.js';
import { isValidDate } from '../util.js';

const router = Router();

// Catatan harian per batch (teks + foto opsional)
router.get('/batch/:batchId', (req, res) => {
  if (!userOwnsBatch(req.user.id, req.params.batchId)) return res.status(404).json({ error: 'Batch tidak ditemukan' });
  res.json(db.prepare('SELECT * FROM batch_notes WHERE batch_id = ? ORDER BY date DESC, id DESC').all(req.params.batchId));
});

router.post('/', (req, res) => {
  const { batch_id, date, text, photo } = req.body || {};
  if (!userOwnsBatch(req.user.id, batch_id)) return res.status(400).json({ error: 'Batch tidak valid' });
  if (!isValidDate(date)) return res.status(400).json({ error: 'Tanggal tidak valid' });
  if (!text || !text.trim()) return res.status(400).json({ error: 'Isi catatan wajib diisi' });
  const info = db
    .prepare('INSERT INTO batch_notes (batch_id, date, text, photo) VALUES (?, ?, ?, ?)')
    .run(batch_id, date, text.trim(), photo || null);
  res.status(201).json(db.prepare('SELECT * FROM batch_notes WHERE id = ?').get(info.lastInsertRowid));
});

router.delete('/:id', (req, res) => {
  const n = db
    .prepare(`SELECT n.id FROM batch_notes n
              JOIN batches b ON b.id = n.batch_id
              JOIN installations i ON i.id = b.installation_id
              WHERE n.id = ? AND i.user_id = ?`)
    .get(req.params.id, req.user.id);
  if (!n) return res.status(404).json({ error: 'Catatan tidak ditemukan' });
  db.prepare('DELETE FROM batch_notes WHERE id = ?').run(n.id);
  res.json({ ok: true });
});

// Biaya per batch (benih, nutrisi, dll.)
router.get('/costs/batch/:batchId', (req, res) => {
  if (!userOwnsBatch(req.user.id, req.params.batchId)) return res.status(404).json({ error: 'Batch tidak ditemukan' });
  res.json(db.prepare('SELECT * FROM costs WHERE batch_id = ? ORDER BY date DESC, id DESC').all(req.params.batchId));
});

router.post('/costs', (req, res) => {
  const { batch_id, date, description, amount } = req.body || {};
  if (!userOwnsBatch(req.user.id, batch_id)) return res.status(400).json({ error: 'Batch tidak valid' });
  if (!isValidDate(date)) return res.status(400).json({ error: 'Tanggal tidak valid' });
  if (!description || !description.trim()) return res.status(400).json({ error: 'Deskripsi biaya wajib diisi' });
  if (isNaN(amount) || amount < 0) return res.status(400).json({ error: 'Jumlah biaya tidak valid' });
  const info = db
    .prepare('INSERT INTO costs (batch_id, date, description, amount) VALUES (?, ?, ?, ?)')
    .run(batch_id, date, description.trim(), amount);
  res.status(201).json(db.prepare('SELECT * FROM costs WHERE id = ?').get(info.lastInsertRowid));
});

router.delete('/costs/:id', (req, res) => {
  const c = db
    .prepare(`SELECT c.id FROM costs c
              JOIN batches b ON b.id = c.batch_id
              JOIN installations i ON i.id = b.installation_id
              WHERE c.id = ? AND i.user_id = ?`)
    .get(req.params.id, req.user.id);
  if (!c) return res.status(404).json({ error: 'Biaya tidak ditemukan' });
  db.prepare('DELETE FROM costs WHERE id = ?').run(c.id);
  res.json({ ok: true });
});

export default router;
