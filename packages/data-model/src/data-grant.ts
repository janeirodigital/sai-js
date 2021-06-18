import { DataFactory } from 'n3';
import { DatasetCore, NamedNode } from '@rdfjs/types';
import { Memoize } from 'typescript-memoize';
import { getOneMatchingQuad } from 'interop-utils';
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

  getDataInstanceIterator(): AsyncIterable<DataInstance> {
    let iterator: AsyncIterable<DataInstance>;
    if (this.scopeOfGrant.equals(INTEROP.AllInstances)) {
      const { factory, hasDataRegistrationIri } = this;
      iterator = {
        async *[Symbol.asyncIterator]() {
          const dataRegistration = await factory.dataRegistration(hasDataRegistrationIri);
          for (const instanceIri of dataRegistration.contains) {
            yield factory.dataInstance(instanceIri);
          }
        }
      };
    } else if (this.scopeOfGrant.equals(INTEROP.SelectedInstances)) {
      // we can't access the data registration :(
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
  get inheritsFromGrantIri(): string | undefined {
    return this.getObject('inheritsFromGrant')?.value;
  }
}
