import { DatasetCore, NamedNode } from '@rdfjs/types';
import { DataFactory } from 'n3';
import { RdfFetch, getOneMatchingQuad, getAllMatchingQuads } from '@janeirodigital/interop-utils';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { InteropFactory } from '.';

export class ReadableResource {
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
    const response = await this.fetch(this.iri);
    this.dataset = await response.dataset();
  }

  protected getObject(property: string, namespace = INTEROP): NamedNode | undefined {
    const quadPattern = [DataFactory.namedNode(this.iri), namespace[property], null, null];
    return getOneMatchingQuad(this.dataset, ...quadPattern)?.object as NamedNode | undefined;
  }

  protected getObjectsArray(property: string, namespace = INTEROP): NamedNode[] {
    const quadPattern = [DataFactory.namedNode(this.iri), namespace[property], null, null];
    return getAllMatchingQuads(this.dataset, ...quadPattern).map((quad) => quad.object) as NamedNode[];
  }
}
