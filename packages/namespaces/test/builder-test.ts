import { NamedNode } from 'n3';
import { buildNamespace } from '../src/builder';

describe('buildNamespace', () => {
  const base = 'http://example.com#';
  const BASE = buildNamespace(base);

  it('can generate any named node', () => {
    expect(BASE.any.value).toEqual(`${base}any`);
    expect(BASE['any-property'].value).toEqual(`${base}any-property`);
  });

  it('generate rdf-js named nodes', () => {
    expect(BASE.foo instanceof NamedNode).toBe(true);
  });
});
