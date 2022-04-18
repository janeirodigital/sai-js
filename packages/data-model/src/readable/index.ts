import { AllFromRegistryDataGrant } from './all-from-registry-data-grant';
import { InheritedDataGrant } from './inherited-data-grant';
import { SelectedFromRegistryDataGrant } from './selected-from-registry-data-grant';

export type DataGrant = AllFromRegistryDataGrant | SelectedFromRegistryDataGrant | InheritedDataGrant;

export { ReadableResource } from './resource';
export { ReadableContainer } from './container';
export { AbstractDataGrant } from './data-grant';
export { InheritableDataGrant } from './inheritable-data-grant';
export { AllFromRegistryDataGrant } from './all-from-registry-data-grant';
export { SelectedFromRegistryDataGrant } from './selected-from-registry-data-grant';
export { InheritedDataGrant } from './inherited-data-grant';
export { ReadableApplicationRegistration } from './application-registration';
export { ReadableAccessGrant } from './access-grant';
export { ReadableShapeTree } from './shape-tree';
export { ReadableDataRegistration } from './data-registration';
export { ReadableAccessAuthorization } from './access-authorization';
export { ReadableDataAuthorization } from './data-authorization';
