import { randomUUID } from 'crypto';
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
// eslint-disable-next-line import/no-extraneous-dependencies
import { statelessFetch } from '@janeirodigital/interop-test-utils';
import { ReadableApplicationRegistration, DataOwner } from '@janeirodigital/interop-data-model';
import { RdfResponse } from '@janeirodigital/interop-utils';
import { Application } from '../src';

const webId = 'https://alice.example/#id';
const linkString = `
  <https://projectron.example/#app>;
  anchor="https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659";
  rel="http://www.w3.org/ns/solid/interop#registeredAgent"
`;

test('should build application registration', async () => {
  const mocked = jest.fn(statelessFetch);
  const responseMock = {
    ok: true,
    headers: { get: (name: string): string | null => (name === 'Link' ? linkString : null) }
  } as unknown as RdfResponse;
  responseMock.clone = () => ({ ...responseMock });
  mocked.mockResolvedValueOnce(await statelessFetch(webId)).mockResolvedValueOnce(responseMock);
  const app = await Application.build(webId, { fetch: mocked, randomUUID });
  expect(app.hasApplicationRegistration).toBeInstanceOf(ReadableApplicationRegistration);
});

test('should throw if no appliction registration', async () => {
  const mocked = jest.fn(statelessFetch);
  const responseMock = { ok: true, headers: { get: (): null => null } } as unknown as RdfResponse;
  responseMock.clone = () => ({ ...responseMock });
  mocked.mockResolvedValueOnce(await statelessFetch(webId)).mockResolvedValueOnce(responseMock);
  expect(Application.build(webId, { fetch: mocked, randomUUID })).rejects.toThrow('support planned');
});

test('should have dataOwners getter', async () => {
  const mocked = jest.fn(statelessFetch);
  const responseMock = {
    ok: true,
    headers: { get: (name: string): string | null => (name === 'Link' ? linkString : null) }
  } as unknown as RdfResponse;
  responseMock.clone = () => ({ ...responseMock });
  mocked.mockResolvedValueOnce(await statelessFetch(webId)).mockResolvedValueOnce(responseMock);
  const app = await Application.build(webId, { fetch: mocked, randomUUID });
  expect(app.dataOwners).toHaveLength(3);
  for (const owner of app.dataOwners) {
    expect(owner).toBeInstanceOf(DataOwner);
  }
});
