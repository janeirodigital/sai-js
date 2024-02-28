// Composables
import { h } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { useCoreStore, OidcError } from '@/store/core';

async function handleRedirect() {
  const coreStore = useCoreStore();
  try {
    await coreStore.handleRedirect(window.location.href);
  } catch (err) {
    console.error('handleRedirect', err);
    if (err instanceof OidcError) {
      return { name: 'login' };
    }
    throw err;
  }
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
          },
          {
            path: '/settings',
            name: 'settings',
            component: () => import(/* webpackChunkName: "settings" */ '@/views/Settings.vue')
          },
          {
            path: '/invitation',
            name: 'invitation',
            component: () => import(/* webpackChunkName: "invitation" */ '@/views/Invitation.vue')
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
        component: () => import(/* webpackChunkName: "authn" */ '@/views/Authentication.vue')
      },
      {
        path: '/redirect',
        name: 'redirect',
        beforeEnter: handleRedirect,
        component: h('div') // empty component
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

router.beforeEach(async (to) => {
  if (['redirect', 'login'].includes(to.name as string)) return undefined;

  const coreStore = useCoreStore();

  await coreStore.restoreOidcSession(to);

  if (!coreStore.userId || !coreStore.isBackendLoggedIn) {
    return {
      name: 'login'
    };
  }
  return undefined;
});

export default router;
