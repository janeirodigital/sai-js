import { DataFactory } from 'n3';
import { getAllMatchingQuads } from '@janeirodigital/interop-utils';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { ReadableResource, InteropFactory, DataGrant } from '..';

export class ReadableAccessGrant extends ReadableResource {
  hasDataGrant: DataGrant[] = [];

  private async buildDataGrants(): Promise<void> {
    const quadPattern = [DataFactory.namedNode(this.iri), INTEROP.hasDataGrant, null, null];
    const grantIriList = getAllMatchingQuads(this.dataset, ...quadPattern).map((quad) => quad.object.value);
    for (const grantIri of grantIriList) {
      // eslint-disable-next-line no-await-in-loop
      this.hasDataGrant.push(await this.factory.dataGrant(grantIri));
    }
  }

  async bootstrap(): Promise<void> {
    await this.fetchData();
    await this.buildDataGrants();
  }

  public static async build(iri: string, factory: InteropFactory): Promise<ReadableAccessGrant> {
    const instance = new ReadableAccessGrant(iri, factory);
    await instance.bootstrap();
    return instance;
  }
}
