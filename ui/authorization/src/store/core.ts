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

class OidcError extends Error {
  constructor(private oidcInfo?: ISessionInfo) {
    super('oidcInfo');
  }
}

export const useCoreStore = defineStore('core', () => {
  const userId = ref<string | null>(null);
  const isBackendLoggedIn = ref(false);
  const redirectUrlForBackend = ref('');
  const lang = ref('en');

  async function login(oidcIssuer: string) {
    const options = {
      clientId: import.meta.env.VITE_APPLICATION_ID,
      oidcIssuer,
      redirectUrl: `${import.meta.env.VITE_BASE_URL}/redirect`
    };
    await oidcLogin(options);
  }

  async function handleRedirect(url: string) {
    const oidcInfo = await handleIncomingRedirect(url);
    if (!oidcInfo?.webId) {
      throw new OidcError(oidcInfo);
    }
    userId.value = oidcInfo.webId;

    // TODO check if backend authenticated
    const backend = useBackend();
    const checkBackendResult = await backend.checkServerSession();
    isBackendLoggedIn.value = checkBackendResult.isLoggedIn;
    redirectUrlForBackend.value = checkBackendResult.redirectUrl ?? '';
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

  return { userId, lang, isBackendLoggedIn, redirectUrlForBackend, login, handleRedirect, restoreOidcSession };
});
