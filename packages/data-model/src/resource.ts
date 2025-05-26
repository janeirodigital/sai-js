/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  INTEROP,
  type RdfFetch,
  getAllMatchingQuads,
  getOneMatchingQuad,
} from '@janeirodigital/interop-utils'
import type { DatasetCore, NamedNode, Quad, Term } from '@rdfjs/types'
import { DataFactory, Store } from 'n3'
import type { BaseFactory } from '.'

type QuadPosition = 'object' | 'subject'

function createQuadPattern(
  quadPosition: QuadPosition,
  iri: string,
  property: string | NamedNode,
  namespace: any
) {
  const predicate = typeof property === 'string' ? namespace[property] : property
  return quadPosition === 'object'
    ? [DataFactory.namedNode(iri), predicate, null, null]
    : [null, predicate, DataFactory.namedNode(iri), null]
}
export class Resource {
  fetch: RdfFetch

  factory: BaseFactory

  iri: string

  node: NamedNode

  dataset: DatasetCore = new Store()

  constructor(iri: string, factory: BaseFactory) {
    this.iri = iri
    this.node = DataFactory.namedNode(this.iri)
    this.factory = factory
    this.fetch = factory.fetch
  }

  public getQuad(subject?: Term, predicate?: Term, object?: Term, graph?: Term): Quad | undefined {
    return getOneMatchingQuad(this.dataset, subject, predicate, object, graph)
  }

  public getQuadArray(subject?: Term, predicate?: Term, object?: Term, graph?: Term): Quad[] {
    return getAllMatchingQuads(this.dataset, subject, predicate, object, graph)
  }

  private getTerm(
    quadPosition: QuadPosition,
    property: string | NamedNode,
    namespace = INTEROP
  ): NamedNode | undefined {
    const quadPattern = createQuadPattern(quadPosition, this.iri, property, namespace)
    const quad = getOneMatchingQuad(this.dataset, ...quadPattern)
    return quad && (quad[quadPosition] as NamedNode | undefined)
  }

  private getTermArray(
    quadPosition: QuadPosition,
    property: string | NamedNode,
    namespace = INTEROP
  ): NamedNode[] {
    const quadPattern = createQuadPattern(quadPosition, this.iri, property, namespace)
    return getAllMatchingQuads(this.dataset, ...quadPattern).map(
      (quad) => quad[quadPosition]
    ) as NamedNode[]
  }

  public getSubject(property: NamedNode): NamedNode | undefined

  public getSubject(property: string, namespace?: any): NamedNode | undefined

  public getSubject(property: string | NamedNode, namespace?: any): NamedNode | undefined {
    return this.getTerm('subject', property, namespace)
  }

  public getObject(property: NamedNode): NamedNode | undefined

  public getObject(property: string, namespace?: any): NamedNode | undefined

  public getObject(property: string | NamedNode, namespace?: any): NamedNode | undefined {
    return this.getTerm('object', property, namespace)
  }

  public getObjectsArray(property: NamedNode): NamedNode[]

  public getObjectsArray(property: string, namespace?: any): NamedNode[]

  public getObjectsArray(property: string | NamedNode, namespace?: any): NamedNode[] {
    return this.getTermArray('object', property, namespace)
  }

  public getSubjectsArray(property: NamedNode): NamedNode[]

  public getSubjectsArray(property: string, namespace?: any): NamedNode[]

  public getSubjectsArray(property: string | NamedNode, namespace?: any): NamedNode[] {
    return this.getTermArray('subject', property, namespace)
  }
}
