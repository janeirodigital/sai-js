import { describe, test, expect } from 'vitest';
import { NamedNode } from 'n3';
import { buildNamespace } from '../src/namespaces';

describe('buildNamespace', () => {
  const base = 'http://example.com#';
  const BASE = buildNamespace(base);

  test('can generate any named node', () => {
    expect(BASE.any.value).toEqual(`${base}any`);
    expect(BASE['any-property'].value).toEqual(`${base}any-property`);
  });

  test('generate rdf-js named nodes', () => {
    expect(BASE.foo instanceof NamedNode).toBe(true);
  });
});
