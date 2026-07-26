<template>
  <div class="space-y-4">
    <div v-if="summary" class="grid grid-cols-3 gap-2 text-center">
      <div class="card !p-3"><p class="text-lg font-bold text-leaf-700">{{ (summary.total_weight_grams / 1000).toFixed(1) }} kg</p><p class="text-xs text-gray-500">Total panen</p></div>
      <div class="card !p-3"><p class="text-lg font-bold text-leaf-700">{{ summary.total_harvests }}x</p><p class="text-xs text-gray-500">Panen tercatat</p></div>
      <div class="card !p-3"><p class="text-lg font-bold text-leaf-700">Rp {{ summary.total_cost.toLocaleString('id-ID') }}</p><p class="text-xs text-gray-500">Total biaya</p></div>
    </div>

    <button class="btn-secondary w-full" @click="exportCsv">⬇️ Ekspor Data Panen (CSV)</button>

    <!-- Insight perbandingan siklus -->
    <div v-if="insights.length" class="space-y-2">
      <h3 class="font-bold">💡 Insight Siklus</h3>
      <div v-for="(ins, i) in insights" :key="i" class="card !border-leaf-200 !bg-leaf-50 !p-3 text-sm text-leaf-900">
        <b>{{ ins.plant }}</b> — {{ ins.last_batch }}:
        <span v-if="ins.duration_diff_days != null">
          {{ ins.duration_diff_days < 0 ? `${Math.abs(ins.duration_diff_days)} hari lebih cepat` : ins.duration_diff_days > 0 ? `${ins.duration_diff_days} hari lebih lambat` : 'durasi sama' }}
        </span>
        <span v-if="ins.weight_diff_pct != null">
          & {{ ins.weight_diff_pct >= 0 ? `${ins.weight_diff_pct}% lebih berat` : `${Math.abs(ins.weight_diff_pct)}% lebih ringan` }}
        </span>
        dari rata-rata batch sebelumnya.
      </div>
    </div>

    <!-- Panen per bulan -->
    <div class="card">
      <h3 class="mb-2 font-bold">Panen per Bulan</h3>
      <p v-if="!summary?.per_month.length" class="text-sm text-gray-400">Belum ada data panen.</p>
      <div v-else class="space-y-1.5">
        <div v-for="m in [...summary.per_month].reverse().slice(0, 6)" :key="m.month" class="flex items-center gap-2 text-sm">
          <span class="w-16 text-gray-500">{{ monthLabel(m.month) }}</span>
          <div class="h-4 rounded-full bg-leaf-400" :style="{ width: barWidth(m.weight_grams) }" />
          <span class="font-medium">{{ m.weight_grams }} g</span>
        </div>
      </div>
    </div>

    <!-- Per tanaman & instalasi -->
    <div class="grid grid-cols-1 gap-3">
      <div class="card">
        <h3 class="mb-2 font-bold">Per Jenis Tanaman</h3>
        <p v-if="!summary?.per_plant.length" class="text-sm text-gray-400">Belum ada data.</p>
        <div v-for="p in summary?.per_plant" :key="p.plant" class="flex justify-between border-b border-gray-50 py-1.5 text-sm last:border-0">
          <span>{{ p.plant }}</span><span class="font-medium">{{ p.weight_grams }} g · {{ p.count }}x</span>
        </div>
      </div>
      <div class="card">
        <h3 class="mb-2 font-bold">Per Instalasi</h3>
        <p v-if="!summary?.per_installation.length" class="text-sm text-gray-400">Belum ada data.</p>
        <div v-for="i in summary?.per_installation" :key="i.installation" class="flex justify-between border-b border-gray-50 py-1.5 text-sm last:border-0">
          <span>{{ i.installation }}</span><span class="font-medium">{{ i.weight_grams }} g · {{ i.count }}x</span>
        </div>
      </div>
    </div>

    <!-- Tabel perbandingan siklus -->
    <div v-for="c in comparisonsWithCycles" :key="c.plant" class="card">
      <h3 class="mb-2 font-bold">{{ c.plant }} — Riwayat Siklus</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead><tr class="text-gray-400"><th class="py-1 pr-2">Batch</th><th class="pr-2">Hasil</th><th class="pr-2">Estimasi</th><th class="pr-2">Aktual</th><th>Biaya</th></tr></thead>
          <tbody>
            <tr v-for="cy in c.cycles" :key="cy.batch_id" class="border-t border-gray-50">
              <td class="py-1.5 pr-2 font-medium">{{ cy.batch_name }}<span v-if="cy.status === 'failed'" class="text-red-500"> (gagal)</span></td>
              <td class="pr-2">{{ cy.weight_grams }} g</td>
              <td class="pr-2">{{ cy.estimated_days }} hari</td>
              <td class="pr-2">{{ cy.actual_days != null ? cy.actual_days + ' hari' : '—' }}</td>
              <td>Rp {{ cy.cost.toLocaleString('id-ID') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { api, getToken } from '../api';
import { BULAN } from '../helpers';

const summary = ref(null);

const insights = computed(() => (summary.value?.comparisons || []).map((c) => c.insight).filter(Boolean));
const comparisonsWithCycles = computed(() => (summary.value?.comparisons || []).filter((c) => c.cycles.length > 0));

const monthLabel = (m) => `${BULAN[Number(m.slice(5)) - 1]} ${m.slice(2, 4)}`;
const maxWeight = computed(() => Math.max(1, ...(summary.value?.per_month.map((m) => m.weight_grams) || [1])));
const barWidth = (w) => `${Math.max(4, Math.round((w / maxWeight.value) * 55))}%`;

async function exportCsv() {
  // Unduh via fetch agar header Authorization terkirim
  const res = await fetch('/api/reports/harvests.csv', { headers: { Authorization: `Bearer ${getToken()}` } });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'panen-hidrogrow.csv';
  a.click();
  URL.revokeObjectURL(url);
}

onMounted(async () => {
  summary.value = await api('GET', '/api/reports/summary').catch(() => null);
});
</script>
