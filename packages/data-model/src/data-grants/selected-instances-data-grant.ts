import { Memoize } from 'typescript-memoize';
import { DataGrant, DataInstance } from '..';

export class SelectedInstancesDataGrant extends DataGrant {
  getDataInstanceIterator(): AsyncIterable<DataInstance> {
    const { factory, hasDataInstance } = this;
    return {
      async *[Symbol.asyncIterator]() {
        for (const instanceIri of hasDataInstance) {
          yield factory.dataInstance(instanceIri);
        }
      }
    };
  }

  @Memoize()
  get hasDataRegistrationIri(): string {
    return this.getObject('hasDataRegistration').value;
  }

  @Memoize()
  get hasDataInstance(): string[] {
    return this.getObjectsArray('hasDataInstance').map((object) => object.value);
  }
}
