import { DatasetCore } from '@rdfjs/types';
import { Store } from 'n3';
import { RdfFetch } from '@janeirodigital/interop-utils';
import { ApplicationFactory } from '..';

type Data = { [key: string]: string | string[] };

export class ImmutableResource {
  fetch: RdfFetch;

  factory: ApplicationFactory;

  iri: string;

  dataset: DatasetCore;

  data: Data;

  // dataset gets populated in consturtor of each sub class
  constructor(iri: string, factory: ApplicationFactory, data: Data) {
    this.iri = iri;
    this.factory = factory;
    this.fetch = factory.fetch;
    this.data = data;
    this.dataset = new Store();
  }

  public async build(): Promise<void> {
    const { ok } = await this.fetch(this.iri, {
      method: 'PUT',
      dataset: this.dataset
    });
    if (!ok) {
      throw new Error('failed to update');
    }
  }
}
