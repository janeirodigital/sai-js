import * as effect from '@/effect'
import { useCoreStore } from '@/store/core'
// Composables
import { createRouter, createWebHistory } from 'vue-router'

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
            component: () =>
              import(/* webpackChunkName: "application-list" */ '@/views/ApplicationList.vue'),
          },
          {
            path: '/social-agents',
            name: 'social-agent-list',
            component: () =>
              import(/* webpackChunkName: "social-agent-list" */ '@/views/SocialAgentList.vue'),
          },
          {
            path: '/data-registries',
            name: 'data-registry-list',
            component: () =>
              import(/* webpackChunkName: "data-registry-list" */ '@/views/DataRegistryList.vue'),
          },
          {
            path: '/settings',
            name: 'settings',
            component: () => import(/* webpackChunkName: "settings" */ '@/views/Settings.vue'),
          },
          {
            path: '/invitation',
            name: 'invitation',
            component: () => import(/* webpackChunkName: "invitation" */ '@/views/Invitation.vue'),
          },
        ],
      },
      {
        path: '/authorize',
        name: 'authorization',
        component: () =>
          import(/* webpackChunkName: "authorization" */ '@/views/Authorization.vue'),
      },
      {
        path: '/login',
        name: 'login',
        component: () => import(/* webpackChunkName: "authn" */ '@/views/Authentication.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  if (to.name === 'login') return undefined

  const coreStore = useCoreStore()

  if (coreStore.userId) {
    return
  }
  try {
    const webId = await effect.getWebId()
    if (webId) {
      coreStore.userId = webId
    } else {
      return { name: 'login' }
    }
  } catch {
    return { name: 'login' }
  }
})

export default router
