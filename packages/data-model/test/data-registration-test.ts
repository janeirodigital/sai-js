// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { DataRegistration, InteropFactory } from '../src';

const factory = new InteropFactory({ fetch, randomUUID });
const snippetIri = 'https://pro.alice.example/773605f0-b5bf-4d46-878d-5c167eac8b5d';

describe('build', () => {
  test('should return instance of DataRegistration', async () => {
    const dataRegistration = await DataRegistration.build(snippetIri, factory);
    expect(dataRegistration).toBeInstanceOf(DataRegistration);
  });

  test('should fetch its data', async () => {
    const dataRegistration = await DataRegistration.build(snippetIri, factory);
    expect(dataRegistration.dataset.size).toBeGreaterThan(0);
  });

  test('should set iriPrefix', async () => {
    const dataRegistration = await DataRegistration.build(snippetIri, factory);
    const iriPrefix = 'https://pro.alice.example/';
    expect(dataRegistration.iriPrefix).toEqual(iriPrefix);
  });

  test('should set registeredShapeTree', async () => {
    const shapeTreeIri = 'https://solidshapes.example/trees/Project';
    const dataRegistration = await DataRegistration.build(snippetIri, factory);
    expect(dataRegistration.registeredShapeTree).toEqual(shapeTreeIri);
  });

  test('should set contains', async () => {
    const dataRegistration = await DataRegistration.build(snippetIri, factory);
    expect(dataRegistration.contains.length).toBe(2);
    for (const contained of dataRegistration.contains) {
      expect(typeof contained).toBe('string');
    }
  });
});
