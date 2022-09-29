import {
  AuthorizationAgentFactory,
  CRUDAuthorizationRegistry,
  DataAuthorizationData,
  ImmutableDataAuthorization,
  ReadableAccessAuthorization
} from '@janeirodigital/interop-data-model';

export type AccessAuthorizationStructure = {
  grantee: string;
  hasAccessNeedGroup: string;
  dataAuthorizations: DataAuthorizationData[];
};

export async function generateDataAuthorizations(
  dataAuthorizations: DataAuthorizationData[],
  grantedBy: string,
  authorizationRegistry: CRUDAuthorizationRegistry,
  factory: AuthorizationAgentFactory
): Promise<ImmutableDataAuthorization[]> {
  // don't create data authorization where grantee == dataowner
  const validDataAuthorizations = dataAuthorizations.filter(
    (dataAuthorization) => dataAuthorization.dataOwner !== dataAuthorization.grantee
  );
  return Promise.all(
    validDataAuthorizations.map((dataAuthorization) => {
      const dataAuthorizationIri = authorizationRegistry.iriForContained();
      return factory.immutable.dataAuthorization(dataAuthorizationIri, {
        ...dataAuthorization,
        grantedBy
      });
    })
  );
}

export async function generateAuthorization(
  authorization: AccessAuthorizationStructure,
  grantedBy: string,
  authorizationRegistry: CRUDAuthorizationRegistry,
  agentId: string,
  factory: AuthorizationAgentFactory
): Promise<ReadableAccessAuthorization> {
  const dataAuthorizations = await generateDataAuthorizations(
    authorization.dataAuthorizations,
    grantedBy,
    authorizationRegistry,
    factory
  );
  const authorizationIri = authorizationRegistry.iriForContained();
  const data = {
    grantedWith: agentId,
    grantedBy,
    grantee: authorization.grantee,
    hasAccessNeedGroup: authorization.hasAccessNeedGroup,
    dataAuthorizations
  };
  const accessAuthorization = factory.immutable.accessAuthorization(authorizationIri, data);
  const rAccessAuthorization = await accessAuthorization.store();

  // link to new access authorization from access authorization registry
  await authorizationRegistry.add(rAccessAuthorization);
  return rAccessAuthorization;
}
