import { INTEROP } from '@janeirodigital/interop-namespaces';
import { DataFactory } from 'n3';
import { AuthorizationAgentFactory, ReadableAccessGrant } from '..';
import { CRUDContainer } from './container';

export type AgentRegistrationData = {
  registeredAgent: string;
  hasAccessGrant?: string;
};

export abstract class CRUDAgentRegistration extends CRUDContainer {
  data?: AgentRegistrationData;

  factory: AuthorizationAgentFactory;

  accessGrant?: ReadableAccessGrant;

  constructor(iri: string, factory: AuthorizationAgentFactory, data?: AgentRegistrationData) {
    super(iri, factory, data);
  }

  // TODO: change to avoid stale access grant
  protected async buildAccessGrant(): Promise<void> {
    if (this.hasAccessGrant) {
      this.accessGrant = await this.factory.readable.accessGrant(this.hasAccessGrant);
    }
  }

  get registeredAgent(): string {
    return this.getObject('registeredAgent').value;
  }

  get hasAccessGrant(): string | undefined {
    return this.getObject('hasAccessGrant')?.value;
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

  protected datasetFromData(): void {
    const props: (keyof AgentRegistrationData)[] = ['registeredAgent', 'hasAccessGrant'];
    for (const prop of props) {
      if (this.data[prop]) {
        this.dataset.add(
          DataFactory.quad(DataFactory.namedNode(this.iri), INTEROP[prop], DataFactory.namedNode(this.data[prop]))
        );
      }
    }
  }
}
