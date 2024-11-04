export interface UniqueId {
  id: string;
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
export * from './effect';
