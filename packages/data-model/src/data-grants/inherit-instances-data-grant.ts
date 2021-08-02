import { Memoize } from 'typescript-memoize';
import { INTEROP } from 'interop-namespaces';
import { AbstractDataGrant, InheritableDataGrant, DataInstance } from '..';

export class InheritInstancesDataGrant extends AbstractDataGrant {
  inheritsFromGrant: InheritableDataGrant;

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

  public newDataInstance(): DataInstance {
    return AbstractDataGrant.newDataInstance(this);
  }

  @Memoize()
  get inheritsFromGrantIri(): string {
    return this.getObject('inheritsFromGrant').value;
  }

  @Memoize()
  get dataOwner(): string {
    return this.getObject('dataOwner').value;
  }

  @Memoize()
  get iriPrefix(): string {
    return AbstractDataGrant.iriPrefix(this);
  }

  // TODO (elf-pavlik) verify expected access mode
  @Memoize()
  get canCreate(): boolean {
    return this.accessMode.includes(INTEROP.Write.value);
  }
}
