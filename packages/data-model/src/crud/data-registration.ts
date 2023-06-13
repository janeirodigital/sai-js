import { INTEROP } from '@janeirodigital/interop-utils';
import { DataFactory } from 'n3';
import { CRUDResource } from '.';
import { AuthorizationAgentFactory } from '..';

export type DataRegistrationData = {
  shapeTree: string;
};

export class CRUDDataRegistration extends CRUDResource {
  data: DataRegistrationData;

  public static async build(
    iri: string,
    factory: AuthorizationAgentFactory,
    data?: DataRegistrationData
  ): Promise<CRUDDataRegistration> {
    const instance = new CRUDDataRegistration(iri, factory, data);
    await instance.bootstrap();
    return instance;
  }

  private datasetFromData(): void {
    const props: (keyof DataRegistrationData)[] = ['shapeTree'];
    for (const prop of props) {
      this.dataset.add(
        DataFactory.quad(DataFactory.namedNode(this.iri), INTEROP[prop], DataFactory.namedNode(this.data[prop]))
      );
    }
  }

  protected async bootstrap(): Promise<void> {
    if (!this.data) {
      await this.fetchData();
    } else {
      this.datasetFromData();
    }
  }
}
