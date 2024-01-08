import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  ISessionInfo,
  getDefaultSession,
  handleIncomingRedirect,
  login as oidcLogin
} from '@inrupt/solid-client-authn-browser';
import type { RouteLocationNormalized } from 'vue-router';
import { useBackend } from '@/backend';

const backend = useBackend();

export class OidcError extends Error {
  constructor(private oidcInfo?: ISessionInfo) {
    super('oidcInfo');
  }
}

export const useCoreStore = defineStore('core', () => {
  const userId = ref<string | null>(null);
  const isBackendLoggedIn = ref(false);
  const redirectUrlForBackend = ref('');
  const lang = ref('en');
  const availableLanguages = ref(['en', 'pl']);
  const pushSubscription = ref<PushSubscription | null>(null);

  async function login(oidcIssuer: string) {
    const options = {
      clientId: import.meta.env.VITE_APPLICATION_ID,
      oidcIssuer,
      redirectUrl: `${import.meta.env.VITE_BASE_URL}/redirect`
    };
    await oidcLogin(options);
  }

  async function getPushSubscription() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      pushSubscription.value = subscription;
    }
    return backend.checkServerSession(subscription ?? undefined);
  }

  async function handleRedirect(url: string) {
    const oidcInfo = await handleIncomingRedirect(url);
    if (!oidcInfo?.webId) {
      throw new OidcError(oidcInfo);
    }
    userId.value = oidcInfo.webId;

    // TODO check if backend authenticated
    const loginStatus = await getPushSubscription();
    isBackendLoggedIn.value = loginStatus.isLoggedIn;
    redirectUrlForBackend.value = loginStatus.completeRedirectUrl ?? '';
  }

  async function restoreOidcSession(to: RouteLocationNormalized): Promise<void> {
    const oidcSession = getDefaultSession();

    if (!oidcSession.info.isLoggedIn) {
      if (to.name !== 'login') localStorage.setItem('restoreUrl', to.fullPath);
      // if session can be restored it will redirect to oidcIssuer, which will return back to `/redirect`
      const oidcInfo = await oidcSession.handleIncomingRedirect({ restorePreviousSession: true });
      if (oidcInfo?.webId) {
        userId.value = oidcInfo.webId;
      }
    }
  }

  async function enableNotifications() {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
        });
      }
      pushSubscription.value = subscription;
      await backend.checkServerSession(subscription);
    }
    return result;
  }

  return {
    userId,
    lang,
    availableLanguages,
    isBackendLoggedIn,
    redirectUrlForBackend,
    pushSubscription,
    login,
    handleRedirect,
    restoreOidcSession,
    enableNotifications,
    getPushSubscription
  };
});
