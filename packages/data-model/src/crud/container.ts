import { CRUDResource } from '.';

// TODO cimbine with ReadableContainer as mixin
export class CRUDContainer extends CRUDResource {
  public iriForContained(): string {
    return `${this.iri}${this.factory.randomUUID()}`;
  }
}
