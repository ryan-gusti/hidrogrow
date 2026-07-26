<template>
  <Sheet title="Tunda Tugas" @close="$emit('close')">
    <p class="sub" style="margin-bottom:14px">{{ task.title }}</p>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button class="btn btn-secondary" style="justify-content:space-between" @click="snooze(todayStr())"><span>Nanti malam</span><span style="color:var(--meta)">{{ formatShort(todayStr()) }}</span></button>
      <button class="btn btn-secondary" style="justify-content:space-between" @click="snooze(addDays(todayStr(),1))"><span>Besok pagi</span><span style="color:var(--meta)">{{ formatShort(addDays(todayStr(),1)) }}</span></button>
      <div style="display:flex;gap:8px">
        <input v-model="custom" type="date" style="flex:1;min-height:44px;padding:8px 12px;border:1px solid var(--border-soft);border-radius:var(--radius-md);font:inherit" />
        <button class="btn btn-primary" :disabled="!custom" @click="snooze(custom)">Pilih</button>
      </div>
    </div>
  </Sheet>
</template>

<script setup>
import { ref } from 'vue';
import Sheet from './Sheet.vue';
import { api } from '../api';
import { todayStr, addDays, formatShort } from '../helpers';

const props = defineProps({ task: { type: Object, required: true } });
const emit = defineEmits(['close', 'snoozed', 'toast']);
const custom = ref('');

async function snooze(until) {
  try { await api('POST', `/api/tasks/${props.task.id}/snooze`, { until }); emit('toast', 'Ditunda.'); emit('snoozed'); }
  catch (e) { emit('toast', e.message); }
}
</script>
