import { DatasetCore } from '@rdfjs/types'

export * from './turtle-parser';
export * from './match';

declare function rdfFetch (iri:string): Promise<DatasetCore>

export type RdfFetch = typeof rdfFetch
