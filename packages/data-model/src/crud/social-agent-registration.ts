import { INTEROP } from '@janeirodigital/interop-namespaces';
import { discoverAuthorizationAgent, discoverAgentRegistration, WhatwgFetch } from '@janeirodigital/interop-utils';
import { AgentRegistrationData, CRUDAgentRegistration } from '.';
import { AuthorizationAgentFactory } from '..';

export class CRUDSocialAgentRegistration extends CRUDAgentRegistration {
  reciprocalRegistration?: CRUDSocialAgentRegistration;

  reciprocal: boolean;

  public constructor(
    iri: string,
    factory: AuthorizationAgentFactory,
    reciprocal: boolean,
    data?: AgentRegistrationData
  ) {
    super(iri, factory, data);
    this.reciprocal = reciprocal;
  }

  // TODO (elf-pavlik) recover if reciprocal can't be fetched
  private async buildReciprocalRegistration(): Promise<void> {
    const reciprocalRegistrationIri = this.getObject(INTEROP.reciprocalRegistration)?.value;
    if (reciprocalRegistrationIri) {
      this.reciprocalRegistration = await this.factory.crud.socialAgentRegistration(reciprocalRegistrationIri, true);
    }
  }

  // TODO: adjust factory to also expose WhatwgFetch
  public async discoverReciprocal(fetch: WhatwgFetch): Promise<string | null> {
    const authrizationAgentIri = await discoverAuthorizationAgent(this.registeredAgent, this.factory.fetch);
    if (!authrizationAgentIri) return null;
    return discoverAgentRegistration(authrizationAgentIri, fetch);
  }

  protected async bootstrap(): Promise<void> {
    await super.bootstrap();
    if (!this.reciprocal) {
      await this.buildReciprocalRegistration();
    }
  }

  public static async build(
    iri: string,
    factory: AuthorizationAgentFactory,
    reciprocal: boolean,
    data?: AgentRegistrationData
  ): Promise<CRUDSocialAgentRegistration> {
    const instance = new CRUDSocialAgentRegistration(iri, factory, reciprocal, data);
    await instance.bootstrap();
    return instance;
  }
}
