import { DataFactory } from 'n3';
import { getOneMatchingQuad, getAllMatchingQuads } from 'interop-utils';
import { INTEROP, LDP } from 'interop-namespaces';
import { Model, InteropFactory } from '.';

export class DataRegistration extends Model {
  private async bootstrap(): Promise<void> {
    await this.fetchData();
  }

  public static async build(iri: string, factory: InteropFactory): Promise<DataRegistration> {
    const instance = new DataRegistration(iri, factory);
    await instance.bootstrap();
    return instance;
  }

  // TODO cache and remove getter
  get registeredShapeTree(): string {
    const quadPattern = [null, INTEROP.registeredShapeTree, null, null];
    return getOneMatchingQuad(this.dataset, ...quadPattern).object.value;
  }

  get contains(): string[] {
    const quadPattern = [DataFactory.namedNode(this.iri), LDP.contains, null, DataFactory.namedNode(this.iri)];
    return getAllMatchingQuads(this.dataset, ...quadPattern).map((q) => q.object.value);
  }
}
