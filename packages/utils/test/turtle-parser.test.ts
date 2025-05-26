import { describe, expect, test } from 'vitest'
import { parseTurtle } from '../src'

const snippet = `
  @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
  @prefix interop: <http://www.w3.org/ns/solid/interop#> .
  @prefix solidtrees: <https://solidshapes.example/trees/> .
  @prefix acme: <https://acme.example/> .
  acme:4d594c61-7cff-484a-a1d2-1f353ee4e1e7
    a interop:DataRegistration ;
    interop:registeredBy <https://garry.example/#id> ;
    interop:registeredWith <https://solidmin.example/#app> ;
    interop:registeredAt "2020-08-23T21:12:27.000Z"^^xsd:dateTime ;
    interop:registeredShapeTree solidtrees:Project .
`

describe('Turtle parser', () => {
  test('creates an empty dataset when no input is given', async () => {
    const dataset = await parseTurtle('')
    expect(dataset.size).toEqual(0)
  })

  test('uses DefaultGraph is none is provided', async () => {
    const dataset = await parseTurtle(snippet)
    expect(dataset.size).toBeGreaterThan(1)
    for (const quad of dataset) {
      expect(quad.graph.termType).toEqual('DefaultGraph')
    }
  })

  test('uses default graph as graph IRI even if source was given', async () => {
    const source = 'https://acme.example/4d594c61-7cff-484a-a1d2-1f353ee4e1e7'
    const dataset = await parseTurtle(snippet, source)
    expect(dataset.size).toBeGreaterThan(1)
    for (const quad of dataset) {
      expect(quad.graph.termType).toBe('DefaultGraph')
    }
  })

  test('should reject for invalid turtle', async () => {
    const incorrectSnippet = 'This is not valid turtle!'
    expect(parseTurtle(incorrectSnippet)).rejects.toBeTruthy()
  })

  test('should use source as fallback base', async () => {
    const noBaseSnippet = `
      <> a <Some> .
    `
    const source = 'https://some.example/'
    const dataset = await parseTurtle(noBaseSnippet, source)
    const quad = [...dataset][0]
    expect(quad.subject.value).toBe(source)
    expect(quad.object.value).toBe(`${source}Some`)
  })

  test('should use embeded base over source', async () => {
    const embeddedBase = 'https://embeded.example/'
    const withBaseSnippet = `
      BASE <${embeddedBase}>
      <> a <Some> .
    `
    const source = 'https://some.example/'
    const dataset = await parseTurtle(withBaseSnippet, source)
    const quad = [...dataset][0]
    expect(quad.subject.value).toBe(embeddedBase)
    expect(quad.object.value).toBe(`${embeddedBase}Some`)
  })
})
