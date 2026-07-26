<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <div class="absolute inset-0 bg-black/40" @click="$emit('close')" />
      <div class="safe-bottom relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl">
        <div class="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gray-300" />
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-bold">{{ title }}</h2>
          <button class="btn-ghost !min-h-0 p-2 text-xl leading-none" @click="$emit('close')" aria-label="Tutup">✕</button>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({ title: { type: String, default: '' } });
defineEmits(['close']);
</script>
