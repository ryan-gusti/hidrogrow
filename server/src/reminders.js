import { db } from './db.js';
import { batchTimeline, addDays, today } from './util.js';

// Buat reminder otomatis dari template saat batch dibuat
export function generateBatchTasks(userId, batch, template) {
  const { transplantDate, harvestDate } = batchTimeline(batch, template);
  const insert = db.prepare(
    `INSERT INTO tasks (user_id, batch_id, installation_id, type, title, due_date, recurrence_days)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const plant = template.name;
  if (transplantDate) {
    insert.run(userId, batch.id, batch.installation_id, 'pindah', `Pindah tanam ${plant} (${batch.name})`, transplantDate, null);
  }
  insert.run(userId, batch.id, batch.installation_id, 'panen', `Estimasi panen ${plant} (${batch.name})`, harvestDate, null);
  insert.run(
    userId, batch.id, batch.installation_id, 'cek_nutrisi',
    `Cek pH/PPM ${plant} (${batch.name})`,
    addDays(batch.sow_date, batch.check_interval), batch.check_interval
  );
  insert.run(
    userId, batch.id, batch.installation_id, 'ganti_larutan',
    `Ganti/kuras larutan (${batch.name})`,
    addDays(batch.sow_date, batch.replace_interval), batch.replace_interval
  );
}

// Hapus semua task pending milik batch (saat batch selesai/gagal)
export function clearBatchTasks(batchId) {
  db.prepare(`DELETE FROM tasks WHERE batch_id = ? AND status = 'pending'`).run(batchId);
}

// Selesaikan task; recurring maju ke jadwal berikutnya, non-recurring ditandai selesai
export function completeTask(task, dateStr = today()) {
  if (task.recurrence_days) {
    let next = task.due_date;
    while (next <= dateStr) next = addDays(next, task.recurrence_days);
    db.prepare(`UPDATE tasks SET due_date = ?, completed_at = datetime('now'), snoozed_until = NULL WHERE id = ?`)
      .run(next, task.id);
  } else {
    db.prepare(`UPDATE tasks SET status = 'done', completed_at = datetime('now'), snoozed_until = NULL WHERE id = ?`)
      .run(task.id);
  }
}

// Geser jadwal task; jika pindah/panen, task terkait di batch yang sama ikut bergeser (F-C.8)
export function rescheduleTask(task, newDate) {
  const deltaDays = Math.round(
    (new Date(newDate + 'T00:00:00') - new Date(task.due_date + 'T00:00:00')) / 86400000
  );
  db.prepare('UPDATE tasks SET due_date = ?, snoozed_until = NULL WHERE id = ?').run(newDate, task.id);
  if (deltaDays !== 0 && task.batch_id && (task.type === 'pindah' || task.type === 'panen')) {
    const related = db
      .prepare(`SELECT * FROM tasks WHERE batch_id = ? AND id != ? AND status = 'pending'`)
      .all(task.batch_id, task.id);
    for (const t of related) {
      const shifted = addDays(t.due_date, deltaDays);
      db.prepare('UPDATE tasks SET due_date = ? WHERE id = ?').run(shifted, t.id);
    }
  }
}

// Materialisasi task recurring menjadi occurrence per rentang tanggal
export function expandTaskOccurrences(task, rangeStart, rangeEnd) {
  const occurrences = [];
  if (!task.recurrence_days) {
    if (task.due_date >= rangeStart && task.due_date <= rangeEnd) {
      occurrences.push({ date: task.due_date, task });
    }
    return occurrences;
  }
  // Mundur ke occurrence paling awal yang masih >= rangeStart (berdasarkan due_date berikutnya)
  let date = task.due_date;
  while (date < rangeStart) date = addDays(date, task.recurrence_days);
  while (date <= rangeEnd) {
    occurrences.push({ date, task });
    date = addDays(date, task.recurrence_days);
  }
  return occurrences;
}
