// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { randomUUID } from 'crypto';
import { DatasetCore } from '@rdfjs/types';
import { DataGrant, DataInstance, InteropFactory, ReferencesList } from '../src';

const factory = new InteropFactory({ fetch, randomUUID });
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
    const dataGrantIri = 'https://auth.alice.example/cd247a67-0879-4301-abd0-828f63abb252';
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

test.skip('should provide newChildDataInstance method');

describe('delete', () => {
  test('should properly use fetch', async () => {
    const localFactory = new InteropFactory({ fetch: jest.fn(fetch), randomUUID });
    const dataInstance = await localFactory.dataInstance(snippetIri, null);
    await dataInstance.delete();
    expect(localFactory.fetch).toHaveBeenCalledWith(snippetIri, { method: 'DELETE' });
  });
});

describe('update', () => {
  let otherProjectIri: string;
  let differentDataset: DatasetCore;
  beforeAll(async () => {
    otherProjectIri = 'https://pro.alice.example/ccbd77ae-f769-4e07-b41f-5136501e13e7#project';
    differentDataset = (await factory.dataInstance(otherProjectIri, null)).dataset;
  });
  test('should properly use fetch', async () => {
    const localFactory = new InteropFactory({ fetch: jest.fn(fetch), randomUUID });
    const dataInstance = await localFactory.dataInstance(snippetIri, null);
    await dataInstance.update(differentDataset);
    expect(localFactory.fetch).toHaveBeenCalledWith(snippetIri, { method: 'PUT', dataset: differentDataset });
  });

  test('should set updated dataset on the data instance', async () => {
    const localFactory = new InteropFactory({ fetch: jest.fn(fetch), randomUUID });
    const dataInstance = await localFactory.dataInstance(snippetIri, null);
    await dataInstance.update(differentDataset);
    expect(dataInstance.dataset).toBe(differentDataset);
  });
});
