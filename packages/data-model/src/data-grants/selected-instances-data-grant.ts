import { DatasetCore } from '@rdfjs/types';
import { Memoize } from 'typescript-memoize';
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
  get hasDataInstance(): string[] {
    return this.getObjectsArray('hasDataInstance').map((object) => object.value);
  }

  @Memoize()
  get effectiveAccessMode(): string[] {
    return AbstractDataGrant.calculateEffectiveAccessMode(this);
  }
}