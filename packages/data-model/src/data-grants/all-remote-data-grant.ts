import { DatasetCore } from '@rdfjs/types';
import { Memoize } from 'typescript-memoize';
import { DataGrant, DataInstance, InteropFactory } from '..';

export class AllRemoteDataGrant extends DataGrant {
  getDataInstanceIterator(): AsyncIterable<DataInstance> {
    const { factory, hasRemoteDataRegistrationIri } = this;
    return {
      async *[Symbol.asyncIterator]() {
        const remoteDataRegistration = await factory.dataRegistration(hasRemoteDataRegistrationIri);
        for (const remoteDataAgentRegistrationIri of remoteDataRegistration.hasRemoteAgentDataRegistration) {
          const remoteAgentDataRegistration = await factory.dataRegistration(remoteDataAgentRegistrationIri);
          for (const dataGrantIri of remoteAgentDataRegistration.satisfiesDataGrant) {
            const dataGrant = await factory.dataGrant(dataGrantIri);
            yield* dataGrant.getDataInstanceIterator();
          }
        }
      }
    };
  }

  @Memoize()
  get hasRemoteDataRegistrationIri(): string | undefined {
    return this.getObject('hasRemoteDataRegistration')?.value;
  }
}
