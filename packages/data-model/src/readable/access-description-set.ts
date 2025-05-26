import { INTEROP, XSD } from '@janeirodigital/interop-utils'
import { DataFactory } from 'n3'
import type {
  AuthorizationAgentFactory,
  ReadableAccessNeedDescription,
  ReadableAccessNeedGroupDescription,
} from '..'
import { ReadableResource } from './resource'

export class ReadableAccessDescriptionSet extends ReadableResource {
  factory: AuthorizationAgentFactory

  public accessNeedDescriptions: ReadableAccessNeedDescription[] = []

  public accessNeedGroupDescriptions: ReadableAccessNeedGroupDescription[] = []

  private get descriptionSubjects() {
    return this.getQuadArray(null, INTEROP.inAccessDescriptionSet).map((quad) => quad.subject)
  }

  get forAccessNeedGroup(): string[] {
    return this.descriptionSubjects
      .filter((subject) => this.dataset.match(subject, INTEROP.hasAccessNeedGroup).size)
      .map((subject) => subject.value)
  }

  get forAccessNeed(): string[] {
    return this.descriptionSubjects
      .filter((subject) => this.dataset.match(subject, INTEROP.hasAccessNeed).size)
      .map((subject) => subject.value)
  }

  protected async bootstrap(): Promise<void> {
    await this.fetchData()
    this.accessNeedDescriptions = await Promise.all(
      this.forAccessNeed.map((iri) => this.factory.readable.accessNeedDescription(iri))
    )
    this.accessNeedGroupDescriptions = await Promise.all(
      this.forAccessNeedGroup.map((iri) => this.factory.readable.accessNeedGroupDescription(iri))
    )
  }

  public static async build(
    iri: string,
    factory: AuthorizationAgentFactory
  ): Promise<ReadableAccessDescriptionSet> {
    const instance = new ReadableAccessDescriptionSet(iri, factory)
    await instance.bootstrap()
    return instance
  }

  public static findInLanguage(
    resource: ReadableResource,
    descriptionLang: string
  ): string | undefined {
    // we can skip matching on INTEROP.hasAccessDescriptionSet since nothing else uses INTEROP.usesLanguage
    return resource.getQuad(
      null,
      INTEROP.usesLanguage,
      DataFactory.literal(descriptionLang, XSD.language)
    )?.subject.value
  }
}
