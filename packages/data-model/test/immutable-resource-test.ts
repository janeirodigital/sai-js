// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { ImmutableResource, InteropFactory } from '../src';
import { RdfFetch } from '@janeirodigital/interop-utils';

const factory = new InteropFactory({ fetch, randomUUID });
const snippetIri = 'https://some.iri/';

describe('build', () => {
  test('should PUT its data', async () => {
    const localFactory = new InteropFactory({ fetch: jest.fn(fetch), randomUUID });
    const resource = new ImmutableResource(snippetIri, localFactory, {});
    await resource.build();

    expect(localFactory.fetch).toHaveBeenCalledWith(snippetIri, {
      method: 'PUT',
      dataset: resource.dataset
    });
  });

  test('should throw if PUT failed', async () => {
    const fakeFetch = () => Promise.resolve({ ok: false });
    const localFactory = new InteropFactory({ fetch: fakeFetch as unknown as RdfFetch, randomUUID });
    const resource = new ImmutableResource(snippetIri, localFactory, {});

    return expect(resource.build()).rejects.toThrow('failed');
  });
});
