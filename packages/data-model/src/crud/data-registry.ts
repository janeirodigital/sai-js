import { DataFactory } from 'n3';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { ReadableDataRegistration } from '../readable';
import { AuthorizationAgentFactory } from '..';
import { CRUDContainer, CRUDDataRegistration } from '.';

export class CRUDDataRegistry extends CRUDContainer {
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

  async createRegistration(shapeTree: string): Promise<CRUDDataRegistration> {
    for await (const registration of this.registrations) {
      if (registration.registeredShapeTree === shapeTree) {
        throw new Error('registration already exists');
      }
    }
    const dataRegistration = await this.factory.crud.dataRegistration(this.iriForContained(), { shapeTree });
    await dataRegistration.update();
    // link to create data registration
    this.dataset.add(
      DataFactory.quad(
        DataFactory.namedNode(this.iri),
        INTEROP.hasRegistration,
        DataFactory.namedNode(dataRegistration.iri)
      )
    );
    // update itself to store changes
    await this.update();
    return dataRegistration;
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
