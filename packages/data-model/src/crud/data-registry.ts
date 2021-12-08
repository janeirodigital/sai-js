import { ReadableDataRegistration } from '../readable';
import { AuthorizationAgentFactory } from '..';
import { CRUDResource } from '.';

export class CRUDDataRegistry extends CRUDResource {
  factory: AuthorizationAgentFactory;

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
    await this.fetchData();
  }

  static async build(iri: string, factory: AuthorizationAgentFactory): Promise<CRUDDataRegistry> {
    const instance = new CRUDDataRegistry(iri, factory);
    await instance.bootstrap();
    return instance;
  }
}
