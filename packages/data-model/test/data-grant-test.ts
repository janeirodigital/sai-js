// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { AccessReceipt, DataGrant, InteropFactory } from '../src';

const factory = new InteropFactory(fetch);
const dataGrantIri = 'https://auth.alice.example/3fcef0f6-5807-4f1b-b77a-63d64df25a69#data-grant-project-pro';
const accessReceiptIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe';
let accessReceipt: AccessReceipt;

beforeAll(async () => {
  accessReceipt = await factory.accessReceipt(accessReceiptIri);
});

describe('constructor', () => {
  test('should set the iri', () => {
    const dataGrant = new DataGrant(dataGrantIri, accessReceipt, factory);
    expect(dataGrant.iri).toBe(dataGrantIri);
  });

  test('should set the factory', () => {
    const dataGrant = new DataGrant(dataGrantIri, accessReceipt, factory);
    expect(dataGrant.factory).toBe(factory);
  });

  test('should set the accessReceipt', () => {
    const dataGrant = new DataGrant(dataGrantIri, accessReceipt, factory);
    expect(dataGrant.accessReceipt).toBe(accessReceipt);
  });

  test('should extract subset of dataset', () => {
    const dataGrant = new DataGrant(dataGrantIri, accessReceipt, factory);
    expect(dataGrant.dataset.size).toBeGreaterThan(0);
    expect(dataGrant.dataset.size).toBeLessThan(accessReceipt.dataset.size);
  });

  test('should set inheritsFromGrantIri', () => {
    const inheritingGrantIri = 'https://auth.alice.example/3fcef0f6-5807-4f1b-b77a-63d64df25a69#data-grant-task-pro';
    const dataGrant = new DataGrant(inheritingGrantIri, accessReceipt, factory);
    expect(dataGrant.inheritsFromGrantIri).toBe(dataGrantIri);
  });

  test('should set inheritsFromGrantIri undefined if not inheriting', () => {
    const dataGrant = new DataGrant(dataGrantIri, accessReceipt, factory);
    expect(dataGrant.inheritsFromGrantIri).toBeUndefined();
  });
});