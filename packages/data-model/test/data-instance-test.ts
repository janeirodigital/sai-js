// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { DatasetCore } from '@rdfjs/types';
import { DataGrant, DataInstance, InteropFactory } from '../src';

const factory = new InteropFactory({ fetch, randomUUID });
const snippetIri = 'https://pro.alice.example/7a130c38-668a-4775-821a-08b38f2306fb#project';
const defaultDataGrantIri = 'https://auth.alice.example/cd247a67-0879-4301-abd0-828f63abb252';
let defaultDataGrant: DataGrant;

beforeAll(async () => {
  defaultDataGrant = await factory.dataGrant(defaultDataGrantIri);
});

describe('build', () => {
  test('should fetch its data', async () => {
    const dataInstance = await DataInstance.build(snippetIri, defaultDataGrant, factory);
    expect(dataInstance.dataset.size).toBeGreaterThan(0);
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
  test('should throw if called on child data instance', async () => {
    const dataInstanceIri = 'https://home.alice.example/f950bae5-247c-49b2-a537-b12cda8d5758#task';
    const inheritingDataGrantIri = 'https://auth.alice.example/54b1a123-23ca-4733-9371-700b52b9c567';
    const inheritingDataGrant = await factory.dataGrant(inheritingDataGrantIri);
    const dataInstance = await DataInstance.build(dataInstanceIri, inheritingDataGrant, factory);
    const taskShapeTree = 'https://solidshapes.example/trees/Task';
    expect(() => dataInstance.getChildInstancesIterator(taskShapeTree)).toThrow('can not have child instance');
  });
});

describe('newChildDataInstance', () => {
  test('should provide newChildDataInstance method', async () => {
    const taskShapeTree = 'https://solidshapes.example/trees/Task';
    const accessReceiptIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe';
    const dataGrantIri = 'https://auth.alice.example/cd247a67-0879-4301-abd0-828f63abb252';
    const accessReceipt = await factory.accessReceipt(accessReceiptIri);
    const dataGrant = accessReceipt.hasDataGrant.find((grant) => grant.iri === dataGrantIri) as DataGrant;
    const dataInstance = await DataInstance.build(snippetIri, dataGrant, factory);
    expect(dataInstance.newChildDataInstance(taskShapeTree)).toBeInstanceOf(DataInstance);
  });

  test('should throw if called on child data instance', async () => {
    const dataInstanceIri = 'https://home.alice.example/f950bae5-247c-49b2-a537-b12cda8d5758#task';
    const inheritingDataGrantIri = 'https://auth.alice.example/54b1a123-23ca-4733-9371-700b52b9c567';
    const inheritingDataGrant = await factory.dataGrant(inheritingDataGrantIri);
    const dataInstance = await DataInstance.build(dataInstanceIri, inheritingDataGrant, factory);
    const taskShapeTree = 'https://solidshapes.example/trees/Task';
    expect(() => dataInstance.newChildDataInstance(taskShapeTree)).toThrow('can not have child instance');
  });
});

test('should forward accessMode from the grant', async () => {
  const accessReceiptIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe';
  const dataGrantIri = 'https://auth.alice.example/cd247a67-0879-4301-abd0-828f63abb252';
  const accessReceipt = await factory.accessReceipt(accessReceiptIri);
  const dataGrant = accessReceipt.hasDataGrant.find((grant) => grant.iri === dataGrantIri) as DataGrant;
  const dataInstance = await DataInstance.build(snippetIri, dataGrant, factory);
  expect(dataInstance.accessMode).toEqual(dataGrant.accessMode);
});

describe('delete', () => {
  test('should properly use fetch', async () => {
    const localFactory = new InteropFactory({ fetch: jest.fn(fetch), randomUUID });
    const dataInstance = await localFactory.dataInstance(snippetIri, defaultDataGrant);
    await dataInstance.delete();
    expect(localFactory.fetch).toHaveBeenCalledWith(snippetIri, { method: 'DELETE' });
  });

  test('should throw if failed', async () => {
    const fakeFetch = () => Promise.resolve({ ok: false });
    const localFactory = new InteropFactory({ fetch, randomUUID });
    const dataInstance = await localFactory.dataInstance(snippetIri, defaultDataGrant);
    // @ts-ignore
    dataInstance.fetch = fakeFetch;
    return expect(dataInstance.delete()).rejects.toThrow('failed');
  });
});

describe('update', () => {
  let otherProjectIri: string;
  let differentDataset: DatasetCore;
  beforeAll(async () => {
    otherProjectIri = 'https://pro.alice.example/ccbd77ae-f769-4e07-b41f-5136501e13e7#project';
    differentDataset = (await factory.dataInstance(otherProjectIri, defaultDataGrant)).dataset;
  });
  test('should properly use fetch', async () => {
    const localFactory = new InteropFactory({ fetch: jest.fn(fetch), randomUUID });
    const dataInstance = await localFactory.dataInstance(snippetIri, defaultDataGrant);
    await dataInstance.update(differentDataset);
    expect(localFactory.fetch).toHaveBeenCalledWith(snippetIri, { method: 'PUT', dataset: differentDataset });
  });

  test('should set updated dataset on the data instance', async () => {
    const localFactory = new InteropFactory({ fetch: jest.fn(fetch), randomUUID });
    const dataInstance = await localFactory.dataInstance(snippetIri, defaultDataGrant);
    await dataInstance.update(differentDataset);
    expect(dataInstance.dataset).toBe(differentDataset);
  });

  test('should throw if failed', async () => {
    const fakeFetch = () => Promise.resolve({ ok: false });
    const localFactory = new InteropFactory({ fetch, randomUUID });
    const dataInstance = await localFactory.dataInstance(snippetIri, defaultDataGrant);
    // @ts-ignore
    dataInstance.fetch = fakeFetch;
    return expect(dataInstance.update(differentDataset)).rejects.toThrow('failed');
  });
});
