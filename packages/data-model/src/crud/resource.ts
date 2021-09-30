import { INTEROP } from '@janeirodigital/interop-namespaces';
import { getOneMatchingQuad } from '@janeirodigital/interop-utils';
import { DataFactory, Store } from 'n3';
import { InteropFactory, ReadableResource } from '..';

type Data = { [key: string]: string | string[] };

// TODO (elf-pavlik) implement creating new resource
export class CRUDResource extends ReadableResource {
  data?: Data;

  constructor(iri: string, factory: InteropFactory, data?: Data) {
    super(iri, factory);
    if (data) {
      this.data = data;
      this.dataset = new Store();
    }
  }

  protected deleteQuad(property: string, namespace = INTEROP): void {
    const existing = getOneMatchingQuad(this.dataset, DataFactory.namedNode(this.iri), namespace[property]);
    if (existing) {
      this.dataset.delete(existing);
    }
  }

  /*
   * @throws Error if fails
   */
  public async update(): Promise<void> {
    const { ok } = await this.fetch(this.iri, {
      method: 'PUT',
      dataset: this.dataset
    });
    if (!ok) {
      throw new Error('failed to update');
    }
  }

  /*
   * @throws Error if fails
   */
  public async delete(): Promise<void> {
    const { ok } = await this.fetch(this.iri, { method: 'DELETE' });
    if (!ok) {
      throw new Error('failed to delete');
    }
  }
}
