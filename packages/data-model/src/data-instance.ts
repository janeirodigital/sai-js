import { DataFactory, NamedNode } from 'n3';
import { DatasetCore } from '@rdfjs/types';
import { targetDataRegistrationLink } from '@janeirodigital/interop-utils';
import { ReadableResource, ApplicationFactory, DataGrant, InheritedDataGrant, ReadableShapeTree } from '.';

export class DataInstance extends ReadableResource {
  dataGrant: DataGrant;

  // eslint-disable-next-line no-use-before-define
  parent: DataInstance;

  draft: boolean;

  shapeTree: ReadableShapeTree;

  public constructor(
    iri: string,
    dataGrant: DataGrant,
    factory: ApplicationFactory,
    parent?: DataInstance,
    draft = false
  ) {
    super(iri, factory);
    this.dataGrant = dataGrant;
    this.parent = parent;
    this.draft = draft;
  }

  private async bootstrap(): Promise<void> {
    if (!this.draft) {
      await this.fetchData();
    }
    this.shapeTree = await this.factory.readable.shapeTree(this.dataGrant.registeredShapeTree);
  }

  public static async build(
    iri: string,
    dataGrant: DataGrant,
    factory: ApplicationFactory,
    parent?: DataInstance,
    draft = false
  ): Promise<DataInstance> {
    const instance = new DataInstance(iri, dataGrant, factory, parent, draft);
    await instance.bootstrap();
    return instance;
  }

  public replaceValue(predicate: NamedNode, value: string) {
    const oldQuad = this.getQuad(this.node, predicate);
    if (oldQuad) this.dataset.delete(oldQuad);
    const newQuad = DataFactory.quad(this.node, predicate, DataFactory.literal(value));
    this.dataset.add(newQuad);
  }

  /*
   * @throws Error if fails
   */
  public async delete(): Promise<void> {
    if (!this.draft) {
      const { ok } = await this.fetch(this.iri, { method: 'DELETE' });
      if (!ok) {
        throw new Error('failed to delete');
      }
      // must be done after deleting
      if (this.parent) {
        await this.parent.updateRemovingChildReference(this);
      }
    }
  }

  /*
   * @param dataset - dataset to replace current one with
   * @throws Error if fails
   */
  public async update(dataset: DatasetCore): Promise<void> {
    // must be done before creating
    if (this.parent && this.draft) {
      await this.parent.updateAddingChildReference(this);
    }
    const { ok } = await this.fetch(this.iri, {
      method: 'PUT',
      dataset,
      headers: { Link: targetDataRegistrationLink(this.dataGrant.hasDataRegistration) }
    });
    if (!ok) {
      throw new Error('failed to update');
    }
    this.draft = false;
    this.dataset = dataset;
  }

  async getChildReferencesForShapeTree(shapeTree: string): Promise<string[]> {
    const predicate = this.shapeTree.getPredicateForReferenced(shapeTree);
    return this.getObjectsArray(predicate).map((object) => object.value);
  }

  findChildGrant(shapeTree: string): InheritedDataGrant {
    if (this.dataGrant instanceof InheritedDataGrant) {
      throw new Error('child instance can not have child instances');
    } else {
      return [...this.dataGrant.hasInheritingGrant].find((grant) => grant.registeredShapeTree === shapeTree);
    }
  }

  getChildInstancesIterator(shapeTree: string): AsyncIterable<DataInstance> {
    const childGrant = this.findChildGrant(shapeTree);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const instance = this;
    return {
      async *[Symbol.asyncIterator]() {
        const references = await instance.getChildReferencesForShapeTree(shapeTree);
        for (const childInstanceIri of references) {
          yield instance.factory.dataInstance(childInstanceIri, childGrant, instance);
        }
      }
    };
  }

  async newChildDataInstance(shapeTree: string): Promise<DataInstance> {
    const childGrant = this.findChildGrant(shapeTree);
    return childGrant.newDataInstance(this);
  }

  get accessMode(): string[] {
    return this.dataGrant.accessMode;
  }

  public async updateAddingChildReference(child: DataInstance): Promise<void> {
    const predicate = this.shapeTree.getPredicateForReferenced(child.dataGrant.registeredShapeTree);

    const referenceQuad = DataFactory.quad(
      DataFactory.namedNode(this.iri),
      predicate,
      DataFactory.namedNode(child.iri),
      [...this.dataset][0].graph
    );
    this.dataset.add(referenceQuad);
    await this.update(this.dataset);
  }

  public async updateRemovingChildReference(child: DataInstance): Promise<void> {
    const predicate = this.shapeTree.getPredicateForReferenced(child.dataGrant.registeredShapeTree);

    const referenceQuad = DataFactory.quad(
      DataFactory.namedNode(this.iri),
      predicate,
      DataFactory.namedNode(child.iri),
      [...this.dataset][0].graph
    );
    this.dataset.delete(referenceQuad);
    await this.update(this.dataset);
  }
}
