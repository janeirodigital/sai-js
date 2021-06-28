import { DataFactory } from 'n3';
import { DatasetCore, NamedNode } from '@rdfjs/types';
import { Memoize } from 'typescript-memoize';
import { INTEROP } from 'interop-namespaces';
import { Model, AccessReceipt, DataInstance, InteropFactory } from '.';

export class DataGrant extends Model {
  inheritsFromGrant?: DataGrant;

  constructor(iri: string, factory: InteropFactory, accessReceipt: AccessReceipt) {
    super(iri, factory);
    if (accessReceipt) {
      this.dataset = this.extractSubset(accessReceipt);
    }
  }

  private async bootstrap(): Promise<void> {
    if (!this.dataset) {
      await this.fetchData();
    }
  }

  public static async build(iri: string, factory: InteropFactory, accessReceipt?: AccessReceipt): Promise<DataGrant> {
    const instance = new DataGrant(iri, factory, accessReceipt);
    await instance.bootstrap();
    return instance;
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

  private createAllRemoteFromAgentIterator(): AsyncIterable<DataInstance> {
    const { factory, hasRemoteDataFromAgentIri } = this;
    return {
      async *[Symbol.asyncIterator]() {
        const remoteAgentDataRegistration = await factory.dataRegistration(hasRemoteDataFromAgentIri);
        for (const dataGrantIri of remoteAgentDataRegistration.satisfiesDataGrant) {
          const dataGrant = await factory.dataGrant(dataGrantIri);
          yield* dataGrant.getDataInstanceIterator();
        }
      }
    };
  }

  getDataInstanceIterator(): AsyncIterable<DataInstance> {
    let iterator: AsyncIterable<DataInstance>;
    if (this.scopeOfGrant.equals(INTEROP.AllInstances)) {
      iterator = this.createAllInstancesIterator();
    } else if (this.scopeOfGrant.equals(INTEROP.SelectedInstances)) {
      // TODO
    } else if (this.scopeOfGrant.equals(INTEROP.InheritInstances)) {
      iterator = this.createInheritInstancesIterator();
    } else if (this.scopeOfGrant.equals(INTEROP.AllRemoteFromAgent)) {
      iterator = this.createAllRemoteFromAgentIterator();
    } else if (this.scopeOfGrant.equals(INTEROP.AllRemote)) {
      // TODO
    } else if (this.scopeOfGrant.equals(INTEROP.SelectedRemote)) {
      // TODO
    }
    return iterator;
  }

  private extractSubset(accessReceipt: AccessReceipt): DatasetCore {
    const quadPattern = [DataFactory.namedNode(this.iri), null, null, DataFactory.namedNode(accessReceipt.iri)];
    return accessReceipt.dataset.match(...quadPattern);
  }

  // scopes: AllInstances, SelectedInstances, InheritInstances
  @Memoize()
  get hasDataRegistrationIri(): string | undefined {
    return this.getObject('hasDataRegistration')?.value;
  }

  // scopes: AllRemoteFromAgent
  @Memoize()
  get hasRemoteDataFromAgentIri(): string | undefined {
    return this.getObject('hasRemoteDataFromAgent')?.value;
  }

  @Memoize()
  get scopeOfGrant(): NamedNode {
    return this.getObject('scopeOfGrant');
  }

  @Memoize()
  get registeredShapeTree(): string {
    return this.getObject('registeredShapeTree').value;
  }

  // scopes: InheritInstances
  @Memoize()
  get inheritsFromGrantIri(): string | undefined {
    return this.getObject('inheritsFromGrant')?.value;
  }
}
