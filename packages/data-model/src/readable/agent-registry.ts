import { DataFactory } from 'n3';
import { getAllMatchingQuads } from '@janeirodigital/interop-utils';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { ReadableResource, ReadableApplicationRegistration, ReadableSocialAgentRegistration } from '.';
import { AuthorizationAgentFactory } from '..';

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
    const pattern = [DataFactory.namedNode(this.iri), INTEROP.hasApplicationRegistration, null, null];
    const iris = getAllMatchingQuads(this.dataset, ...pattern).map((q) => q.object.value);
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
    const pattern = [DataFactory.namedNode(this.iri), INTEROP.hasSocialAgentRegistration, null, null];
    const iris = getAllMatchingQuads(this.dataset, ...pattern).map((q) => q.object.value);
    const { factory } = this;
    return {
      async *[Symbol.asyncIterator]() {
        for (const iri of iris) {
          yield factory.readable.socialAgentRegistration(iri);
        }
      }
    };
  }
}
