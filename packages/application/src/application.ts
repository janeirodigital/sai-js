import { InteropFactory, ApplicationRegistration, DataOwner } from '@janeirodigital/interop-data-model';
import { RdfFetch, RandomUUID } from '@janeirodigital/interop-utils';

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
   * @returns DataOwner instance for currently logged in user
   */
  get loggedInDataOwner(): DataOwner {
    return this.dataOwners.find((agent) => agent.iri === this.fetch.user);
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
