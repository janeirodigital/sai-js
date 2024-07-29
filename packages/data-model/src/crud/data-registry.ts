import { DataFactory } from 'n3';
import { DatasetCore } from '@rdfjs/types';
import { INTEROP, RDF, SPACE, discoverStorageDescription, getOneMatchingQuad } from '@janeirodigital/interop-utils';
import { ReadableDataRegistration } from '../readable';
import { AuthorizationAgentFactory } from '..';
import { CRUDContainer, CRUDDataRegistration } from '.';

export class CRUDDataRegistry extends CRUDContainer {
  factory: AuthorizationAgentFactory;

  get hasDataRegistration(): string[] {
    return this.getObjectsArray('hasDataRegistration').map((obj) => obj.value);
  }

  get registrations(): AsyncIterable<ReadableDataRegistration> {
    const { factory } = this;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const dataRegistry = this;
    return {
      async *[Symbol.asyncIterator]() {
        for (const registrationIri of dataRegistry.hasDataRegistration) {
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
        INTEROP.hasDataRegistration,
        DataFactory.namedNode(dataRegistration.iri)
      )
    );
    // update itself to store changes
    await this.update();
    return dataRegistration;
  }

  private async fetchStorageDescription(): Promise<DatasetCore> {
    const storageDescriptionIri = await discoverStorageDescription(this.iri, this.fetch.raw);
    return this.fetch(storageDescriptionIri).then((res) => res.dataset());
  }

  public async storageIri(): Promise<string> {
    const storageDescription = await this.fetchStorageDescription();
    return getOneMatchingQuad(storageDescription, null, RDF.type, SPACE.Storage).subject.value;
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
