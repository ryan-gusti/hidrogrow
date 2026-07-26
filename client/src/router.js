import { createRouter, createWebHistory } from 'vue-router';
import { getToken } from './api';
import { useAuthStore } from './stores/auth';

const routes = [
  { path: '/login', name: 'login', component: () => import('./views/LoginView.vue'), meta: { public: true } },
  { path: '/onboarding', name: 'onboarding', component: () => import('./views/OnboardingView.vue') },
  { path: '/', name: 'today', component: () => import('./views/TodayView.vue') },
  { path: '/kalender', name: 'calendar', component: () => import('./views/CalendarView.vue') },
  { path: '/tanam', name: 'grow', component: () => import('./views/GrowView.vue') },
  { path: '/tanam/:id', name: 'batch-detail', component: () => import('./views/BatchDetailView.vue') },
  { path: '/log', name: 'logs', component: () => import('./views/LogsView.vue') },
  { path: '/laporan', name: 'reports', component: () => import('./views/ReportsView.vue') },
  { path: '/pengaturan', name: 'settings', component: () => import('./views/SettingsView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (to.meta.public) {
    if (to.name === 'login' && getToken()) {
      // Validasi dulu tokennya — jangan redirect membabi buta (hindari loop token basi)
      if (!auth.user) await auth.fetchMe();
      if (auth.user) return { name: 'today' };
    }
    return true;
  }
  if (!getToken()) return { name: 'login' };
  if (!auth.user) await auth.fetchMe();
  if (!auth.user) return { name: 'login' };
  await auth.fetchInstallations();
  if (auth.needsOnboarding && to.name !== 'onboarding') return { name: 'onboarding' };
  if (!auth.needsOnboarding && to.name === 'onboarding') return { name: 'today' };
  return true;
});
