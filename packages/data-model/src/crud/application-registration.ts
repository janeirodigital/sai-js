import { INTEROP, XSD } from '@janeirodigital/interop-namespaces';
import { DataFactory } from 'n3';
import { AuthorizationAgentFactory } from '..';
import { CRUDResource } from './resource';

export type ApplicationRegistrationData = {
  registeredBy: string;
  registeredWith: string;
  registeredAgent: string;
  hasAccessGrant: string;
};

export class CRUDApplicationRegistration extends CRUDResource {
  data?: ApplicationRegistrationData;

  constructor(iri: string, factory: AuthorizationAgentFactory, data?: ApplicationRegistrationData) {
    super(iri, factory, data);
  }

  get hasAccessGrant(): string {
    return this.getObject('hasAccessGrant').value;
  }

  set hasAccessGrant(iri: string) {
    const subject = DataFactory.namedNode(this.iri);
    const predicate = INTEROP.hasAccessGrant;
    const object = DataFactory.namedNode(iri);
    // delete existing quad
    this.deleteQuad('hasAccessGrant');
    // add new quad
    this.dataset.add(DataFactory.quad(subject, predicate, object));
  }

  private datasetFromData(): void {
    const props: (keyof ApplicationRegistrationData)[] = [
      'registeredBy',
      'registeredWith',
      'registeredAgent',
      'hasAccessGrant'
    ];
    for (const prop of props) {
      this.dataset.add(
        DataFactory.quad(DataFactory.namedNode(this.iri), INTEROP[prop], DataFactory.namedNode(this.data[prop]))
      );
    }
  }

  private async bootstrap(): Promise<void> {
    if (!this.data) {
      await this.fetchData();
    } else {
      this.datasetFromData();
    }
  }

  public async update(): Promise<void> {
    if (this.data) {
      this.registeredAt = new Date();
    }
    this.updatedAt = new Date();
    super.update();
  }

  get registeredAt(): Date | undefined {
    const object = this.getObject('registeredAt');
    if (object) {
      return new Date(object.value);
    }
  }

  set registeredAt(date: Date) {
    this.deleteQuad('registeredAt');
    this.dataset.add(
      DataFactory.quad(
        DataFactory.namedNode(this.iri),
        INTEROP.registeredAt,
        DataFactory.literal(date.toISOString(), XSD.dateTime)
      )
    );
  }

  get updatedAt(): Date | undefined {
    const object = this.getObject('updatedAt');
    if (object) {
      return new Date(object.value);
    }
  }

  set updatedAt(date: Date) {
    this.deleteQuad('updatedAt');
    this.dataset.add(
      DataFactory.quad(
        DataFactory.namedNode(this.iri),
        INTEROP.updatedAt,
        DataFactory.literal(date.toISOString(), XSD.dateTime)
      )
    );
  }

  public static async build(
    iri: string,
    factory: AuthorizationAgentFactory,
    data?: ApplicationRegistrationData
  ): Promise<CRUDApplicationRegistration> {
    const instance = new CRUDApplicationRegistration(iri, factory, data);
    await instance.bootstrap();
    return instance;
  }
}
