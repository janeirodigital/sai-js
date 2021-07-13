import { Memoize } from 'typescript-memoize';
import { AbstractDataGrant, DataInstance } from '..';

export class AllRemoteFromAgentDataGrant extends AbstractDataGrant {
  getDataInstanceIterator(): AsyncIterable<DataInstance> {
    const { factory } = this;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const remoteDataGrant = this;
    return {
      async *[Symbol.asyncIterator]() {
        const remoteAgentDataRegistration = await remoteDataGrant.factory.dataRegistration(
          remoteDataGrant.hasRemoteDataFromAgentIri
        );
        for (const dataGrantIri of remoteAgentDataRegistration.satisfiesDataGrant) {
          // eslint-disable-next-line no-await-in-loop
          const dataGrant = await factory.dataGrant(dataGrantIri, remoteDataGrant);
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
