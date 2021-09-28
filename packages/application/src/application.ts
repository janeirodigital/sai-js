import { DataFactory } from 'n3';
import { DatasetCore } from '@rdfjs/types';
import { InteropFactory, ApplicationRegistration, DataOwner } from '@janeirodigital/interop-data-model';
import {
  WhatwgFetch,
  RdfFetch,
  fetchWrapper,
  getOneMatchingQuad,
  getApplicationRegistrationIri
} from '@janeirodigital/interop-utils';
import { INTEROP } from '@janeirodigital/interop-namespaces';

interface ApplicationDependencies {
  fetch: WhatwgFetch;
  randomUUID(): string;
}

export class Application {
  factory: InteropFactory;

  fetch: RdfFetch;

  webId: string;

  hasAuthorizationAgent: string;

  hasApplicationRegistration: ApplicationRegistration;

  constructor(webId: string, dependencies: ApplicationDependencies) {
    this.webId = webId;
    this.fetch = fetchWrapper(dependencies.fetch);
    this.factory = new InteropFactory({ fetch: this.fetch, randomUUID: dependencies.randomUUID });
  }

  private async bootstrap(): Promise<void> {
    this.hasAuthorizationAgent = await this.discoverAuthorizationAgent();
    const applicationRegistrationIri = await this.discoverRegistration();
    if (applicationRegistrationIri) {
      this.hasApplicationRegistration = await this.factory.applicationRegistration(applicationRegistrationIri);
    } else {
      throw new Error('support planned in the future');
      // TODO (elf-pavlik) implement flow with Authorization Agent
      // https://github.com/janeirodigital/sai-js/issues/15
      // this.initiateRegistration(this.hasAuthorizationAgent)
    }
  }

  async discoverAuthorizationAgent(): Promise<string> {
    const userDataset: DatasetCore = await (await this.fetch(this.webId)).dataset();
    const authorizationAgentPattern = [DataFactory.namedNode(this.webId), INTEROP.hasAuthorizationAgent, null];
    return getOneMatchingQuad(userDataset, ...authorizationAgentPattern).object.value;
  }

  async discoverRegistration(): Promise<string> {
    const response = await this.fetch(this.hasAuthorizationAgent, { method: 'HEAD' });
    return getApplicationRegistrationIri(response.headers.get('Link'));
  }

  static async build(webId: string, dependencies: ApplicationDependencies): Promise<Application> {
    const application = new Application(webId, dependencies);
    await application.bootstrap();
    return application;
  }

  /**
   * Array of DataOwner instances out of all the data application can access.
   * @public
   */
  get dataOwners(): DataOwner[] {
    return this.hasApplicationRegistration.hasAccessGrant.hasDataGrant.reduce((acc, grant) => {
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
