import { AuthorizationAgentFactory } from '..';
import { CRUDResource, CRUDDataRegistry, CRUDAgentRegistry, CRUDAuthorizationRegistry } from '.';

export class CRUDRegistrySet extends CRUDResource {
  factory: AuthorizationAgentFactory;

  hasAuthorizationRegistry: CRUDAuthorizationRegistry;

  hasAgentRegistry: CRUDAgentRegistry;

  hasDataRegistry: CRUDDataRegistry[];

  private async bootstrap(): Promise<void> {
    await this.fetchData();
    this.hasAuthorizationRegistry = await this.factory.crud.authorizationRegistry(
      this.getObject('hasAuthorizationRegistry').value
    );
    this.hasAgentRegistry = await this.factory.crud.agentRegistry(this.getObject('hasAgentRegistry').value);
    const dataRegistryIris = this.getObjectsArray('hasDataRegistry').map((object) => object.value);
    this.hasDataRegistry = await Promise.all(dataRegistryIris.map((iri) => this.factory.crud.dataRegistry(iri)));
  }

  public static async build(iri: string, factory: AuthorizationAgentFactory): Promise<CRUDRegistrySet> {
    const instance = new CRUDRegistrySet(iri, factory);
    await instance.bootstrap();
    return instance;
  }
}
