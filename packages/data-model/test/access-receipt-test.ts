// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { AccessGrant, AbstractDataGrant, InteropFactory } from '../src';

const factory = new InteropFactory({ fetch, randomUUID });
const snippetIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe';

describe('build', () => {
  test('should return instance of Access Receipt', async () => {
    const accessGrant = await AccessGrant.build(snippetIri, factory);
    expect(accessGrant).toBeInstanceOf(AccessGrant);
  });

  test('should fetch its data', async () => {
    const accessGrant = await AccessGrant.build(snippetIri, factory);
    expect(accessGrant.dataset.size).toBeGreaterThan(0);
  });

  test('should build data grants', async () => {
    const accessGrant = await AccessGrant.build(snippetIri, factory);
    expect(accessGrant.hasDataGrant.length).toBe(10);
    for (const grant of accessGrant.hasDataGrant) {
      expect(grant).toBeInstanceOf(AbstractDataGrant);
    }
  });
});
