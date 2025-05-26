import { ACL } from '@janeirodigital/interop-utils'
import type { DatasetCore } from '@rdfjs/types'
import { Memoize } from 'typescript-memoize'
import { AbstractDataGrant, InheritableDataGrant } from '.'
import type { DataInstance, InteropFactory } from '..'

export class AllFromRegistryDataGrant extends InheritableDataGrant {
  public static async build(
    iri: string,
    factory: InteropFactory,
    dataset: DatasetCore
  ): Promise<AllFromRegistryDataGrant> {
    const instance = new AllFromRegistryDataGrant(iri, factory, dataset)
    await instance.bootstrap()
    return instance
  }

  getDataInstanceIterator(): AsyncIterable<DataInstance> {
    const { factory } = this
    const dataGrant = this
    return {
      async *[Symbol.asyncIterator]() {
        const dataRegistration = await factory.readable.dataRegistration(
          dataGrant.hasDataRegistration
        )
        for (const instanceIri of dataRegistration.contains) {
          yield factory.dataInstance(instanceIri, dataGrant)
        }
      },
    }
  }

  public async newDataInstance(): Promise<DataInstance> {
    return AbstractDataGrant.newDataInstance(this)
  }

  // TODO (elf-pavlik) verify expected access mode
  // https://github.com/solid/data-interoperability-panel/issues/159
  @Memoize()
  get canCreate(): boolean {
    return this.accessMode.includes(ACL.Write.value)
  }
}
