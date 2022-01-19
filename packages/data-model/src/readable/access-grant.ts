import { Memoize } from 'typescript-memoize';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { ReadableResource, DataGrant, InteropFactory } from '..';

export class ReadableAccessGrant extends ReadableResource {
  hasDataGrant: DataGrant[] = [];

  private async buildDataGrants(): Promise<void> {
    const grantIriList = this.getObjectsArray(INTEROP.hasDataGrant).map((object) => object.value);
    for (const grantIri of grantIriList) {
      // eslint-disable-next-line no-await-in-loop
      this.hasDataGrant.push(await this.factory.readable.dataGrant(grantIri));
    }
  }

  async bootstrap(): Promise<void> {
    await this.fetchData();
    await this.buildDataGrants();
  }

  // TODO: update to grantedBy
  @Memoize()
  get fromAgent(): string {
    return this.getObject('fromAgent').value;
  }

  public static async build(iri: string, factory: InteropFactory): Promise<ReadableAccessGrant> {
    const instance = new ReadableAccessGrant(iri, factory);
    await instance.bootstrap();
    return instance;
  }
}
