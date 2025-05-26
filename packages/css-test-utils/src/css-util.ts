import {
  type KeyPair,
  createDpopHeader,
  generateDpopKeyPair,
} from '@inrupt/solid-client-authn-core'
import { AppRunner, resolveModulePath } from '@solid/community-server'
import { host, port } from './config'

export function createApp() {
  return new AppRunner().create({
    loaderProperties: {
      mainModulePath: resolveModulePath(''),
      typeChecking: false,
    },
    config: new URL('../src/css-config.json', import.meta.url).pathname,
    shorthand: {
      port,
      loggingLevel: 'off',
      rootFilePath: new URL('../../css-storage-fixture/test', import.meta.url).pathname,
    },
  })
}

export interface ISecretData {
  id: string
  secret: string
}

// From https://communitysolidserver.github.io/CommunitySolidServer/7.x/usage/client-credentials/
export async function getSecret(
  webId: string,
  email: string,
  password: string
): Promise<ISecretData> {
  const index = `${host}/.account/`
  // First we request the account API controls to find out where we can log in
  let indexResponse = await fetch(index)
  let { controls } = await indexResponse.json()

  // And then we log in to the account API
  const loginResponse = await fetch(controls.password.login, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
    }),
  })
  // This authorization value will be used to authenticate in the next step
  const { authorization } = await loginResponse.json()
  // Now that we are logged in, we need to request the updated controls from the server.
  // These will now have more values than in the previous example.
  indexResponse = await fetch(index, {
    headers: { authorization: `CSS-Account-Token ${authorization}` },
  })
  controls = (await indexResponse.json()).controls

  // Here we request the server to generate a token on our account
  const response = await fetch(controls.account.clientCredentials, {
    method: 'POST',
    headers: {
      authorization: `CSS-Account-Token ${authorization}`,
      'content-type': 'application/json',
    },
    // The name field will be used when generating the ID of your token.
    // The WebID field determines which WebID you will identify as when using the token.
    // Only WebIDs linked to your account can be used.
    body: JSON.stringify({
      name: 'my-token',
      webId,
    }),
  })

  // These are the identifier and secret of your token.
  // Store the secret somewhere safe as there is no way to request it again from the server!
  // The `resource` value can be used to delete the token at a later point in time.
  return response.json()
}

export interface ITokenData {
  accessToken: string
  dpopKey: KeyPair
}

// From https://communitysolidserver.github.io/CommunitySolidServer/7.x/usage/client-credentials/
export async function refreshToken({ id, secret }: ISecretData): Promise<ITokenData> {
  const dpopKey = await generateDpopKeyPair()
  const authString = `${encodeURIComponent(id)}:${encodeURIComponent(secret)}`
  const tokenUrl = `${host}/.oidc/token`
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      // The header needs to be in base64 encoding.
      authorization: `Basic ${Buffer.from(authString).toString('base64')}`,
      'content-type': 'application/x-www-form-urlencoded',
      dpop: await createDpopHeader(tokenUrl, 'POST', dpopKey),
    },
    body: 'grant_type=client_credentials&scope=webid',
  })

  const { access_token: accessToken } = await response.json()

  return { accessToken, dpopKey }
}
