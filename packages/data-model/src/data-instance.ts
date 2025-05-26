import {
  SHAPETREES,
  getDescriptionResource,
  insertPatch,
  targetDataRegistrationLink,
} from '@janeirodigital/interop-utils'
import type { DatasetCore } from '@rdfjs/types'
import { DataFactory, type NamedNode } from 'n3'
import {
  type ApplicationFactory,
  type DataGrant,
  InheritedDataGrant,
  ReadableResource,
  type ReadableShapeTree,
} from '.'

export class DataInstance extends ReadableResource {
  dataGrant: DataGrant

  parent: DataInstance

  draft: boolean

  shapeTree: ReadableShapeTree

  public constructor(
    iri: string,
    dataGrant: DataGrant,
    factory: ApplicationFactory,
    parent?: DataInstance,
    draft = false
  ) {
    super(iri, factory)
    this.dataGrant = dataGrant
    this.parent = parent
    this.draft = draft
  }

  private async bootstrap(): Promise<void> {
    this.shapeTree = await this.factory.readable.shapeTree(this.dataGrant.registeredShapeTree)
    if (!this.draft) {
      if (!this.isBlob) {
        await this.fetchData()
      } else {
        const descriptionIri = await this.discoverDescriptionResource()
        const response = await this.fetch(descriptionIri)
        this.dataset = await response.dataset()
      }
    }
  }

  // TODO: extract as mixin from container
  async discoverDescriptionResource(): Promise<string> {
    // @ts-ignore
    const response = await this.fetch.raw(this.iri, {
      method: 'HEAD',
    })

    // get value of describedby Link
    return getDescriptionResource(response.headers.get('Link'))
  }

  public static async build(
    iri: string,
    dataGrant: DataGrant,
    factory: ApplicationFactory,
    parent?: DataInstance,
    draft = false
  ): Promise<DataInstance> {
    const instance = new DataInstance(iri, dataGrant, factory, parent, draft)
    await instance.bootstrap()
    return instance
  }

  public replaceValue(predicate: NamedNode, value: string) {
    const oldQuad = this.getQuad(this.node, predicate)
    if (oldQuad) this.dataset.delete(oldQuad)
    const newQuad = DataFactory.quad(this.node, predicate, DataFactory.literal(value))
    this.dataset.add(newQuad)
  }

  /*
   * @throws Error if fails
   */
  public async delete(): Promise<void> {
    if (!this.draft) {
      const { ok } = await this.fetch(this.iri, { method: 'DELETE' })
      if (!ok) {
        throw new Error('failed to delete')
      }
      // must be done after deleting
      if (this.parent) {
        await this.parent.updateRemovingChildReference(this)
      }
    }
  }

  /*
   * @param dataset - dataset to replace current one with
   * @throws Error if fails
   */
  public async update(dataset: DatasetCore, file?: File): Promise<void> {
    // must be done before creating
    if (this.parent && this.draft) {
      await this.parent.updateAddingChildReference(this)
    }

    if (this.isBlob) {
      if (this.draft && !file) {
        throw new Error('new non RDF resource needs the blob')
      }

      if (file) {
        // TODO: refactor RdfFetch
        // @ts-ignore
        const { ok } = await this.fetch.raw(this.iri, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        })

        if (!ok) {
          throw new Error('failed to upload file')
        }
      }

      const descriptionIri = await this.discoverDescriptionResource()

      // TODO support update, now only create will work
      // TODO reuse from CRUD Container
      const { ok } = await this.fetch(descriptionIri, {
        method: 'PATCH',
        body: await insertPatch(this.dataset),
        headers: {
          'Content-Type': 'application/sparql-update',
        },
      })
      if (!ok) {
        throw new Error(`failed to patch ${descriptionIri}`)
      }
    } else {
      const { ok } = await this.fetch(this.iri, {
        method: 'PUT',
        dataset,
        headers: { Link: targetDataRegistrationLink(this.dataGrant.hasDataRegistration) },
      })
      if (!ok) {
        throw new Error('failed to update')
      }
    }

    this.draft = false
    this.dataset = dataset
  }

  async getChildReferencesForShapeTree(shapeTree: string): Promise<string[]> {
    const predicate = this.shapeTree.getPredicateForReferenced(shapeTree)
    return this.getObjectsArray(predicate).map((object) => object.value)
  }

  findChildGrant(shapeTree: string): InheritedDataGrant {
    if (this.dataGrant instanceof InheritedDataGrant) {
      throw new Error('child instance can not have child instances')
    }
    return [...this.dataGrant.hasInheritingGrant].find(
      (grant) => grant.registeredShapeTree === shapeTree
    )
  }

  getChildInstancesIterator(shapeTree: string): AsyncIterable<DataInstance> {
    const childGrant = this.findChildGrant(shapeTree)
    const instance = this
    return {
      async *[Symbol.asyncIterator]() {
        const references = await instance.getChildReferencesForShapeTree(shapeTree)
        for (const childInstanceIri of references) {
          yield instance.factory.dataInstance(childInstanceIri, childGrant, instance)
        }
      },
    }
  }

  async newChildDataInstance(shapeTree: string): Promise<DataInstance> {
    const childGrant = this.findChildGrant(shapeTree)
    return childGrant.newDataInstance(this)
  }

  get accessMode(): string[] {
    return this.dataGrant.accessMode
  }

  public async updateAddingChildReference(child: DataInstance): Promise<void> {
    const predicate = this.shapeTree.getPredicateForReferenced(child.dataGrant.registeredShapeTree)

    const referenceQuad = DataFactory.quad(
      DataFactory.namedNode(this.iri),
      predicate,
      DataFactory.namedNode(child.iri),
      [...this.dataset][0].graph
    )
    this.dataset.add(referenceQuad)
    await this.update(this.dataset)
  }

  public async updateRemovingChildReference(child: DataInstance): Promise<void> {
    const predicate = this.shapeTree.getPredicateForReferenced(child.dataGrant.registeredShapeTree)

    const referenceQuad = DataFactory.quad(
      DataFactory.namedNode(this.iri),
      predicate,
      DataFactory.namedNode(child.iri),
      [...this.dataset][0].graph
    )
    this.dataset.delete(referenceQuad)
    await this.update(this.dataset)
  }

  addNode(predicate: string, object: string) {
    this.dataset.add(
      DataFactory.quad(this.node, DataFactory.namedNode(predicate), DataFactory.namedNode(object))
    )
  }

  get isBlob(): boolean {
    return this.shapeTree.expectsType.value === SHAPETREES.NonRDFResource.value
  }

  async fetchBlob(): Promise<Blob> {
    // @ts-ignore
    return (await this.fetch.raw(this.iri)).blob()
  }
}
