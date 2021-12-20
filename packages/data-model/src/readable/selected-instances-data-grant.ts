import { DatasetCore } from '@rdfjs/types';
import { DataFactory } from 'n3';
import { Memoize } from 'typescript-memoize';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { getAllMatchingQuads } from '@janeirodigital/interop-utils';
import { AbstractDataGrant, InheritInstancesDataGrant } from '.';
import { InteropFactory, DataInstance } from '..';

export class SelectedInstancesDataGrant extends AbstractDataGrant {
  hasInheritingGrant: Set<InheritInstancesDataGrant>;

  canCreate = false;

  public constructor(iri: string, factory: InteropFactory, dataset: DatasetCore) {
    super(iri, factory, dataset);
    this.hasInheritingGrant = new Set();
  }

  public static async build(
    iri: string,
    factory: InteropFactory,
    dataset: DatasetCore
  ): Promise<SelectedInstancesDataGrant> {
    const instance = new SelectedInstancesDataGrant(iri, factory, dataset);
    await instance.bootstrap();
    return instance;
  }

  // TODO: deduplicate all instances data grant
  private async bootstrap(): Promise<void> {
    for (const inheritingGrantIri of this.hasInheritingGrantIriList) {
      // eslint-disable-next-line no-await-in-loop
      const inheritingGrant = (await this.factory.readable.dataGrant(inheritingGrantIri)) as InheritInstancesDataGrant;
      inheritingGrant.inheritsFromGrant = this;
      this.hasInheritingGrant.add(inheritingGrant);
    }
  }

  getDataInstanceIterator(): AsyncIterable<DataInstance> {
    const { factory } = this;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const dataGrant = this;
    return {
      async *[Symbol.asyncIterator]() {
        for (const instanceIri of dataGrant.hasDataInstance) {
          yield factory.dataInstance(instanceIri, dataGrant);
        }
      }
    };
  }

  @Memoize()
  get hasDataRegistrationIri(): string {
    return this.getObject('hasDataRegistration').value;
  }

  @Memoize()
  get dataOwner(): string {
    return this.getObject('dataOwner').value;
  }

  @Memoize()
  get iriPrefix(): string {
    return AbstractDataGrant.iriPrefix(this);
  }

  @Memoize()
  get hasInheritingGrantIriList(): string[] {
    const quadPattern = [null, INTEROP.inheritsFromGrant, DataFactory.namedNode(this.iri)];
    return getAllMatchingQuads(this.dataset, ...quadPattern).map((quad) => quad.subject.value);
  }

  @Memoize()
  get hasDataInstance(): string[] {
    return this.getObjectsArray('hasDataInstance').map((object) => object.value);
  }
}
