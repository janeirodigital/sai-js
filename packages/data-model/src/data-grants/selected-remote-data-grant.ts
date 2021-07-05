import { DatasetCore } from '@rdfjs/types';
import { Memoize } from 'typescript-memoize';
import { DataGrant, DataInstance, InteropFactory } from '..';

export class SelectedRemoteDataGrant extends DataGrant {
  getDataInstanceIterator(): AsyncIterable<DataInstance> {
    const { factory, hasDataGrant } = this;
    return {
      async *[Symbol.asyncIterator]() {
        for (const dataGrantIri of hasDataGrant) {
          const dataGrant = await factory.dataGrant(dataGrantIri);
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
