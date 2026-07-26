import { Router } from 'express';
import { db, getTemplate } from '../db.js';

const router = Router();

function parse(row) {
  return { ...row, phases: JSON.parse(row.phases) };
}

function validatePhases(phases) {
  if (!Array.isArray(phases) || phases.length === 0) return 'Minimal satu fase diperlukan';
  for (const p of phases) {
    if (!p.name || isNaN(p.days) || p.days < 1) return 'Setiap fase butuh nama & durasi ≥ 1 hari';
  }
  return null;
}

// Katalog bawaan + template kustom milik pengguna
router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM plant_templates WHERE user_id IS NULL OR user_id = ? ORDER BY is_custom, name')
    .all(req.user.id);
  res.json(rows.map(parse));
});

router.get('/:id', (req, res) => {
  const t = getTemplate(req.params.id);
  if (!t || (t.user_id != null && t.user_id !== req.user.id)) {
    return res.status(404).json({ error: 'Tanaman tidak ditemukan' });
  }
  res.json(t);
});

router.post('/', (req, res) => {
  const { name, phases, tips = '' } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Nama tanaman wajib diisi' });
  const err = validatePhases(phases);
  if (err) return res.status(400).json({ error: err });
  const info = db
    .prepare('INSERT INTO plant_templates (user_id, name, phases, tips, is_custom) VALUES (?, ?, ?, ?, 1)')
    .run(req.user.id, name.trim(), JSON.stringify(phases), tips);
  res.status(201).json(parse(db.prepare('SELECT * FROM plant_templates WHERE id = ?').get(info.lastInsertRowid)));
});

router.put('/:id', (req, res) => {
  const t = getTemplate(req.params.id);
  if (!t || t.user_id !== req.user.id) return res.status(404).json({ error: 'Template kustom tidak ditemukan' });
  const { name, phases, tips = '' } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Nama tanaman wajib diisi' });
  const err = validatePhases(phases);
  if (err) return res.status(400).json({ error: err });
  db.prepare('UPDATE plant_templates SET name = ?, phases = ?, tips = ? WHERE id = ?')
    .run(name.trim(), JSON.stringify(phases), tips, t.id);
  res.json(parse(db.prepare('SELECT * FROM plant_templates WHERE id = ?').get(t.id)));
});

router.delete('/:id', (req, res) => {
  const t = getTemplate(req.params.id);
  if (!t || t.user_id !== req.user.id) return res.status(404).json({ error: 'Template kustom tidak ditemukan' });
  const used = db.prepare('SELECT COUNT(*) AS c FROM batches WHERE plant_template_id = ?').get(t.id).c;
  if (used > 0) return res.status(409).json({ error: 'Template sedang dipakai batch, tidak bisa dihapus' });
  db.prepare('DELETE FROM plant_templates WHERE id = ?').run(t.id);
  res.json({ ok: true });
});

export default router;
