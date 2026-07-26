<template>
  <div v-if="summary">
    <div class="page-head">
      <h1>Laporan</h1>
      <span class="sp"></span>
      <button class="btn btn-secondary" @click="exportCsv"><span v-html="ICON.download"></span>Ekspor CSV</button>
    </div>

    <div class="banner">
      <img src="/assets/kebun-sap.jpg" alt="Kebun hidroponik" />
      <div class="cap"><b>{{ auth.user?.name || 'Kebun' }}</b><br>{{ auth.installations.length }} instalasi · {{ totalLubang }} lubang · {{ summary.total_harvests }} kali panen</div>
    </div>

    <section class="sec stat-grid" style="margin-top:16px">
      <div class="stat"><div class="v">{{ kg(summary.total_weight_grams) }} <small>kg</small></div><div class="k">Total panen</div></div>
      <div class="stat"><div class="v">{{ summary.total_harvests }}</div><div class="k">Kali panen</div></div>
      <div class="stat"><div class="v">{{ summary.comparisons.reduce((s, c) => s + c.cycles.length, 0) }}</div><div class="k">Batch selesai</div></div>
      <div class="stat"><div class="v">{{ rupiah(summary.total_cost) }}</div><div class="k">Total biaya</div></div>
    </section>

    <section v-if="insight" class="sec insight">
      <svg class="leaf-bg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21c-4.5 0-7.5-3-7.5-7.5C4.5 7.5 9 4 16 3.5c.8 5-1 9.5-4 12.5"/><path d="M12 21c0-5 1.5-8.5 5-11"/></svg>
      <span class="eyebrow">Perbandingan siklus</span>
      <p class="quote"><em>{{ insight.plant }}</em> — {{ insight.last_batch }}: {{ insightText }}.</p>
      <p class="sub">Pola yang sama bisa kamu ulangi untuk siklus berikutnya. Lihat detail di tabel riwayat batch di bawah.</p>
    </section>

    <div class="lap-cols" style="margin-top:26px">
      <div>
        <section class="card chart-card">
          <div class="sec-head" style="margin-bottom:6px"><h2 style="font-size:19px">Panen per bulan</h2><span class="sp"></span><span class="badge b-muted">gram</span></div>
          <BarChart :per-month="summary.per_month" />
        </section>

        <section class="sec card" style="padding:16px">
          <div class="sec-head" style="margin-bottom:6px"><h2 style="font-size:19px">Per jenis tanaman</h2><span class="sp"></span><span class="badge b-muted">total berat</span></div>
          <div v-if="summary.per_plant.length">
            <div v-for="p in summary.per_plant" :key="p.plant" class="plant-row">
              <span class="nm">{{ p.plant }}</span>
              <span class="track"><span class="fill" :style="{ width: Math.max(4, (p.weight_grams / maxPlant) * 100) + '%' }"></span></span>
              <span class="g">{{ kg(p.weight_grams) }} kg</span>
            </div>
          </div>
          <div v-else class="empty-note">Belum ada data panen.</div>
        </section>

        <section class="sec">
          <div class="sec-head"><h2>Batch selesai</h2><span class="badge b-muted">{{ doneCount }} batch</span><span class="sp"></span></div>
          <div class="card" style="padding:0">
            <div v-for="c in doneCycles" :key="c.batch_id" class="hist-row">
              <div class="b"><div class="t">{{ c.batch_name }}</div><div class="m">{{ c.status === 'failed' ? 'Gagal' : 'Selesai' }} · {{ c.estimated_days }} hari estimasi<template v-if="c.actual_days != null"> · {{ c.actual_days }} hari aktual</template></div></div>
              <span class="badge" :class="c.status === 'failed' ? 'b-bad' : 'b-ok'">{{ c.status === 'failed' ? 'Gagal' : 'Selesai' }}</span>
              <span class="g">{{ numID(c.weight_grams) }} g</span>
            </div>
            <div v-if="!doneCycles.length" class="empty-note" style="padding:16px;text-align:center">Belum ada batch selesai.</div>
          </div>
        </section>
      </div>

      <div>
        <section class="card cost-card">
          <span class="eyebrow">Ringkasan biaya</span>
          <div style="margin-top:12px" class="frow">
            <div class="field"><label>Total biaya tercatat (Rp)</label><input :value="rupiah(summary.total_cost)" disabled /></div>
            <div class="field"><label>Asumsi harga jual (Rp/kg)</label><input v-model.number="pricePerKg" type="number" inputmode="numeric" min="0" value="25000" /></div>
          </div>
          <div class="cost-row"><span>Panen bulan ini</span><span class="v">{{ kg(monthGrams) }} kg</span></div>
          <div class="cost-row"><span>Perkiraan nilai panen</span><span class="v">{{ rupiah(valueMonth) }}</span></div>
          <div class="cost-row"><span>Total biaya</span><span class="v">{{ rupiah(summary.total_cost) }}</span></div>
          <div class="cost-row total"><span>Selisih</span><span class="v" :style="{ color: margin >= 0 ? 'var(--leaf-deep)' : 'var(--danger)' }">{{ (margin >= 0 ? '+' : '−') + rupiah(Math.abs(margin)) }}</span></div>
          <p style="font-size:12px;color:var(--meta);margin-top:10px;line-height:1.6">Angka kasar untuk kebutuhanmu sendiri — bukan pembukuan resmi.</p>
        </section>
      </div>
    </div>
  </div>
  <div v-else class="empty-note">Memuat laporan…</div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { api, getToken } from '../api';
import { useAuthStore } from '../stores/auth';
import { ICON, kg, numID, rupiah, todayStr } from '../helpers';
import BarChart from '../components/BarChart.vue';

const auth = useAuthStore();
const summary = ref(null);
const pricePerKg = ref(25000);

const totalLubang = computed(() => auth.installations.reduce((s, i) => s + (i.capacity || 0), 0));
const maxPlant = computed(() => Math.max(1, ...(summary.value?.per_plant.map((p) => p.weight_grams) || [1])));
const doneCycles = computed(() => summary.value?.comparisons.flatMap((c) => c.cycles) || []);
const doneCount = computed(() => doneCycles.value.length);

const monthGrams = computed(() => summary.value?.per_month.find((m) => m.month === todayStr().slice(0, 7))?.weight_grams || 0);
const valueMonth = computed(() => Math.round((monthGrams.value / 1000) * pricePerKg.value));
const margin = computed(() => valueMonth.value - summary.value?.total_cost);

const insight = computed(() => summary.value?.comparisons.map((c) => c.insight).find(Boolean) || null);
const insightText = computed(() => {
  const i = insight.value; if (!i) return '';
  const parts = [];
  if (i.duration_diff_days != null) parts.push(i.duration_diff_days < 0 ? `${Math.abs(i.duration_diff_days)} hari lebih cepat` : i.duration_diff_days > 0 ? `${i.duration_diff_days} hari lebih lambat` : 'durasi sama');
  if (i.weight_diff_pct != null) parts.push(i.weight_diff_pct >= 0 ? `${i.weight_diff_pct}% lebih berat` : `${Math.abs(i.weight_diff_pct)}% lebih ringan`);
  return parts.join(' & ') + ' dari rata-rata batch sebelumnya';
});

async function exportCsv() {
  try {
    const res = await fetch('/api/reports/harvests.csv', { headers: { Authorization: `Bearer ${getToken()}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'panen-hidrogrow.csv'; a.click();
    URL.revokeObjectURL(url);
    window.dispatchEvent(new CustomEvent('hg:toast', { detail: 'CSV panen diunduh.' }));
  } catch (e) { window.dispatchEvent(new CustomEvent('hg:toast', { detail: e.message })); }
}

onMounted(async () => { summary.value = await api('GET', '/api/reports/summary').catch(() => null); });
</script>
