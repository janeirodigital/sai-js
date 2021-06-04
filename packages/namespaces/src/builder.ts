import { DataFactory } from 'n3';
import { NamedNode } from 'rdf-js';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function buildNamespace(base: string): any {
  const handler = {
    get: (target: { base: string }, property: string): NamedNode => DataFactory.namedNode(target.base + property),
  };
  return new Proxy({ base }, handler);
}
