import { randomUUID } from 'crypto';
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest, describe, test, expect } from '@jest/globals';
// eslint-disable-next-line import/no-extraneous-dependencies
import { statelessFetch } from '@janeirodigital/interop-test-utils';
import { ReadableApplicationRegistration, DataOwner } from '@janeirodigital/interop-data-model';
import { RdfResponse } from '@janeirodigital/interop-utils';

import { Application } from '../src';

const webId = 'https://alice.example/#id';
const applicationId = 'https://projectron.example/';

const linkString = `
  <https://projectron.example/#app>;
  anchor="https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659";
  rel="http://www.w3.org/ns/solid/interop#registeredAgent"
`;

describe('applicatrion registration exists', () => {
  const mocked = jest.fn(statelessFetch);
  const responseMock = {
    ok: true,
    headers: { get: (name: string): string | null => (name === 'Link' ? linkString : null) }
  } as unknown as RdfResponse;
  responseMock.clone = () => ({ ...responseMock });

  test('should build application registration if discovered', async () => {
    mocked.mockResolvedValueOnce(await statelessFetch(webId)).mockResolvedValueOnce(responseMock);
    const app = await Application.build(webId, applicationId, { fetch: mocked, randomUUID });
    expect(app.hasApplicationRegistration).toBeInstanceOf(ReadableApplicationRegistration);
  });

  test('should have dataOwners getter', async () => {
    mocked.mockResolvedValueOnce(await statelessFetch(webId)).mockResolvedValueOnce(responseMock);
    const app = await Application.build(webId, applicationId, { fetch: mocked, randomUUID });
    expect(app.dataOwners).toHaveLength(3);
    for (const owner of app.dataOwners) {
      expect(owner).toBeInstanceOf(DataOwner);
    }
  });
});
describe('discovery helpers', () => {
  const expectedRedirectUriBase = 'https://auth.example/authorize';
  const mocked = jest.fn(statelessFetch);
  const responseMock = { ok: true, headers: { get: (): null => null } } as unknown as RdfResponse;
  responseMock.clone = () => ({ ...responseMock });

  test('should not build appliction registration if not discovered', async () => {
    mocked.mockResolvedValueOnce(await statelessFetch(webId)).mockResolvedValueOnce(responseMock);
    const app = await Application.build(webId, applicationId, { fetch: mocked, randomUUID });
    expect(app.hasApplicationRegistration).toBeUndefined();
  });

  test('should have authorizationRedirectEndpoint discovered', async () => {
    mocked.mockResolvedValueOnce(await statelessFetch(webId)).mockResolvedValueOnce(responseMock);
    const app = await Application.build(webId, applicationId, { fetch: mocked, randomUUID });
    expect(app.authorizationRedirectEndpoint).toBe(expectedRedirectUriBase);
  });

  test('should have correct authorizationRedirectUri', async () => {
    mocked.mockResolvedValueOnce(await statelessFetch(webId)).mockResolvedValueOnce(responseMock);
    const app = await Application.build(webId, applicationId, { fetch: mocked, randomUUID });
    expect(app.authorizationRedirectUri).toBe(
      `${expectedRedirectUriBase}?client_id=${encodeURIComponent(applicationId)}`
    );
  });

  test('should have dataOwners getter returning an empty array', async () => {
    mocked.mockResolvedValueOnce(await statelessFetch(webId)).mockResolvedValueOnce(responseMock);
    const app = await Application.build(webId, applicationId, { fetch: mocked, randomUUID });
    expect(app.dataOwners).toHaveLength(0);
  });

  // TODO: refactor to be independent from order of query parameters
  test('should provide shareUri', async () => {
    mocked.mockResolvedValueOnce(await statelessFetch(webId)).mockResolvedValueOnce(responseMock);
    const app = await Application.build(webId, applicationId, { fetch: mocked, randomUUID });
    const resourceUri = 'some-resource-uri';
    const shareUri = app.getShareUri(resourceUri);
    expect(shareUri).toBe(
      `${expectedRedirectUriBase}?resource=${encodeURIComponent(resourceUri)}&client_id=${encodeURIComponent(
        applicationId
      )}`
    );
  });
});
