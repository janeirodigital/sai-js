import { DataFactory } from 'n3';
import { getAllMatchingQuads } from 'interop-utils';
import { INTEROP } from 'interop-namespaces';
import { Model, InteropFactory, AnyDataGrant } from '.';

export class AccessReceipt extends Model {
  hasDataGrant: AnyDataGrant[];

  private async buildDataGrants(): Promise<void> {
    const quadPattern = [DataFactory.namedNode(this.iri), INTEROP.hasDataGrant, null, null];
    this.hasDataGrant = await Promise.all(
      getAllMatchingQuads(this.dataset, ...quadPattern)
        .map((quad) => quad.object.value)
        .map((dataGrantIri) => this.factory.dataGrant(dataGrantIri))
    );
  }

  async bootstrap(): Promise<void> {
    await this.fetchData();
    await this.buildDataGrants();
  }

  public static async build(iri: string, factory: InteropFactory): Promise<AccessReceipt> {
    const instance = new AccessReceipt(iri, factory);
    await instance.bootstrap();
    return instance;
  }
}
