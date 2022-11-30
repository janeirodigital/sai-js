// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
// eslint-disable-next-line import/no-extraneous-dependencies
import { statelessFetch, fetch } from '@janeirodigital/interop-test-utils';
import {
  RdfResponse,
  discoverAuthorizationAgent,
  discoverAgentRegistration,
  discoverAuthorizationRedirectEndpoint
} from '../src';

const webId = 'https://alice.example/#id';
const authorizationAgentIri = 'https://auth.alice.example/';

describe('discoverAuthorizationAgent', () => {
  test('should discover Authorization Agent from the WebID document', async () => {
    const iri = await discoverAuthorizationAgent(webId, fetch);
    expect(iri).toBe(authorizationAgentIri);
  });
});

describe('discoverAgentRegistration', () => {
  test('should discover Agent Registration from link header ', async () => {
    const agentRegistrationIri = 'https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659';
    const linkString = `
      <https://projectron.example/#app>;
      anchor="${agentRegistrationIri}";
      rel="http://www.w3.org/ns/solid/interop#registeredAgent"
    `;
    const mocked = jest.fn(statelessFetch);
    const responseMock = {
      ok: true,
      headers: { get: (name: string): string | null => (name === 'Link' ? linkString : null) }
    } as unknown as RdfResponse;
    responseMock.clone = () => ({ ...responseMock });
    mocked.mockResolvedValueOnce(responseMock);
    const iri = await discoverAgentRegistration(authorizationAgentIri, mocked);
    expect(iri).toBe(agentRegistrationIri);
  });

  test('should return null if no link header ', async () => {
    const mocked = jest.fn(statelessFetch);
    const responseMock = {
      ok: true,
      headers: { get: (): null => null }
    } as unknown as RdfResponse;
    responseMock.clone = () => ({ ...responseMock });
    mocked.mockResolvedValueOnce(responseMock);
    const iri = await discoverAgentRegistration(authorizationAgentIri, mocked);
    expect(iri).toBeNull();
  });
});

describe('discoverAuthorizationRedirectEndpoint', () => {
  test('should discover authorization uri from Client ID document', async () => {
    const authorizationRedirectUri = 'https://auth.example/authorize';
    const iri = await discoverAuthorizationRedirectEndpoint(authorizationAgentIri, statelessFetch);
    expect(iri).toBe(authorizationRedirectUri);
  });
});
