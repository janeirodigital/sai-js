import { DataGrant } from '.';

export class DataOwner {
  issuedGrants: DataGrant[] = [];

  constructor(public iri: string) {}

  /**
   * @public
   * @param shapeTree URL of shape tree
   * @returns  Array of grants for that shape tree
   */
  grantsForShapeTree(shapeTree: string): DataGrant[] {
    return this.issuedGrants.filter((sourceGrant) => sourceGrant.registeredShapeTree === shapeTree);
  }
}
