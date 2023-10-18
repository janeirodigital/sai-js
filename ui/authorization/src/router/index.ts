// Composables
import { h } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { useCoreStore } from '@/store/core';

async function handleRedirect() {
  const coreStore = useCoreStore();
  await coreStore.handleRedirect(window.location.href);
  const restoreUrl = localStorage.getItem('restoreUrl');
  localStorage.removeItem('restoreUrl');
  return restoreUrl || { name: 'dashboard' };
}

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
            path: '/applications',
            name: 'application-list',
            component: () => import(/* webpackChunkName: "application-list" */ '@/views/ApplicationList.vue')
          },
          {
            path: '/social-agents',
            name: 'social-agent-list',
            component: () => import(/* webpackChunkName: "social-agent-list" */ '@/views/SocialAgentList.vue')
          },
          {
            path: '/data-registries',
            name: 'data-registry-list',
            component: () => import(/* webpackChunkName: "data-registry-list" */ '@/views/DataRegistryList.vue')
          }
        ]
      },
      {
        path: '/authorize',
        name: 'authorization',
        component: () => import(/* webpackChunkName: "authorization" */ '@/views/Authorization.vue')
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

router.beforeEach(async (to) => {
  if (to.name === 'redirect') return undefined;
  const coreStore = useCoreStore();
  await coreStore.restoreOidcSession(to);

  if (!to.meta.public) {
    if (!coreStore.userId || !coreStore.isBackendLoggedIn) {
      return {
        name: 'login'
      };
    }
  }
  return undefined;
});

export default router;
