<template>
  <Sheet title="⏰ Tunda Tugas" @close="$emit('close')">
    <p class="mb-3 text-sm text-gray-600">{{ task.title }}</p>
    <div class="space-y-2">
      <button class="btn-secondary w-full justify-between" @click="snooze(todayStr())">
        Nanti malam <span>{{ formatShort(todayStr()) }}</span>
      </button>
      <button class="btn-secondary w-full justify-between" @click="snooze(addDays(todayStr(), 1))">
        Besok <span>{{ formatShort(addDays(todayStr(), 1)) }}</span>
      </button>
      <div class="flex gap-2">
        <input v-model="custom" type="date" class="input flex-1" />
        <button class="btn-primary" @click="snooze(custom)" :disabled="!custom">Pilih</button>
      </div>
    </div>
    <p v-if="error" class="mt-2 text-sm text-red-600">{{ error }}</p>
  </Sheet>
</template>

<script setup>
import { ref } from 'vue';
import Sheet from './Sheet.vue';
import { api } from '../api';
import { todayStr, addDays, formatShort } from '../helpers';

const props = defineProps({ task: { type: Object, required: true } });
const emit = defineEmits(['close', 'snoozed']);

const custom = ref('');
const error = ref('');

async function snooze(until) {
  error.value = '';
  try {
    await api('POST', `/api/tasks/${props.task.id}/snooze`, { until });
    emit('snoozed');
  } catch (err) {
    error.value = err.message;
  }
}
</script>
