import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  ISessionInfo,
  getDefaultSession,
  handleIncomingRedirect,
  login as oidcLogin
} from '@inrupt/solid-client-authn-browser';
import { useSai } from '@/sai';
import { RouteLocationNormalized } from 'vue-router';

class OidcError extends Error {
  constructor(private oidcInfo?: ISessionInfo) {
    super('oidcInfo');
  }
}

export const useCoreStore = defineStore('core', () => {
  const userId = ref<string | null>(null);
  const isAuthorized = ref(false);
  const authorizationRedirectUri = ref<string | null>(null);

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

    const sai = useSai(oidcInfo.webId);

    isAuthorized.value = await sai.isAuthorized();
  }

  async function authorize() {
    if (!userId.value) {
      throw new Error('no user id');
    }
    const sai = useSai(userId.value);
    window.location.href = await sai.getAuthorizationRedirectUri();
  }

  async function restoreOidcSession(to: RouteLocationNormalized): Promise<void> {
    const oidcSession = getDefaultSession();

    if (!oidcSession.info.isLoggedIn) {
      const restoreUrl = localStorage.getItem('restorePath');
      if (to.name !== 'login' && !restoreUrl) {
        localStorage.setItem('restorePath', to.fullPath);
      }
      const oidcInfo = await oidcSession.handleIncomingRedirect({ restorePreviousSession: true });
      if (oidcInfo?.webId) {
        userId.value = oidcInfo.webId;
      }
    }
  }

  return { userId, isAuthorized, authorizationRedirectUri, login, authorize, handleRedirect, restoreOidcSession };
});
