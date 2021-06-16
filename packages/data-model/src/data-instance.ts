import { Model, InteropFactory } from '.';

export class DataInstance extends Model {
  private async bootstrap(): Promise<void> {
    await this.fetchData();
  }

  public static async build(iri: string, factory: InteropFactory): Promise<DataInstance> {
    const instance = new DataInstance(iri, factory);
    await instance.bootstrap();
    return instance;
  }
}
