import { AllFromRegistryDataGrant } from './all-from-registry-data-grant';
import { InheritedDataGrant } from './inherited-data-grant';
import { SelectedFromRegistryDataGrant } from './selected-from-registry-data-grant';
import { ReadableApplicationRegistration } from './application-registration';
import { ReadableSocialAgentRegistration } from './social-agent-registration';

export type DataGrant = AllFromRegistryDataGrant | SelectedFromRegistryDataGrant | InheritedDataGrant;
export type ReadableAgentRegistration = ReadableApplicationRegistration | ReadableSocialAgentRegistration;

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
export { ReadableAccessConsent } from './access-consent';
export { ReadableDataConsent } from './data-consent';
export { ReadableRegistrySet } from './registry-set';
export { ReadableAgentRegistry } from './agent-registry';
export { ReadableSocialAgentRegistration } from './social-agent-registration';
