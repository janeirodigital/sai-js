import { AgentRegistrationData, CRUDAgentRegistration } from '.';
import { AuthorizationAgentFactory, ReadableSocialAgentRegistration } from '..';

export class CRUDSocialAgentRegistration extends CRUDAgentRegistration {
  public async getReadable(): Promise<ReadableSocialAgentRegistration> {
    return this.factory.readable.socialAgentRegistration(this.iri);
  }

  public static async build(
    iri: string,
    factory: AuthorizationAgentFactory,
    data?: AgentRegistrationData
  ): Promise<CRUDSocialAgentRegistration> {
    const instance = new CRUDSocialAgentRegistration(iri, factory, data);
    await instance.bootstrap();
    return instance;
  }
}
