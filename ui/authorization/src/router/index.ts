// Composables
import { h } from 'vue';
import { useCoreStore } from '@/store/core';
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/default/Default.vue'),
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import(/* webpackChunkName: "dashboard" */ '@/views/Dashboard.vue'),
        children: [
          {
            path: '/authorize',
            name: 'authorization',
            component: () => import(/* webpackChunkName: "authorization" */ '@/views/Authorization.vue')
          }
        ]
      },
      {
        path: '/login',
        name: 'login',
        component: () => import(/* webpackChunkName: "authn" */ '@/views/Authentication.vue'),
        meta: { public: true }
      },
      {
        path: '/redirect',
        name: 'redirect',
        beforeEnter: handleRedirect,
        component: h('div'), // empty component
        meta: { public: true }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

router.beforeEach(async (to, from) => {
  if (to.name === 'redirect') return;
  const coreStore = useCoreStore();
  await coreStore.restoreOidcSession(to);

  if (!to.meta.public) {
    if (!coreStore.userId || !coreStore.isBackendLoggedIn) {
      return {
        name: 'login'
      };
    }
  }
});

async function handleRedirect() {
  const coreStore = useCoreStore();
  await coreStore.handleRedirect(window.location.href);
  const restoreUrl = localStorage.getItem('restoreUrl');
  localStorage.removeItem('restoreUrl');
  return restoreUrl ? restoreUrl : { name: 'dashboard' };
}

export default router;
