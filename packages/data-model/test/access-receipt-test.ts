// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { AccessReceipt, DataGrant, InteropFactory } from '../src';

const factory = new InteropFactory(fetch);
const snippetIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe';

describe('build', () => {
  test('should return instance of Access Receipt', async () => {
    const accessReceipt = await AccessReceipt.build(snippetIri, factory);
    expect(accessReceipt).toBeInstanceOf(AccessReceipt);
  });

  test('should fetch its data', async () => {
    const accessReceipt = await AccessReceipt.build(snippetIri, factory);
    expect(accessReceipt.dataset.size).toBeGreaterThan(0);
  });

  test('should build data grants', async () => {
    const accessReceipt = await AccessReceipt.build(snippetIri, factory);
    expect(accessReceipt.hasDataGrant.length).toBe(8);
    for (const grant of accessReceipt.hasDataGrant) {
      expect(grant).toBeInstanceOf(DataGrant);
    }
  });

  test('should link inheriting grants', async () => {
    const accessReceipt = await AccessReceipt.build(snippetIri, factory);
    for (const grant of accessReceipt.hasDataGrant) {
      if (grant.inheritsFromGrantIri) {
        expect(grant.inheritsFromGrant).toBeInstanceOf(DataGrant);
        expect(grant.inheritsFromGrant.iri).toBe(grant.inheritsFromGrantIri);
      }
    }
  });
});
