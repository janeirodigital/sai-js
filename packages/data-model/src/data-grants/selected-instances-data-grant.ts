import { Memoize } from 'typescript-memoize';
import { DataGrant, DataInstance, DataInstanceIteratorOptions } from '..';

export class SelectedInstancesDataGrant extends DataGrant {
  getDataInstanceIterator(options?: DataInstanceIteratorOptions): AsyncIterable<DataInstance> {
    const { factory, hasDataInstance, accessMode } = this;
    const accessOptions = options ? Object.assign(options, { accessMode }) : { accessMode };
    return {
      async *[Symbol.asyncIterator]() {
        for (const instanceIri of hasDataInstance) {
          yield factory.dataInstance(instanceIri, accessOptions);
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
