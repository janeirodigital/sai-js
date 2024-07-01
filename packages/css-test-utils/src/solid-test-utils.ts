import type { App } from '@solid/community-server';
import { createApp, getSecret, refreshToken, ISecretData, ITokenData } from './css-util';
import { buildAuthenticatedFetch } from '@inrupt/solid-client-authn-core';

export class SolidTestUtils {
  app: App;
  secret: ISecretData;
  token: ITokenData;
  authFetch: typeof fetch;

  constructor(
    private webId: string,
    private email: string,
    private password: string
  ) {}

  async beforeAll(): Promise<void> {
    // Start up the server
    this.app = await createApp();
    await this.app.start();

    // Generate secret
    this.secret = await getSecret(this.webId, this.email, this.password);

    // Get token
    this.token = await refreshToken(this.secret);

    // Build authenticated fetch
    this.authFetch = await buildAuthenticatedFetch(this.token.accessToken, {
      dpopKey: this.token.dpopKey
    });
  }

  async afterAll(): Promise<void> {
    await this.app.stop();
  }
}
