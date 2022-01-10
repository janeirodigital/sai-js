import { DatasetCore } from '@rdfjs/types';
import { DataFactory } from 'n3';
import { Memoize } from 'typescript-memoize';
import { ACL, INTEROP } from '@janeirodigital/interop-namespaces';
import { getAllMatchingQuads } from '@janeirodigital/interop-utils';
import { AbstractDataGrant, InheritableDataGrant, InheritInstancesDataGrant } from '.';
import { DataInstance, InteropFactory } from '..';

export class AllInstancesDataGrant extends InheritableDataGrant {
  public static async build(
    iri: string,
    factory: InteropFactory,
    dataset: DatasetCore
  ): Promise<AllInstancesDataGrant> {
    const instance = new AllInstancesDataGrant(iri, factory, dataset);
    await instance.bootstrap();
    return instance;
  }

  getDataInstanceIterator(): AsyncIterable<DataInstance> {
    const { factory } = this;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const dataGrant = this;
    return {
      async *[Symbol.asyncIterator]() {
        const dataRegistration = await factory.readable.dataRegistration(dataGrant.hasDataRegistration);
        for (const instanceIri of dataRegistration.contains) {
          yield factory.dataInstance(instanceIri, dataGrant);
        }
      }
    };
  }

  public newDataInstance(): DataInstance {
    return AbstractDataGrant.newDataInstance(this);
  }

  // TODO (elf-pavlik) verify expected access mode
  // https://github.com/solid/data-interoperability-panel/issues/159
  @Memoize()
  get canCreate(): boolean {
    return this.accessMode.includes(ACL.Write.value);
  }
}
