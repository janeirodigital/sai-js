import { Memoize } from 'typescript-memoize';
import { AbstractDataGrant, InheritableRemoteDataGrant, DataInstance } from '..';

export class InheritRemoteInstancesDataGrant extends AbstractDataGrant {
  inheritsFromGrant: InheritableRemoteDataGrant;

  getDataInstanceIterator(): AsyncIterable<DataInstance> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const grant = this;
    const parentIterator = grant.inheritsFromGrant.getDataInstanceIterator();
    return {
      async *[Symbol.asyncIterator]() {
        for await (const parentInstance of parentIterator) {
          yield* parentInstance.getChildInstancesIterator(grant.registeredShapeTree);
        }
      }
    };
  }

  @Memoize()
  get inheritsFromGrantIri(): string {
    return this.getObject('inheritsFromGrant').value;
  }
}
