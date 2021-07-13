import { AllInstancesDataGrant } from './all-instances-data-grant';
import { AllRemoteDataGrant } from './all-remote-data-grant';
import { AllRemoteFromAgentDataGrant } from './all-remote-from-agent-data-grant';
import { InheritInstancesDataGrant } from './inherit-instances-data-grant';
import { SelectedInstancesDataGrant } from './selected-instances-data-grant';
import { SelectedRemoteDataGrant } from './selected-remote-data-grant';

// TODO (elf-pavlik) re-consider including InheritInstancesDataGrant
export type DataGrant = AllInstancesDataGrant | SelectedInstancesDataGrant | InheritInstancesDataGrant;

// TODO (elf-pavlik) consider including InheritInstancesDataGrant
export type RemoteDataGrant = SelectedRemoteDataGrant | AllRemoteFromAgentDataGrant | AllRemoteDataGrant;

export type AnyDataGrant = DataGrant | RemoteDataGrant | InheritInstancesDataGrant;

export type InheritableDataGrant =
  | AllInstancesDataGrant
  | SelectedInstancesDataGrant
  | SelectedRemoteDataGrant
  | AllRemoteFromAgentDataGrant
  | AllRemoteDataGrant;

export { AllInstancesDataGrant } from './all-instances-data-grant';
export { SelectedInstancesDataGrant } from './selected-instances-data-grant';
export { SelectedRemoteDataGrant } from './selected-remote-data-grant';
export { AllRemoteFromAgentDataGrant } from './all-remote-from-agent-data-grant';
export { AllRemoteDataGrant } from './all-remote-data-grant';
export { InheritInstancesDataGrant } from './inherit-instances-data-grant';
