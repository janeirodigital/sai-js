import { DataGrant, DataInstance, SelectedFromRegistryDataGrant } from '.';
import { InheritedDataGrant } from './readable';

export class ReadableDataRegistrationProxy {
  constructor(private grant: DataGrant) {}

  public get dataInstances(): AsyncIterable<DataInstance> {
    return this.grant.getDataInstanceIterator();
  }

  public newDataInstance(parent?: DataInstance): DataInstance {
    if (this.grant instanceof SelectedFromRegistryDataGrant) {
      throw new Error('cannot create instances based on SelectedFromRegistry data grant');
    } else if (!parent && this.grant instanceof InheritedDataGrant) {
      throw new Error('cannot create instances based on Inherited data grant without parent');
    }
    return this.grant.newDataInstance(parent);
  }
}
