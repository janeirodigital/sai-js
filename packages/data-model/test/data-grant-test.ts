// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { randomUUID } from 'crypto';
import { ACL } from 'interop-namespaces';
import {
  AccessReceipt,
  InteropFactory,
  AbstractDataGrant,
  DataGrant,
  InheritableRemoteDataGrant,
  AllRemoteFromAgentDataGrant
} from '../src';

const factory = new InteropFactory({ fetch, randomUUID });
const dataGrantIri = 'https://auth.alice.example/cd247a67-0879-4301-abd0-828f63abb252';
const accessReceiptIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe';
let accessReceipt: AccessReceipt;

beforeAll(async () => {
  accessReceipt = await factory.accessReceipt(accessReceiptIri);
});

test('should set the iri', async () => {
  const dataGrant = await factory.dataGrant(dataGrantIri);
  expect(dataGrant.iri).toBe(dataGrantIri);
});

test('should set the factory', async () => {
  const dataGrant = await factory.dataGrant(dataGrantIri);
  expect(dataGrant.factory).toBe(factory);
});

test('should set registeredShapeTree', async () => {
  const dataGrant = await factory.dataGrant(dataGrantIri);
  const projectShapeTree = 'https://solidshapes.example/trees/Project';
  expect(dataGrant.registeredShapeTree).toBe(projectShapeTree);
});

describe('calculateEffectiveAccessMode', () => {
  test('should calculate proper mode when no remote data grant', async () => {
    const dataGrant = accessReceipt.hasDataGrant.find((grant) => grant.iri === dataGrantIri) as DataGrant;
    const accessMode = AbstractDataGrant.calculateEffectiveAccessMode(dataGrant);
    expect(accessMode.includes(ACL.Write.value)).toBeTruthy();
  });

  test('should calculate proper mode with remote data grant', async () => {
    const freshFactory = new InteropFactory({ fetch, randomUUID });
    const remoteDataGrantIri = 'https://auth.alice.example/a691ee69-97d8-45c0-bb03-8e887b2db806';
    const remoteDataGrant = (await freshFactory.dataGrant(remoteDataGrantIri)) as InheritableRemoteDataGrant;
    const localDataGrantIri = 'https://auth.acme.example/f8064946-cb67-469a-8b28-652fd17090f6';
    const localDataGrant = (await freshFactory.dataGrant(localDataGrantIri, remoteDataGrant)) as DataGrant;
    const accessMode = AbstractDataGrant.calculateEffectiveAccessMode(localDataGrant);
    expect(accessMode.includes(ACL.Write.value)).toBeFalsy();
  });

  test.skip('should calculate proper mode with remote access mode broader than local', async () => {
    const freshFactory = new InteropFactory({ fetch, randomUUID });
    const accessMode = [] as any[];
    expect(accessMode.includes(ACL.Write.value)).toBeFalsy();
  });
});
