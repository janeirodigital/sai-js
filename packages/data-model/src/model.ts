import { DatasetCore } from '@rdfjs/types';
import { RdfFetch } from 'interop-utils';
import { InteropFactory } from '.';

export class Model {
  fetch: RdfFetch;

  factory: InteropFactory;

  iri: string;

  dataset: DatasetCore;

  constructor(iri: string, factory: InteropFactory) {
    this.iri = iri;
    this.factory = factory;
    this.fetch = factory.fetch;
  }

  protected async fetchData(): Promise<void> {
    this.dataset = await this.fetch(this.iri);
  }
}
