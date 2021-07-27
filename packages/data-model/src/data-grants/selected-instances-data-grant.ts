import { DatasetCore } from '@rdfjs/types';
import { DataFactory } from 'n3';
import { Memoize } from 'typescript-memoize';
import { INTEROP } from 'interop-namespaces';
import { getAllMatchingQuads } from 'interop-utils';
import {
  AbstractDataGrant,
  InheritableRemoteDataGrant,
  InheritInstancesDataGrant,
  DataInstance,
  InteropFactory
} from '..';

export class SelectedInstancesDataGrant extends AbstractDataGrant {
  viaRemoteDataGrant?: InheritableRemoteDataGrant;

  hasInheritingGrant: Set<InheritInstancesDataGrant>;

  public constructor(
    iri: string,
    factory: InteropFactory,
    dataset: DatasetCore,
    viaRemoteDataGrant: InheritableRemoteDataGrant
  ) {
    super(iri, factory, dataset);
    this.viaRemoteDataGrant = viaRemoteDataGrant;
    this.hasInheritingGrant = new Set();
  }

  public static async build(
    iri: string,
    factory: InteropFactory,
    dataset: DatasetCore,
    viaRemoteDataGrant: InheritableRemoteDataGrant
  ): Promise<SelectedInstancesDataGrant> {
    const instance = new SelectedInstancesDataGrant(iri, factory, dataset, viaRemoteDataGrant);
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
  get hasInheritingGrantIriList(): string[] {
    const quadPattern = [null, INTEROP.inheritsFromGrant, DataFactory.namedNode(this.iri)];
    return getAllMatchingQuads(this.dataset, ...quadPattern).map((quad) => quad.subject.value);
  }

  @Memoize()
  get hasDataInstance(): string[] {
    return this.getObjectsArray('hasDataInstance').map((object) => object.value);
  }

  @Memoize()
  get effectiveAccessMode(): string[] {
    return AbstractDataGrant.calculateEffectiveAccessMode(this);
  }
}
