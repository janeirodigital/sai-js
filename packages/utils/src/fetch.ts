import { DatasetCore } from '@rdfjs/types';
import { serializeTurtle, parseTurtle } from '.';

export interface RdfRequestInit extends RequestInit {
  dataset?: DatasetCore;
}

export interface RdfResponse extends Response {
  dataset(): Promise<DatasetCore>;
}

type WhatwgFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;
export type RdfFetch = (iri: string, options?: RdfRequestInit) => Promise<RdfResponse>;

async function unwrappedRdfFetch(
  whatwgFetch: WhatwgFetch,
  iri: string,
  options?: RdfRequestInit
): Promise<RdfResponse> {
  const requestInit = { dataset: undefined, ...options } as RequestInit;
  if (options.dataset) {
    requestInit.body = await serializeTurtle(options.dataset);
    requestInit.headers = { 'Content-Type': 'text/turtle', ...requestInit.headers };
  } else {
    // TODO (elf-pavlik) handle binary files
    requestInit.headers = { Accept: 'text/turtle', ...requestInit.headers };
  }
  const response = await whatwgFetch(iri, requestInit);
  const rdfResponse = { ...response } as RdfResponse;
  // TODO (elf-pavlik) check if Content-Type is text/turtle
  rdfResponse.dataset = async function dataset() {
    return parseTurtle(await response.text());
  };
  return rdfResponse;
}

export function fetchWrapper(whatwgFetch: WhatwgFetch): RdfFetch {
  return function wrappedRdfFetch(iri: string, options?: RdfRequestInit) {
    return unwrappedRdfFetch(whatwgFetch, iri, options);
  };
}
