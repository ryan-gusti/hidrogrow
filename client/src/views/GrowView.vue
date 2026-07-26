<template>
  <div>
    <div class="page-head">
      <h1>Tanam</h1>
      <span class="sp"></span>
      <button class="btn btn-primary" @click="batchSheet = true"><span v-html="ICON.plus"></span>Batch Baru</button>
    </div>

    <section>
      <div class="sec-head"><span class="eyebrow">Batch aktif</span><span class="sp"></span><span class="badge b-muted">{{ active.length }} batch</span></div>
      <div v-if="active.length === 0" class="card" style="padding:28px;text-align:center;color:var(--muted)">Belum ada batch aktif. Mulai semai batch pertamamu!</div>
      <div v-else class="batch-grid">
        <router-link v-for="b in active" :key="b.id" :to="`/tanam/${b.id}`" class="card batch-card" style="text-decoration:none">
          <div class="batch-top">
            <img v-if="photo(b)" class="batch-thumb" :src="photo(b)" :alt="b.plant_name" />
            <span v-else class="batch-thumb" style="display:grid;place-items:center;background:var(--leaf-soft);color:var(--leaf-deep)" v-html="ICON.navGrow"></span>
            <div class="batch-info">
              <h3>{{ b.name }}</h3>
              <div class="m">{{ instName(b) }} · {{ b.quantity }} lubang · Semai {{ formatShort(b.sow_date) }}</div>
              <div class="batch-meta-row">
                <span class="badge" :class="phaseCls(b)"><span class="dot"></span>{{ b.current_phase }}</span>
                <span style="font-size:12.5px;color:var(--muted)">Hari ke-{{ b.day_number }} dari ±{{ totalDays(b) }}</span>
              </div>
            </div>
          </div>
          <PhaseBar :batch="b" />
        </router-link>
      </div>
    </section>

    <section class="sec">
      <div class="sec-head">
        <h2>Katalog Tanaman</h2>
        <span class="badge b-muted">{{ plants.length }} template</span>
        <span class="sp"></span>
        <button class="btn btn-secondary btn-sm" @click="plantSheet = true">+ Tanaman kustom</button>
      </div>
      <div class="search-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>
        <input v-model="search" type="search" placeholder="Cari tanaman — misal: selada, kangkung…" aria-label="Cari tanaman" />
      </div>
      <div class="cat-grid">
        <div v-for="p in filteredPlants" :key="p.id" class="card cat-card">
          <div class="nm"><i v-html="ICON.navGrow"></i><div><h3>{{ p.name }}<span v-if="p.is_custom" class="badge b-muted" style="margin-left:6px">Kustom</span></h3></div></div>
          <div class="spec">
            <span class="badge b-muted">Panen ± {{ totalDays(p) }} hr</span>
            <span class="badge b-muted">pH {{ comma(p.phases[0].ph_min) }}–{{ comma(p.phases[0].ph_max) }}</span>
            <span class="badge b-muted">PPM {{ p.phases.at(-1).ppm_min }}–{{ p.phases.at(-1).ppm_max }}</span>
          </div>
          <div class="tips">{{ p.tips || 'Template siap pakai.' }}</div>
          <div class="row"><button class="mini-btn primary" @click="semai(p)">Semai tanaman ini</button></div>
        </div>
      </div>
    </section>

    <BatchFormSheet v-if="batchSheet" @close="batchSheet = false" @saved="onSaved" @toast="onToast" />
    <PlantFormSheet v-if="plantSheet" @close="plantSheet = false" @saved="onSaved" @toast="onToast" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { api } from '../api';
import { useAuthStore } from '../stores/auth';
import { ICON, EVENT_META, formatShort, comma } from '../helpers';
import PhaseBar from '../components/PhaseBar.vue';
import BatchFormSheet from '../components/BatchFormSheet.vue';
import PlantFormSheet from '../components/PlantFormSheet.vue';

const auth = useAuthStore();
const batches = ref([]);
const plants = ref([]);
const search = ref('');
const batchSheet = ref(false);
const plantSheet = ref(false);

const active = computed(() => batches.value.filter((b) => b.status === 'active'));
const filteredPlants = computed(() => plants.value.filter((p) => !search.value || p.name.toLowerCase().includes(search.value.toLowerCase())));

const totalDays = (b) => (b.timeline ? b.timeline.phases.reduce((s, p) => s + p.days, 0) : (b.phases ? b.phases.reduce((s, p) => s + p.days, 0) : 0));
const phaseCls = (b) => { const p = b.current_phase; return p === 'Semai' ? 'b-semai' : p === 'Panen' ? 'b-panen' : 'b-ok'; };
const instName = (b) => auth.installations.find((i) => i.id === b.installation_id)?.name || '—';
const photo = (b) => {
  const n = (b.plant_name || '').toLowerCase();
  if (n.includes('selada') || n.includes('romaine')) return '/assets/hero-nft.jpg';
  if (n.includes('kangkung') || n.includes('sawi') || n.includes('bayam')) return '/assets/kebun-sap.jpg';
  if (n.includes('pakcoy') || n.includes('caisim')) return '/assets/pakcoy.jpg';
  return null;
};
function semai(p) { batchSheet.value = true; }
function onSaved() { batchSheet.value = false; plantSheet.value = false; load(); window.dispatchEvent(new CustomEvent('hg:refresh')); }
function onToast(m) { window.dispatchEvent(new CustomEvent('hg:toast', { detail: m })); }

async function load() {
  try { [batches.value, plants.value] = await Promise.all([api('GET', '/api/batches'), api('GET', '/api/plants')]); } catch { /* offline */ }
}
onMounted(() => { load(); window.addEventListener('hg:refresh', load); });
onUnmounted(() => window.removeEventListener('hg:refresh', load));
</script>
