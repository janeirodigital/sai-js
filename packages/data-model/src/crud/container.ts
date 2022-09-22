import { getDescriptionResource, insertPatch } from '@janeirodigital/interop-utils';
import { DatasetCore } from '@rdfjs/types';
import { CRUDResource } from '.';

// TODO combine with ReadableContainer as mixin
export class CRUDContainer extends CRUDResource {
  descriptionResourceIri?: string;

  public iriForContained(container = false): string {
    let containedIri = `${this.iri}${this.factory.randomUUID()}`;
    if (container) containedIri += '/';
    return containedIri;
  }

  public async addPatch(dataset: DatasetCore): Promise<void> {
    await this.discoverDescriptionResource();
    // update the Description Resource
    const { ok } = await this.fetch(this.descriptionResourceIri, {
      method: 'PATCH',
      body: await insertPatch(dataset),
      headers: {
        'Content-Type': 'application/sparql-update'
      }
    });
    if (!ok) {
      throw new Error(`failed to patch ${this.descriptionResourceIri}`);
    }
  }

  private async discoverDescriptionResource(): Promise<string> {
    if (this.descriptionResourceIri) return this.descriptionResourceIri;
    const headResponse = await this.fetch(this.iri, {
      method: 'HEAD'
    });

    this.descriptionResourceIri = getDescriptionResource(headResponse.headers.get('Link'));
    return this.descriptionResourceIri;
  }

  /*
   * @throws Error if fails
   */
  public async create(): Promise<void> {
    this.setTimestampsAndAgents();

    // create empty container, CSS ignores body!
    {
      const { ok } = await this.fetch(this.iri, {
        method: 'PUT'
      });
      if (!ok) throw new Error('failed to create empty container');
    }

    await this.discoverDescriptionResource();
    await this.addPatch(this.dataset);
  }
}
