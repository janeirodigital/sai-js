import { Store, DataFactory } from 'n3';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { AuthorizationAgentFactory, CRUDApplicationRegistration, CRUDSocialAgentRegistration } from '..';
import { CRUDContainer } from '.';

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

  // eslint-disable-next-line consistent-return
  public async findApplicationRegistration(iri: string): Promise<CRUDApplicationRegistration | undefined> {
    for await (const registration of this.applicationRegistrations) {
      if (registration.registeredAgent === iri) {
        return this.factory.crud.applicationRegistration(registration.iri);
      }
    }
  }

  // eslint-disable-next-line consistent-return
  public async findSocialAgentRegistration(iri: string): Promise<CRUDSocialAgentRegistration | undefined> {
    for await (const registration of this.socialAgentRegistrations) {
      if (registration.registeredAgent === iri) {
        return this.factory.crud.socialAgentRegistration(registration.iri);
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
    const registration = await this.factory.crud.applicationRegistration(this.iriForContained(true), {
      registeredAgent
    });
    await registration.create();
    // link to created application registration
    const quad = DataFactory.quad(
      DataFactory.namedNode(this.iri),
      INTEROP.hasApplicationRegistration,
      DataFactory.namedNode(registration.iri)
    );
    // update itself to store changes
    await this.addPatch(new Store([quad]));
    return registration;
  }

  public async addSocialAgentRegistration(
    registeredAgent: string,
    prefLabel: string,
    note?: string
  ): Promise<CRUDSocialAgentRegistration> {
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
    await this.addPatch(new Store([quad]));
    return registration;
  }
}
