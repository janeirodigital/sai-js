import { DatasetCore } from '@rdfjs/types';

export * from './turtle-parser';
export * from './match';

export interface FetchOptions {
  method: string;
  dataset?: DatasetCore;
}

export interface FetchResponse {
  dataset?: DatasetCore;
  ok: Boolean;
}

declare function rdfFetch(iri: string, options?: FetchOptions): Promise<FetchResponse>;
export type RdfFetch = typeof rdfFetch;

declare function randomUUID(): string;
export type RandomUUID = typeof randomUUID;
