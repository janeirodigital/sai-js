import {
  AuthorizationAgentFactory,
  CRUDAuthorizationRegistry,
  DataAuthorizationData,
  ImmutableDataAuthorization,
  ReadableAccessAuthorization
} from '@janeirodigital/interop-data-model';

// Nesting is being used to capture inheritance before IRIs are available
export type NestedDataAuthorizationData = DataAuthorizationData & {
  children?: DataAuthorizationData[];
};

interface BaseAuthorization {
  grantee: string;
  hasAccessNeedGroup: string;
}
export interface GrantedAuthorization extends BaseAuthorization {
  dataAuthorizations: DataAuthorizationData[];
  granted: true;
}

export interface DeniedAuthorization extends BaseAuthorization {
  dataAuthorizations?: never;
  granted: false;
}

export type AccessAuthorizationStructure = GrantedAuthorization | DeniedAuthorization;

export async function generateDataAuthorizations(
  dataAuthorizations: NestedDataAuthorizationData[],
  grantedBy: string,
  authorizationRegistry: CRUDAuthorizationRegistry,
  factory: AuthorizationAgentFactory
): Promise<ImmutableDataAuthorization[]> {
  // don't create data authorization where grantee == dataowner
  const validDataAuthorizations = dataAuthorizations.filter(
    (dataAuthorization) => dataAuthorization.dataOwner !== dataAuthorization.grantee
  );

  return validDataAuthorizations.reduce((all, dataAuthorization) => {
    const dataAuthorizationIri = authorizationRegistry.iriForContained();
    let childInstances: ImmutableDataAuthorization[] = [];
    if (dataAuthorization.children) {
      childInstances = dataAuthorization.children.map((childDataAuthorization) => {
        const childDataAuthorizationIri = authorizationRegistry.iriForContained();
        return factory.immutable.dataAuthorization(childDataAuthorizationIri, {
          ...childDataAuthorization,
          inheritsFromAuthorization: dataAuthorizationIri,
          grantedBy
        });
      });
    }
    const parentInstance = factory.immutable.dataAuthorization(dataAuthorizationIri, {
      ...dataAuthorization,
      hasInheritingAuthorization: childInstances.map((childInstance) => childInstance.iri),
      grantedBy
    });
    return [...all, parentInstance, ...childInstances];
  }, []);
}

export async function generateAuthorization(
  authorization: AccessAuthorizationStructure,
  grantedBy: string,
  authorizationRegistry: CRUDAuthorizationRegistry,
  agentId: string,
  factory: AuthorizationAgentFactory
): Promise<ReadableAccessAuthorization> {
  let dataAuthorizations: ImmutableDataAuthorization[] = [];
  if (authorization.granted) {
    dataAuthorizations = await generateDataAuthorizations(
      authorization.dataAuthorizations,
      grantedBy,
      authorizationRegistry,
      factory
    );
  }

  const authorizationIri = authorizationRegistry.iriForContained();
  const data = {
    grantedWith: agentId,
    grantedBy,
    grantee: authorization.grantee,
    hasAccessNeedGroup: authorization.hasAccessNeedGroup,
    dataAuthorizations,
    granted: authorization.granted
  };
  const accessAuthorization = factory.immutable.accessAuthorization(authorizationIri, data);
  const rAccessAuthorization = await accessAuthorization.store();

  // link to new access authorization from access authorization registry
  await authorizationRegistry.add(rAccessAuthorization);
  return rAccessAuthorization;
}
