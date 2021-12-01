import { AgentRegistrationData, CRUDAgentRegistration } from '.';
import { AuthorizationAgentFactory, ReadableApplicationRegistration } from '..';

export class CRUDApplicationRegistration extends CRUDAgentRegistration {
  public async getReadable(): Promise<ReadableApplicationRegistration> {
    return this.factory.readable.applicationRegistration(this.iri);
  }

  public static async build(
    iri: string,
    factory: AuthorizationAgentFactory,
    data?: AgentRegistrationData
  ): Promise<CRUDApplicationRegistration> {
    const instance = new CRUDApplicationRegistration(iri, factory, data);
    await instance.bootstrap();
    return instance;
  }
}
