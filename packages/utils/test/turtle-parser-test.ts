import { parseTurtle } from '../src';

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
`;

describe('Turtle parser', () => {
  test('creates an empty dataset when no input is given', async () => {
    const dataset = await parseTurtle('');
    expect(dataset.size).toEqual(0);
  });

  test('uses DefaultGraph is none is provided', async () => {
    const dataset = await parseTurtle(snippet);
    expect(dataset.size).toBeGreaterThan(1);
    for (const quad of dataset) {
      expect(quad.graph.termType).toEqual('DefaultGraph');
    }
  });

  test('uses source as graph IRI if one given', async () => {
    const source = 'https://acme.example/4d594c61-7cff-484a-a1d2-1f353ee4e1e7';
    const dataset = await parseTurtle(snippet, source);
    expect(dataset.size).toBeGreaterThan(1);
    for (const quad of dataset) {
      expect(quad.graph.value).toEqual(source);
    }
  });
});
