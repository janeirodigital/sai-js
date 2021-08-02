// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { randomUUID } from 'crypto';
import { DataOwner, AccessReceipt, InteropFactory } from '../src';

const factory = new InteropFactory({ fetch, randomUUID });
const snippetIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe';

test('should select Registrations', async () => {
  const accessReceipt = await AccessReceipt.build(snippetIri, factory);
  const webid = 'https://acme.example/#corp';
  const dataOwner = new DataOwner(webid);
  dataOwner.issuedGrants = accessReceipt.hasDataGrant.filter((grant) => grant.dataOwner === webid);
  const shapeTree = 'https://solidshapes.example/trees/Project';
  expect(dataOwner.selectRegistrations(shapeTree).length).toBe(2);
});
