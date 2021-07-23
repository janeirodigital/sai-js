// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { randomUUID } from 'crypto';
import { INTEROP } from 'interop-namespaces';
import { AccessReceipt, DataInstance, InteropFactory, InheritInstancesDataGrant, AbstractDataGrant } from '../src';

const factory = new InteropFactory({ fetch, randomUUID });
const selectedInstancesDataGrantIri = 'https://auth.alice.example/cd247a67-0879-4301-abd0-828f63abb252';
const accessReceiptIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe';

const inheritsFromSelectedInstancesIri = 'https://auth.alice.example/9827ae00-2778-4655-9f22-08bb9daaee26';
const inheritsFromAllInstancesIri = 'https://auth.alice.example/54b1a123-23ca-4733-9371-700b52b9c567';

let accessReceipt: AccessReceipt;

beforeAll(async () => {
  accessReceipt = await factory.accessReceipt(accessReceiptIri);
});

test('should use correct subclass', async () => {
  const dataGrant = await factory.dataGrant(inheritsFromSelectedInstancesIri);
  expect(dataGrant).toBeInstanceOf(InheritInstancesDataGrant);
});

test('should set correct scopeOfGrant', async () => {
  const dataGrant = await factory.dataGrant(inheritsFromSelectedInstancesIri);
  expect(dataGrant.scopeOfGrant).toEqualRdfTerm(INTEROP.InheritInstances);
});

test('should set inheritsFromGrantIri', async () => {
  const dataGrant = (await factory.dataGrant(inheritsFromSelectedInstancesIri)) as unknown as InheritInstancesDataGrant;
  expect(dataGrant.inheritsFromGrantIri).toBe(selectedInstancesDataGrantIri);
});

test('should set inheritsFromGrant', async () => {
  const dataGrant = (await factory.dataGrant(inheritsFromSelectedInstancesIri)) as unknown as InheritInstancesDataGrant;
  expect(dataGrant.inheritsFromGrant).toBeInstanceOf(AbstractDataGrant);
});

test('should provide data instance iterator for InheritInstances of AllInstances', async () => {
  const inheritingGrant = accessReceipt.hasDataGrant.find((grant) => grant.iri === inheritsFromAllInstancesIri);
  let count = 0;
  for await (const instance of inheritingGrant.getDataInstanceIterator()) {
    expect(instance).toBeInstanceOf(DataInstance);
    count += 1;
  }
  expect(count).toBe(2);
});

test('should provide data instance iterator for InheritInstances of SelectedInstances', async () => {
  const inheritingGrant = accessReceipt.hasDataGrant.find((grant) => grant.iri === inheritsFromSelectedInstancesIri);
  let count = 0;
  for await (const instance of inheritingGrant.getDataInstanceIterator()) {
    expect(instance).toBeInstanceOf(DataInstance);
    count += 1;
  }
  expect(count).toBe(1);
});
