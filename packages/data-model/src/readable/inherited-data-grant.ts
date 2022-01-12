import { Memoize } from 'typescript-memoize';
import { ACL } from '@janeirodigital/interop-namespaces';
import { AbstractDataGrant, AllFromRegistryDataGrant, SelectedFromRegistryDataGrant } from '.';
import { DataInstance } from '..';

export class InheritedDataGrant extends AbstractDataGrant {
  inheritsFromGrant: AllFromRegistryDataGrant | SelectedFromRegistryDataGrant;

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

  public newDataInstance(parent: DataInstance): DataInstance {
    return AbstractDataGrant.newDataInstance(this, parent);
  }

  @Memoize()
  get inheritsFromGrantIri(): string {
    return this.getObject('inheritsFromGrant').value;
  }

  // TODO (elf-pavlik) verify expected access mode
  // https://github.com/solid/data-interoperability-panel/issues/159
  @Memoize()
  get canCreate(): boolean {
    return this.accessMode.includes(ACL.Write.value);
  }
}
