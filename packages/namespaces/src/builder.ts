import { DataFactory } from 'n3';
import { NamedNode } from 'rdf-js';

export function buildNamespace(base: string): unknown {
  const handler = {
    get: (target: { base: string }, property: string): NamedNode => DataFactory.namedNode(target.base + property),
  };
  return new Proxy({ base }, handler);
}
