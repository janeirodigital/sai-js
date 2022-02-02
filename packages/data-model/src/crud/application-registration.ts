import { AgentRegistrationData, CRUDAgentRegistration } from '.';
import { AuthorizationAgentFactory } from '..';

export class CRUDApplicationRegistration extends CRUDAgentRegistration {
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
