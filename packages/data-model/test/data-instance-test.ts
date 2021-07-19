// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { DataGrant, DataInstance, InteropFactory, ReferencesList } from '../src';

const factory = new InteropFactory(fetch);
const snippetIri = 'https://pro.alice.example/7a130c38-668a-4775-821a-08b38f2306fb#project';

describe('build', () => {
  test('should fetch its data', async () => {
    const dataInstance = await DataInstance.build(snippetIri, null, factory);
    expect(dataInstance.dataset.size).toBeGreaterThan(0);
  });
});

describe('getReferencesListForShapeTree', () => {
  test('should return a ReferencesList', async () => {
    const shapeTree = 'https://solidshapes.example/trees/Task';
    const dataInstance = await DataInstance.build(snippetIri, null, factory);
    const result = await dataInstance.getReferencesListForShapeTree(shapeTree);
    expect(result).toBeInstanceOf(ReferencesList);
  });
});

describe('getChildInstancesIterator', () => {
  test('should iterate over children data instances', async () => {
    const accessReceiptIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe';
    const dataGrantIri = 'https://auth.alice.example/9827ae00-2778-4655-9f22-08bb9daaee26';
    const accessReceipt = await factory.accessReceipt(accessReceiptIri);
    const dataGrant = accessReceipt.hasDataGrant.find((grant) => grant.iri === dataGrantIri) as DataGrant;
    const taskShapeTree = 'https://solidshapes.example/trees/Task';
    const dataInstance = await DataInstance.build(snippetIri, dataGrant, factory);
    let count = 0;
    for await (const child of dataInstance.getChildInstancesIterator(taskShapeTree)) {
      expect(child).toBeInstanceOf(DataInstance);
      count += 1;
    }
    expect(count).toBe(1);
  });
});
