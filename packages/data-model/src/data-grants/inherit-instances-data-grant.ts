import { DatasetCore } from '@rdfjs/types';
import { Memoize } from 'typescript-memoize';
import { DataGrant, DataInstance, InteropFactory } from '..';

export class InheritInstancesDataGrant extends DataGrant {
  getDataInstanceIterator(): AsyncIterable<DataInstance> {
    const { registeredShapeTree, inheritsFromGrant } = this;
    const parentIterator = inheritsFromGrant.getDataInstanceIterator();
    return {
      async *[Symbol.asyncIterator]() {
        for await (const parentInstance of parentIterator) {
          yield* parentInstance.getChildInstancesIterator(registeredShapeTree);
        }
      }
    };
  }

  @Memoize()
  get inheritsFromGrantIri(): string {
    return this.getObject('inheritsFromGrant').value;
  }
}
