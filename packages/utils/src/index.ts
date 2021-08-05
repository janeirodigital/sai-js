import { DatasetCore } from '@rdfjs/types';

export * from './turtle-parser';
export * from './match';

export interface FetchOptions {
  method: string;
  dataset?: DatasetCore;
}

export interface FetchResponse {
  dataset?: DatasetCore;
  ok: boolean;
}

export type RdfFetch = {
  (iri: string, options?: FetchOptions): Promise<FetchResponse>;
  user?: string;
};

declare function randomUUID(): string;
export type RandomUUID = typeof randomUUID;
