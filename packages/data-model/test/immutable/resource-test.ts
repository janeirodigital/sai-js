// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { RdfFetch } from '@janeirodigital/interop-utils';
import { randomUUID } from 'crypto';
import { ImmutableResource, AuthorizationAgentFactory } from '../../src';

const snippetIri = 'https://some.iri/';
const webId = 'https://alice.example/#id';
const agentId = 'https://alice.jarvis.example/#agent';

describe('put', () => {
  test('should PUT its data', async () => {
    const localFactory = new AuthorizationAgentFactory(webId, agentId, { fetch: jest.fn(fetch), randomUUID });
    const resource = new ImmutableResource(snippetIri, localFactory, {});
    await resource.put();

    expect(localFactory.fetch).toHaveBeenCalledWith(snippetIri, {
      method: 'PUT',
      dataset: resource.dataset,
      headers: {
        'If-None-Match': '*'
      }
    });
  });

  test('should throw if PUT failed', async () => {
    const fakeFetch = () => Promise.resolve({ ok: false });
    const localFactory = new AuthorizationAgentFactory(webId, agentId, {
      fetch: fakeFetch as unknown as RdfFetch,
      randomUUID
    });
    const resource = new ImmutableResource(snippetIri, localFactory, {});

    return expect(resource.put()).rejects.toThrow('failed');
  });

  test('should throw if already stored', async () => {
    const localFactory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });

    const resource = new ImmutableResource(snippetIri, localFactory, {});
    await resource.put();
    return expect(resource.put()).rejects.toThrow('this resource has been already stored');
  });
});
