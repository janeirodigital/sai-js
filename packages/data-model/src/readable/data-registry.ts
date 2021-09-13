import { Memoize } from 'typescript-memoize';
import { ReadableDataRegistration, ReadableResource } from '.';
import { AuthorizationAgentFactory } from '..';

export class ReadableDataRegistry extends ReadableResource {
  factory: AuthorizationAgentFactory;

  @Memoize()
  get hasRegistration(): string[] {
    return this.getObjectsArray('hasRegistration').map((obj) => obj.value);
  }

  get registrations(): AsyncIterable<ReadableDataRegistration> {
    const { factory } = this;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const dataRegistry = this;
    return {
      async *[Symbol.asyncIterator]() {
        for (const registrationIri of dataRegistry.hasRegistration) {
          yield factory.readable.dataRegistration(registrationIri);
        }
      }
    };
  }

  async bootstrap(): Promise<void> {
    this.fetchData();
  }

  static async build(iri: string, factory: AuthorizationAgentFactory): Promise<ReadableDataRegistry> {
    const instance = new ReadableDataRegistry(iri, factory);
    await instance.bootstrap();
    return instance;
  }
}
