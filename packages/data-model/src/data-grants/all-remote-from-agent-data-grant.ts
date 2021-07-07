import { Memoize } from 'typescript-memoize';
import { DataGrant, DataInstance, DataInstanceIteratorOptions } from '..';

export class AllRemoteFromAgentDataGrant extends DataGrant {
  getDataInstanceIterator(options?: DataInstanceIteratorOptions): AsyncIterable<DataInstance> {
    const { factory, hasRemoteDataFromAgentIri, accessMode } = this;
    return {
      async *[Symbol.asyncIterator]() {
        const remoteAgentDataRegistration = await factory.dataRegistration(hasRemoteDataFromAgentIri);
        for (const dataGrantIri of remoteAgentDataRegistration.satisfiesDataGrant) {
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
  get hasRemoteDataFromAgentIri(): string {
    return this.getObject('hasRemoteDataFromAgent').value;
  }
}
