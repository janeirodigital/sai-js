import { INTEROP } from '@janeirodigital/interop-utils'
import type { AuthorizationAgentFactory } from '..'
import { ReadableAccessDescriptionSet } from './access-description-set'
import type { ReadableAccessNeed } from './access-need'
import type { ReadableAccessNeedGroupDescription } from './access-need-group-description'
import { ReadableResource } from './resource'

export class ReadableAccessNeedGroup extends ReadableResource {
  public descriptions: { [key: string]: ReadableAccessNeedGroupDescription } = {}

  accessNeeds: ReadableAccessNeed[] = []

  constructor(
    public iri: string,
    public factory: AuthorizationAgentFactory,
    public descriptionLang?: string
  ) {
    super(iri, factory)
  }

  get hasAccessNeed(): string[] {
    return this.getObjectsArray(INTEROP.hasAccessNeed).map((object) => object.value)
  }

  get reliableDescriptionLanguages(): Set<string> {
    return this.accessNeeds.reduce(
      (acc, need) => {
        if (!acc) return need.reliableDescriptionLanguages
        return new Set([...acc].filter((lang) => need.reliableDescriptionLanguages.has(lang)))
      },
      null as Set<string> | null
    )
  }

  public async getDescription(
    descriptionLang: string
  ): Promise<ReadableAccessNeedGroupDescription | undefined> {
    if (this.descriptions[descriptionLang]) return this.descriptions[descriptionLang]
    const descriptionSetIri = ReadableAccessDescriptionSet.findInLanguage(this, descriptionLang)
    if (!descriptionSetIri) return undefined
    const descriptionSet = await this.factory.readable.accessDescriptionSet(descriptionSetIri)
    return descriptionSet.accessNeedGroupDescriptions.find(
      (description) => description.hasAccessNeedGroup === this.iri
    )
  }

  protected async bootstrap(): Promise<void> {
    await this.fetchData()
    this.accessNeeds = await Promise.all(
      this.hasAccessNeed.map((iri) => this.factory.readable.accessNeed(iri, this.descriptionLang))
    )
    if (this.descriptionLang) {
      const description = await this.getDescription(this.descriptionLang)
      if (description) {
        this.descriptions[this.descriptionLang] = description
      }
    }
  }

  public static async build(
    iri: string,
    factory: AuthorizationAgentFactory,
    descriptionLang?: string
  ): Promise<ReadableAccessNeedGroup> {
    const instance = new ReadableAccessNeedGroup(iri, factory, descriptionLang)
    await instance.bootstrap()
    return instance
  }
}
