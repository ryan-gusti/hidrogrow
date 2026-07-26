<template>
  <Sheet :title="initial ? 'Ubah Tanaman Kustom' : 'Tanaman Kustom Baru'" @close="$emit('close')">
    <form @submit.prevent="save">
      <div class="field"><label>Nama tanaman</label><input v-model="name" type="text" required placeholder="cth: Selada Merah" /></div>
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-size:12px;font-weight:500;color:var(--muted)">Fase & target nutrisi</span>
          <button type="button" class="btn btn-ghost btn-sm" @click="addPhase">+ Fase</button>
        </div>
        <div v-for="(p, i) in phases" :key="i" style="border:1px solid var(--border-soft);border-radius:var(--radius-md);padding:12px;margin-bottom:8px">
          <div style="display:flex;gap:8px;align-items:center">
            <input v-model="p.name" type="text" placeholder="Nama fase" required style="flex:1;min-height:40px;padding:8px 12px;border:1px solid var(--border-soft);border-radius:var(--radius-md);font:inherit" />
            <input v-model.number="p.days" type="number" inputmode="numeric" min="1" required style="width:70px;min-height:40px;padding:8px" />
            <span style="font-size:11px;color:var(--meta)">hari</span>
            <button v-if="phases.length > 1" type="button" class="btn btn-ghost btn-sm" @click="phases.splice(i,1)">🗑</button>
          </div>
          <div class="frow" style="gap:8px;margin-top:8px">
            <div class="field" style="margin:0"><label style="font-size:11px">pH min</label><input v-model.number="p.ph_min" type="number" step="0.1" /></div>
            <div class="field" style="margin:0"><label style="font-size:11px">pH max</label><input v-model.number="p.ph_max" type="number" step="0.1" /></div>
            <div class="field" style="margin:0"><label style="font-size:11px">PPM min</label><input v-model.number="p.ppm_min" type="number" inputmode="numeric" /></div>
            <div class="field" style="margin:0"><label style="font-size:11px">PPM max</label><input v-model.number="p.ppm_max" type="number" inputmode="numeric" /></div>
          </div>
        </div>
      </div>
      <div class="field"><label>Tips singkat (opsional)</label><textarea v-model="tips" rows="2"></textarea></div>
      <div style="display:flex;gap:10px">
        <button type="button" class="btn btn-secondary" style="flex:1" @click="$emit('close')">Batal</button>
        <button type="submit" class="btn btn-primary" style="flex:2" :disabled="saving">{{ saving ? 'Menyimpan…' : 'Simpan' }}</button>
      </div>
    </form>
  </Sheet>
</template>

<script setup>
import { ref } from 'vue';
import Sheet from './Sheet.vue';
import { api } from '../api';

const props = defineProps({ initial: { type: Object, default: null } });
const emit = defineEmits(['close', 'saved', 'toast']);

const name = ref(props.initial?.name || '');
const tips = ref(props.initial?.tips || '');
const phases = ref(props.initial ? props.initial.phases.map((p) => ({ ...p })) : [
  { name: 'Semai', days: 10, ph_min: 5.5, ph_max: 6.5, ppm_min: 400, ppm_max: 700 },
  { name: 'Vegetatif', days: 25, ph_min: 5.5, ph_max: 6.5, ppm_min: 800, ppm_max: 1200 },
  { name: 'Panen', days: 7, ph_min: 5.5, ph_max: 6.5, ppm_min: 900, ppm_max: 1300 },
]);
const saving = ref(false);

function addPhase() { phases.value.push({ name: `Fase ${phases.value.length + 1}`, days: 7, ph_min: 5.5, ph_max: 6.5, ppm_min: 800, ppm_max: 1200 }); }

async function save() {
  saving.value = true;
  try {
    const body = { name: name.value, phases: phases.value, tips: tips.value };
    if (props.initial) await api('PUT', `/api/plants/${props.initial.id}`, body);
    else await api('POST', '/api/plants', body);
    emit('toast', 'Tanaman tersimpan.');
    emit('saved');
  } catch (e) { emit('toast', e.message); }
  finally { saving.value = false; }
}
</script>
