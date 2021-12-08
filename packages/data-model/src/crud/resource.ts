import { INTEROP, XSD } from '@janeirodigital/interop-namespaces';
import { getOneMatchingQuad } from '@janeirodigital/interop-utils';
import { DataFactory, Store } from 'n3';
import { AuthorizationAgentFactory, InteropFactory, ReadableResource } from '..';

type Data = { [key: string]: string | string[] };

// TODO (elf-pavlik) implement creating new resource
export class CRUDResource extends ReadableResource {
  data?: Data;

  factory: AuthorizationAgentFactory;

  constructor(iri: string, factory: InteropFactory, data?: Data) {
    super(iri, factory);
    if (data) {
      this.data = data;
      this.dataset = new Store();
    }
  }

  protected deleteQuad(property: string, namespace = INTEROP): void {
    const existing = getOneMatchingQuad(this.dataset, DataFactory.namedNode(this.iri), namespace[property]);
    if (existing) {
      this.dataset.delete(existing);
    }
  }

  /*
   * @throws Error if fails
   */
  public async update(): Promise<void> {
    this.setTimestampsAndAgents();
    const { ok } = await this.fetch(this.iri, {
      method: 'PUT',
      dataset: this.dataset
    });
    if (!ok) {
      throw new Error('failed to update');
    }
  }

  private setTimestampsAndAgents(): void {
    if (this.data) {
      this.registeredBy = this.factory.webId;
      this.registeredWith = this.factory.agentId;
      this.registeredAt = new Date();
    }
    this.updatedAt = new Date();
  }

  // eslint-disable-next-line consistent-return
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

  // eslint-disable-next-line consistent-return
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

  get registeredBy(): string | undefined {
    return this.getObject('registeredBy')?.value;
  }

  set registeredBy(agent: string) {
    this.deleteQuad('registeredBy');
    this.dataset.add(
      DataFactory.quad(DataFactory.namedNode(this.iri), INTEROP.registeredBy, DataFactory.literal(agent, XSD.string))
    );
  }

  get registeredWith(): string | undefined {
    return this.getObject('registeredWith')?.value;
  }

  set registeredWith(agent: string) {
    this.deleteQuad('registeredWith');
    this.dataset.add(
      DataFactory.quad(DataFactory.namedNode(this.iri), INTEROP.registeredWith, DataFactory.literal(agent, XSD.string))
    );
  }

  /*
   * @throws Error if fails
   */
  public async delete(): Promise<void> {
    const { ok } = await this.fetch(this.iri, { method: 'DELETE' });
    if (!ok) {
      throw new Error('failed to delete');
    }
  }
}
