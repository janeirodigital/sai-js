import { OIDC } from '@janeirodigital/interop-namespaces';
import { InteropFactory } from '..';
import { ReadableResource } from './resource';

export class ReadableClientIdDocument extends ReadableResource {
  get callbackEndpoint(): string | undefined {
    return this.getObject('hasAuthorizationCallbackEndpoint')?.value;
  }

  get hasAccessNeedGroup(): string | undefined {
    return this.getObject('hasAccessNeedGroup')?.value;
  }

  get clientName(): string | undefined {
    return this.getObject(OIDC.client_name).value;
  }

  get logoUri(): string | undefined {
    return this.getObject(OIDC.logo_uri).value;
  }

  protected async bootstrap(): Promise<void> {
    await this.fetchData();
  }

  static async build(iri: string, factory: InteropFactory): Promise<ReadableClientIdDocument> {
    const instance = new ReadableClientIdDocument(iri, factory);
    await instance.bootstrap();
    return instance;
  }
}
