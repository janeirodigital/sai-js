// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { Model, InteropFactory } from '../src';

const factory = new InteropFactory(fetch);
const snippetIri = 'https://alice.example/';

describe('constructor', () => {
  test('should set the iri', () => {
    const model = new Model(snippetIri, factory);
    expect(model.iri).toBe(snippetIri);
  });

  test('should set the factory', () => {
    const model = new Model(snippetIri, factory);
    expect(model.factory).toBe(factory);
  });

  test('should set the fetch', () => {
    const model = new Model(snippetIri, factory);
    expect(model.fetch).toBe(factory.fetch);
  });
});