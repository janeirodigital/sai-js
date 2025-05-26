import type {
  AccessAuthorizationData,
  AuthorizationAgentFactory,
  CRUDAuthorizationRegistry,
  DataAuthorizationData,
  ImmutableDataAuthorization,
  ReadableAccessAuthorization,
} from '@janeirodigital/interop-data-model'
import { INTEROP } from '@janeirodigital/interop-utils'

// Nesting is being used to capture inheritance before IRIs are available
export type NestedDataAuthorizationData = DataAuthorizationData & {
  children?: DataAuthorizationData[]
}

interface BaseAuthorization {
  grantee: string
  hasAccessNeedGroup?: string
}

// TODO: de-duplicate with AccessAuthorizationData (in immutable/access-authorization)
// TODO: de-duplicate with Authorization (in api-messages)
export interface GrantedAuthorization extends BaseAuthorization {
  dataAuthorizations: DataAuthorizationData[]
  granted: true
}

export interface DeniedAuthorization extends BaseAuthorization {
  dataAuthorizations?: never
  granted: false
}

export type AccessAuthorizationStructure = GrantedAuthorization | DeniedAuthorization

export async function generateDataAuthorizations(
  dataAuthorizations: NestedDataAuthorizationData[],
  grantedBy: string,
  authorizationRegistry: CRUDAuthorizationRegistry,
  factory: AuthorizationAgentFactory
): Promise<ImmutableDataAuthorization[]> {
  // don't create data authorization where grantee == dataowner
  const validDataAuthorizations = dataAuthorizations.filter(
    (dataAuthorization) => dataAuthorization.dataOwner !== dataAuthorization.grantee
  )

  return validDataAuthorizations.reduce((all, dataAuthorization) => {
    const dataAuthorizationIri = authorizationRegistry.iriForContained()
    let childInstances: ImmutableDataAuthorization[] = []
    if (dataAuthorization.children) {
      childInstances = dataAuthorization.children.map((childDataAuthorization) => {
        const childDataAuthorizationIri = authorizationRegistry.iriForContained()
        return factory.immutable.dataAuthorization(childDataAuthorizationIri, {
          ...childDataAuthorization,
          inheritsFromAuthorization: dataAuthorizationIri,
          grantedBy,
        })
      })
    }
    const parentInstance = factory.immutable.dataAuthorization(dataAuthorizationIri, {
      ...dataAuthorization,
      hasInheritingAuthorization: childInstances.map((childInstance) => childInstance.iri),
      grantedBy,
    })
    return [...all, parentInstance, ...childInstances]
  }, [])
}

export async function generateAuthorization(
  authorization: AccessAuthorizationStructure,
  grantedBy: string,
  authorizationRegistry: CRUDAuthorizationRegistry,
  agentId: string,
  factory: AuthorizationAgentFactory,
  extendIfExists: boolean
): Promise<ReadableAccessAuthorization> {
  if (extendIfExists && !authorization.granted) {
    throw new Error('Previous denied authorizations can not be extended')
  }

  let dataAuthorizationsToReuse: string[] = []

  // TODO: agent has and access authorization, with data authorization (SelectedFromRegistry) which does not include this data instance
  // do we need to check access modes? (if same extend data authorization, if different create a new one)
  if (extendIfExists && authorization.granted) {
    const existingAccessAuthorization = await authorizationRegistry.findAuthorization(
      authorization.grantee
    )
    if (existingAccessAuthorization) {
      // start with reusing all existing data authorizations
      dataAuthorizationsToReuse = [...existingAccessAuthorization.hasDataAuthorization]

      // TODO: case when new doesn't have inheriting but matching had inheriting data grant, create additional data authorization instead of replacing
      // check if some of existing data authorizations overlap for a registry
      for await (const existingDataAuthorization of existingAccessAuthorization.dataAuthorizations) {
        const matchingDataAuthorization = authorization.dataAuthorizations.find(
          (da) => existingDataAuthorization.hasDataRegistration === da.hasDataRegistration
        )
        if (matchingDataAuthorization) {
          // TODO: should we handle it differently
          if (matchingDataAuthorization.scopeOfAuthorization !== INTEROP.SelectedFromRegistry.value)
            throw new Error(`unexpected scope: ${matchingDataAuthorization.scopeOfAuthorization}`)

          // copy over selected instances from existing data authorization
          // TODO: check for duplicates (make it a set?)
          matchingDataAuthorization.hasDataInstance.push(
            ...existingDataAuthorization.hasDataInstance
          )

          // exclude from data authorization to reuse
          dataAuthorizationsToReuse = dataAuthorizationsToReuse.filter(
            (iri) =>
              ![
                existingDataAuthorization.iri,
                ...existingDataAuthorization.hasInheritingAuthorization.map((cda) => cda.iri),
              ].includes(iri)
          )
        }
      }
    }
  }

  let dataAuthorizations: ImmutableDataAuthorization[] = []
  if (authorization.granted) {
    dataAuthorizations = await generateDataAuthorizations(
      authorization.dataAuthorizations,
      grantedBy,
      authorizationRegistry,
      factory
    )
  }

  const authorizationIri = authorizationRegistry.iriForContained()
  const data: AccessAuthorizationData = {
    grantedWith: agentId,
    grantedBy,
    grantee: authorization.grantee,
    hasAccessNeedGroup: authorization.hasAccessNeedGroup,
    dataAuthorizations,
    dataAuthorizationsToReuse,
    granted: authorization.granted,
  }

  const accessAuthorization = factory.immutable.accessAuthorization(authorizationIri, data)
  const rAccessAuthorization = await accessAuthorization.store()

  // link to new access authorization from access authorization registry
  await authorizationRegistry.add(rAccessAuthorization)
  return rAccessAuthorization
}
