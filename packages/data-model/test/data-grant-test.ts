// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
import { INTEROP } from 'interop-namespaces';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { AccessReceipt, DataGrant, DataInstance, InteropFactory } from '../src';

const factory = new InteropFactory(fetch);
const dataGrantIri = 'https://auth.alice.example/3fcef0f6-5807-4f1b-b77a-63d64df25a69#data-grant-project-pro';
const accessReceiptIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe';
let accessReceipt: AccessReceipt;

beforeAll(async () => {
  accessReceipt = await factory.accessReceipt(accessReceiptIri);
});

test('should set the iri', async () => {
  const dataGrant = await factory.dataGrant(dataGrantIri, accessReceipt);
  expect(dataGrant.iri).toBe(dataGrantIri);
});

test('should set the factory', async () => {
  const dataGrant = await factory.dataGrant(dataGrantIri, accessReceipt);
  expect(dataGrant.factory).toBe(factory);
});

test('should extract subset of dataset', async () => {
  const dataGrant = await factory.dataGrant(dataGrantIri, accessReceipt);
  expect(dataGrant.dataset.size).toBeGreaterThan(0);
  expect(dataGrant.dataset.size).toBeLessThan(accessReceipt.dataset.size);
});

test('should set registeredShapeTree', async () => {
  const dataGrant = await factory.dataGrant(dataGrantIri, accessReceipt);
  const projectShapeTree = 'https://solidshapes.example/trees/Project';
  expect(dataGrant.registeredShapeTree).toBe(projectShapeTree);
});
