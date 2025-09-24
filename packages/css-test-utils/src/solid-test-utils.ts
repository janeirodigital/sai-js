import { buildAuthenticatedFetch } from '@inrupt/solid-client-authn-core'
import type { App } from '@solid/community-server'
import { type ISecretData, type ITokenData, createApp, getSecret, refreshToken } from './css-util'
import type { Account } from './types'

export class SolidTestUtils {
  app: App
  secret: ISecretData
  token: ITokenData
  authFetch: typeof fetch

  constructor(public account: Account) {}

  async auth(): Promise<void> {
    // Generate secret
    this.secret = await getSecret(this.account.webId, this.account.email, this.account.password)

    // Get token
    this.token = await refreshToken(this.secret)

    // Build authenticated fetch
    this.authFetch = await buildAuthenticatedFetch(this.token.accessToken, {
      dpopKey: this.token.dpopKey,
    })
  }

  async beforeAll(): Promise<void> {
    // Start up the server
    this.app = await createApp()
    await this.app.start()
    await this.auth()
  }

  async afterAll(): Promise<void> {
    await this.app.stop()
  }
}
