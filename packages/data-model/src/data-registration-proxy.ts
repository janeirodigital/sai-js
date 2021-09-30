import { DataGrant, DataInstance, SelectedInstancesDataGrant } from '.';
import { InheritInstancesDataGrant } from './readable';

export class ReadableDataRegistrationProxy {
  constructor(private grant: DataGrant) {}

  public get dataInstances(): AsyncIterable<DataInstance> {
    return this.grant.getDataInstanceIterator();
  }

  public newDataInstance(parent?: DataInstance): DataInstance {
    if (this.grant instanceof SelectedInstancesDataGrant) {
      throw new Error('cannot create instances based on SelectedInstances data grant');
    } else if (!parent && this.grant instanceof InheritInstancesDataGrant) {
      throw new Error('cannot create instances based on InheritInstances data grant without parent');
    }
    return this.grant.newDataInstance(parent);
  }
}
