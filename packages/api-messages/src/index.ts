export type IRI = string;

export interface UniqueId {
  id: IRI;
}

export * from './payloads';
export * from './requests';
export * from './responses';
export { AccessModes } from './payloads';
