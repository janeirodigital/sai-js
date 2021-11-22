import { RdfFetch } from '@janeirodigital/interop-utils';
import { ApplicationFactory } from './application-factory';
import { AuthorizationAgentFactory } from './authorization-agent-factory';

export interface FactoryDependencies {
  fetch: RdfFetch;
  randomUUID(): string;
}
export { BaseFactory } from './base-factory';

export * from './readable';
export * from './immutable';
export * from './crud';
export { ApplicationFactory } from './application-factory';
export { AuthorizationAgentFactory } from './authorization-agent-factory';
export type InteropFactory = ApplicationFactory | AuthorizationAgentFactory;
export { DataInstance } from './data-instance';
export { DataOwner } from './data-owner';
export { ReadableDataRegistrationProxy } from './data-registration-proxy';
