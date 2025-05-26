import { SKOS } from '@janeirodigital/interop-utils'
import { ReadableResource } from './resource'

export abstract class ReadableAccessDescription extends ReadableResource {
  // TODO handle missing labels
  public get label(): string {
    return this.getObject(SKOS.prefLabel)!.value
  }

  public get definition(): string | undefined {
    return this.getObject(SKOS.definition)?.value
  }
}
