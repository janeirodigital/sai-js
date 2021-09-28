import { DataFactory } from 'n3';
import { getOneMatchingQuad } from '@janeirodigital/interop-utils';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { ReadableResource, AccessGrant, InteropFactory } from '.';

export class ReadableApplicationRegistration extends ReadableResource {
  hasAccessGrant: AccessGrant;

  private async buildAccessGrant(): Promise<void> {
    const quadPattern = [DataFactory.namedNode(this.iri), INTEROP.hasAccessGrant, null, null];
    const accessGrantIri = getOneMatchingQuad(this.dataset, ...quadPattern).object.value;
    this.hasAccessGrant = await this.factory.accessGrant(accessGrantIri);
  }

  private async bootstrap(): Promise<void> {
    await this.fetchData();
    await this.buildAccessGrant();
  }

  public static async build(iri: string, factory: InteropFactory): Promise<ReadableApplicationRegistration> {
    const instance = new ReadableApplicationRegistration(iri, factory);
    await instance.bootstrap();
    return instance;
  }
}
