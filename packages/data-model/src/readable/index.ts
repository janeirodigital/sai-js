import type { AllFromRegistryDataGrant } from './all-from-registry-data-grant'
import type { InheritedDataGrant } from './inherited-data-grant'
import type { SelectedFromRegistryDataGrant } from './selected-from-registry-data-grant'

export type DataGrant =
  | AllFromRegistryDataGrant
  | SelectedFromRegistryDataGrant
  | InheritedDataGrant

export { ReadableResource } from './resource'
export { ReadableContainer } from './container'
export { AbstractDataGrant } from './data-grant'
export { InheritableDataGrant } from './inheritable-data-grant'
export { AllFromRegistryDataGrant } from './all-from-registry-data-grant'
export { SelectedFromRegistryDataGrant } from './selected-from-registry-data-grant'
export { InheritedDataGrant } from './inherited-data-grant'
export { ReadableApplicationRegistration } from './application-registration'
export { ReadableAccessGrant } from './access-grant'
export { ReadableShapeTree } from './shape-tree'
export { ReadableShapeTreeDescription } from './shape-tree-description'
export { ReadableDataRegistration } from './data-registration'
export { ReadableAccessAuthorization } from './access-authorization'
export { ReadableDataAuthorization } from './data-authorization'
export { ReadableWebIdProfile } from './webid-profile'
export { ReadableClientIdDocument } from './client-id-document'
export { ReadableAccessDescription } from './access-description'
export { ReadableAccessNeedDescription } from './access-need-description'
export { ReadableAccessNeedGroupDescription } from './access-need-group-description'
export { ReadableAccessDescriptionSet } from './access-description-set'
export { ReadableAccessNeed } from './access-need'
export { ReadableAccessNeedGroup } from './access-need-group'
export { ReadableDataInstance } from './data-instance'
