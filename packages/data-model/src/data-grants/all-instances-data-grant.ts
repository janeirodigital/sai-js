import { DatasetCore } from '@rdfjs/types';
import { DataFactory } from 'n3';
import { Memoize } from 'typescript-memoize';
import { INTEROP } from 'interop-namespaces';
import { getAllMatchingQuads } from 'interop-utils';
import { AbstractDataGrant, InheritInstancesDataGrant, DataInstance, InteropFactory } from '..';

export class AllInstancesDataGrant extends AbstractDataGrant {
  hasInheritingGrant: Set<InheritInstancesDataGrant>;

  public constructor(iri: string, factory: InteropFactory, dataset: DatasetCore) {
    super(iri, factory, dataset);
    this.hasInheritingGrant = new Set();
  }

  public static async build(
    iri: string,
    factory: InteropFactory,
    dataset: DatasetCore
  ): Promise<AllInstancesDataGrant> {
    const instance = new AllInstancesDataGrant(iri, factory, dataset);
    for (const inheritingGrantIri of instance.hasInheritingGrantIriList) {
      // eslint-disable-next-line no-await-in-loop
      const inheritingGrant = (await factory.dataGrant(inheritingGrantIri)) as InheritInstancesDataGrant;
      inheritingGrant.inheritsFromGrant = instance;
      instance.hasInheritingGrant.add(inheritingGrant);
    }
    return instance;
  }

  getDataInstanceIterator(): AsyncIterable<DataInstance> {
    const { factory } = this;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const dataGrant = this;
    return {
      async *[Symbol.asyncIterator]() {
        const dataRegistration = await factory.dataRegistration(dataGrant.hasDataRegistrationIri);
        for (const instanceIri of dataRegistration.contains) {
          yield factory.dataInstance(instanceIri, dataGrant);
        }
      }
    };
  }

  public newDataInstance(): DataInstance {
    return AbstractDataGrant.newDataInstance(this);
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

  // TODO (elf-pavlik) verify expected access mode
  @Memoize()
  get canCreate(): boolean {
    return this.accessMode.includes(INTEROP.Write.value);
  }
}
