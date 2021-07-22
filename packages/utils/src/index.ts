import { DatasetCore } from '@rdfjs/types';

export * from './turtle-parser';
export * from './match';

export interface FetchOptions {
  [key: string]: string;
}

export interface FetchResponse {
  dataset?: DatasetCore;
  ok: Boolean;
}

declare function rdfFetch(iri: string, options?: FetchOptions): Promise<FetchResponse>;

export type RdfFetch = typeof rdfFetch;
