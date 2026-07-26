<template>
  <Sheet :title="`Tambah Jadwal`" :sub="formatLong(date) + ' — pilih jenis kegiatan.'" @close="$emit('close')">
    <div v-if="!type" class="type-pick">
      <button v-for="t in eventTypes" :key="t.value" @click="pick(t.value)"><i :style="{ background: t.col }"></i>{{ t.label }}</button>
    </div>
    <form v-else @submit.prevent="save">
      <button type="button" class="btn btn-ghost btn-sm" style="margin-bottom:10px" @click="type = null">← Ganti jenis</button>
      <div class="field"><label>Judul</label><input v-model="title" type="text" required /></div>
      <div class="field"><label>Instalasi (opsional)</label>
        <select v-model="installationId" class="input">
          <option :value="null">—</option>
          <option v-for="i in installations" :key="i.id" :value="i.id">{{ i.name }}</option>
        </select>
      </div>
      <label class="field" style="display:flex;align-items:center;gap:8px;font-size:13.5px;color:var(--fg-2)">
        <input v-model="recurring" type="checkbox" style="width:18px;height:18px;min-height:auto" /> Berulang
      </label>
      <div v-if="recurring" class="field"><label>Ulangi tiap (hari)</label><input v-model.number="interval" type="number" inputmode="numeric" min="1" /></div>
      <div style="display:flex;gap:10px">
        <button type="button" class="btn btn-secondary" style="flex:1" @click="$emit('close')">Batal</button>
        <button type="submit" class="btn btn-primary" style="flex:2" :disabled="saving">{{ saving ? 'Menyimpan…' : 'Simpan jadwal' }}</button>
      </div>
    </form>
  </Sheet>
</template>

<script setup>
import { ref } from 'vue';
import Sheet from './Sheet.vue';
import { api } from '../api';
import { formatLong, EVENT_META } from '../helpers';

const props = defineProps({ date: { type: String, required: true }, installations: { type: Array, default: () => [] } });
const emit = defineEmits(['close', 'saved', 'new-batch', 'toast']);

const eventTypes = [
  { value: 'semai', label: 'Mulai Semai', col: 'var(--ev-semai)' },
  { value: 'pindah', label: 'Pindah Tanam', col: 'var(--ev-pindah)' },
  { value: 'cek_nutrisi', label: 'Cek Nutrisi', col: 'var(--ev-cek)' },
  { value: 'ganti_larutan', label: 'Ganti Larutan', col: 'var(--ev-cek)' },
  { value: 'bersih_tandon', label: 'Bersihkan Tandon', col: 'var(--meta)' },
  { value: 'lainnya', label: 'Lainnya', col: 'var(--meta)' },
];

const type = ref(null);
const title = ref('');
const installationId = ref(null);
const recurring = ref(false);
const interval = ref(2);
const saving = ref(false);

function pick(t) {
  if (t === 'semai') { emit('new-batch'); return; }
  type.value = t;
  title.value = (EVENT_META[t] || { label: 'Kegiatan' }).label;
  recurring.value = t === 'cek_nutrisi';
}

async function save() {
  saving.value = true;
  try {
    await api('POST', '/api/tasks', { type: type.value, title: title.value, due_date: props.date, installation_id: installationId.value, recurrence_days: recurring.value ? interval.value : null });
    emit('toast', 'Jadwal tersimpan — tampil juga di Hari Ini.');
    emit('saved');
  } catch (err) { emit('toast', err.message); }
  finally { saving.value = false; }
}
</script>
