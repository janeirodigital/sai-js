/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

import EventDetails from '@/components/EventDetails.vue'
import EventForm from '@/components/EventForm.vue'
import EventList from '@/components/EventList.vue'
// Composables
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'list', component: EventList },
  { path: '/event', name: 'details', component: EventDetails },
  { path: '/form', name: 'form', component: EventForm },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
