// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { DataRegistration, InteropFactory } from '../src';

const factory = new InteropFactory(fetch);
const snippetIri = 'https://pro.alice.example/773605f0-b5bf-4d46-878d-5c167eac8b5d';

describe('build', () => {
  test('should return instance of DataRegistration', async () => {
    const applicationRegistration = await DataRegistration.build(snippetIri, factory);
    expect(applicationRegistration).toBeInstanceOf(DataRegistration);
  });

  test('should fetch its data', async () => {
    const applicationRegistration = await DataRegistration.build(snippetIri, factory);
    expect(applicationRegistration.dataset.size).toBeGreaterThan(0);
  });

  test('should set registeredShapeTree', async () => {
    const shapeTreeIri = 'https://solidshapes.example/trees/Project';
    const dataRegistration = await DataRegistration.build(snippetIri, factory);
    expect(dataRegistration.registeredShapeTree).toEqual(shapeTreeIri);
  });
});
