import { Memoize } from 'typescript-memoize';
import { LDP } from '@janeirodigital/interop-namespaces';
import { ReadableResource, InteropFactory } from '..';

export class ReadableDataRegistration extends ReadableResource {
  private async bootstrap(): Promise<void> {
    await this.fetchData();
  }

  public static async build(iri: string, factory: InteropFactory): Promise<ReadableDataRegistration> {
    const instance = new ReadableDataRegistration(iri, factory);
    await instance.bootstrap();
    return instance;
  }

  @Memoize()
  get registeredShapeTree(): string {
    return this.getObject('registeredShapeTree').value;
  }

  @Memoize()
  get contains(): string[] {
    return this.getObjectsArray('contains', LDP).map((object) => object.value);
  }

  @Memoize()
  get iriPrefix(): string {
    return this.getObject('iriPrefix').value;
  }
}
