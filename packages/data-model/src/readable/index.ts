import { AllInstancesDataGrant } from './all-instances-data-grant';
import { InheritInstancesDataGrant } from './inherit-instances-data-grant';
import { SelectedInstancesDataGrant } from './selected-instances-data-grant';
import { ReadableApplicationRegistration } from './application-registration';
import { ReadableSocialAgentRegistration } from './social-agent-registration';

export type DataGrant = AllInstancesDataGrant | SelectedInstancesDataGrant | InheritInstancesDataGrant;
export type InheritableDataGrant = AllInstancesDataGrant | SelectedInstancesDataGrant;
export type ReadableAgentRegistration = ReadableApplicationRegistration | ReadableSocialAgentRegistration;

export { ReadableResource } from './resource';
export { ReadableContainer } from './container';
export { AbstractDataGrant } from './data-grant';
export { AllInstancesDataGrant } from './all-instances-data-grant';
export { SelectedInstancesDataGrant } from './selected-instances-data-grant';
export { InheritInstancesDataGrant } from './inherit-instances-data-grant';
export { ReadableApplicationRegistration } from './application-registration';
export { ReadableAccessGrant } from './access-grant';
export { ReadableShapeTree } from './shape-tree';
export { ReadableDataRegistration } from './data-registration';
export { ReadableAccessConsent } from './access-consent';
export { ReadableDataConsent } from './data-consent';
export { ReadableRegistrySet } from './registry-set';
export { ReadableAgentRegistry } from './agent-registry';
export { ReadableSocialAgentRegistration } from './social-agent-registration';
