import { findChildReferences, getPredicate, parseTurtle } from '../src';

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

const projectTurtle = `
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  PREFIX pm: <https://vocab.example/project-management/>
  PREFIX alice-pro: <https://pro.alice.example/>

  alice-pro:ccbd77ae-f769-4e07-b41f-5136501e13e7\\#project
    a pm:Project ;
    rdfs:label "P-Ap-1" ;
    pm:hasTask
      alice-pro:576520a6-af5a-4cf9-8b40-8b1512b59c73\\#task ,
      alice-pro:106a82aa-6911-4a7e-a49b-383cbaa9da66\\#task .
`;

describe('findChildReferences', () => {
  test('should find correct references', async () => {
    const projejectIri = 'https://pro.alice.example/ccbd77ae-f769-4e07-b41f-5136501e13e7#project';
    const dataset = await parseTurtle(projectTurtle);
    const shapeIri = 'https://solidshapes.example/shapes/Project';
    const taskReferences = findChildReferences(projejectIri, dataset, shapeIri, shapeText, shapePath);
    expect(taskReferences).toContain('https://pro.alice.example/576520a6-af5a-4cf9-8b40-8b1512b59c73#task');
    expect(taskReferences).toContain('https://pro.alice.example/106a82aa-6911-4a7e-a49b-383cbaa9da66#task');
  });
});

describe('getPredicate', () => {
  test('should get correct predicate', () => {
    expect(getPredicate(shapePath, shapeText)).toBe('https://vocab.example/project-management/hasTask');
  });
});
