<template>
  <Teleport to="body">
    <div class="sheet-root open">
      <div class="ovl" @click="$emit('close')"></div>
      <div class="sheet" role="dialog" aria-modal="true">
        <div class="grip"></div>
        <div v-if="title || $slots.title" style="margin-bottom: 4px">
          <slot name="title"><h3>{{ title }}</h3></slot>
        </div>
        <p v-if="sub" class="sub">{{ sub }}</p>
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({ title: { type: String, default: '' }, sub: { type: String, default: '' } });
defineEmits(['close']);
</script>
