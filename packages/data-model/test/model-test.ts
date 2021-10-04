// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { ReadableResource, ApplicationFactory } from '../src';

const factory = new ApplicationFactory({ fetch, randomUUID });
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
