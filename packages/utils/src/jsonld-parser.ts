import type { DatasetCore } from '@rdfjs/types'
import { JsonLdParser } from 'jsonld-streaming-parser'
import { Store } from 'n3'

/**
 * Wrapper around streaming-jsonld-parser to convert from callback style to Promise.
 * @param text Text to parse (JSON-LD)
 * @param source
 */

export const parseJsonld = async (text: string, source = ''): Promise<DatasetCore> => {
  const store = new Store()
  return new Promise((resolve, reject) => {
    const parserOptions: { baseIRI?: string } = {}
    if (source) {
      parserOptions.baseIRI = source
    }
    const parser = new JsonLdParser({ baseIRI: source })
    parser.on('data', (quads) => store.add(quads))
    parser.on('error', (error) => reject(error))
    parser.on('end', () => resolve(store))
    parser.write(text)
    parser.end()
  })
}
