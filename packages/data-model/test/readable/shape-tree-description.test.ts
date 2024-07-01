import { test } from 'vitest';
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { expect } from '../expect';
import { ApplicationFactory, ReadableShapeTreeDescription } from '../../src';

const factory = new ApplicationFactory({ fetch, randomUUID });
const snippetIri = 'https://solidshapes.example/trees/desc-en#Project';

test('getters', async () => {
  const description = await ReadableShapeTreeDescription.build(snippetIri, factory);
  expect(description.label).toBe('Projects');
  expect(description.definition).toBe('Creative processes with specific goals');
});
