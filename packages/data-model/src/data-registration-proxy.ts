import { type DataGrant, type DataInstance, SelectedFromRegistryDataGrant } from '.'
import { InheritedDataGrant } from './readable'

export class ReadableDataRegistrationProxy {
  constructor(public grant: DataGrant) {}

  public get iri(): string {
    return this.grant.hasDataRegistration
  }

  public get dataInstances(): AsyncIterable<DataInstance> {
    return this.grant.getDataInstanceIterator()
  }

  public async newDataInstance(parent?: DataInstance): Promise<DataInstance> {
    if (this.grant instanceof SelectedFromRegistryDataGrant) {
      throw new Error('cannot create instances based on SelectedFromRegistry data grant')
    }
    if (!parent && this.grant instanceof InheritedDataGrant) {
      throw new Error('cannot create instances based on Inherited data grant without parent')
    }
    return this.grant.newDataInstance(parent)
  }
}
