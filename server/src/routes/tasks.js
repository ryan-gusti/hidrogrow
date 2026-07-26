import { Router } from 'express';
import { db, userOwnsBatch, userOwnsInstallation } from '../db.js';
import { completeTask, rescheduleTask } from '../reminders.js';
import { today, isValidDate } from '../util.js';

const router = Router();

const TASK_TYPES = ['semai', 'pindah', 'panen', 'cek_nutrisi', 'ganti_larutan', 'bersih_tandon', 'lainnya'];

function getOwnTask(userId, id) {
  return db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, userId);
}

// Tugas hari ini: pending, due <= hari ini, tidak sedang di-snooze
router.get('/today', (req, res) => {
  const t = today();
  const rows = db
    .prepare(
      `SELECT * FROM tasks
       WHERE user_id = ? AND status = 'pending' AND due_date <= ?
         AND (snoozed_until IS NULL OR snoozed_until <= ?)
       ORDER BY due_date, id`
    )
    .all(req.user.id, t, t);
  res.json(rows);
});

// Buat task manual (dari kalender / halaman tugas)
router.post('/', (req, res) => {
  const { type, title, due_date, batch_id, installation_id, recurrence_days } = req.body || {};
  if (!TASK_TYPES.includes(type)) return res.status(400).json({ error: 'Jenis tugas tidak valid' });
  if (!title || !title.trim()) return res.status(400).json({ error: 'Judul wajib diisi' });
  if (!isValidDate(due_date)) return res.status(400).json({ error: 'Tanggal tidak valid' });
  if (batch_id && !userOwnsBatch(req.user.id, batch_id)) return res.status(400).json({ error: 'Batch tidak valid' });
  if (installation_id && !userOwnsInstallation(req.user.id, installation_id)) {
    return res.status(400).json({ error: 'Instalasi tidak valid' });
  }
  if (recurrence_days != null && (isNaN(recurrence_days) || recurrence_days < 1)) {
    return res.status(400).json({ error: 'Interval pengulangan minimal 1 hari' });
  }
  const info = db
    .prepare(`INSERT INTO tasks (user_id, batch_id, installation_id, type, title, due_date, recurrence_days)
              VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(req.user.id, batch_id || null, installation_id || null, type, title.trim(), due_date, recurrence_days || null);
  res.status(201).json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid));
});

// Tandai selesai (recurring otomatis maju ke jadwal berikutnya)
router.post('/:id/complete', (req, res) => {
  const task = getOwnTask(req.user.id, req.params.id);
  if (!task) return res.status(404).json({ error: 'Tugas tidak ditemukan' });
  completeTask(task);
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id));
});

// Snooze: tunda sampai tanggal tertentu (nanti malam/besok dihitung di klien)
router.post('/:id/snooze', (req, res) => {
  const task = getOwnTask(req.user.id, req.params.id);
  if (!task) return res.status(404).json({ error: 'Tugas tidak ditemukan' });
  const { until } = req.body || {};
  if (!isValidDate(until)) return res.status(400).json({ error: 'Tanggal snooze tidak valid' });
  db.prepare('UPDATE tasks SET snoozed_until = ? WHERE id = ?').run(until, task.id);
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id));
});

// Geser jadwal (reschedule) — task terkait di batch ikut menyesuaikan
router.post('/:id/reschedule', (req, res) => {
  const task = getOwnTask(req.user.id, req.params.id);
  if (!task) return res.status(404).json({ error: 'Tugas tidak ditemukan' });
  const { date } = req.body || {};
  if (!isValidDate(date)) return res.status(400).json({ error: 'Tanggal tidak valid' });
  rescheduleTask(task, date);
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id));
});

router.put('/:id', (req, res) => {
  const task = getOwnTask(req.user.id, req.params.id);
  if (!task) return res.status(404).json({ error: 'Tugas tidak ditemukan' });
  const { title, recurrence_days } = req.body || {};
  if (title != null && !title.trim()) return res.status(400).json({ error: 'Judul tidak boleh kosong' });
  if (recurrence_days != null && (isNaN(recurrence_days) || recurrence_days < 1)) {
    return res.status(400).json({ error: 'Interval pengulangan minimal 1 hari' });
  }
  db.prepare('UPDATE tasks SET title = ?, recurrence_days = ? WHERE id = ?')
    .run(title?.trim() ?? task.title, recurrence_days !== undefined ? recurrence_days : task.recurrence_days, task.id);
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id));
});

router.delete('/:id', (req, res) => {
  const task = getOwnTask(req.user.id, req.params.id);
  if (!task) return res.status(404).json({ error: 'Tugas tidak ditemukan' });
  db.prepare('DELETE FROM tasks WHERE id = ?').run(task.id);
  res.json({ ok: true });
});

export default router;
