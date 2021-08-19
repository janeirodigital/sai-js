import { DataFactory } from 'n3';
import { DatasetCore } from '@rdfjs/types';
import { findChildReferences, getPredicate } from '@janeirodigital/interop-utils';
import { Model, InteropFactory, DataGrant, InheritInstancesDataGrant, ShapeTree } from '.';

export class DataInstance extends Model {
  dataGrant: DataGrant;

  parent: DataInstance;

  draft: boolean;

  shapeTree: ShapeTree;

  private async bootstrap(): Promise<void> {
    await this.fetchData();
    this.shapeTree = await this.factory.shapeTree(this.dataGrant.registeredShapeTree);
  }

  public static async build(
    iri: string,
    dataGrant: DataGrant,
    factory: InteropFactory,
    parent?: DataInstance
  ): Promise<DataInstance> {
    const instance = new DataInstance(iri, factory);
    instance.draft = false;
    instance.dataGrant = dataGrant;
    instance.parent = parent;
    await instance.bootstrap();
    return instance;
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

  // TODO (elf-pavlik) set HTTP Link header pointing to Data Registration when used to create
  /*
   * @param dataset - dataset to replace current one with
   * @throws Error if fails
   */
  public async update(dataset: DatasetCore): Promise<void> {
    // must be done before creating
    if (this.parent && this.draft) {
      await this.parent.updateAddingChildReference(this);
    }
    const { ok } = await this.fetch(this.iri, { method: 'PUT', dataset });
    if (!ok) {
      throw new Error('failed to update');
    }
    this.draft = false;
    this.dataset = dataset;
  }

  async getChildReferencesForShapeTree(shapeTree: string): Promise<string[]> {
    const shapePath = this.shapeTree.getShapePathForReferenced(shapeTree);
    return findChildReferences(this.iri, this.dataset, this.shapeTree.validatedBy, this.shapeTree.shapeText, shapePath);
  }

  getChildInstancesIterator(shapeTree: string): AsyncIterable<DataInstance> {
    let childGrant = null as null | InheritInstancesDataGrant;
    if (this.dataGrant instanceof InheritInstancesDataGrant) {
      throw new Error('child instance can not have child instances');
    } else {
      // TODO (elf-pavlik) extract as getter
      childGrant = [...this.dataGrant.hasInheritingGrant].find((grant) => grant.registeredShapeTree === shapeTree);
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const instance = this;
    return {
      async *[Symbol.asyncIterator]() {
        const references = await instance.getChildReferencesForShapeTree(shapeTree);
        for (const childInstanceIri of references) {
          yield instance.factory.dataInstance(childInstanceIri, childGrant);
        }
      }
    };
  }

  newChildDataInstance(shapeTree: string): DataInstance {
    if (this.dataGrant instanceof InheritInstancesDataGrant) {
      throw new Error('child instance can not have child instances');
    } else {
      // TODO (elf-pavlik) extract as getter
      const childGrant = [...this.dataGrant.hasInheritingGrant].find(
        (grant) => grant.registeredShapeTree === shapeTree
      );
      return childGrant.newDataInstance(this);
    }
  }

  get accessMode(): string[] {
    return this.dataGrant.accessMode;
  }

  public async updateAddingChildReference(child: DataInstance): Promise<void> {
    const shapePath = this.shapeTree.getShapePathForReferenced(child.dataGrant.registeredShapeTree);
    const predicate = getPredicate(shapePath, this.shapeTree.shapeText);

    // TODO (elf-pavlik) set graph name
    const referenceQuad = DataFactory.quad(
      DataFactory.namedNode(this.iri),
      DataFactory.namedNode(predicate),
      DataFactory.namedNode(child.iri)
    );
    this.dataset.add(referenceQuad);
    await this.update(this.dataset);
  }

  public async updateRemovingChildReference(child: DataInstance): Promise<void> {
    const shapePath = this.shapeTree.getShapePathForReferenced(child.dataGrant.registeredShapeTree);
    const predicate = getPredicate(shapePath, this.shapeTree.shapeText);

    // TODO (elf-pavlik) set graph name
    const referenceQuad = DataFactory.quad(
      DataFactory.namedNode(this.iri),
      DataFactory.namedNode(predicate),
      DataFactory.namedNode(child.iri)
    );
    this.dataset.delete(referenceQuad);
    await this.update(this.dataset);
  }
}
