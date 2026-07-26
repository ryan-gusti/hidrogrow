<template>
  <div class="card flex items-center gap-3 !p-3">
    <span class="h-3 w-3 shrink-0 rounded-full" :class="meta.dot" />
    <div class="min-w-0 flex-1">
      <p class="truncate font-medium">{{ task.title }}</p>
      <p class="text-xs text-gray-500">
        <span class="chip mr-1" :class="meta.chip">{{ meta.label }}</span>
        <span v-if="overdue" class="text-red-500">Terlewat {{ overdueDays }} hari</span>
        <span v-else>Hari ini</span>
        <span v-if="task.recurrence_days"> · tiap {{ task.recurrence_days }} hari</span>
      </p>
    </div>
    <div class="flex shrink-0 gap-1">
      <button v-if="task.type === 'cek_nutrisi' || task.type === 'ganti_larutan'"
        class="btn-secondary !min-h-0 px-3 py-2 text-sm" @click="$emit('log')" title="Isi log & selesaikan">
        💧 Isi Log
      </button>
      <button class="btn-primary !min-h-0 px-3 py-2 text-sm" @click="$emit('complete')" title="Tandai selesai">✓</button>
      <button class="btn-ghost !min-h-0 px-2 py-2 text-sm" @click="$emit('snooze')" title="Tunda">⏰</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { EVENT_META, todayStr, parseDate } from '../helpers';

const props = defineProps({ task: { type: Object, required: true } });
defineEmits(['complete', 'log', 'snooze']);

const meta = computed(() => EVENT_META[props.task.type] || EVENT_META.lainnya);
const overdue = computed(() => props.task.due_date < todayStr());
const overdueDays = computed(() =>
  Math.round((parseDate(todayStr()) - parseDate(props.task.due_date)) / 86400000)
);
</script>
