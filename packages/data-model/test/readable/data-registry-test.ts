// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { AuthorizationAgentFactory, ReadableDataRegistration } from '../../src';

const factory = new AuthorizationAgentFactory({ fetch, randomUUID });
const snippetIri = 'https://home.alice.example/2d3d97b4-a26d-434e-afa2-e3bc8e8e2b56';

test('hasRegistration', async () => {
  const dataRegistry = await factory.readable.dataRegistry(snippetIri);
  expect(dataRegistry.hasRegistration).toHaveLength(2);
});

test('registrations', async () => {
  const dataRegistry = await factory.readable.dataRegistry(snippetIri);
  let count = 0;
  for await (const registration of dataRegistry.registrations) {
    expect(registration).toBeInstanceOf(ReadableDataRegistration);
    count += 1;
  }
  expect(count).toBe(2);
});
