import { Router } from 'express';
import { db, getTemplate, userOwnsInstallation, userOwnsBatch } from '../db.js';
import { generateBatchTasks, clearBatchTasks } from '../reminders.js';
import { batchTimeline, currentPhase, dayNumber, isValidDate, today } from '../util.js';

const router = Router();

function decorate(batch) {
  const t = getTemplate(batch.plant_template_id);
  if (!t) return batch;
  const tl = batchTimeline(batch, t);
  const phase = currentPhase(batch, t);
  return {
    ...batch,
    plant_name: t.name,
    timeline: tl,
    current_phase: phase.name,
    day_number: dayNumber(batch),
    phase_days: t.phases.map((p, i) => (tl.phases[i] ? tl.phases[i].days : p.days)),
  };
}

router.get('/', (req, res) => {
  const status = req.query.status; // active | done | failed | (kosong = semua)
  let sql = `SELECT b.* FROM batches b JOIN installations i ON i.id = b.installation_id WHERE i.user_id = ?`;
  const params = [req.user.id];
  if (status) {
    sql += ' AND b.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY b.status = \'active\' DESC, b.sow_date DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(decorate));
});

router.post('/', (req, res) => {
  const { installation_id, plant_template_id, sow_date, quantity = 1, phase_overrides,
          check_interval = 2, replace_interval = 14 } = req.body || {};
  if (!userOwnsInstallation(req.user.id, installation_id)) {
    return res.status(400).json({ error: 'Instalasi tidak valid' });
  }
  const t = getTemplate(plant_template_id);
  if (!t || (t.user_id != null && t.user_id !== req.user.id)) {
    return res.status(400).json({ error: 'Tanaman tidak valid' });
  }
  if (!isValidDate(sow_date)) return res.status(400).json({ error: 'Tanggal semai tidak valid' });
  if (isNaN(quantity) || quantity < 1) return res.status(400).json({ error: 'Jumlah bibit minimal 1' });
  if (phase_overrides && (!Array.isArray(phase_overrides) || phase_overrides.length !== t.phases.length)) {
    return res.status(400).json({ error: 'Override fase harus sesuai jumlah fase template' });
  }
  // Nama batch otomatis: "Pakcoy Batch #2"
  const count = db
    .prepare(`SELECT COUNT(*) AS c FROM batches b JOIN installations i ON i.id = b.installation_id
              WHERE i.user_id = ? AND b.plant_template_id = ?`)
    .get(req.user.id, plant_template_id).c;
  const name = `${t.name} Batch #${count + 1}`;
  const info = db
    .prepare(`INSERT INTO batches (installation_id, plant_template_id, name, sow_date, quantity, phase_overrides, check_interval, replace_interval)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(installation_id, plant_template_id, name, sow_date, quantity,
      phase_overrides ? JSON.stringify(phase_overrides) : null, check_interval, replace_interval);
  const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(info.lastInsertRowid);
  generateBatchTasks(req.user.id, batch, t);
  res.status(201).json(decorate(batch));
});

router.get('/:id', (req, res) => {
  const batch = userOwnsBatch(req.user.id, req.params.id);
  if (!batch) return res.status(404).json({ error: 'Batch tidak ditemukan' });
  const notes = db.prepare('SELECT * FROM batch_notes WHERE batch_id = ? ORDER BY date DESC, id DESC').all(batch.id);
  const harvests = db.prepare('SELECT * FROM harvest_logs WHERE batch_id = ? ORDER BY date DESC, id DESC').all(batch.id);
  const costs = db.prepare('SELECT * FROM costs WHERE batch_id = ? ORDER BY date DESC, id DESC').all(batch.id);
  const tasks = db.prepare(`SELECT * FROM tasks WHERE batch_id = ? AND status = 'pending' ORDER BY due_date`).all(batch.id);
  res.json({ ...decorate(batch), notes, harvests, costs, tasks });
});

router.put('/:id', (req, res) => {
  const batch = userOwnsBatch(req.user.id, req.params.id);
  if (!batch) return res.status(404).json({ error: 'Batch tidak ditemukan' });
  const { quantity, phase_overrides, check_interval, replace_interval } = req.body || {};
  const t = getTemplate(batch.plant_template_id);
  if (phase_overrides && (!Array.isArray(phase_overrides) || phase_overrides.length !== t.phases.length)) {
    return res.status(400).json({ error: 'Override fase harus sesuai jumlah fase template' });
  }
  db.prepare(`UPDATE batches SET quantity = ?, phase_overrides = ?, check_interval = ?, replace_interval = ? WHERE id = ?`)
    .run(
      quantity ?? batch.quantity,
      phase_overrides ? JSON.stringify(phase_overrides) : batch.phase_overrides,
      check_interval ?? batch.check_interval,
      replace_interval ?? batch.replace_interval,
      batch.id
    );
  res.json(decorate(db.prepare('SELECT * FROM batches WHERE id = ?').get(batch.id)));
});

// Tandai batch selesai (ditutup setelah panen)
router.post('/:id/close', (req, res) => {
  const batch = userOwnsBatch(req.user.id, req.params.id);
  if (!batch) return res.status(404).json({ error: 'Batch tidak ditemukan' });
  db.prepare(`UPDATE batches SET status = 'done' WHERE id = ?`).run(batch.id);
  clearBatchTasks(batch.id);
  res.json(decorate(db.prepare('SELECT * FROM batches WHERE id = ?').get(batch.id)));
});

// Tandai batch gagal beserta alasan
router.post('/:id/fail', (req, res) => {
  const batch = userOwnsBatch(req.user.id, req.params.id);
  if (!batch) return res.status(404).json({ error: 'Batch tidak ditemukan' });
  const { reason } = req.body || {};
  if (!reason || !reason.trim()) return res.status(400).json({ error: 'Alasan gagal wajib diisi' });
  db.prepare(`UPDATE batches SET status = 'failed', fail_reason = ? WHERE id = ?`).run(reason.trim(), batch.id);
  clearBatchTasks(batch.id);
  res.json(decorate(db.prepare('SELECT * FROM batches WHERE id = ?').get(batch.id)));
});

router.delete('/:id', (req, res) => {
  const batch = userOwnsBatch(req.user.id, req.params.id);
  if (!batch) return res.status(404).json({ error: 'Batch tidak ditemukan' });
  db.prepare('DELETE FROM batches WHERE id = ?').run(batch.id);
  res.json({ ok: true });
});

export default router;
