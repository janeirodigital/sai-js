import { INTEROP, RDFS } from '@janeirodigital/interop-utils';
import { InteropFactory } from '..';
import { ReadableResource } from './resource';

export class ReadableWebIdProfile extends ReadableResource {
  get hasRegistrySet(): string | undefined {
    return this.getObject(INTEROP.hasRegistrySet)?.value;
  }

  get label(): string | undefined {
    return this.getObject(RDFS.label)?.value;
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
