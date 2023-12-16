import { IRI } from '@janeirodigital/sai-api-messages';

export interface IReciprocalRegistrationsJobData {
  webId: IRI;
  registeredAgent: IRI;
}
export interface IReciprocalRegistrationsJob {
  data: IReciprocalRegistrationsJobData;
}

export interface IDelegatedGrantsJobData {
  webId: IRI;
  registeredAgent: IRI;
}
export interface IDelegatedGrantsJob {
  data: IDelegatedGrantsJobData;
}

export interface IPushNotificationsJobData {
  webId: IRI;
  registeredAgent: IRI;
}
export interface IPushNotificationsJob {
  data: IPushNotificationsJobData;
}
