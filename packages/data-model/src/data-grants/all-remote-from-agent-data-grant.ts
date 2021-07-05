import { DatasetCore } from '@rdfjs/types';
import { Memoize } from 'typescript-memoize';
import { DataGrant, DataInstance, InteropFactory } from '..';

export class AllRemoteFromAgentDataGrant extends DataGrant {
  getDataInstanceIterator(): AsyncIterable<DataInstance> {
    const { factory, hasRemoteDataFromAgentIri } = this;
    return {
      async *[Symbol.asyncIterator]() {
        const remoteAgentDataRegistration = await factory.dataRegistration(hasRemoteDataFromAgentIri);
        for (const dataGrantIri of remoteAgentDataRegistration.satisfiesDataGrant) {
          const dataGrant = await factory.dataGrant(dataGrantIri);
          yield* dataGrant.getDataInstanceIterator();
        }
      }
    };
  }

  @Memoize()
  get hasRemoteDataFromAgentIri(): string {
    return this.getObject('hasRemoteDataFromAgent').value;
  }
}
