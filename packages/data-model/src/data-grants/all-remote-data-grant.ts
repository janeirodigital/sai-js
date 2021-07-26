import { DatasetCore } from '@rdfjs/types';
import { Memoize } from 'typescript-memoize';
import { AbstractDataGrant, InheritRemoteInstancesDataGrant, DataInstance, InteropFactory, DataGrant } from '..';

export class AllRemoteDataGrant extends AbstractDataGrant {
  hasInheritingGrant: Set<InheritRemoteInstancesDataGrant>;

  hasSourceGrant: Set<DataGrant>;

  public constructor(iri: string, factory: InteropFactory, dataset: DatasetCore) {
    super(iri, factory, dataset);
    this.hasInheritingGrant = new Set();
  }

  public static async build(iri: string, factory: InteropFactory, dataset: DatasetCore): Promise<AllRemoteDataGrant> {
    const instance = new AllRemoteDataGrant(iri, factory, dataset);
    const remoteDataRegistration = await factory.dataRegistration(instance.hasRemoteDataRegistrationIri);
    const remoteAgentDataRegistrations = await Promise.all(
      remoteDataRegistration.hasRemoteAgentDataRegistration.map((remoteDataAgentRegistrationIri) =>
        factory.dataRegistration(remoteDataAgentRegistrationIri)
      )
    );
    const sourceDataGrantIris = remoteAgentDataRegistrations.flatMap(
      (remoteAgentDataRegistration) => remoteAgentDataRegistration.satisfiesDataGrant
    );
    instance.hasSourceGrant = new Set(
      await Promise.all(
        sourceDataGrantIris.map((sourceGrantIri) => factory.dataGrant(sourceGrantIri, instance) as Promise<DataGrant>)
      )
    );
    return instance;
  }

  getDataInstanceIterator(): AsyncIterable<DataInstance> {
    return AbstractDataGrant.createDataInstanceIterotorInRemote(this);
  }

  @Memoize()
  get hasRemoteDataRegistrationIri(): string | undefined {
    return this.getObject('hasRemoteDataRegistration')?.value;
  }
}
