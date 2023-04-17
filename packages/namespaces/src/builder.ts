import { DataFactory } from 'n3';
import { NamedNode } from '@rdfjs/types';

// TODO find a way to type the namespace
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function buildNamespace(base: string): any {
  const handler = {
    get: (target: { base: string }, property: string): NamedNode => DataFactory.namedNode(target.base + property)
  };
  return new Proxy({ base }, handler);
}
