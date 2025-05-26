import { OIDC, parseJsonld } from '@janeirodigital/interop-utils'
import type { InteropFactory } from '..'
import { ReadableResource } from './resource'

export class ReadableClientIdDocument extends ReadableResource {
  get callbackEndpoint(): string | undefined {
    return this.getObject('hasAuthorizationCallbackEndpoint')?.value
  }

  get hasAccessNeedGroup(): string | undefined {
    return this.getObject('hasAccessNeedGroup')?.value
  }

  get clientName(): string | undefined {
    return this.getObject(OIDC.client_name).value
  }

  get logoUri(): string | undefined {
    return this.getObject(OIDC.logo_uri).value
  }

  protected async bootstrap(): Promise<void> {
    await this.fetchData()
  }

  static async build(iri: string, factory: InteropFactory): Promise<ReadableClientIdDocument> {
    const instance = new ReadableClientIdDocument(iri, factory)
    await instance.bootstrap()
    return instance
  }

  protected async fetchData(): Promise<void> {
    const response = await this.fetch.raw(this.iri, {
      headers: { Accept: 'application/ld+json' },
    })
    this.dataset = await parseJsonld(await response.text(), response.url)
  }
}
