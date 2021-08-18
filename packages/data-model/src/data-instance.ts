import { DatasetCore } from '@rdfjs/types';
import { findChildReferences } from '@janeirodigital/interop-utils';
import { Model, InteropFactory, DataGrant, InheritInstancesDataGrant } from '.';

export class DataInstance extends Model {
  dataGrant: DataGrant;

  private async bootstrap(): Promise<void> {
    await this.fetchData();
  }

  public static async build(iri: string, dataGrant: DataGrant, factory: InteropFactory): Promise<DataInstance> {
    const instance = new DataInstance(iri, factory);
    instance.dataGrant = dataGrant;
    await instance.bootstrap();
    return instance;
  }

  /*
   * @throws Error if fails
   */
  public async delete(): Promise<void> {
    const { ok } = await this.fetch(this.iri, { method: 'DELETE' });
    if (!ok) {
      throw new Error('failed to delete');
    }
  }

  // TODO (elf-pavlik) set HTTP Link header pointing to Data Registration when used to create
  /*
   * @param dataset - dataset to replace current one with
   * @throws Error if fails
   */
  public async update(dataset: DatasetCore): Promise<void> {
    const { ok } = await this.fetch(this.iri, { method: 'PUT', dataset });
    if (!ok) {
      throw new Error('failed to update');
    }
    this.dataset = dataset;
  }

  async getChildReferencesForShapeTree(shapeTree: string): Promise<string[]> {
    const instanceShapeTree = await this.factory.shapeTree(this.dataGrant.registeredShapeTree);
    const shapeText = await (
      await this.fetch(instanceShapeTree.validatedBy, { headers: { Accept: 'text/shex' } })
    ).text();
    const shapePath = instanceShapeTree.getShapePathForReferenced(shapeTree);
    return findChildReferences(this.iri, this.dataset, instanceShapeTree.validatedBy, shapeText, shapePath);
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
      return childGrant.newDataInstance();
    }
  }

  get accessMode(): string[] {
    return this.dataGrant.accessMode;
  }
}
