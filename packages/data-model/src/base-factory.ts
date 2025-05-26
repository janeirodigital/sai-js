import { INTEROP, type RdfFetch, getOneMatchingQuad } from '@janeirodigital/interop-utils'
import { DataFactory, type NamedNode } from 'n3'
import {
  AllFromRegistryDataGrant,
  type DataGrant,
  DataInstance,
  type FactoryDependencies,
  InheritedDataGrant,
  ReadableAccessGrant,
  ReadableApplicationRegistration,
  ReadableClientIdDocument,
  ReadableDataInstance,
  ReadableDataRegistration,
  ReadableShapeTree,
  ReadableWebIdProfile,
  SelectedFromRegistryDataGrant,
} from '.'

interface CachedDataGrants {
  [key: string]: DataGrant
}

interface Cache {
  dataGrant: CachedDataGrants
}

export interface BaseReadableFactory {
  dataInstance(iri: string, descriptionLang?: string): Promise<ReadableDataInstance>
  accessGrant(iri: string): Promise<ReadableAccessGrant>
  applicationRegistration(iri: string): Promise<ReadableApplicationRegistration>
  dataRegistration(iri: string): Promise<ReadableDataRegistration>
  shapeTree(iri: string, descriptionLang?: string): Promise<ReadableShapeTree>
  dataGrant(iri: string): Promise<DataGrant>
  webIdProfile(iri: string): Promise<ReadableWebIdProfile>
  clientIdDocument(iri: string): Promise<ReadableClientIdDocument>
}

export class BaseFactory {
  readable: BaseReadableFactory

  fetch: RdfFetch

  randomUUID: () => string

  cache: Cache

  constructor(dependencies: FactoryDependencies) {
    this.fetch = dependencies.fetch
    this.randomUUID = dependencies.randomUUID
    this.cache = {
      dataGrant: {},
    }

    this.readable = this.readableFactory()
  }

  protected readableFactory(): BaseReadableFactory {
    const factory = this
    return {
      dataInstance: async function dataInstance(
        iri: string,
        descriptionLang?: string
      ): Promise<ReadableDataInstance> {
        return ReadableDataInstance.build(iri, factory, descriptionLang)
      },
      accessGrant: async function accessGrant(iri: string): Promise<ReadableAccessGrant> {
        return ReadableAccessGrant.build(iri, factory)
      },
      applicationRegistration: async function applicationRegistration(
        iri: string
      ): Promise<ReadableApplicationRegistration> {
        return ReadableApplicationRegistration.build(iri, factory)
      },
      dataRegistration: async function dataRegistration(
        iri: string
      ): Promise<ReadableDataRegistration> {
        return ReadableDataRegistration.build(iri, factory)
      },
      shapeTree: async function shapeTree(
        iri: string,
        descriptionLang?: string
      ): Promise<ReadableShapeTree> {
        return ReadableShapeTree.build(iri, factory, descriptionLang)
      },
      webIdProfile: async function webIdProfile(iri: string): Promise<ReadableWebIdProfile> {
        return ReadableWebIdProfile.build(iri, factory)
      },
      clientIdDocument: async function clientIdDocument(
        iri: string
      ): Promise<ReadableClientIdDocument> {
        return ReadableClientIdDocument.build(iri, factory)
      },
      dataGrant: async function dataGrant(iri: string): Promise<DataGrant> {
        // return cached if exists
        const cached = factory.cache.dataGrant[iri]
        if (cached) return cached

        const response = await factory.fetch(iri)
        const dataset = await response.dataset()

        const quadPattern = [DataFactory.namedNode(iri), INTEROP.scopeOfGrant, null, null]
        const scopeOfGrant = getOneMatchingQuad(dataset, ...quadPattern).object as NamedNode
        let scopedDataGrant
        switch (scopeOfGrant.value) {
          case INTEROP.AllFromRegistry.value:
            scopedDataGrant = await AllFromRegistryDataGrant.build(iri, factory, dataset)
            break
          case INTEROP.SelectedFromRegistry.value:
            scopedDataGrant = await SelectedFromRegistryDataGrant.build(iri, factory, dataset)
            break
          case INTEROP.Inherited.value:
            scopedDataGrant = new InheritedDataGrant(iri, factory, dataset)
            break
          default:
            throw new Error(`Unknown scope: ${scopeOfGrant.value} on ${iri}`)
        }

        // store in cache for future access
        factory.cache.dataGrant[iri] = scopedDataGrant

        return scopedDataGrant
      },
    }
  }

  async dataInstance(iri: string, grant: DataGrant, parent?: DataInstance): Promise<DataInstance> {
    return DataInstance.build(iri, grant, this, parent)
  }
}
