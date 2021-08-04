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

  // Remote Agent Data Registration
  @Memoize()
  get satisfiesDataGrant(): string[] | undefined {
    const result = this.getObjectsArray('satisfiesDataGrant').map((object) => object.value);
    return result.length ? result : undefined;
  }

  // Data Registration
  @Memoize()
  get contains(): string[] | undefined {
    return this.getObjectsArray('contains', LDP).map((object) => object.value);
  }

  // Remote Data Registration
  @Memoize()
  get hasRemoteAgentDataRegistration(): string[] | undefined {
    return this.getObjectsArray('hasRemoteAgentDataRegistration').map((object) => object.value);
  }

  @Memoize()
  get iriPrefix(): string {
    return this.getObject('iriPrefix').value;
  }
}
