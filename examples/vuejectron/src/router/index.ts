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
        path: '/',
        component: () => import(/* webpackChunkName: "main" */ '@/views/Main.vue'),
        children: [
          {
            path: '/',
            name: 'dashboard',
            component: () => import(/* webpackChunkName: "dashboard" */ '@/views/Dashboard.vue')
          },
          {
            path: '/project',
            name: 'project',
            component: () => import(/* webpackChunkName: "project" */ '@/views/Project.vue')
          },
          {
            path: '/agent',
            name: 'agent',
            component: () => import(/* webpackChunkName: "agent" */ '@/views/Agent.vue')
          }
        ]
      },
      {
        path: '/login',
        name: 'login',
        component: () => import(/* webpackChunkName: "authn" */ '@/views/Authn.vue'),
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
  if (to.name === 'redirect') return;
  const coreStore = useCoreStore();
  await coreStore.restoreOidcSession(to);

  if (!to.meta.public) {
    if (!coreStore.userId || !coreStore.isAuthorized) {
      return {
        name: 'login'
      };
    }
  }
});

async function handleRedirect() {
  const coreStore = useCoreStore();
  await coreStore.handleRedirect(window.location.href);
  const restoreUrl = localStorage.getItem('restorePath');
  localStorage.removeItem('restorePath');
  const defaultRoute = { name: 'agent', query: { agent: coreStore.userId } };
  return restoreUrl ? restoreUrl : defaultRoute;
}

router.afterEach((to, from) => {
  let direction = 'none';

  if ((from.name === 'dashboard' && to.name === 'agent') || (from.name === 'agent' && to.name === 'project')) {
    direction = 'left';
  }

  if ((from.name === 'agent' && to.name === 'dashboard') || (from.name === 'project' && to.name === 'agent')) {
    direction = 'right';
  }

  to.meta.transition = direction;
});

export default router;
