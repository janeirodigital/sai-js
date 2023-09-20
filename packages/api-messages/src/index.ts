export type IRI = string;

export interface UniqueId {
  id: IRI;
}

export enum Scopes {
  Inherited = 'Inherited',
  All = 'All',
  AllFromAgent = 'AllFromAgent',
  AllFromRegistry = 'AllFromRegistry',
  SelectedFromRegistry = 'SelectedFromRegistry'
}

export * from './payloads';
export * from './requests';
export * from './responses';
