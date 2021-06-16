import { DataFactory } from 'n3';
import { getAllMatchingQuads } from 'interop-utils';
import { INTEROP } from 'interop-namespaces';
import { Model, InteropFactory, DataGrant } from '.';

export class AccessReceipt extends Model {
  hasDataGrant: DataGrant[];

  combinedDataGrant: DataGrant[];

  private buildDataGrants(): void {
    const quadPattern = [DataFactory.namedNode(this.iri), INTEROP.hasDataGrant, null, null];
    this.hasDataGrant = getAllMatchingQuads(this.dataset, ...quadPattern)
      .map((quad) => quad.object.value)
      .map((dataGrantIri) => this.factory.dataGrant(dataGrantIri, this));
  }

  private setCombinedDataGrants(): void {
    this.combinedDataGrant = [
      ...this.hasDataGrant,
      ...this.hasDataGrant.flatMap((dataGrant) => dataGrant.hasReferencedDataGrant)
    ];
  }

  async bootstrap(): Promise<void> {
    await this.fetchData();
    this.buildDataGrants();
    this.setCombinedDataGrants();
  }

  public static async build(iri: string, factory: InteropFactory): Promise<AccessReceipt> {
    const instance = new AccessReceipt(iri, factory);
    await instance.bootstrap();
    return instance;
  }
}
