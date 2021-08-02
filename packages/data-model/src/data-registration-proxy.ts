import { DataGrant, DataInstance, SelectedInstancesDataGrant } from '.';

export class DataRegistrationProxy {
  constructor(private grant: DataGrant) {}

  public get dataInstances(): AsyncIterable<DataInstance> {
    return this.grant.getDataInstanceIterator();
  }

  public newDataInstance(): DataInstance {
    if (this.grant instanceof SelectedInstancesDataGrant) {
      throw new Error('cannot create instances based on SelectedInstances data grant');
    } else {
      return this.grant.newDataInstance();
    }
  }
}
