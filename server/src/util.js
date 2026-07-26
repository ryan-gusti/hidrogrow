// Helper tanggal (format YYYY-MM-DD, waktu lokal server)
export function today() {
  return toDateStr(new Date());
}

export function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

export function diffDays(fromStr, toStr) {
  const a = new Date(fromStr + 'T00:00:00');
  const b = new Date(toStr + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

export function isValidDate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + 'T00:00:00'));
}

// Hitung timeline batch dari template + override durasi fase
export function batchTimeline(batch, template) {
  const overrides = batch.phase_overrides ? JSON.parse(batch.phase_overrides) : null;
  const phases = template.phases.map((p, i) => ({
    ...p,
    days: overrides && overrides[i] != null ? overrides[i] : p.days,
  }));
  let cursor = batch.sow_date;
  const timeline = phases.map((p) => {
    const start = cursor;
    const end = addDays(start, p.days);
    cursor = end;
    return { ...p, start, end };
  });
  const transplantDate = timeline.length > 1 ? timeline[0].end : null; // pindah tanam = akhir fase pertama
  const harvestDate = timeline.length > 1 ? timeline[timeline.length - 2].end : timeline[0].end; // awal fase terakhir
  return { phases: timeline, transplantDate, harvestDate, endDate: cursor };
}

// Fase batch pada tanggal tertentu (default hari ini)
export function currentPhase(batch, template, dateStr = today()) {
  const { phases } = batchTimeline(batch, template);
  for (const p of phases) {
    if (dateStr >= p.start && dateStr < p.end) return p;
  }
  return phases[phases.length - 1];
}

export function dayNumber(batch, dateStr = today()) {
  return diffDays(batch.sow_date, dateStr) + 1;
}
