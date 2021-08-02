import { DataGrant, DataRegistrationProxy } from '.';

export class DataOwner {
  issuedGrants: DataGrant[] = [];

  constructor(public iri: string) {}

  /**
   * @public
   * @param shapeTree URL of shape tree
   * @returns  Array of data registration proxies for that shape tree
   */
  selectRegistrations(shapeTree: string): DataRegistrationProxy[] {
    return this.issuedGrants
      .filter((sourceGrant) => sourceGrant.registeredShapeTree === shapeTree)
      .map((grant) => new DataRegistrationProxy(grant));
  }
}
