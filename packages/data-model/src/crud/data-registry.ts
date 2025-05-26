import {
  INTEROP,
  RDF,
  SPACE,
  discoverStorageDescription,
  getOneMatchingQuad,
} from '@janeirodigital/interop-utils'
import type { DatasetCore } from '@rdfjs/types'
import { DataFactory } from 'n3'
import { CRUDContainer, type CRUDDataRegistration } from '.'
import type { AuthorizationAgentFactory } from '..'
import type { ReadableDataRegistration } from '../readable'
import type { CRUDData } from './resource'

export class CRUDDataRegistry extends CRUDContainer {
  factory: AuthorizationAgentFactory

  get hasDataRegistration(): string[] {
    return this.getObjectsArray('hasDataRegistration').map((obj) => obj.value)
  }

  get registrations(): AsyncIterable<ReadableDataRegistration> {
    const { factory } = this
    const dataRegistry = this
    return {
      async *[Symbol.asyncIterator]() {
        for (const registrationIri of dataRegistry.hasDataRegistration) {
          yield factory.readable.dataRegistration(registrationIri)
        }
      },
    }
  }

  async createRegistration(registeredShapeTree: string): Promise<CRUDDataRegistration> {
    for await (const registration of this.registrations) {
      if (registration.registeredShapeTree === registeredShapeTree) {
        throw new Error('registration already exists')
      }
    }
    const dataRegistration = await this.factory.crud.dataRegistration(this.iriForContained(true), {
      registeredShapeTree,
    })
    await dataRegistration.create()

    // link to create data registration
    const quad = DataFactory.quad(this.node, INTEROP.hasDataRegistration, dataRegistration.node)
    this.dataset.add(quad)
    await this.addStatement(quad)
    return dataRegistration
  }

  private async fetchStorageDescription(): Promise<DatasetCore> {
    const storageDescriptionIri = await discoverStorageDescription(this.iri, this.fetch.raw)
    return this.fetch(storageDescriptionIri).then((res) => res.dataset())
  }

  public async storageIri(): Promise<string> {
    const storageDescription = await this.fetchStorageDescription()
    return getOneMatchingQuad(storageDescription, null, RDF.type, SPACE.Storage).subject.value
  }

  async bootstrap(): Promise<void> {
    await this.fetchData()
    if (this.data) {
      this.dataset.add(DataFactory.quad(this.node, RDF.type, INTEROP.DataRegistry))
    }
  }

  static async build(
    iri: string,
    factory: AuthorizationAgentFactory,
    data?: CRUDData
  ): Promise<CRUDDataRegistry> {
    const instance = new CRUDDataRegistry(iri, factory, data)
    await instance.bootstrap()
    return instance
  }
}
