import { DatasetCore } from '@rdfjs/types';
import { Memoize } from 'typescript-memoize';
import { AbstractDataGrant, InheritRemoteInstancesDataGrant, DataInstance, InteropFactory } from '..';

export class AllRemoteDataGrant extends AbstractDataGrant {
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
        const remoteDataRegistration = await factory.dataRegistration(remoteDataGrant.hasRemoteDataRegistrationIri);
        for (const remoteDataAgentRegistrationIri of remoteDataRegistration.hasRemoteAgentDataRegistration) {
          // eslint-disable-next-line no-await-in-loop
          const remoteAgentDataRegistration = await factory.dataRegistration(remoteDataAgentRegistrationIri);
          for (const dataGrantIri of remoteAgentDataRegistration.satisfiesDataGrant) {
            // eslint-disable-next-line no-await-in-loop
            const dataGrant = await factory.dataGrant(dataGrantIri, remoteDataGrant);
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
