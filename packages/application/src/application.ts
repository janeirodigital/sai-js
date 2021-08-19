import { DataFactory } from 'n3';
import { DatasetCore } from '@rdfjs/types';
import { InteropFactory, ApplicationRegistration, DataOwner } from '@janeirodigital/interop-data-model';
import {
  RdfFetch,
  fetchWrapper,
  getOneMatchingQuad,
  getApplicationRegistrationIri
} from '@janeirodigital/interop-utils';
import { INTEROP } from '@janeirodigital/interop-namespaces';

interface ApplicationDependencies {
  fetch: RdfFetch;
  randomUUID(): string;
}

export class Application {
  factory: InteropFactory;

  fetch: RdfFetch;

  webId: string;

  clientId: string;

  authorizationAgent: string;

  hasApplicationRegistration: ApplicationRegistration;

  constructor(webId: string, clientId: string, dependencies: ApplicationDependencies) {
    this.webId = webId;
    this.clientId = clientId;
    this.fetch = fetchWrapper(dependencies.fetch);
    this.factory = new InteropFactory({ fetch: dependencies.fetch, randomUUID: dependencies.randomUUID });
  }

  private async bootstrap(): Promise<void> {
    this.authorizationAgent = await this.discoverAuthorizationAgent();
    const applicationRegistrationIri = await this.discoverRegistration();
    if (applicationRegistrationIri) {
      this.hasApplicationRegistration = await this.factory.applicationRegistration(applicationRegistrationIri);
    } else {
      throw new Error('support planned in the future');
      // TODO (elf-pavlik) implement flow with Authorization Agent
      // this.initiateRegistration(this.authorizationAgent, this.clientId)
    }
  }

  async discoverAuthorizationAgent(): Promise<string> {
    const userDataset: DatasetCore = await (await this.fetch(this.webId)).dataset();
    const authorizationAgentPattern = [DataFactory.namedNode(this.webId), INTEROP.authorizationAgent, null];
    return getOneMatchingQuad(userDataset, ...authorizationAgentPattern).object.value;
  }

  async discoverRegistration(): Promise<string> {
    const response = await this.fetch(this.authorizationAgent, { method: 'HEAD' });
    return getApplicationRegistrationIri(response.headers.get('Link'));
  }

  static async build(webId: string, clientId: string, dependencies: ApplicationDependencies): Promise<Application> {
    const application = new Application(webId, clientId, dependencies);
    await application.bootstrap();
    return application;
  }

  /**
   * Array of DataOwner instances out of all the data application can access.
   * @public
   */
  get dataOwners(): DataOwner[] {
    return this.hasApplicationRegistration.hasAccessReceipt.hasDataGrant.reduce((acc, grant) => {
      let owner: DataOwner = acc.find((agent) => agent.iri === grant.dataOwner);
      if (!owner) {
        owner = new DataOwner(grant.dataOwner);
        acc.push(owner);
      }
      owner.issuedGrants.push(grant);
      return acc;
    }, []);
  }
}
