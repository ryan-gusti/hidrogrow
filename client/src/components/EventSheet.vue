<template>
  <Sheet title="Detail Kegiatan" @close="$emit('close')">
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <span class="h-3 w-3 rounded-full" :class="meta.dot" />
        <span class="chip" :class="meta.chip">{{ meta.label }}</span>
        <span class="text-sm text-gray-500">{{ formatId(event.date) }}</span>
      </div>
      <p class="text-lg font-bold">{{ event.title }}</p>
      <p v-if="event.recurring" class="text-sm text-gray-500">🔁 Jadwal berulang — menyelesaikan akan menjadwalkan ulang otomatis.</p>

      <div v-if="!rescheduling" class="grid grid-cols-2 gap-2">
        <button v-if="event.type === 'cek_nutrisi' || event.type === 'ganti_larutan'"
          class="btn-secondary" @click="$emit('log')">💧 Isi Log</button>
        <button v-if="event.task_id" class="btn-primary" @click="complete">✓ Tandai Selesai</button>
        <button class="btn-secondary" @click="rescheduling = true">📅 Geser Tanggal</button>
        <router-link v-if="event.batch_id" :to="`/tanam/${event.batch_id}`" class="btn-ghost text-center">Lihat Batch →</router-link>
      </div>
      <div v-else class="space-y-2">
        <label class="label">Tanggal baru</label>
        <div class="flex gap-2">
          <input v-model="newDate" type="date" class="input flex-1" />
          <button class="btn-primary" :disabled="!newDate || saving" @click="reschedule">Simpan</button>
        </div>
        <p v-if="event.type === 'pindah' || event.type === 'panen'" class="text-xs text-gray-500">
          ℹ️ Reminder terkait di batch ini akan ikut menyesuaikan.
        </p>
        <button class="btn-ghost w-full" @click="rescheduling = false">Batal</button>
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    </div>
  </Sheet>
</template>

<script setup>
import { computed, ref } from 'vue';
import Sheet from './Sheet.vue';
import { api } from '../api';
import { EVENT_META, formatId } from '../helpers';

const props = defineProps({ event: { type: Object, required: true } });
const emit = defineEmits(['close', 'changed', 'log']);

const meta = computed(() => EVENT_META[props.event.type] || EVENT_META.lainnya);
const rescheduling = ref(false);
const newDate = ref(props.event.date);
const saving = ref(false);
const error = ref('');

async function complete() {
  error.value = '';
  try {
    await api('POST', `/api/tasks/${props.event.task_id}/complete`);
    emit('changed');
  } catch (err) {
    error.value = err.message;
  }
}

async function reschedule() {
  error.value = '';
  saving.value = true;
  try {
    if (props.event.task_id) {
      await api('POST', `/api/tasks/${props.event.task_id}/reschedule`, { date: newDate.value });
    }
    emit('changed');
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
}
</script>
