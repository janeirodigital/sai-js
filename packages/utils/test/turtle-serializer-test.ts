import { DataFactory, Store } from 'n3'
import { describe, expect, test } from 'vitest'
import { parseTurtle, serializeTurtle } from '../src'

const snippet = `<https://acme.example/4d594c61-7cff-484a-a1d2-1f353ee4e1e7> a <http://www.w3.org/ns/solid/interop#DataRegistration>;
    <http://www.w3.org/ns/solid/interop#registeredBy> <https://garry.example/#id>;
    <http://www.w3.org/ns/solid/interop#registeredWith> <https://solidmin.example/#app>;
    <http://www.w3.org/ns/solid/interop#registeredAt> "2020-08-23T21:12:27.000Z"^^<http://www.w3.org/2001/XMLSchema#dateTime>;
    <http://www.w3.org/ns/solid/interop#registeredShapeTree> <https://solidshapes.example/trees/Project>.
`

describe('serializer', () => {
  test('should serialize dataset', async () => {
    const dataset = await parseTurtle(snippet)
    const text = await serializeTurtle(dataset)
    expect(text).toMatch(snippet)
  })

  test('should serialize dataset with stripped named graph as ttl', async () => {
    const q = DataFactory.quad(
      DataFactory.namedNode('s'),
      DataFactory.namedNode('p'),
      DataFactory.namedNode('o'),
      DataFactory.namedNode('g')
    )
    const dataset = new Store([q])

    const text = await serializeTurtle(dataset, true)

    expect(text).toMatch('<s> <p> <o>.')
  })

  test('should serialize dataset named graph as trig', async () => {
    const q = DataFactory.quad(
      DataFactory.namedNode('s'),
      DataFactory.namedNode('p'),
      DataFactory.namedNode('o'),
      DataFactory.namedNode('g')
    )
    const dataset = new Store([q])

    const text = await serializeTurtle(dataset)

    expect(text).toMatch(`<g> {
<s> <p> <o>
}`)
  })
})

test.todo('should reject for invalid dataset')
