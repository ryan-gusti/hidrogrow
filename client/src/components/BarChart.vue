<template>
  <div class="chart-wrap">
    <svg :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="Grafik batang panen per bulan">
      <template v-for="(m, i) in months" :key="i">
        <rect :x="cx(i) - bw / 2" :y="P.t + ih - barH(m.g)" :width="bw" :height="barH(m.g)" rx="8" :fill="i === months.length - 1 ? 'var(--ev-panen)' : 'var(--leaf)'" :opacity="i === months.length - 1 ? 1 : 0.88">
          <title>{{ monthName(m.dt) }}: {{ numID(m.g) }} g</title>
        </rect>
        <text class="bar-val" :x="cx(i)" :y="P.t + ih - barH(m.g) - 8" text-anchor="middle">{{ kg(m.g) }}</text>
        <text class="bar-lbl" :x="cx(i)" :y="H - 10" text-anchor="middle">{{ formatShort(m.dt) }}{{ i === months.length - 1 ? ' ·' : '' }}</text>
      </template>
      <line :x1="P.l" :y1="P.t + ih" :x2="W - P.r" :y2="P.t + ih" stroke="var(--border-soft)" stroke-width="1.5" />
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { toStr, formatShort, numID, kg } from '../helpers';

const props = defineProps({ perMonth: { type: Array, default: () => [] } });
const W = 640, H = 220, P = { l: 8, r: 8, t: 26, b: 30 };
const iw = W - P.l - P.r, ih = H - P.t - P.b;
const bw = Math.min(64, (iw / 6) * 0.52);

const today = new Date();
const months = computed(() => {
  const byKey = {};
  props.perMonth.forEach((m) => { byKey[m.month] = m.weight_grams; });
  const out = [];
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = toStr(dt).slice(0, 7);
    out.push({ dt, g: byKey[key] || 0 });
  }
  return out;
});
const max = computed(() => Math.max(1, ...months.value.map((m) => m.g)) * 1.15);
const cx = (i) => P.l + (i + 0.5) * (iw / 6);
const barH = (g) => Math.max(3, (g / max.value) * ih);
const monthName = (dt) => dt.toLocaleDateString('id-ID', { month: 'long' });
</script>
