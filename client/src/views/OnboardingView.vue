<template>
  <div class="flex min-h-dvh items-center justify-center bg-gradient-to-b from-leaf-50 to-white px-4">
    <div class="w-full max-w-sm">
      <div class="mb-6 text-center">
        <span class="text-5xl">🏡</span>
        <h1 class="mt-2 text-xl font-bold text-leaf-700">Siapkan Kebunmu</h1>
        <p class="text-sm text-gray-500">Buat instalasi hidroponik pertamamu untuk mulai.</p>
      </div>
      <InstallationForm @saved="onSaved" />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import InstallationForm from '../components/InstallationForm.vue';

const router = useRouter();
const auth = useAuthStore();

async function onSaved() {
  await auth.fetchInstallations(true);
  router.push('/');
}
</script>
