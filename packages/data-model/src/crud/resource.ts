import { INTEROP, XSD } from '@janeirodigital/interop-utils'
import { DataFactory, Store } from 'n3'
import { type AuthorizationAgentFactory, type InteropFactory, ReadableResource } from '..'

export type CRUDData = { [key: string]: string | string[] }

// TODO (elf-pavlik) implement creating new resource
export class CRUDResource extends ReadableResource {
  data?: CRUDData

  factory: AuthorizationAgentFactory

  constructor(iri: string, factory: InteropFactory, data?: CRUDData) {
    super(iri, factory)
    if (data) {
      this.data = data
      this.dataset = new Store()
    }
  }

  protected async fetchData(): Promise<void> {
    if (!this.data) return super.fetchData()
  }

  protected deleteQuad(property: string, namespace = INTEROP): void {
    const existing = this.getQuad(DataFactory.namedNode(this.iri), namespace[property])
    if (existing) {
      this.dataset.delete(existing)
    }
  }

  /*
   * @throws Error if fails
   */
  public async update(): Promise<void> {
    this.setTimestampsAndAgents()
    const response = await this.fetch(this.iri, {
      method: 'PUT',
      dataset: this.dataset,
    })
    if (!response.ok) {
      throw new Error('failed to update')
    }
  }

  protected setTimestampsAndAgents(): void {
    if (this.data) {
      this.registeredBy = this.factory.webId
      this.registeredWith = this.factory.agentId
      this.registeredAt = new Date()
    }
    this.updatedAt = new Date()
  }

  get registeredAt(): Date | undefined {
    const object = this.getObject('registeredAt')
    if (object) {
      return new Date(object.value)
    }

    return undefined
  }

  set registeredAt(date: Date) {
    this.deleteQuad('registeredAt')
    this.dataset.add(
      DataFactory.quad(
        DataFactory.namedNode(this.iri),
        INTEROP.registeredAt,
        DataFactory.literal(date.toISOString(), XSD.dateTime)
      )
    )
  }

  get updatedAt(): Date | undefined {
    const object = this.getObject('updatedAt')
    if (object) {
      return new Date(object.value)
    }

    return undefined
  }

  set updatedAt(date: Date) {
    this.deleteQuad('updatedAt')
    this.dataset.add(
      DataFactory.quad(
        DataFactory.namedNode(this.iri),
        INTEROP.updatedAt,
        DataFactory.literal(date.toISOString(), XSD.dateTime)
      )
    )
  }

  get registeredBy(): string | undefined {
    return this.getObject('registeredBy')?.value
  }

  set registeredBy(agent: string) {
    this.deleteQuad('registeredBy')
    this.dataset.add(
      DataFactory.quad(
        DataFactory.namedNode(this.iri),
        INTEROP.registeredBy,
        DataFactory.literal(agent, XSD.string)
      )
    )
  }

  get registeredWith(): string | undefined {
    return this.getObject('registeredWith')?.value
  }

  set registeredWith(agent: string) {
    this.deleteQuad('registeredWith')
    this.dataset.add(
      DataFactory.quad(
        DataFactory.namedNode(this.iri),
        INTEROP.registeredWith,
        DataFactory.literal(agent, XSD.string)
      )
    )
  }

  /*
   * @throws Error if fails
   */
  public async delete(): Promise<void> {
    const { ok } = await this.fetch(this.iri, { method: 'DELETE' })
    if (!ok) {
      throw new Error('failed to delete')
    }
  }
}
