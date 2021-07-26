import { DatasetCore } from '@rdfjs/types';
import { Memoize } from 'typescript-memoize';
import { AbstractDataGrant, InheritRemoteInstancesDataGrant, DataInstance, InteropFactory, DataGrant } from '..';

export class AllRemoteFromAgentDataGrant extends AbstractDataGrant {
  hasInheritingGrant: Set<InheritRemoteInstancesDataGrant>;

  hasSourceGrant: Set<DataGrant>;

  public constructor(iri: string, factory: InteropFactory, dataset: DatasetCore) {
    super(iri, factory, dataset);
    this.hasInheritingGrant = new Set();
  }

  public static async build(
    iri: string,
    factory: InteropFactory,
    dataset: DatasetCore
  ): Promise<AllRemoteFromAgentDataGrant> {
    const instance = new AllRemoteFromAgentDataGrant(iri, factory, dataset);
    const remoteAgentDataRegistration = await factory.dataRegistration(instance.hasRemoteDataFromAgentIri);
    instance.hasSourceGrant = new Set(
      await Promise.all(
        remoteAgentDataRegistration.satisfiesDataGrant.map(
          (sourceGrantIri) => factory.dataGrant(sourceGrantIri, instance) as Promise<DataGrant>
        )
      )
    );
    return instance;
  }

  getDataInstanceIterator(): AsyncIterable<DataInstance> {
    return AbstractDataGrant.createDataInstanceIterotorInRemote(this);
  }

  @Memoize()
  get hasRemoteDataFromAgentIri(): string {
    return this.getObject('hasRemoteDataFromAgent').value;
  }
}
