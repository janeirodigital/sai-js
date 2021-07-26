import { DatasetCore } from '@rdfjs/types';
import { Memoize } from 'typescript-memoize';
import { AbstractDataGrant, InheritRemoteInstancesDataGrant, DataInstance, InteropFactory, DataGrant } from '..';

export class SelectedRemoteDataGrant extends AbstractDataGrant {
  hasInheritingGrant: Set<InheritRemoteInstancesDataGrant>;

  hasSourceGrant: Set<DataGrant>;

  private constructor(iri: string, factory: InteropFactory, dataset: DatasetCore) {
    super(iri, factory, dataset);
    this.hasInheritingGrant = new Set();
  }

  public static async build(
    iri: string,
    factory: InteropFactory,
    dataset: DatasetCore
  ): Promise<SelectedRemoteDataGrant> {
    const instance = new SelectedRemoteDataGrant(iri, factory, dataset);
    instance.hasSourceGrant = new Set(
      await Promise.all(
        instance.hasDataGrant.map((sourceGrantIri) => factory.dataGrant(sourceGrantIri, instance) as Promise<DataGrant>)
      )
    );
    return instance;
  }

  getDataInstanceIterator(): AsyncIterable<DataInstance> {
    return AbstractDataGrant.createDataInstanceIterotorInRemote(this);
  }

  @Memoize()
  get hasDataGrant(): string[] {
    return this.getObjectsArray('hasDataGrant').map((object) => object.value);
  }
}
