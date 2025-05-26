import type { NamedNode } from '@rdfjs/types'
import { DataFactory } from 'n3'

// TODO find a way to type the namespace
export function buildNamespace(base: string): any {
  const handler = {
    get: (target: { base: string }, property: string): NamedNode =>
      DataFactory.namedNode(target.base + property),
  }
  return new Proxy({ base }, handler)
}

export const INTEROP = buildNamespace('http://www.w3.org/ns/solid/interop#')
export const NOTIFY = buildNamespace('http://www.w3.org/ns/solid/notifications#')
export const RDF = buildNamespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
export const RDFS = buildNamespace('http://www.w3.org/2000/01/rdf-schema#')
export const LDP = buildNamespace('http://www.w3.org/ns/ldp#')
export const ACL = buildNamespace('http://www.w3.org/ns/auth/acl#')
export const SHAPETREES = buildNamespace('http://www.w3.org/ns/shapetrees#')
export const XSD = buildNamespace('http://www.w3.org/2001/XMLSchema#')
export const SKOS = buildNamespace('http://www.w3.org/2004/02/skos/core#')
export const ACP = buildNamespace('http://www.w3.org/ns/solid/acp#')
export const SOLID = buildNamespace('http://www.w3.org/ns/solid/terms#')
export const OIDC = buildNamespace('http://www.w3.org/ns/solid/oidc#')
export const DC = buildNamespace('http://purl.org/dc/terms/')
export const SPACE = buildNamespace('http://www.w3.org/ns/pim/space#')
export const AS = buildNamespace('https://www.w3.org/ns/activitystreams#')
