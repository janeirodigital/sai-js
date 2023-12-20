import { DataFactory } from 'n3';
import { INTEROP, OIDC } from '@janeirodigital/interop-utils';
import { AuthorizationAgentFactory } from '..';
import { CRUDContainer, CRUDApplicationRegistration, CRUDSocialAgentRegistration, CRUDSocialAgentInvitation } from '.';

export class CRUDAgentRegistry extends CRUDContainer {
  factory: AuthorizationAgentFactory;

  async bootstrap(): Promise<void> {
    await this.fetchData();
  }

  public static async build(iri: string, factory: AuthorizationAgentFactory): Promise<CRUDAgentRegistry> {
    const instance = new CRUDAgentRegistry(iri, factory);
    await instance.bootstrap();
    return instance;
  }

  get applicationRegistrations(): AsyncIterable<CRUDApplicationRegistration> {
    const iris = this.getObjectsArray(INTEROP.hasApplicationRegistration).map((object) => object.value);
    const { factory } = this;
    return {
      async *[Symbol.asyncIterator]() {
        for (const iri of iris) {
          yield factory.crud.applicationRegistration(iri);
        }
      }
    };
  }

  get socialAgentRegistrations(): AsyncIterable<CRUDSocialAgentRegistration> {
    const iris = this.getObjectsArray(INTEROP.hasSocialAgentRegistration).map((object) => object.value);
    const { factory } = this;
    return {
      async *[Symbol.asyncIterator]() {
        for (const iri of iris) {
          yield factory.crud.socialAgentRegistration(iri);
        }
      }
    };
  }

  get socialAgentInvitations(): AsyncIterable<CRUDSocialAgentInvitation> {
    const iris = this.getObjectsArray(INTEROP.hasSocialAgentInvitation).map((object) => object.value);
    const { factory } = this;
    return {
      async *[Symbol.asyncIterator]() {
        for (const iri of iris) {
          yield factory.crud.socialAgentInvitation(iri);
        }
      }
    };
  }

  // eslint-disable-next-line consistent-return
  public async findApplicationRegistration(registeredAgent: string): Promise<CRUDApplicationRegistration | undefined> {
    for await (const registration of this.applicationRegistrations) {
      if (registration.registeredAgent === registeredAgent) {
        return this.factory.crud.applicationRegistration(registration.iri);
      }
    }
  }

  // eslint-disable-next-line consistent-return
  public async findSocialAgentRegistration(registeredAgent: string): Promise<CRUDSocialAgentRegistration | undefined> {
    for await (const registration of this.socialAgentRegistrations) {
      if (registration.registeredAgent === registeredAgent) {
        return this.factory.crud.socialAgentRegistration(registration.iri);
      }
    }
  }

  // eslint-disable-next-line consistent-return
  public async findSocialAgentInvitation(capabilityUrl: string): Promise<CRUDSocialAgentInvitation | undefined> {
    for await (const invitation of this.socialAgentInvitations) {
      if (invitation.capabilityUrl === capabilityUrl) {
        return this.factory.crud.socialAgentInvitation(invitation.iri);
      }
    }
  }

  // eslint-disable-next-line consistent-return
  public async findRegistration(
    iri: string
  ): Promise<CRUDApplicationRegistration | CRUDSocialAgentRegistration | undefined> {
    return (await this.findApplicationRegistration(iri)) || this.findSocialAgentRegistration(iri);
  }

  public async addApplicationRegistration(registeredAgent: string): Promise<CRUDApplicationRegistration> {
    const existing = await this.findApplicationRegistration(registeredAgent);
    if (existing) {
      throw new Error(`Application Registration for ${registeredAgent} already exists`);
    }
    const registration = await this.factory.crud.applicationRegistration(this.iriForContained(true), {
      registeredAgent
    });
    // get data from ClientID document
    try {
      const clientIdDocument = await this.factory.readable.clientIdDocument(registeredAgent);
      const props = [
        OIDC.client_name,
        OIDC.logo_uri,
        INTEROP.hasAccessNeedGroup,
        INTEROP.hasAuthorizationCallbackEndpoint
      ];
      for (const prop of props) {
        const quad = clientIdDocument.getQuad(clientIdDocument.node, prop);
        if (quad) registration.dataset.add(quad);
      }
    } catch (error) {
      console.error('failed to get data from Client ID document', error);
    }
    await registration.create();
    // link to created application registration
    const quad = DataFactory.quad(
      DataFactory.namedNode(this.iri),
      INTEROP.hasApplicationRegistration,
      DataFactory.namedNode(registration.iri)
    );
    // update itself to store changes
    await this.addStatement(quad);
    return registration;
  }

  public async addSocialAgentRegistration(
    registeredAgent: string,
    prefLabel: string,
    note?: string
  ): Promise<CRUDSocialAgentRegistration> {
    const existing = await this.findSocialAgentRegistration(registeredAgent);
    if (existing) {
      throw new Error(`Social Agent Registration for ${registeredAgent} already exists`);
    }
    const registration = await this.factory.crud.socialAgentRegistration(this.iriForContained(true), false, {
      registeredAgent,
      prefLabel,
      note
    });
    await registration.create();
    // link to created social agent registration
    const quad = DataFactory.quad(
      DataFactory.namedNode(this.iri),
      INTEROP.hasSocialAgentRegistration,
      DataFactory.namedNode(registration.iri)
    );
    // update itself to store changes
    await this.addStatement(quad);
    return registration;
  }

  public async addSocialAgentInvitation(
    capabilityUrl: string,
    prefLabel: string,
    note?: string
  ): Promise<CRUDSocialAgentInvitation> {
    const existing = await this.findSocialAgentInvitation(capabilityUrl);
    if (existing) {
      throw new Error(`Social Agent Invitation with ${capabilityUrl} already exists`);
    }
    const invitation = await this.factory.crud.socialAgentInvitation(this.iriForContained(), {
      capabilityUrl,
      prefLabel,
      note
    });
    await invitation.update();
    // link to created social agent invitation
    const quad = DataFactory.quad(
      DataFactory.namedNode(this.iri),
      INTEROP.hasSocialAgentInvitation,
      DataFactory.namedNode(invitation.iri)
    );
    // update itself to store changes
    await this.addStatement(quad);
    return invitation;
  }
}
