import { getPredicate } from '../src';

const shapePath = '@<https://solidshapes.example/shapes/Project>~<https://vocab.example/project-management/hasTask>';
const shapeText = `
  PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  PREFIX solidshapes: <https://solidshapes.example/shapes/>
  PREFIX pm: <https://vocab.example/project-management/>

  solidshapes:Project {
    a [ pm:Project ] ;
    rdfs:label xsd:string ;
    pm:hasTask IRI *
  }
`;

describe('findChildReferences', () => {
  test.todo('should find correct references');
});

describe('getPredicate', () => {
  test('should get correct predicate', async () => {
    expect(getPredicate(shapePath, shapeText)).toBe('https://vocab.example/project-management/hasTask');
  });
});
