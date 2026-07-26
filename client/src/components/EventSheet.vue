<template>
  <Sheet title="Detail Kegiatan" @close="$emit('close')">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px">
      <span style="width:10px;height:10px;border-radius:50%;display:inline-block" :style="{ background: meta.col }"></span>
      <span class="badge" :class="meta.cls"><span class="dot"></span>{{ meta.label }}</span>
      <span style="font-size:12.5px;color:var(--meta)">{{ formatId(event.date) }}</span>
    </div>
    <p style="font-size:17px;font-weight:500;font-family:var(--font-display);margin-bottom:6px">{{ event.title }}</p>
    <p v-if="event.recurring" style="font-size:12.5px;color:var(--meta);margin-bottom:10px">🔁 Jadwal berulang — menyelesaikan akan menjadwalkan ulang otomatis.</p>

    <div v-if="!rescheduling" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <button v-if="event.type === 'cek_nutrisi' || event.type === 'ganti_larutan'" class="btn btn-secondary btn-sm" @click="$emit('log')">💧 Isi Log</button>
      <button v-if="event.task_id" class="btn btn-primary btn-sm" @click="complete">✓ Tandai Selesai</button>
      <button class="btn btn-secondary btn-sm" @click="rescheduling = true">📅 Geser Tanggal</button>
      <router-link v-if="event.batch_id" :to="`/tanam/${event.batch_id}`" class="btn btn-ghost btn-sm" style="text-decoration:none">Lihat Batch →</router-link>
    </div>
    <div v-else style="margin-top:6px">
      <div class="field"><label>Tanggal baru</label><input v-model="newDate" type="date" /></div>
      <p v-if="event.type === 'pindah' || event.type === 'panen'" class="hint" style="text-align:left">ℹ️ Reminder terkait di batch ini akan ikut menyesuaikan.</p>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary btn-sm" style="flex:1" @click="rescheduling = false">Batal</button>
        <button class="btn btn-primary btn-sm" style="flex:1" :disabled="!newDate || saving" @click="reschedule">Simpan</button>
      </div>
    </div>
  </Sheet>
</template>

<script setup>
import { computed, ref } from 'vue';
import Sheet from './Sheet.vue';
import { api } from '../api';
import { EVENT_META, formatId } from '../helpers';

const props = defineProps({ event: { type: Object, required: true } });
const emit = defineEmits(['close', 'changed', 'log', 'toast']);

const meta = computed(() => EVENT_META[props.event.type] || EVENT_META.lainnya);
const rescheduling = ref(false);
const newDate = ref(props.event.date);
const saving = ref(false);

async function complete() {
  try { await api('POST', `/api/tasks/${props.event.task_id}/complete`); emit('toast', 'Ditandai selesai — tercatat sebagai log.'); emit('changed'); }
  catch (e) { emit('toast', e.message); }
}
async function reschedule() {
  saving.value = true;
  try { await api('POST', `/api/tasks/${props.event.task_id}/reschedule`, { date: newDate.value }); emit('toast', 'Jadwal digeser — reminder terkait menyesuaikan.'); emit('changed'); }
  catch (e) { emit('toast', e.message); }
  finally { saving.value = false; }
}
</script>
