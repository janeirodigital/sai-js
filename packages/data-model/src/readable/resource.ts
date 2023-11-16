import { DatasetCore } from '@rdfjs/types';
import { getStorageDescription } from '@janeirodigital/interop-utils';
import { Resource } from '..';

export class ReadableResource extends Resource {
  protected async fetchData(): Promise<void> {
    const response = await this.fetch(this.iri);
    this.dataset = await response.dataset();
  }

  protected async fetchStorageDescription(): Promise<DatasetCore> {
    // @ts-ignore
    const response = await this.fetch.raw(this.iri, {
      method: 'HEAD'
    });
    const storageDescriptionIri = getStorageDescription(response.headers.get('Link'));
    return this.fetch(storageDescriptionIri).then((res) => res.dataset());
  }
}
