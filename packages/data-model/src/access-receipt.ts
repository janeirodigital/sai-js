import { DataFactory } from 'n3';
import { getAllMatchingQuads } from 'interop-utils';
import { INTEROP } from 'interop-namespaces';
import { Model, InteropFactory, DataGrant } from '.';

export class AccessReceipt extends Model {
  hasDataGrant: DataGrant[];

  private buildDataGrants(): void {
    const quadPattern = [DataFactory.namedNode(this.iri), INTEROP.hasDataGrant, null, null];
    this.hasDataGrant = getAllMatchingQuads(this.dataset, ...quadPattern)
      .map((quad) => quad.object.value)
      .map((dataGrantIri) => this.factory.dataGrant(dataGrantIri, this));
  }

  private linkInheritingGrants(): void {
    for (const grant of this.hasDataGrant) {
      if (grant.inheritsFromGrantIri) {
        const parent = this.hasDataGrant.find((g) => g.iri === grant.inheritsFromGrantIri);
        grant.inheritsFromGrant = parent;
      }
    }
  }

  async bootstrap(): Promise<void> {
    await this.fetchData();
    this.buildDataGrants();
    this.linkInheritingGrants();
  }

  public static async build(iri: string, factory: InteropFactory): Promise<AccessReceipt> {
    const instance = new AccessReceipt(iri, factory);
    await instance.bootstrap();
    return instance;
  }
}
