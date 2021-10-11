// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { RdfFetch } from '@janeirodigital/interop-utils';
import { randomUUID } from 'crypto';
import { ImmutableResource, ApplicationFactory } from '../../src';

const snippetIri = 'https://some.iri/';

describe('put', () => {
  test('should PUT its data', async () => {
    const localFactory = new ApplicationFactory({ fetch: jest.fn(fetch), randomUUID });
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
    const localFactory = new ApplicationFactory({ fetch: fakeFetch as unknown as RdfFetch, randomUUID });
    const resource = new ImmutableResource(snippetIri, localFactory, {});

    return expect(resource.put()).rejects.toThrow('failed');
  });
});
