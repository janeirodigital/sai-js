import { randomUUID } from 'crypto';
import { RdfFetch } from '@janeirodigital/interop-utils';
import { AuthorizationAgentFactory } from '../../src';

const webId = 'https://alice.example/#id';
const agentId = 'https://jarvis.alice.example/#agent';
const snippetIri = 'http://localhost:3000/acme/projectron/id';
const snippetText = `
{
  "@context": [
    "https://www.w3.org/ns/solid/oidc-context.jsonld",
    {
      "interop": "http://www.w3.org/ns/solid/interop#"
    }
  ]  ,
  "client_id": "http://localhost:3000/acme/projectron/id",
  "client_name": "Projectron",
  "logo_uri": "https://robohash.org/https://projectron.example/?set=set3",
  "redirect_uris": ["http://localhost:4100/redirect"],
  "grant_types" : ["refresh_token","authorization_code"],
  "interop:hasAccessNeedGroup": "http://localhost:3000/acme/projectron/access-needs#need-group-pm",
  "interop:hasAuthorizationCallbackEndpoint": "http://localhost:4100"
}
`;
const fetch = {
  raw: async () => ({ text: async () => snippetText })
} as unknown as RdfFetch;

const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });

describe('getters', () => {
  test('hasAccessNeedGroup', async () => {
    const clientIdDocument = await factory.readable.clientIdDocument(snippetIri);
    expect(clientIdDocument.hasAccessNeedGroup).toBe(
      'http://localhost:3000/acme/projectron/access-needs#need-group-pm'
    );
  });
  test('callbackEndpoint', async () => {
    const clientIdDocument = await factory.readable.clientIdDocument(snippetIri);
    expect(clientIdDocument.callbackEndpoint).toBe('http://localhost:4100');
  });

  test('clientName', async () => {
    const clientIdDocument = await factory.readable.clientIdDocument(snippetIri);
    expect(clientIdDocument.clientName).toEqual('Projectron');
  });

  test('logoUri', async () => {
    const clientIdDocument = await factory.readable.clientIdDocument(snippetIri);
    expect(clientIdDocument.logoUri).toEqual('https://robohash.org/https://projectron.example/?set=set3');
  });
});
