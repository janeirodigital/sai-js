import { Memoize } from 'typescript-memoize';
import { LDP } from '@janeirodigital/interop-namespaces';
import { Model, InteropFactory } from '.';

export class DataRegistration extends Model {
  private async bootstrap(): Promise<void> {
    await this.fetchData();
  }

  public static async build(iri: string, factory: InteropFactory): Promise<DataRegistration> {
    const instance = new DataRegistration(iri, factory);
    await instance.bootstrap();
    return instance;
  }

  @Memoize()
  get registeredShapeTree(): string {
    return this.getObject('registeredShapeTree').value;
  }

  @Memoize()
  get contains(): string[] | undefined {
    return this.getObjectsArray('contains', LDP).map((object) => object.value);
  }

  @Memoize()
  get iriPrefix(): string {
    return this.getObject('iriPrefix').value;
  }
}
