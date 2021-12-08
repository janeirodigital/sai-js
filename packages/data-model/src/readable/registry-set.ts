import { ReadableResource, ReadableAgentRegistry, ReadableAccessConsentRegistry } from '.';
import { AuthorizationAgentFactory, CRUDDataRegistry } from '..';

export class ReadableRegistrySet extends ReadableResource {
  factory: AuthorizationAgentFactory;

  hasAccessConsentRegistry: ReadableAccessConsentRegistry;

  hasAgentRegistry: ReadableAgentRegistry;

  hasDataRegistry: CRUDDataRegistry[];

  private async bootstrap(): Promise<void> {
    await this.fetchData();
    this.hasAccessConsentRegistry = await this.factory.readable.accessConsentRegistry(
      this.getObject('hasAccessConsentRegistry').value
    );
    this.hasAgentRegistry = await this.factory.readable.agentRegistry(this.getObject('hasAgentRegistry').value);
    const dataRegistryIris = this.getObjectsArray('hasDataRegistry').map((object) => object.value);
    this.hasDataRegistry = await Promise.all(dataRegistryIris.map((iri) => this.factory.readable.dataRegistry(iri)));
  }

  public static async build(iri: string, factory: AuthorizationAgentFactory): Promise<ReadableRegistrySet> {
    const instance = new ReadableRegistrySet(iri, factory);
    await instance.bootstrap();
    return instance;
  }
}
