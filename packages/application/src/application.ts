import { InteropFactory, ApplicationRegistration } from 'interop-data-model';
import { RdfFetch, RandomUUID } from 'interop-utils';

interface ApplicationDependencies {
  fetch: RdfFetch;
  randomUUID: RandomUUID;
  // TODO(elf-pavlik) replace by implementing discovery
  applicationRegistrationUrl: string;
}

export class Application {
  factory: InteropFactory;

  applicationRegistrationUrl: string;

  hasApplicationRegistration: ApplicationRegistration;

  constructor(dependencies: ApplicationDependencies) {
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
}
