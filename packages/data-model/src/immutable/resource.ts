import { DatasetCore } from '@rdfjs/types';
import { Store } from 'n3';
import { RdfFetch } from '@janeirodigital/interop-utils';
import { ApplicationFactory } from '..';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Data = { [key: string]: any };

export class ImmutableResource {
  fetch: RdfFetch;

  factory: ApplicationFactory;

  iri: string;

  dataset: DatasetCore;

  data: Data;

  stored = false;

  // dataset gets populated in consturtor of each sub class
  constructor(iri: string, factory: ApplicationFactory, data: Data) {
    this.iri = iri;
    this.factory = factory;
    this.fetch = factory.fetch;
    this.data = data;
    this.dataset = new Store();
  }

  /*
   * Immutable resource is always created new, never updated
   * for that reason it will always use If-None-Match: * header.
   * TODO: take into account retry - 412 shouldn't fail operation
   */
  public async put(): Promise<void> {
    if (this.stored) {
      throw new Error('this resource has been already stored');
    }
    const { ok } = await this.fetch(this.iri, {
      method: 'PUT',
      dataset: this.dataset,
      headers: {
        'If-None-Match': '*'
      }
    });
    if (ok) {
      this.stored = true;
    } else {
      throw new Error('failed to store');
    }
  }
}
