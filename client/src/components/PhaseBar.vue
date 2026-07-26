<template>
  <div v-if="batch.timeline" class="phase-wrap" :style="padded ? null : { padding: 0 }">
    <div class="phase-labels">
      <span :class="{ now: isCurrent(0) }">Semai</span>
      <span>Pindah H+{{ firstEnd }}</span>
      <span :class="{ now: isCurrent(1) }">Vegetatif</span>
      <span :class="{ now: isCurrentLast }">Panen</span>
    </div>
    <div class="phase-bar">
      <div class="phase-fill" :style="{ width: pct + '%' }"></div>
      <span class="phase-tick" :style="{ left: tick1 + '%' }"></span>
      <span class="phase-tick" :style="{ left: tick2 + '%' }"></span>
    </div>
    <div class="batch-meta-row">
      <span v-if="phase" class="badge" :class="phase.cls"><span class="dot"></span>{{ phase.label }}</span>
      <span style="font-size:12.5px;color:var(--muted)">Hari ke-{{ batch.day_number }} dari ±{{ total }}</span>
      <span v-if="sisa >= 0" style="font-size:12.5px;margin-left:auto" :style="{ color: sisa <= 2 ? 'var(--ev-panen)' : 'var(--muted)', fontWeight: sisa <= 2 ? 600 : 400 }">
        {{ sisa > 0 ? `Estimasi panen ${formatShort(harvestDate)} (${sisa} hari lagi)` : 'Sudah masuk masa panen' }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatShort, todayStr, addDays, EVENT_META } from '../helpers';

const props = defineProps({ batch: { type: Object, required: true }, padded: { type: Boolean, default: true } });

const phases = computed(() => props.batch.timeline.phases);
const total = computed(() => phases.value.reduce((s, p) => s + p.days, 0));
const firstEnd = computed(() => phases.value[0]?.days || 0);
const pct = computed(() => Math.min(100, Math.max(2, (props.batch.day_number / total.value) * 100)));
const tick1 = computed(() => ((phases.value[0]?.days || 0) / total.value) * 100);
const tick2 = computed(() => total.value > 0 ? (((total.value - (phases.value.at(-1)?.days || 0)) / total.value) * 100) : 100);
const harvestDate = computed(() => props.batch.timeline.harvestDate);
const sisa = computed(() => total.value - props.batch.day_number);

const phase = computed(() => {
  const idx = phases.value.findIndex((p) => todayStr() >= p.start && todayStr() < p.end);
  if (idx < 0) return null;
  const key = idx === 0 ? 'semai' : idx === phases.value.length - 1 ? 'panen' : 'pindah';
  return { label: phases.value[idx].name, cls: EVENT_META[key].cls };
});
const isCurrent = (i) => phases.value[i] && todayStr() >= phases.value[i].start && todayStr() < phases.value[i].end;
const isCurrentLast = computed(() => phases.value.length > 1 && todayStr() >= phases.value.at(-2).end);
</script>
