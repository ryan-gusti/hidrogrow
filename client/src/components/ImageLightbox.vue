<template>
  <Teleport to="body">
    <div v-if="src" class="lightbox-root" @click="close">
      <div class="lightbox-inner">
        <img :src="src" :alt="alt" @click.stop />
        <button class="lightbox-close" @click="close" aria-label="Tutup">✕</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

const src = ref(null);
const alt = ref('');

function open(url, label = '') {
  if (!url) return;
  src.value = url;
  alt.value = label;
  document.addEventListener('keydown', onKey);
}
function close() {
  src.value = null;
  document.removeEventListener('keydown', onKey);
}
function onKey(e) { if (e.key === 'Escape') close(); }

function onEvent(e) { open(e.detail?.url, e.detail?.alt || ''); }

onMounted(() => window.addEventListener('hg:lightbox', onEvent));
onUnmounted(() => { window.removeEventListener('hg:lightbox', onEvent); document.removeEventListener('keydown', onKey); });
</script>

<style scoped>
.lightbox-root {
  position: fixed; inset: 0; z-index: 80;
  background: rgba(20, 20, 19, 0.88);
  display: grid; place-items: center;
  padding: 24px;
  cursor: zoom-out;
  animation: lb-fade 200ms ease;
}
@keyframes lb-fade { from { opacity: 0 } to { opacity: 1 } }
.lightbox-inner { position: relative; max-width: 100%; max-height: 100%; }
.lightbox-inner img {
  max-width: 92vw; max-height: 86vh;
  border-radius: 12px;
  object-fit: contain;
  box-shadow: 0 24px 64px rgba(0,0,0,0.4);
  cursor: default;
}
.lightbox-close {
  position: absolute; top: -14px; right: -14px;
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--surface, #faf9f5); color: var(--fg, #141413);
  font-size: 18px; font-weight: 600;
  display: grid; place-items: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  cursor: pointer;
}
.lightbox-close:hover { background: #fff }
</style>
