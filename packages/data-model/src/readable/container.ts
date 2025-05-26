import { ReadableResource } from '.'

export class ReadableContainer extends ReadableResource {
  public iriForContained(): string {
    return `${this.iri}${this.factory.randomUUID()}`
  }
}
