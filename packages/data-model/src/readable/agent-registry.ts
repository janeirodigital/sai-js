import { INTEROP } from '@janeirodigital/interop-namespaces';
import { ReadableResource, ReadableApplicationRegistration, ReadableSocialAgentRegistration } from '.';
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

  get applicationRegistrations(): AsyncIterable<ReadableApplicationRegistration> {
    const iris = this.getObjectsArray(INTEROP.hasApplicationRegistration).map((object) => object.value);
    const { factory } = this;
    return {
      async *[Symbol.asyncIterator]() {
        for (const iri of iris) {
          yield factory.readable.applicationRegistration(iri);
        }
      }
    };
  }

  get socialAgentRegistrations(): AsyncIterable<ReadableSocialAgentRegistration> {
    const iris = this.getObjectsArray(INTEROP.hasSocialAgentRegistration).map((object) => object.value);
    const { factory } = this;
    return {
      async *[Symbol.asyncIterator]() {
        for (const iri of iris) {
          yield factory.readable.socialAgentRegistration(iri);
        }
      }
    };
  }

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
