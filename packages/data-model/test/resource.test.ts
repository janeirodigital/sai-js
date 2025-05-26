import { randomUUID } from 'node:crypto'
import { fetch } from '@janeirodigital/interop-test-utils'
import { INTEROP } from '@janeirodigital/interop-utils'
import { DataFactory } from 'n3'
import { describe, test } from 'vitest'
import { ApplicationFactory, Resource } from '../src'
import { expect } from './expect'

const factory = new ApplicationFactory({ fetch, randomUUID })
const snippetIri = 'https://some.example/43a28334-e133-493f-9ce6-e383b54d7a5d'

describe('constructor', () => {
  test('should set the iri', () => {
    const resource = new Resource(snippetIri, factory)
    expect(resource.iri).toBe(snippetIri)
  })

  test('should set the node', () => {
    const resource = new Resource(snippetIri, factory)
    expect(resource.node.termType).toBe('NamedNode')
    expect(resource.node.value).toBe(snippetIri)
  })

  test('should set the factory', () => {
    const resource = new Resource(snippetIri, factory)
    expect(resource.factory).toBe(factory)
  })

  test('should set the fetch', () => {
    const resource = new Resource(snippetIri, factory)
    expect(resource.fetch).toBe(factory.fetch)
  })
})

describe('getSubject', () => {
  test('should return subject of matching statement', () => {
    const resource = new Resource(snippetIri, factory)
    const subjectIri = 'https://some.example/73bd097a-1f96-4724-930d-960144d10b06'
    const property = 'some'
    const namespace = 'https://vocab.example/terms#'
    const predicateNode = DataFactory.namedNode(namespace + property)
    resource.dataset.add(
      DataFactory.quad(
        DataFactory.namedNode(resource.iri),
        INTEROP.hasShapeTree,
        DataFactory.namedNode('https://solidshapes/tree/Something')
      )
    )
    resource.dataset.add(
      DataFactory.quad(
        DataFactory.namedNode(subjectIri),
        predicateNode,
        DataFactory.namedNode(resource.iri)
      )
    )
    const subject = resource.getSubject(property, namespace)
    expect(subject!.value).toBe(subjectIri)
  })
})
