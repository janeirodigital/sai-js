import { DatasetCore } from '@rdfjs/types';
import { Memoize } from 'typescript-memoize';
import { InheritableDataGrant } from '.';
import { AbstractDataGrant, InheritableRemoteDataGrant, DataInstance, DataGrant, InteropFactory } from '..';

export class InheritRemoteInstancesDataGrant extends AbstractDataGrant {
  inheritsFromGrant: InheritableRemoteDataGrant;

  hasSourceGrant: Set<DataGrant>;

  public static async build(
    iri: string,
    factory: InteropFactory,
    dataset: DatasetCore
  ): Promise<InheritRemoteInstancesDataGrant> {
    const instance = new InheritRemoteInstancesDataGrant(iri, factory, dataset);
    instance.inheritsFromGrant = (await factory.dataGrant(instance.inheritsFromGrantIri)) as InheritableRemoteDataGrant;
    instance.hasSourceGrant = new Set(
      [...instance.inheritsFromGrant.hasSourceGrant].map((sourceGrant) =>
        [...(sourceGrant as InheritableDataGrant).hasInheritingGrant].find(
          (inheritingSourceGrant) => inheritingSourceGrant.registeredShapeTree === instance.registeredShapeTree
        )
      )
    );
    return instance;
  }

  getDataInstanceIterator(): AsyncIterable<DataInstance> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const grant = this;
    const parentIterator = grant.inheritsFromGrant.getDataInstanceIterator();
    return {
      async *[Symbol.asyncIterator]() {
        for await (const parentInstance of parentIterator) {
          yield* parentInstance.getChildInstancesIterator(grant.registeredShapeTree);
        }
      }
    };
  }

  @Memoize()
  get inheritsFromGrantIri(): string {
    return this.getObject('inheritsFromGrant').value;
  }
}
