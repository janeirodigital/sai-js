// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { findChildReferences, getPredicate } from '../src';

const projectSchemaIri = 'https://solidshapes.example/shapes/Project';
const shapePath = '@<https://solidshapes.example/shapes/Project>~<https://vocab.example/project-management/hasTask>';

describe('findChildReferences', () => {
  test.todo('should find correct references');
});

describe('getPredicate', () => {
  test('should get correct predicate', async () => {
    const shapePathText = await (await fetch(projectSchemaIri)).text();
    expect(getPredicate(shapePath, shapePathText)).toBe('https://vocab.example/project-management/hasTask');
  });
});
