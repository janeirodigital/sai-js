import { INTEROP } from '@janeirodigital/interop-namespaces';
import { DataFactory } from 'n3';
import { AuthorizationAgentFactory } from '..';
import { CRUDResource } from './resource';

export type AgentRegistrationData = {
  registeredAgent: string;
  hasAccessGrant: string;
};

export class CRUDAgentRegistration extends CRUDResource {
  data?: AgentRegistrationData;

  factory: AuthorizationAgentFactory;

  constructor(iri: string, factory: AuthorizationAgentFactory, data?: AgentRegistrationData) {
    super(iri, factory, data);
  }

  get hasAccessGrant(): string {
    return this.getObject('hasAccessGrant').value;
  }

  set hasAccessGrant(iri: string) {
    const subject = DataFactory.namedNode(this.iri);
    const predicate = INTEROP.hasAccessGrant;
    const object = DataFactory.namedNode(iri);
    // delete existing quad
    this.deleteQuad('hasAccessGrant');
    // add new quad
    this.dataset.add(DataFactory.quad(subject, predicate, object));
  }

  private datasetFromData(): void {
    const props: (keyof AgentRegistrationData)[] = ['registeredAgent', 'hasAccessGrant'];
    for (const prop of props) {
      this.dataset.add(
        DataFactory.quad(DataFactory.namedNode(this.iri), INTEROP[prop], DataFactory.namedNode(this.data[prop]))
      );
    }
  }

  protected async bootstrap(): Promise<void> {
    if (!this.data) {
      await this.fetchData();
    } else {
      this.datasetFromData();
    }
  }

  public static async build(
    iri: string,
    factory: AuthorizationAgentFactory,
    data?: AgentRegistrationData
  ): Promise<CRUDAgentRegistration> {
    const instance = new CRUDAgentRegistration(iri, factory, data);
    await instance.bootstrap();
    return instance;
  }
}
