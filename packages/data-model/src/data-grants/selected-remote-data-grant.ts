import { DatasetCore } from '@rdfjs/types';
import { Memoize } from 'typescript-memoize';
import { AbstractDataGrant, InheritRemoteInstancesDataGrant, DataInstance, InteropFactory } from '..';

export class SelectedRemoteDataGrant extends AbstractDataGrant {
  hasInheritingGrant: Set<InheritRemoteInstancesDataGrant>;

  public constructor(iri: string, factory: InteropFactory, dataset: DatasetCore) {
    super(iri, factory, dataset);
    this.hasInheritingGrant = new Set();
  }

  getDataInstanceIterator(): AsyncIterable<DataInstance> {
    const { factory } = this;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const remoteDataGrant = this;
    return {
      async *[Symbol.asyncIterator]() {
        for (const dataGrantIri of remoteDataGrant.hasDataGrant) {
          // eslint-disable-next-line no-await-in-loop
          const dataGrant = await factory.dataGrant(dataGrantIri, remoteDataGrant);
          yield* dataGrant.getDataInstanceIterator();
        }
      }
    };
  }

  @Memoize()
  get hasDataGrant(): string[] {
    return this.getObjectsArray('hasDataGrant').map((object) => object.value);
  }
}
