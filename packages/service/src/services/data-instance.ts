import type {
  AuthorizationAgent,
  ShareDataInstanceStructure,
} from '@janeirodigital/interop-authorization-agent'
import {
  IRI,
  Resource,
  type ShareAuthorization,
  type ShareAuthorizationConfirmation,
} from '@janeirodigital/sai-api-messages'
import type * as S from 'effect/Schema'

export const getResource = async (saiSession: AuthorizationAgent, iri: string, lang: string) => {
  const resource = await saiSession.factory.readable.dataInstance(iri, lang)
  if (!resource) throw new Error(`Resource not found: ${iri}`)
  return Resource.make({
    id: IRI.make(resource.iri),
    label: resource.label,
    shapeTree: {
      id: IRI.make(resource.shapeTree.iri),
      label: resource.shapeTree.label,
    },
    accessGrantedTo: (await saiSession.findSocialAgentsWithAccess(resource.iri)).map(({ agent }) =>
      IRI.make(agent)
    ),
    children: resource.children.map((child) => ({
      shapeTree: {
        id: IRI.make(child.shapeTree.iri),
        label: child.shapeTree.label,
      },
      count: child.count,
    })),
  })
}

export const shareResource = async (
  saiSession: AuthorizationAgent,
  shareAuthorization: S.Schema.Type<typeof ShareAuthorization>
): Promise<S.Schema.Type<typeof ShareAuthorizationConfirmation>> => {
  // TODO: finde cleaner way of dealing with types
  const authorizationIris = await saiSession.shareDataInstance(
    shareAuthorization as unknown as ShareDataInstanceStructure
  )

  // TODO: this should be handled in a worker
  await Promise.all(
    authorizationIris.map((authorizationIri) => saiSession.generateAccessGrant(authorizationIri))
  )

  const clientIdDocument = await saiSession.factory.readable.clientIdDocument(
    shareAuthorization.applicationId
  )
  return {
    callbackEndpoint: clientIdDocument.callbackEndpoint!,
  }
}
