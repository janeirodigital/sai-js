import type { DatasetCore } from '@rdfjs/types'
import { DataFactory } from 'n3'
import { beforeAll, describe, expect, test } from 'vitest'
import { getAllMatchingQuads, getOneMatchingQuad, parseTurtle } from '../src'

const snippet = `
  @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
  @prefix interop: <http://www.w3.org/ns/solid/interop#> .
  @prefix solidtrees: <https://solidshapes.example/trees/> .
  @prefix acme: <https://acme.example/> .
  acme:4d594c61-7cff-484a-a1d2-1f353ee4e1e7
    a interop:DataRegistration ;
    interop:registeredBy <https://garry.example/#id>, <https://jane.example/#id> ;
    interop:registeredWith <https://solidmin.example/#app> ;
    interop:registeredAt "2020-08-23T21:12:27.000Z"^^xsd:dateTime ;
    interop:registeredShapeTree solidtrees:Project .
`

let dataset: DatasetCore

describe('getOneMatchingQuad', () => {
  beforeAll(async () => {
    dataset = await parseTurtle(snippet)
  })

  test('should return quad if matching exists', () => {
    const quadPattern = [
      null,
      DataFactory.namedNode('http://www.w3.org/ns/solid/interop#registeredAt'),
    ]
    const quad = getOneMatchingQuad(dataset, ...quadPattern)
    expect(quad.object.value).toBe('2020-08-23T21:12:27.000Z')
  })
})

describe('getAllMatchingQuads', () => {
  test('should return array of quads if matches exists', () => {
    const quadPattern = [
      null,
      DataFactory.namedNode('http://www.w3.org/ns/solid/interop#registeredBy'),
    ]
    const quads = getAllMatchingQuads(dataset, ...quadPattern)
    expect(quads.length).toBe(2)
  })
})
