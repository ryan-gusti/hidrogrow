<template>
  <Sheet :title="initial ? 'Ubah Tanaman Kustom' : 'Tanaman Kustom Baru'" @close="$emit('close')">
    <form class="space-y-3" @submit.prevent="save">
      <div>
        <label class="label">Nama tanaman</label>
        <input v-model="name" type="text" class="input" required placeholder="cth: Selada Merah" />
      </div>
      <div>
        <div class="mb-1 flex items-center justify-between">
          <label class="label !mb-0">Fase & target nutrisi</label>
          <button type="button" class="text-sm font-medium text-leaf-600" @click="addPhase">+ Fase</button>
        </div>
        <div v-for="(p, i) in phases" :key="i" class="mb-2 space-y-2 rounded-xl border border-gray-200 p-3">
          <div class="flex items-center gap-2">
            <input v-model="p.name" type="text" class="input flex-1" placeholder="Nama fase" required />
            <input v-model.number="p.days" type="number" min="1" class="input !w-20" title="Durasi (hari)" required inputmode="numeric" />
            <span class="text-xs text-gray-400">hari</span>
            <button v-if="phases.length > 1" type="button" class="btn-ghost !min-h-0 p-1" @click="phases.splice(i, 1)">🗑</button>
          </div>
          <div class="grid grid-cols-4 gap-2 text-xs">
            <div><label class="text-gray-500">pH min</label><input v-model.number="p.ph_min" type="number" step="0.1" class="input !px-2" /></div>
            <div><label class="text-gray-500">pH max</label><input v-model.number="p.ph_max" type="number" step="0.1" class="input !px-2" /></div>
            <div><label class="text-gray-500">PPM min</label><input v-model.number="p.ppm_min" type="number" class="input !px-2" inputmode="numeric" /></div>
            <div><label class="text-gray-500">PPM max</label><input v-model.number="p.ppm_max" type="number" class="input !px-2" inputmode="numeric" /></div>
          </div>
        </div>
      </div>
      <div>
        <label class="label">Tips singkat (opsional)</label>
        <textarea v-model="tips" class="input" rows="2"></textarea>
      </div>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <button class="btn-primary w-full" :disabled="saving">{{ saving ? 'Menyimpan…' : 'Simpan Tanaman' }}</button>
    </form>
  </Sheet>
</template>

<script setup>
import { ref } from 'vue';
import Sheet from './Sheet.vue';
import { api } from '../api';

const props = defineProps({ initial: { type: Object, default: null } });
const emit = defineEmits(['close', 'saved']);

const name = ref(props.initial?.name || '');
const tips = ref(props.initial?.tips || '');
const phases = ref(
  props.initial
    ? props.initial.phases.map((p) => ({ ...p }))
    : [
        { name: 'Semai', days: 10, ph_min: 5.5, ph_max: 6.5, ppm_min: 400, ppm_max: 700 },
        { name: 'Vegetatif', days: 25, ph_min: 5.5, ph_max: 6.5, ppm_min: 800, ppm_max: 1200 },
        { name: 'Panen', days: 7, ph_min: 5.5, ph_max: 6.5, ppm_min: 900, ppm_max: 1300 },
      ]
);
const saving = ref(false);
const error = ref('');

function addPhase() {
  phases.value.push({ name: `Fase ${phases.value.length + 1}`, days: 7, ph_min: 5.5, ph_max: 6.5, ppm_min: 800, ppm_max: 1200 });
}

async function save() {
  error.value = '';
  saving.value = true;
  try {
    const body = { name: name.value, phases: phases.value, tips: tips.value };
    if (props.initial) await api('PUT', `/api/plants/${props.initial.id}`, body);
    else await api('POST', '/api/plants', body);
    emit('saved');
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
}
</script>
