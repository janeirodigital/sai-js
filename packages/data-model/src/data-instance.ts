import { NamedNode } from '@rdfjs/types';
import { DataFactory } from 'n3';
import { getOneMatchingQuad, getAllMatchingQuads } from 'interop-utils';
import { Model, ReferencesList, InteropFactory } from '.';

export class DataInstance extends Model {
  private async bootstrap(): Promise<void> {
    await this.fetchData();
  }

  public static async build(iri: string, factory: InteropFactory): Promise<DataInstance> {
    const instance = new DataInstance(iri, factory);
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

  get referencesListPattern(): (NamedNode | null)[] {
    return [DataFactory.namedNode(this.iri), DataFactory.namedNode('https://tbd.example/hasReferenceList'), null, null];
  }
}
