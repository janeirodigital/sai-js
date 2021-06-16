import { InteropFactory, ApplicationRegistration } from 'interop-data-model';
import { RdfFetch } from 'interop-utils';

interface ApplicationDependencies {
  fetch: RdfFetch;
  // TODO(elf-pavlik) replace by implementing discovery
  applicationRegistrationUrl: string;
}

export class Application {
  fetch: RdfFetch;

  factory: InteropFactory;

  applicationRegistrationUrl: string;

  hasApplicationRegistration: ApplicationRegistration;

  constructor(dependencies: ApplicationDependencies) {
    this.fetch = dependencies.fetch;
    this.factory = new InteropFactory(this.fetch);
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
