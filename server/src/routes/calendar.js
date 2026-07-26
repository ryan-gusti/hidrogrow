import { Router } from 'express';
import { db } from '../db.js';
import { expandTaskOccurrences } from '../reminders.js';
import { batchTimeline } from '../util.js';
import { getTemplate } from '../db.js';
import { isValidDate, today } from '../util.js';

const router = Router();

export const EVENT_COLORS = {
  semai: 'green',
  pindah: 'blue',
  cek_nutrisi: 'yellow',
  ganti_larutan: 'red',
  panen: 'orange',
  bersih_tandon: 'purple',
  lainnya: 'gray',
};

// GET /api/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD&installation_id=
// Menggabungkan: event semai/pindah/panen dari batch + occurrence task (termasuk recurring)
router.get('/', (req, res) => {
  const { start, end, installation_id } = req.query;
  if (!isValidDate(start) || !isValidDate(end)) {
    return res.status(400).json({ error: 'Parameter start & end wajib berupa tanggal valid' });
  }
  const events = [];
  const t = today();

  // 1) Event dari batch: semai, pindah tanam, estimasi panen
  let batchSql = `SELECT b.* FROM batches b JOIN installations i ON i.id = b.installation_id WHERE i.user_id = ?`;
  const params = [req.user.id];
  if (installation_id) {
    batchSql += ' AND b.installation_id = ?';
    params.push(installation_id);
  }
  const batches = db.prepare(batchSql).all(...params);
  for (const b of batches) {
    const tpl = getTemplate(b.plant_template_id);
    if (!tpl) continue;
    const tl = batchTimeline(b, tpl);
    const base = { batch_id: b.id, batch_name: b.name, installation_id: b.installation_id, status: b.status };
    if (b.sow_date >= start && b.sow_date <= end) {
      events.push({ ...base, type: 'semai', date: b.sow_date, title: `Mulai semai ${tpl.name} (${b.name})`, color: EVENT_COLORS.semai });
    }
    if (tl.transplantDate && tl.transplantDate >= start && tl.transplantDate <= end) {
      events.push({ ...base, type: 'pindah', date: tl.transplantDate, title: `Pindah tanam ${tpl.name} (${b.name})`, color: EVENT_COLORS.pindah });
    }
    if (tl.harvestDate >= start && tl.harvestDate <= end) {
      events.push({ ...base, type: 'panen', date: tl.harvestDate, title: `Estimasi panen ${tpl.name} (${b.name})`, color: EVENT_COLORS.panen });
    }
  }

  // 2) Occurrence dari task (recurring & non-recurring)
  let taskSql = `SELECT * FROM tasks WHERE user_id = ? AND status = 'pending'`;
  const tparams = [req.user.id];
  if (installation_id) {
    taskSql += ' AND installation_id = ?';
    tparams.push(installation_id);
  }
  const tasks = db.prepare(taskSql).all(...tparams);
  for (const task of tasks) {
    for (const occ of expandTaskOccurrences(task, start, end)) {
      events.push({
        type: task.type,
        date: occ.date,
        title: task.title,
        color: EVENT_COLORS[task.type] || 'gray',
        task_id: task.id,
        batch_id: task.batch_id,
        installation_id: task.installation_id,
        recurring: !!task.recurrence_days,
        overdue: occ.date < t,
        snoozed: task.snoozed_until != null && task.snoozed_until > occ.date,
      });
    }
  }

  // Badge jumlah tugas belum selesai (hari ini & terlewat)
  const pendingCount = db
    .prepare(
      `SELECT COUNT(*) AS c FROM tasks
       WHERE user_id = ? AND status = 'pending' AND due_date <= ?
         AND (snoozed_until IS NULL OR snoozed_until <= ?)`
    )
    .get(req.user.id, t, t).c;

  res.json({ events, pending_count: pendingCount });
});

export default router;
