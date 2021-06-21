import { DataFactory } from 'n3';
import { DatasetCore, NamedNode } from '@rdfjs/types';
import { Memoize } from 'typescript-memoize';
import { INTEROP } from 'interop-namespaces';
import { Model, AccessReceipt, DataInstance, InteropFactory } from '.';

export class DataGrant extends Model {
  accessReceipt: AccessReceipt;

  inheritsFromGrant?: DataGrant;

  constructor(iri: string, factory: InteropFactory, accessReceipt: AccessReceipt) {
    super(iri, factory);
    this.accessReceipt = accessReceipt;
    this.dataset = this.extractSubset();
  }

  private createAllInstancesIterator(): AsyncIterable<DataInstance> {
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

  private createInheritInstancesIterator(): AsyncIterable<DataInstance> {
    const { factory, registeredShapeTree, inheritsFromGrant } = this;
    const parentIterator = inheritsFromGrant.getDataInstanceIterator();
    return {
      async *[Symbol.asyncIterator]() {
        for await (const parentInstance of parentIterator) {
          const referencesList = await parentInstance.getReferencesListForShapeTree(registeredShapeTree);
          for (const childInstanceIri of referencesList.references) {
            yield factory.dataInstance(childInstanceIri);
          }
        }
      }
    };
  }

  getDataInstanceIterator(): AsyncIterable<DataInstance> {
    let iterator: AsyncIterable<DataInstance>;
    if (this.scopeOfGrant.equals(INTEROP.AllInstances)) {
      iterator = this.createAllInstancesIterator();
    } else if (this.scopeOfGrant.equals(INTEROP.SelectedInstances)) {
      // we can't access the data registration :(
    } else if (this.scopeOfGrant.equals(INTEROP.InheritInstances)) {
      iterator = this.createInheritInstancesIterator();
    }
    return iterator;
  }

  private extractSubset(): DatasetCore {
    const quadPattern = [DataFactory.namedNode(this.iri), null, null, DataFactory.namedNode(this.accessReceipt.iri)];
    return this.accessReceipt.dataset.match(...quadPattern);
  }

  @Memoize()
  get hasDataRegistrationIri(): string {
    return this.getObject('hasDataRegistration').value;
  }

  @Memoize()
  get scopeOfGrant(): NamedNode {
    return this.getObject('scopeOfGrant');
  }

  @Memoize()
  get registeredShapeTree(): string {
    return this.getObject('registeredShapeTree').value;
  }

  @Memoize()
  get inheritsFromGrantIri(): string | undefined {
    return this.getObject('inheritsFromGrant')?.value;
  }
}
