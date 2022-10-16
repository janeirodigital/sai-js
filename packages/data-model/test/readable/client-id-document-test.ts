// eslint-disable-next-line import/no-extraneous-dependencies
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
    expect(clientIdDocument.hasAccessNeedGroup).toBe('https://projectron.example/#need-group-pm');
  });
});
