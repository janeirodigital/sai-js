// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { DataInstance, InteropFactory, ReferencesList } from '../src';

const factory = new InteropFactory(fetch);
const snippetIri = 'https://home.alice.example/0fd3daa3-dd6b-4484-826b-9ebaef099241#project';

describe('build', () => {
  test('should fetch its data', async () => {
    const dataInstance = await DataInstance.build(snippetIri, factory);
    expect(dataInstance.dataset.size).toBeGreaterThan(0);
  });
});

describe('getReferencesListForShapeTree', () => {
  test('should return a ReferencesList', async () => {
    const shapeTree = 'https://solidshapes.example/trees/Task';
    const dataInstance = await DataInstance.build(snippetIri, factory);
    const result = await dataInstance.getReferencesListForShapeTree(shapeTree);
    expect(result).toBeInstanceOf(ReferencesList);
  });
});

describe('getChildInstancesIterator', () => {
  test('should iterate over children data instances', async () => {
    const shapeTree = 'https://solidshapes.example/trees/Task';
    const dataInstance = await DataInstance.build(snippetIri, factory);
    let count = 0;
    for await (const child of dataInstance.getChildInstancesIterator(shapeTree)) {
      expect(child).toBeInstanceOf(DataInstance);
      count += 1;
    }
    expect(count).toBe(2);
  });
});
