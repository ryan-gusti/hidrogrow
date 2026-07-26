<template>
  <div v-if="batch.timeline" class="space-y-1">
    <div class="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        v-for="(p, i) in batch.timeline.phases" :key="i"
        class="h-full" :class="[phaseColor(i), today >= p.end ? 'opacity-100' : today >= p.start ? 'opacity-70' : 'opacity-25']"
        :style="{ width: `${(p.days / total) * 100}%` }"
        :title="`${p.name} (${formatShort(p.start)} – ${formatShort(p.end)})`"
      />
    </div>
    <div class="flex justify-between text-[10px] text-gray-400">
      <span>Semai {{ formatShort(batch.sow_date) }}</span>
      <span v-if="batch.timeline.transplantDate">Pindah {{ formatShort(batch.timeline.transplantDate) }}</span>
      <span>Panen ≈ {{ formatShort(batch.timeline.harvestDate) }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatShort, todayStr } from '../helpers';

const props = defineProps({ batch: { type: Object, required: true } });

const today = todayStr();
const total = computed(() => props.batch.timeline.phases.reduce((s, p) => s + p.days, 0));
const colors = ['bg-green-400', 'bg-blue-400', 'bg-orange-400', 'bg-purple-400', 'bg-pink-400'];
const phaseColor = (i) => colors[i % colors.length];
</script>
