<template>
  <div class="chart-wrap">
    <svg :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="Grafik tren nutrisi">
      <line v-for="(g, i) in gridLines" :key="'g'+i" :x1="P.l" :y1="g.y" :x2="W - P.r" :y2="g.y" stroke="var(--border-soft)" stroke-width="1" />
      <text v-for="(g, i) in gridLines" :key="'t'+i" :x="P.l - 6" :y="g.y + 3" text-anchor="end" font-size="10" fill="var(--meta)">{{ g.lbl }}</text>
      <rect :x="P.l" :y="bandY" :width="iw" :height="bandH" :fill="col" opacity="0.09" rx="4" />
      <path :d="areaPath" :fill="col" opacity="0.10" />
      <polyline :points="linePoints" fill="none" :stroke="col" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
      <circle v-for="(p, i) in points" :key="i" :cx="p.x" :cy="p.y" r="4" :fill="p.out ? 'var(--danger)' : col" stroke="var(--surface)" stroke-width="2" style="cursor:pointer" @mouseenter="showTip(i)" @click="showTip(i)" />
      <text v-for="(p, i) in labels" :key="'l'+i" :x="p.x" :y="H - 8" text-anchor="middle" font-size="10" fill="var(--meta)">{{ p.lbl }}</text>
    </svg>
    <div class="chart-tip" :style="{ display: tip ? 'block' : 'none', left: tipX + 'px', top: tipY + 'px' }" v-html="tip"></div>
    <div class="chart-legend">
      <span><i :style="{ background: col }"></i>{{ kind === 'ph' ? 'pH larutan' : 'PPM / TDS' }}</span>
      <span><i :style="{ background: col, opacity: 0.25, height: '8px', width: '14px', borderRadius: '2px' }"></i>Rentang target {{ kind === 'ph' ? '5,5–6,5' : '840–1.400' }}</span>
      <span><i :style="{ background: 'var(--danger)', width: '8px', height: '8px', borderRadius: '50%' }"></i>Di luar rentang</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { formatShort } from '../helpers';

const props = defineProps({ logs: { type: Array, default: () => [] }, kind: { type: String, default: 'ph' } });

const W = 640, H = 210, P = { l: 38, r: 12, t: 16, b: 26 };
const iw = W - P.l - P.r, ih = H - P.t - P.b;
const isPh = computed(() => props.kind === 'ph');
const col = computed(() => isPh.value ? 'var(--leaf)' : 'var(--ev-panen)');
const lo = computed(() => isPh.value ? 5 : 700);
const hi = computed(() => isPh.value ? 7 : 1500);
const bandLo = computed(() => isPh.value ? 5.5 : 840);
const bandHi = computed(() => isPh.value ? 6.5 : 1400);

const data = computed(() => props.logs.filter((l) => l[props.kind] != null).slice(-10));
const X = (i) => P.l + (data.value.length <= 1 ? iw / 2 : (i / (data.value.length - 1)) * iw);
const Y = (v) => P.t + ih - ((v - lo.value) / (hi.value - lo.value)) * ih;
const fmtV = (v) => isPh.value ? String(v).replace('.', ',') : v.toLocaleString('id-ID');

const gridLines = computed(() => {
  const steps = isPh.value ? [5, 5.5, 6, 6.5, 7] : [700, 900, 1100, 1300, 1500];
  return steps.map((g) => ({ y: Y(g), lbl: fmtV(g) }));
});
const bandY = computed(() => Y(bandHi.value));
const bandH = computed(() => Y(bandLo.value) - Y(bandHi.value));
const points = computed(() => data.value.map((l, i) => {
  const v = l[props.kind];
  return { x: X(i), y: Y(v), out: v < bandLo.value || v > bandHi.value };
}));
const linePoints = computed(() => points.value.map((p) => `${p.x},${p.y}`).join(' '));
const areaPath = computed(() => `M${P.l},${P.t + ih} L` + points.value.map((p) => `${p.x},${p.y}`).join(' L') + ` L${P.l + iw},${P.t + ih} Z`);
const labels = computed(() => data.value.map((l, i) => ({ x: X(i), lbl: formatShort(l.date) })).filter((_, i) => i % 2 === 0 || i === data.value.length - 1));

const tip = ref('');
const tipX = ref(0);
const tipY = ref(0);
function showTip(i) {
  const l = data.value[i];
  const v = l[props.kind];
  tip.value = `${formatShort(l.date)} · <b>${fmtV(v)}${isPh.value ? '' : ' PPM'}</b>`;
  tipX.value = points.value[i].x / W * 100 + '%';
  tipY.value = points.value[i].y / H * 100 + '%';
}
</script>
