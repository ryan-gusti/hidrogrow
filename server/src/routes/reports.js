import { Router } from 'express';
import { db, getTemplate } from '../db.js';
import { batchTimeline, diffDays } from '../util.js';

const router = Router();

function userHarvests(userId) {
  return db
    .prepare(
      `SELECT h.*, b.name AS batch_name, b.sow_date, b.plant_template_id, b.installation_id,
              i.name AS installation_name
       FROM harvest_logs h
       JOIN batches b ON b.id = h.batch_id
       JOIN installations i ON i.id = b.installation_id
       WHERE i.user_id = ?`
    )
    .all(userId);
}

// Dashboard laporan: total panen per bulan, per tanaman, per instalasi + perbandingan siklus
router.get('/summary', (req, res) => {
  const harvests = userHarvests(req.user.id);

  const perMonth = {};
  const perPlant = {};
  const perInstallation = {};
  for (const h of harvests) {
    const month = h.date.slice(0, 7);
    const w = h.weight_grams || 0;
    const q = h.quantity || 0;
    perMonth[month] = perMonth[month] || { month, weight_grams: 0, quantity: 0, count: 0 };
    perMonth[month].weight_grams += w; perMonth[month].quantity += q; perMonth[month].count += 1;

    const t = getTemplate(h.plant_template_id);
    const plantName = t ? t.name : 'Lainnya';
    perPlant[plantName] = perPlant[plantName] || { plant: plantName, weight_grams: 0, quantity: 0, count: 0 };
    perPlant[plantName].weight_grams += w; perPlant[plantName].quantity += q; perPlant[plantName].count += 1;

    perInstallation[h.installation_name] = perInstallation[h.installation_name] || { installation: h.installation_name, weight_grams: 0, quantity: 0, count: 0 };
    perInstallation[h.installation_name].weight_grams += w;
    perInstallation[h.installation_name].quantity += q;
    perInstallation[h.installation_name].count += 1;
  }

  // Perbandingan antar siklus: per tanaman, bandingkan batch terakhir vs rata-rata batch sebelumnya
  const doneBatches = db
    .prepare(
      `SELECT b.* FROM batches b JOIN installations i ON i.id = b.installation_id
       WHERE i.user_id = ? AND b.status IN ('done','failed') ORDER BY b.sow_date`
    )
    .all(req.user.id);
  const cyclesByPlant = {};
  for (const b of doneBatches) {
    const t = getTemplate(b.plant_template_id);
    if (!t) continue;
    const hs = db.prepare('SELECT * FROM harvest_logs WHERE batch_id = ? ORDER BY date').all(b.id);
    const weight = hs.reduce((s, h) => s + (h.weight_grams || 0), 0);
    const firstHarvest = hs.length ? hs[0].date : null;
    const tl = batchTimeline(b, t);
    const estimatedDays = diffDays(b.sow_date, tl.harvestDate);
    const actualDays = firstHarvest ? diffDays(b.sow_date, firstHarvest) : null;
    const cost = db.prepare('SELECT COALESCE(SUM(amount),0) AS s FROM costs WHERE batch_id = ?').get(b.id).s;
    cyclesByPlant[t.name] = cyclesByPlant[t.name] || [];
    cyclesByPlant[t.name].push({
      batch_id: b.id, batch_name: b.name, status: b.status, sow_date: b.sow_date,
      weight_grams: weight, harvest_count: hs.length,
      estimated_days: estimatedDays, actual_days: actualDays, cost,
    });
  }
  const comparisons = Object.entries(cyclesByPlant).map(([plant, cycles]) => {
    const harvested = cycles.filter((c) => c.status === 'done' && c.harvest_count > 0);
    let insight = null;
    if (harvested.length >= 2) {
      const last = harvested[harvested.length - 1];
      const prev = harvested.slice(0, -1);
      const avgW = prev.reduce((s, c) => s + c.weight_grams, 0) / prev.length;
      const avgD = prev.reduce((s, c) => s + (c.actual_days ?? c.estimated_days), 0) / prev.length;
      const wDiff = avgW > 0 ? Math.round(((last.weight_grams - avgW) / avgW) * 100) : null;
      const dDiff = last.actual_days != null ? Math.round(last.actual_days - avgD) : null;
      insight = { plant, last_batch: last.batch_name, weight_diff_pct: wDiff, duration_diff_days: dDiff };
    }
    return { plant, cycles, insight };
  });

  const totalCost = db
    .prepare(
      `SELECT COALESCE(SUM(c.amount),0) AS s FROM costs c
       JOIN batches b ON b.id = c.batch_id JOIN installations i ON i.id = b.installation_id
       WHERE i.user_id = ?`
    )
    .get(req.user.id).s;

  res.json({
    per_month: Object.values(perMonth).sort((a, b) => a.month.localeCompare(b.month)),
    per_plant: Object.values(perPlant).sort((a, b) => b.weight_grams - a.weight_grams),
    per_installation: Object.values(perInstallation).sort((a, b) => b.weight_grams - a.weight_grams),
    comparisons,
    total_cost: totalCost,
    total_weight_grams: harvests.reduce((s, h) => s + (h.weight_grams || 0), 0),
    total_harvests: harvests.length,
  });
});

// Ekspor data panen ke CSV
router.get('/harvests.csv', (req, res) => {
  const harvests = userHarvests(req.user.id);
  const header = 'tanggal,batch,tanaman,instalasi,jumlah,satuan,berat_gram,catatan';
  const esc = (v) => (v == null ? '' : `"${String(v).replace(/"/g, '""')}"`);
  const lines = harvests.map((h) => {
    const t = getTemplate(h.plant_template_id);
    return [h.date, h.batch_name, t ? t.name : '', h.installation_name, h.quantity, h.unit, h.weight_grams, h.notes]
      .map(esc).join(',');
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="panen-hidrogrow.csv"');
  res.send('﻿' + [header, ...lines].join('\n'));
});

export default router;
