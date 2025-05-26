import * as effect from '@/effect'
import { fluent } from '@/plugins/fluent'
import { FluentBundle } from '@fluent/bundle'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { PushSubscription } from 'web-push'

function defaultLang(availableLanguages: string[]): string {
  const lang = navigator.language.split('-')[0]
  return availableLanguages.includes(lang) ? lang : 'en'
}

export const useCoreStore = defineStore('core', () => {
  const userId = ref<string | null>(null)
  const availableLanguages = ref<string[]>(import.meta.env.VITE_LANGUAGES.split(','))
  const lang = ref(localStorage.getItem('lang') ?? defaultLang(availableLanguages.value))
  const pushSubscription = ref<PushSubscription | null>(null)

  watch(
    lang,
    async (newLang) => {
      localStorage.setItem('lang', newLang)
      const newMessages = await import(`@/locales/${newLang}.ftl`)
      const newBundle = new FluentBundle(newLang)
      newBundle.addResource(newMessages.default)
      fluent.bundles = [newBundle]
    },
    { immediate: true }
  )

  async function login(webId: string) {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/login`, {
      method: 'POST',
      body: JSON.stringify(webId),
      headers: { 'Content-Type': 'application/json' },
    })

    window.location.href = await response.json()
  }

  async function getPushSubscription(): Promise<void> {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      pushSubscription.value = subscription.toJSON() as PushSubscription
      effect.registerPushSubscription(pushSubscription.value)
    }
  }

  async function enableNotifications() {
    const result = await Notification.requestPermission()
    if (result === 'granted') {
      const registration = await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
        })
      }
      pushSubscription.value = subscription.toJSON() as PushSubscription
      await effect.registerPushSubscription(pushSubscription.value)
    }
    return result
  }

  return {
    userId,
    lang,
    availableLanguages,
    pushSubscription,
    login,
    enableNotifications,
    getPushSubscription,
  }
})
