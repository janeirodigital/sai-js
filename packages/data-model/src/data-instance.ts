import { DatasetCore, NamedNode } from '@rdfjs/types';
import { DataFactory } from 'n3';
import { getOneMatchingQuad, getAllMatchingQuads } from 'interop-utils';
import { Model, ReferencesList, InteropFactory, DataInstanceIteratorOptions } from '.';

export interface ChildAccessMode {
  [key: string]: NamedNode[];
}

export class DataInstance extends Model {
  childAccessMode: ChildAccessMode;

  private async bootstrap(): Promise<void> {
    await this.fetchData();
  }

  public static async build(
    iri: string,
    accessOptions: DataInstanceIteratorOptions,
    factory: InteropFactory
  ): Promise<DataInstance> {
    const instance = new DataInstance(iri, factory);
    instance.childAccessMode = accessOptions.childAccessMode;
    await instance.bootstrap();
    return instance;
  }

  async getReferencesListForShapeTree(shapeTree: string): Promise<ReferencesList> {
    const referencesListNode = getAllMatchingQuads(this.dataset, ...this.referencesListPattern)
      .map((quad) => quad.object)
      .find((object) => {
        const childTreePattern = [
          object,
          DataFactory.namedNode('https://tbd.example/referencedTree'),
          DataFactory.namedNode(shapeTree),
          null
        ];
        return getOneMatchingQuad(this.dataset, ...childTreePattern);
      }) as NamedNode;
    return this.factory.referencesList(referencesListNode.value);
  }

  getChildInstancesIterator(shapeTree: string): AsyncIterable<DataInstance> {
    const instance = this;
    return {
      async *[Symbol.asyncIterator]() {
        const referencesList = await instance.getReferencesListForShapeTree(shapeTree);
        for (const childInstanceIri of referencesList.references) {
          yield instance.factory.dataInstance(childInstanceIri, {
            accessMode: instance.childAccessMode[shapeTree]
          });
        }
      }
    };
  }

  private get referencesListPattern(): (NamedNode | null)[] {
    return [DataFactory.namedNode(this.iri), DataFactory.namedNode('https://tbd.example/hasReferenceList'), null, null];
  }
}
