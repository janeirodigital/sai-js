import { AllInstancesDataGrant } from './all-instances-data-grant';
import { InheritInstancesDataGrant } from './inherit-instances-data-grant';
import { SelectedInstancesDataGrant } from './selected-instances-data-grant';

export type DataGrant = AllInstancesDataGrant | SelectedInstancesDataGrant | InheritInstancesDataGrant;
export type InheritableDataGrant = AllInstancesDataGrant | SelectedInstancesDataGrant;

export { AllInstancesDataGrant } from './all-instances-data-grant';
export { SelectedInstancesDataGrant } from './selected-instances-data-grant';
export { InheritInstancesDataGrant } from './inherit-instances-data-grant';
