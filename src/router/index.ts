import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/components/layout/MainApp.vue'),
      children: [
        { path: '', redirect: '/upload' },
        { path: 'upload', component: () => import('@/views/UploadView.vue') },
        { path: 'check-result', component: () => import('@/views/CheckResultView.vue') },
      ],
    },
    {
      path: '/settings',
      component: () => import('@/views/SettingsView.vue'),
    },
  ],
});

export default router;
