import { Memoize } from 'typescript-memoize';
import { DataGrant, DataInstance, DataInstanceIteratorOptions } from '..';

export class SelectedRemoteDataGrant extends DataGrant {
  getDataInstanceIterator(options?: DataInstanceIteratorOptions): AsyncIterable<DataInstance> {
    const { factory, hasDataGrant, accessMode } = this;
    return {
      async *[Symbol.asyncIterator]() {
        for (const dataGrantIri of hasDataGrant) {
          const dataGrant = await factory.dataGrant(dataGrantIri);
          yield* dataGrant.getDataInstanceIterator({
            accessMode: DataGrant.getLowestCommonAccessMode(accessMode, dataGrant.accessMode),
            childAccessMode: options?.childAccessMode
          });
        }
      }
    };
  }

  @Memoize()
  get hasDataGrant(): string[] {
    return this.getObjectsArray('hasDataGrant').map((object) => object.value);
  }
}
