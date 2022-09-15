import { Memoize } from 'typescript-memoize';
import { DataFactory } from 'n3';
import { NamedNode } from '@rdfjs/types';
import { SHAPETREES } from '@janeirodigital/interop-namespaces';
import { InteropFactory } from '..';
import { ReadableResource } from '.';

export class ReadableShapeTree extends ReadableResource {
  shapeText: string;

  private async bootstrap(): Promise<void> {
    await this.fetchData();
    this.shapeText = await (await this.fetch(this.shape, { headers: { Accept: 'text/shex' } })).text();
  }

  public static async build(iri: string, factory: InteropFactory): Promise<ReadableShapeTree> {
    const instance = new ReadableShapeTree(iri, factory);
    await instance.bootstrap();
    return instance;
  }

  getPredicateForReferenced(shapeTree: string): NamedNode {
    const referencedNode = this.getQuad(null, SHAPETREES.hasShapeTree, DataFactory.namedNode(shapeTree)).subject;
    return this.getQuad(referencedNode, SHAPETREES.viaPredicate).object as NamedNode;
  }

  @Memoize()
  get shape(): string {
    return this.getObject('shape', SHAPETREES).value;
  }
}
