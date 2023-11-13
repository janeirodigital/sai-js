import type { CRUDApplicationRegistration } from '@janeirodigital/interop-data-model';
import type { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import type { Application, IRI } from '@janeirodigital/sai-api-messages';

const buildApplicationProfile = (registration: CRUDApplicationRegistration): Application =>
  // TODO (angel) data validation and how to handle when the applications profile is missing some components?
  ({
    id: registration.registeredAgent,
    name: registration.name!,
    logo: registration.logo,
    authorizationDate: registration.registeredAt!.toISOString(),
    lastUpdateDate: registration.updatedAt?.toISOString(),
    accessNeedGroup: registration.accessNeedGroup!,
    callbackEndpoint: registration.hasAuthorizationCallbackEndpoint
  });
/**
 * Returns all the registered applications for the currently authenticated agent
 * @param saiSession
 */
export const getApplications = async (saiSession: AuthorizationAgent) => {
  const profiles: Application[] = [];
  for await (const registration of saiSession.applicationRegistrations) {
    profiles.push(buildApplicationProfile(registration));
  }
  return profiles;
};

/**
 * Returns the application profile of an application that is _not_ registered for the given agent
 */
export const getUnregisteredApplicationProfile = async (
  agent: AuthorizationAgent,
  id: IRI
): Promise<Partial<Application>> => {
  const { name, logo, accessNeedGroup } = await agent.factory.readable
    .clientIdDocument(id)
    .then((doc) => ({ name: doc.clientName, logo: doc.logoUri, accessNeedGroup: doc.hasAccessNeedGroup }));

  return { id, name, logo, accessNeedGroup };
};
