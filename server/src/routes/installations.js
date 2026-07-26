import { Router } from 'express';
import { db, userOwnsInstallation } from '../db.js';
import { batchTimeline, currentPhase, dayNumber, today } from '../util.js';
import { getTemplate } from '../db.js';

const router = Router();

const SYSTEM_TYPES = ['wick', 'nft', 'dft', 'rakit_apung', 'drip', 'lainnya'];

function validate(body) {
  const { name, system_type, capacity, reservoir_volume } = body || {};
  if (!name || !name.trim()) return 'Nama instalasi wajib diisi';
  if (!system_type) return 'Jenis sistem wajib dipilih';
  if (capacity != null && (isNaN(capacity) || capacity < 0)) return 'Kapasitas lubang tidak valid';
  if (reservoir_volume != null && (isNaN(reservoir_volume) || reservoir_volume < 0)) return 'Volume tandon tidak valid';
  return null;
}

router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM installations WHERE user_id = ? ORDER BY created_at')
    .all(req.user.id);
  // Status lubang sederhana: hitung batch aktif per fase
  const result = rows.map((inst) => {
    const batches = db
      .prepare(`SELECT * FROM batches WHERE installation_id = ? AND status = 'active'`)
      .all(inst.id);
    const phases = { semai: 0, vegetatif: 0, panen: 0 };
    for (const b of batches) {
      const t = getTemplate(b.plant_template_id);
      if (!t) continue;
      const phase = currentPhase(b, t);
      const key = phase.name.toLowerCase();
      if (key === 'semai') phases.semai += b.quantity;
      else if (key === 'panen') phases.panen += b.quantity;
      else phases.vegetatif += b.quantity;
    }
    return { ...inst, active_batches: batches.length, hole_status: phases };
  });
  res.json(result);
});

router.post('/', (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(400).json({ error: err });
  const { name, system_type, capacity = 0, reservoir_volume = 0 } = req.body;
  const info = db
    .prepare('INSERT INTO installations (user_id, name, system_type, capacity, reservoir_volume) VALUES (?, ?, ?, ?, ?)')
    .run(req.user.id, name.trim(), system_type, capacity, reservoir_volume);
  res.status(201).json(db.prepare('SELECT * FROM installations WHERE id = ?').get(info.lastInsertRowid));
});

router.get('/:id', (req, res) => {
  const inst = userOwnsInstallation(req.user.id, req.params.id);
  if (!inst) return res.status(404).json({ error: 'Instalasi tidak ditemukan' });
  const full = db.prepare('SELECT * FROM installations WHERE id = ?').get(inst.id);
  const batches = db.prepare(`SELECT * FROM batches WHERE installation_id = ? ORDER BY sow_date DESC`).all(inst.id);
  res.json({ ...full, batches });
});

router.put('/:id', (req, res) => {
  if (!userOwnsInstallation(req.user.id, req.params.id)) return res.status(404).json({ error: 'Instalasi tidak ditemukan' });
  const err = validate(req.body);
  if (err) return res.status(400).json({ error: err });
  const { name, system_type, capacity = 0, reservoir_volume = 0 } = req.body;
  db.prepare('UPDATE installations SET name = ?, system_type = ?, capacity = ?, reservoir_volume = ? WHERE id = ?')
    .run(name.trim(), system_type, capacity, reservoir_volume, req.params.id);
  res.json(db.prepare('SELECT * FROM installations WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  if (!userOwnsInstallation(req.user.id, req.params.id)) return res.status(404).json({ error: 'Instalasi tidak ditemukan' });
  db.prepare('DELETE FROM installations WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
