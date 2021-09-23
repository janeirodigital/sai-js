// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { ReadableResource, InteropFactory } from '../src';

const factory = new InteropFactory({ fetch, randomUUID });
const snippetIri = 'https://alice.example/';

describe('constructor', () => {
  test('should set the iri', () => {
    const model = new ReadableResource(snippetIri, factory);
    expect(model.iri).toBe(snippetIri);
  });

  test('should set the factory', () => {
    const model = new ReadableResource(snippetIri, factory);
    expect(model.factory).toBe(factory);
  });

  test('should set the fetch', () => {
    const model = new ReadableResource(snippetIri, factory);
    expect(model.fetch).toBe(factory.fetch);
  });
});
