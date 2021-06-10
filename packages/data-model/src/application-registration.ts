import { DataFactory } from 'n3';
import { getOneMatchingQuad } from 'interop-utils';
import { INTEROP } from 'interop-namespaces';
import { Model, AccessReceipt, InteropFactory } from '.';

export class ApplicationRegistration extends Model {
  hasAccessReceipt: AccessReceipt;

  private async buildAccessReceipt(): Promise<void> {
    const quadPattern = [DataFactory.namedNode(this.iri), INTEROP.hasAccessReceipt, null, null];
    const accessReceiptIri = getOneMatchingQuad(this.dataset, ...quadPattern).object.value;
    this.hasAccessReceipt = await this.factory.accessReceipt(accessReceiptIri);
  }

  private async bootstrap(): Promise<void> {
    await this.fetchData();
    await this.buildAccessReceipt();
  }

  public static async build(iri: string, factory: InteropFactory): Promise<ApplicationRegistration> {
    const instance = new ApplicationRegistration(iri, factory);
    await instance.bootstrap();
    return instance;
  }
}
