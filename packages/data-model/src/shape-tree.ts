import { Memoize } from 'typescript-memoize';
import { DataFactory } from 'n3';
import { getOneMatchingQuad } from '@janeirodigital/interop-utils';
import { SHAPETREES } from '@janeirodigital/interop-namespaces';
import { Model, InteropFactory } from '.';

export class ShapeTree extends Model {
  shapeText: string;

  private async bootstrap(): Promise<void> {
    await this.fetchData();
    this.shapeText = await (await this.fetch(this.validatedBy, { headers: { Accept: 'text/shex' } })).text();
  }

  public static async build(iri: string, factory: InteropFactory): Promise<ShapeTree> {
    const instance = new ShapeTree(iri, factory);
    await instance.bootstrap();
    return instance;
  }

  getShapePathForReferenced(shapeTree: string): string {
    const referencedPattern = [null, SHAPETREES.hasShapeTree, DataFactory.namedNode(shapeTree), null];
    const referencedNode = getOneMatchingQuad(this.dataset, ...referencedPattern).subject;
    const shapePathPattern = [referencedNode, SHAPETREES.viaShapePath, null];
    return getOneMatchingQuad(this.dataset, ...shapePathPattern).object.value;
  }

  @Memoize()
  get validatedBy(): string {
    return this.getObject('validatedBy', SHAPETREES).value;
  }
}
