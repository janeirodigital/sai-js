import { Model, InteropFactory } from '.';

export class AccessReceipt extends Model {
  public static async build(iri: string, factory: InteropFactory): Promise<AccessReceipt> {
    const instance = new AccessReceipt(iri, factory);
    await instance.fetchData();
    return instance;
  }
}
