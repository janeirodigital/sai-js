// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import { DataFactory, Store } from 'n3';
import {
  RdfResponse,
  discoverAuthorizationAgent,
  discoverAgentRegistration,
  discoverAuthorizationRedirectEndpoint,
  INTEROP
} from '../src';
import type { RdfFetch, WhatwgFetch } from '../src';

const webId = 'https://alice.example/#id';
const authorizationAgentIri = 'https://auth.alice.example/';
const rdfFetch = jest.fn<RdfFetch>();
const statelessFetch = jest.fn<WhatwgFetch>();

describe('discoverAuthorizationAgent', () => {
  test('should discover Authorization Agent from the WebID document', async () => {
    rdfFetch.mockResolvedValueOnce({
      dataset: async () =>
        new Store([
          DataFactory.quad(
            DataFactory.namedNode(webId),
            INTEROP.hasAuthorizationAgent,
            DataFactory.literal(authorizationAgentIri)
          )
        ])
    } as unknown as RdfResponse);
    const iri = await discoverAuthorizationAgent(webId, rdfFetch);
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
    statelessFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: (name: string): string | null => (name === 'Link' ? linkString : null) }
    } as unknown as RdfResponse);
    const iri = await discoverAgentRegistration(authorizationAgentIri, statelessFetch);
    expect(iri).toBe(agentRegistrationIri);
  });

  test('should return undefined if no link header ', async () => {
    statelessFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: (): undefined => undefined }
    } as unknown as RdfResponse);
    const iri = await discoverAgentRegistration(authorizationAgentIri, statelessFetch);
    expect(iri).toBeUndefined();
  });
});

describe('discoverAuthorizationRedirectEndpoint', () => {
  test('should discover authorization uri from Client ID document', async () => {
    const authorizationRedirectUri = 'https://auth.example/authorize';
    statelessFetch.mockResolvedValueOnce({
      text: async () => `
        {
          "@context": { "interop": "http://www.w3.org/ns/solid/interop#" },
          "interop:hasAuthorizationRedirectEndpoint": "${authorizationRedirectUri}"
        }
      `
    } as unknown as Response);
    const iri = await discoverAuthorizationRedirectEndpoint(authorizationAgentIri, statelessFetch);
    expect(iri).toBe(authorizationRedirectUri);
  });
});
