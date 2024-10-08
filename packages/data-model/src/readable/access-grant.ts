import { Memoize } from 'typescript-memoize';
import { INTEROP } from '@janeirodigital/interop-utils';
import { DataGrant, InteropFactory } from '..';
import { ReadableResource } from '.';

export class ReadableAccessGrant extends ReadableResource {
  hasDataGrant: DataGrant[] = [];

  private async buildDataGrants(): Promise<void> {
    const grantIriList = this.getObjectsArray(INTEROP.hasDataGrant).map((object) => object.value);
    for (const grantIri of grantIriList) {
      this.hasDataGrant.push(await this.factory.readable.dataGrant(grantIri));
    }
  }

  async bootstrap(): Promise<void> {
    await this.fetchData();
    await this.buildDataGrants();
  }

  @Memoize()
  get grantedBy(): string {
    return this.getObject('grantedBy').value;
  }

  @Memoize()
  get granted(): boolean {
    return this.getObject('granted').value === 'true';
  }

  public static async build(iri: string, factory: InteropFactory): Promise<ReadableAccessGrant> {
    const instance = new ReadableAccessGrant(iri, factory);
    await instance.bootstrap();
    return instance;
  }
}
