import { Memoize } from 'typescript-memoize';
import { DataGrant, DataInstance, DataInstanceIteratorOptions } from '..';

export class AllInstancesDataGrant extends DataGrant {
  getDataInstanceIterator(options?: DataInstanceIteratorOptions): AsyncIterable<DataInstance> {
    const { factory, hasDataRegistrationIri, accessMode } = this;
    const accessOptions = options ? Object.assign(options, { accessMode }) : { accessMode };
    return {
      async *[Symbol.asyncIterator]() {
        const dataRegistration = await factory.dataRegistration(hasDataRegistrationIri);
        for (const instanceIri of dataRegistration.contains) {
          yield factory.dataInstance(instanceIri, accessOptions);
        }
      }
    };
  }

  @Memoize()
  get hasDataRegistrationIri(): string {
    return this.getObject('hasDataRegistration').value;
  }
}
