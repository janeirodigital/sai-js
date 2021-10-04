// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { parseTurtle } from '@janeirodigital/interop-utils';
import { randomUUID } from 'crypto';
import { ReadableApplicationRegistration, BaseFactory } from '../src';

describe('constructor', () => {
  it('should set fetch', () => {
    const factory = new BaseFactory({ fetch, randomUUID });
    expect(factory.fetch).toBe(fetch);
  });
});

test('builds application registration', async () => {
  const factory = new BaseFactory({ fetch, randomUUID });
  const applicationRegistrationUrl = 'https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659';
  const applicationRegistration = await factory.readable.applicationRegistration(applicationRegistrationUrl);
  expect(applicationRegistration).toBeInstanceOf(ReadableApplicationRegistration);
});

test('throws for grant with invalid scope', async () => {
  const invalidGrantDataset = await parseTurtle(`
    PREFIX interop: <http://www.w3.org/ns/solid/interop#>
    PREFIX foo: <https://foo.example/>
    foo:bar interop:scopeOfGrant interop:NonExistingScope .
  `);
  const fakeFetch = () => Promise.resolve({ dataset: () => invalidGrantDataset, ok: true });
  // @ts-ignore
  const factory = new BaseFactory({ fetch: fakeFetch, randomUUID });
  return expect(factory.readable.dataGrant('https://foo.example/bar')).rejects.toThrow('Unknown scope');
});
