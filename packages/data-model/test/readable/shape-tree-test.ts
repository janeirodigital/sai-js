// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { ReadableShapeTree, ApplicationFactory } from '../../src';

const factory = new ApplicationFactory({ fetch, randomUUID });
const snippetIri = 'https://solidshapes.example/trees/Project';

test('factory should build a shape tree', async () => {
  const shapeTree = await factory.readable.shapeTree(snippetIri);
  expect(shapeTree).toBeInstanceOf(ReadableShapeTree);
});

test('factory should always use the same instance for the same shape tree', async () => {
  const shapeTreeA = await factory.readable.shapeTree(snippetIri);
  const shapeTreeB = await factory.readable.shapeTree(snippetIri);
  expect(shapeTreeA).toBe(shapeTreeB);
});

test('should allow to get shape path for a referenced tree', async () => {
  const shapeTree = await factory.readable.shapeTree(snippetIri);
  const taskTreeIri = 'https://solidshapes.example/trees/Task';
  const expectedShapePath =
    '@<https://solidshapes.example/shapes/Project>~<https://vocab.example/project-management/hasTask>';
  const shapePathToTask = shapeTree.getShapePathForReferenced(taskTreeIri);
  expect(shapePathToTask).toBe(expectedShapePath);
});
