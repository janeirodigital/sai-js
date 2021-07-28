import { InteropFactory, ApplicationRegistration, DataGrant, RemoteDataGrant, SocialAgent } from 'interop-data-model';
import { RdfFetch, RandomUUID } from 'interop-utils';
import { INTEROP } from 'interop-namespaces';

interface ApplicationDependencies {
  fetch: RdfFetch;
  randomUUID: RandomUUID;
  // TODO(elf-pavlik) replace by implementing discovery
  applicationRegistrationUrl: string;
}

export class Application {
  factory: InteropFactory;

  fetch: RdfFetch;

  applicationRegistrationUrl: string;

  hasApplicationRegistration: ApplicationRegistration;

  constructor(dependencies: ApplicationDependencies) {
    this.fetch = dependencies.fetch;
    this.factory = new InteropFactory({ fetch: dependencies.fetch, randomUUID: dependencies.randomUUID });
    this.applicationRegistrationUrl = dependencies.applicationRegistrationUrl;
  }

  private async bootstrap(): Promise<void> {
    this.hasApplicationRegistration = await this.factory.applicationRegistration(this.applicationRegistrationUrl);
  }

  static async build(dependencies: ApplicationDependencies): Promise<Application> {
    const application = new Application(dependencies);
    await application.bootstrap();
    return application;
  }

  // TODO (elf-pavlik) verify exact access to user's webid from solid-auth-fetcher
  /**
   * @returns SocialAgent instance for currently logged in user
   */
  get loggedInDataOwner(): SocialAgent {
    return this.dataOwners.find((agent) => agent.iri === this.fetch.user);
  }

  /**
   * Array of SocialAgent instances out of all the data application can access.
   * @public
   */
  get dataOwners(): SocialAgent[] {
    return this.hasApplicationRegistration.hasAccessReceipt.hasDataGrant.reduce((acc, grant) => {
      const sourceGrants: DataGrant[] = [];
      const sourceGrantScopeValues = [
        INTEROP.AllInstances.value,
        INTEROP.SelectedInstances.value,
        INTEROP.InheritInstances.value
      ];
      if (sourceGrantScopeValues.includes(grant.scopeOfGrant.value)) {
        sourceGrants.push(grant as DataGrant);
      } else {
        for (const sourceGrant of (grant as RemoteDataGrant).hasSourceGrant) {
          sourceGrants.push(sourceGrant as DataGrant);
        }
      }
      for (const sourceGrant of sourceGrants) {
        let owner: SocialAgent = acc.find((agent) => agent.iri === sourceGrant.dataOwner);
        if (!owner) {
          owner = new SocialAgent(sourceGrant.dataOwner);
          acc.push(owner);
        }
        owner.issuedGrants.push(sourceGrant);
      }
      return acc;
    }, []);
  }
}
