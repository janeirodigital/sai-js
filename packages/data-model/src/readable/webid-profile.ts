import { INTEROP } from '@janeirodigital/interop-namespaces';
import { InteropFactory } from '..';
import { ReadableResource } from './resource';

export class ReadableWebIdProfile extends ReadableResource {
  get hasAccessInbox(): string | undefined {
    return this.getObject(INTEROP.hasAccessInbox)?.value;
  }

  get hasRegistrySet(): string | undefined {
    return this.getObject(INTEROP.hasRegistrySet)?.value;
  }

  private async bootstrap(): Promise<void> {
    await this.fetchData();
  }

  public static async build(iri: string, factory: InteropFactory): Promise<ReadableWebIdProfile> {
    const instance = new ReadableWebIdProfile(iri, factory);
    await instance.bootstrap();
    return instance;
  }
}
