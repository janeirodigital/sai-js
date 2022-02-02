import { INTEROP } from '@janeirodigital/interop-namespaces';
import { ReadableResource } from '.';
import { AuthorizationAgentFactory, CRUDApplicationRegistration, CRUDSocialAgentRegistration } from '..';

export class ReadableAgentRegistry extends ReadableResource {
  factory: AuthorizationAgentFactory;

  async bootstrap(): Promise<void> {
    await this.fetchData();
  }

  public static async build(iri: string, factory: AuthorizationAgentFactory): Promise<ReadableAgentRegistry> {
    const instance = new ReadableAgentRegistry(iri, factory);
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
  public async findRegistration(
    iri: string
  ): Promise<CRUDApplicationRegistration | CRUDSocialAgentRegistration | undefined> {
    for await (const registration of this.applicationRegistrations) {
      if (registration.registeredAgent === iri) {
        return this.factory.crud.applicationRegistration(registration.iri);
      }
    }
    for await (const registration of this.socialAgentRegistrations) {
      if (registration.registeredAgent === iri) {
        return this.factory.crud.socialAgentRegistration(registration.iri);
      }
    }
  }
}
