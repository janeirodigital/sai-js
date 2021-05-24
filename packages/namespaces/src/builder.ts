import { DataFactory } from 'n3'

const handler = {
  //@ts-ignore FIXME
  apply: (target, thisArg, args) => target(args[0]),
  //@ts-ignore FIXME
  get: (target: object, property) => target(property)
}

export function buildNamespace (baseIRI: string) {
  const builder = (term = '') => DataFactory.namedNode(`${baseIRI}${term}`)

  return typeof Proxy === 'undefined' ? builder : new Proxy(builder, handler)
}
