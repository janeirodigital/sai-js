import type { RdfFetch } from '@janeirodigital/interop-utils'
import type { ApplicationFactory } from './application-factory'
import type { AuthorizationAgentFactory } from './authorization-agent-factory'

export interface FactoryDependencies {
  fetch: RdfFetch
  randomUUID(): string
}
export * from './base-factory'
export * from './resource'

export * from './readable'
export * from './immutable'
export * from './crud'
export { ApplicationFactory } from './application-factory'
export { AuthorizationAgentFactory } from './authorization-agent-factory'
export type InteropFactory = ApplicationFactory | AuthorizationAgentFactory
export { DataInstance } from './data-instance'
export { DataOwner } from './data-owner'
export { ReadableDataRegistrationProxy } from './data-registration-proxy'
