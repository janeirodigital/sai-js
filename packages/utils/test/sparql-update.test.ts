import { expect, test } from 'vitest'
import { deletePatch, insertPatch, parseTurtle, serializeTurtle } from '../src'

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

test('insertPatch', async () => {
  const dataset = await parseTurtle(snippet)
  const patch = await insertPatch(dataset)
  const expected = `INSERT DATA { ${await serializeTurtle(dataset)} }`
  expect(patch).toBe(expected)
})

test('deletePatch', async () => {
  const dataset = await parseTurtle(snippet)
  const patch = await deletePatch(dataset)
  const expected = `DELETE DATA { ${await serializeTurtle(dataset)} }`
  expect(patch).toBe(expected)
})
