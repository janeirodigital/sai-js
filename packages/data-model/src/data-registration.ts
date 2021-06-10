import { getOneMatchingQuad } from 'interop-utils';
import { INTEROP } from 'interop-namespaces';
import { Model, InteropFactory } from '.';

export class DataRegistration extends Model {
  registeredShapeTree: string;

  private setRegisteredShapeTree(): void {
    const quadPattern = [null, INTEROP.registeredShapeTree, null, null];
    this.registeredShapeTree = getOneMatchingQuad(this.dataset, ...quadPattern).object.value;
  }

  private async bootstrap(): Promise<void> {
    await this.fetchData();
    this.setRegisteredShapeTree();
  }

  public static async build(iri: string, factory: InteropFactory): Promise<DataRegistration> {
    const instance = new DataRegistration(iri, factory);
    await instance.bootstrap();
    return instance;
  }
}
