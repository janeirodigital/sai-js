import { DatasetCore } from '@rdfjs/types';
import { Memoize } from 'typescript-memoize';
import { DataGrant, DataInstance, InteropFactory } from '..';

export class AllInstancesDataGrant extends DataGrant {
  getDataInstanceIterator(): AsyncIterable<DataInstance> {
    const { factory, hasDataRegistrationIri } = this;
    return {
      async *[Symbol.asyncIterator]() {
        const dataRegistration = await factory.dataRegistration(hasDataRegistrationIri);
        for (const instanceIri of dataRegistration.contains) {
          yield factory.dataInstance(instanceIri);
        }
      }
    };
  }

  @Memoize()
  get hasDataRegistrationIri(): string {
    return this.getObject('hasDataRegistration').value;
  }
}
