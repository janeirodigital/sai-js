import { SKOS } from '@janeirodigital/interop-utils'
import type { InteropFactory } from '..'
import { ReadableResource } from './resource'

export class ReadableShapeTreeDescription extends ReadableResource {
  // TODO: handle missing labels
  public get label(): string {
    return this.getObject(SKOS.prefLabel)!.value
  }

  public get definition(): string | undefined {
    return this.getObject(SKOS.definition)?.value
  }

  protected async bootstrap(): Promise<void> {
    await this.fetchData()
  }

  public static async build(
    iri: string,
    factory: InteropFactory
  ): Promise<ReadableShapeTreeDescription> {
    const instance = new ReadableShapeTreeDescription(iri, factory)
    await instance.bootstrap()
    return instance
  }
}
