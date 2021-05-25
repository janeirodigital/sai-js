import { parse } from 'interop-client'
import { DataRegistration } from '../src/data-registration'


const snippet = `
  @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
  @prefix interop: <http://www.w3.org/ns/solid/interop#> .
  @prefix solidtrees: <https://solidshapes.example/trees/> .
  @prefix solidshapes: <https://solidshapes.example/shapes/> .
  @prefix acme: <https://acme.example/> .
  acme:4d594c61-7cff-484a-a1d2-1f353ee4e1e7
    a interop:DataRegistration ;
    interop:registeredBy <https://garry.example/#id> ;
    interop:registeredWith <https://solidmin.example/#app> ;
    interop:registeredAt "2020-08-23T21:12:27.000Z"^^xsd:dateTime ;
    interop:registeredShapeTree solidtrees:Project .
`

test('DataRegistration has registeredShapeTree', async () => {
  const dataset = await parse(snippet)
  const registration = new DataRegistration(dataset)
  expect(registration.registeredShapeTree).toEqual('https://solidshapes.example/trees/Project')
})
