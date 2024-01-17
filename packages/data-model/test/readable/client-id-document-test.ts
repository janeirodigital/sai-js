import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { AuthorizationAgentFactory } from '../../src';

const webId = 'https://alice.example/#id';
const agentId = 'https://jarvis.alice.example/#agent';
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });
const snippetIri = 'https://projectron.example/#app';

describe('getters', () => {
  test('hasAccessNeedGroup', async () => {
    const clientIdDocument = await factory.readable.clientIdDocument(snippetIri);
    expect(clientIdDocument.hasAccessNeedGroup).toBe('https://projectron.example/access-needs#need-group-pm');
  });
  test('callbackEndpoint', async () => {
    const clientIdDocument = await factory.readable.clientIdDocument(snippetIri);
    expect(clientIdDocument.callbackEndpoint).toBe('https://projectron.example/');
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
