import { NamedNode } from '@rdfjs/types';
import { Memoize } from 'typescript-memoize';
import { AbstractDataGrant, RemoteDataGrant, InheritableDataGrant, DataInstance } from '..';

export class InheritInstancesDataGrant extends AbstractDataGrant {
  inheritsFromGrant: InheritableDataGrant;

  // TODO (elf-pavlik) reconsider how it is supposed to work with this scope
  viaRemoteDataGrant?: RemoteDataGrant;

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

  @Memoize()
  get effectiveAccessMode(): string[] {
    return AbstractDataGrant.calculateEffectiveAccessMode(this);
  }
}
