import { InteropFactory } from '..';
import { ReadableResource } from './resource';

export class ReadableClientIdDocument extends ReadableResource {
  get callbackEndpoint(): string | undefined {
    return this.getObject('hasAuthorizationCallbackEndpoint')?.value;
  }

  get hasAccessNeedGroup(): string | undefined {
    return this.getObject('hasAccessNeedGroup')?.value;
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
