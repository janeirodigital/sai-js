import { DataFactory } from 'n3';
import { Memoize } from 'typescript-memoize';
import { getOneMatchingQuad } from '@janeirodigital/interop-utils';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { ReadableAccessGrant, InteropFactory, ReadableContainer } from '..';

export class ReadableApplicationRegistration extends ReadableContainer {
  hasAccessGrant: ReadableAccessGrant;

  private async buildAccessGrant(): Promise<void> {
    const quadPattern = [DataFactory.namedNode(this.iri), INTEROP.hasAccessGrant, null, null];
    const accessGrantIri = getOneMatchingQuad(this.dataset, ...quadPattern).object.value;
    this.hasAccessGrant = await this.factory.readable.accessGrant(accessGrantIri);
  }

  private async bootstrap(): Promise<void> {
    await this.fetchData();
    await this.buildAccessGrant();
  }

  @Memoize()
  get registeredAgent(): string {
    return this.getObject('registeredAgent').value;
  }

  public static async build(iri: string, factory: InteropFactory): Promise<ReadableApplicationRegistration> {
    const instance = new ReadableApplicationRegistration(iri, factory);
    await instance.bootstrap();
    return instance;
  }
}
