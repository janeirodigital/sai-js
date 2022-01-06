import { INTEROP } from '@janeirodigital/interop-namespaces';
import { getAllMatchingQuads, getOneMatchingQuad, RdfFetch } from '@janeirodigital/interop-utils';
import { DatasetCore } from '@rdfjs/types';
import { DataFactory, NamedNode } from 'n3';
import { BaseFactory } from '.';

export class Resource {
  fetch: RdfFetch;

  factory: BaseFactory;

  iri: string;

  dataset: DatasetCore;

  constructor(iri: string, factory: BaseFactory) {
    this.iri = iri;
    this.factory = factory;
    this.fetch = factory.fetch;
  }

  public getObject(property: string, namespace = INTEROP): NamedNode | undefined {
    const quadPattern = [DataFactory.namedNode(this.iri), namespace[property], null, null];
    return getOneMatchingQuad(this.dataset, ...quadPattern)?.object as NamedNode | undefined;
  }

  public getObjectsArray(property: string, namespace = INTEROP): NamedNode[] {
    const quadPattern = [DataFactory.namedNode(this.iri), namespace[property], null, null];
    return getAllMatchingQuads(this.dataset, ...quadPattern).map((quad) => quad.object) as NamedNode[];
  }
}
