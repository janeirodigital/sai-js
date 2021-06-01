import { DataFactory } from 'n3'

const handler = {
  get: (target: Function, property: string) => target(property)
}

export function buildNamespace (baseIRI: string) {
  const builder = (term = '') => DataFactory.namedNode(`${baseIRI}${term}`)

  return typeof Proxy === 'undefined' ? builder : new Proxy(builder, handler)
}
