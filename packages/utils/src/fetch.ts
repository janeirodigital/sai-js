import type { DatasetCore } from '@rdfjs/types'
import { parseTurtle, serializeTurtle } from '.'

export interface RdfRequestInit extends RequestInit {
  dataset?: DatasetCore
}

export interface RdfResponse extends Response {
  dataset(): Promise<DatasetCore>
  text(): Promise<string>
}

export type WhatwgFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>
export type RdfFetch = ((iri: string, options?: RdfRequestInit) => Promise<RdfResponse>) & {
  raw: WhatwgFetch
}

// TODO accept either string | NamedNode
// https://github.com/janeirodigital/sai-js/issues/17
async function unwrappedRdfFetch(
  whatwgFetch: WhatwgFetch,
  iri: string,
  options?: RdfRequestInit
): Promise<RdfResponse> {
  let requestInit: RequestInit
  if (options?.dataset) {
    const { dataset, ...request } = options
    request.body = await serializeTurtle(options.dataset)
    request.headers = { 'Content-Type': 'text/turtle', ...request.headers }
    requestInit = request
  } else {
    requestInit = { ...options } as RequestInit
    requestInit.headers = { Accept: 'text/turtle', ...requestInit.headers }
  }
  const response = await whatwgFetch(iri, requestInit)
  const rdfResponse = response.clone() as RdfResponse
  rdfResponse.dataset = async function dataset() {
    const contentType = response.headers.get('Content-Type')
    if (contentType === null || !contentType.match('text/turtle')) {
      throw Error(`Content-Type was ${contentType}`)
    }
    return parseTurtle(await response.text(), response.url)
  }
  rdfResponse.text = response.text
  return rdfResponse
}

export function fetchWrapper(whatwgFetch: WhatwgFetch): RdfFetch {
  const wrappedRdfFetch = function wrappedRdfFetch(iri: string, options?: RdfRequestInit) {
    return unwrappedRdfFetch(whatwgFetch, iri, options)
  }
  wrappedRdfFetch.raw = whatwgFetch
  return wrappedRdfFetch
}
