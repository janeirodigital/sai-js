import { randomUUID } from 'node:crypto'
import { fetch } from '@janeirodigital/interop-test-utils'
import { ACL, INTEROP } from '@janeirodigital/interop-utils'
import { DataFactory } from 'n3'
import { test, vi } from 'vitest'
import { type AccessAuthorizationData, AuthorizationAgentFactory } from '../../src'
import { expect } from '../expect'

const webId = 'https://alice.example/#id'
const agentId = 'https://jarvis.alice.example/#agent'

test('should set data and store', async () => {
  const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID })
  const dataAuthorizationIri = 'https://auth.alice.example/25b18e05-7f75-4e13-94f6-9950a67a89dd'
  const dataAuthorization = factory.immutable.dataAuthorization(dataAuthorizationIri, {
    grantee: 'https://projectron.example/#app',
    grantedBy: webId,
    registeredShapeTree: 'https://solidshapes.example/trees/Project',
    accessMode: [ACL.Read.value, ACL.Write.value],
    scopeOfAuthorization: INTEROP.All.value,
  })
  const accessAuthorizationData = {
    granted: true,
    grantedBy: webId,
    grantedWith: agentId,
    grantee: 'https://projectron.example/#app',
    hasAccessNeedGroup: 'https://projectron.example/#some-access-group',
    dataAuthorizations: [dataAuthorization],
    dataAuthorizationsToReuse: [
      'https://auth.alice.example/5ea3346e-d8f2-46da-b7ae-2966330fba17',
      'https://auth.alice.example/e20a6ff2-ac57-4b1f-a4e5-615ebfc34685',
    ],
  }
  const accessAuthorizationIri = 'https://auth.alice.example/e791fa95-9363-4852-a9ed-e266aa62c193'
  const accessAuthorizationQuads = [
    DataFactory.quad(
      DataFactory.namedNode(accessAuthorizationIri),
      INTEROP.hasDataAuthorization,
      DataFactory.namedNode(dataAuthorization.iri)
    ),
  ]
  const props: (keyof AccessAuthorizationData)[] = [
    'grantedBy',
    'grantedWith',
    'grantee',
    'hasAccessNeedGroup',
  ]
  for (const prop of props) {
    accessAuthorizationQuads.push(
      DataFactory.quad(
        DataFactory.namedNode(accessAuthorizationIri),
        INTEROP[prop],
        DataFactory.namedNode(accessAuthorizationData[prop] as string)
      )
    )
  }
  for (const iri of accessAuthorizationData.dataAuthorizationsToReuse) {
    accessAuthorizationQuads.push(
      DataFactory.quad(
        DataFactory.namedNode(accessAuthorizationIri),
        INTEROP.hasDataAuthorization,
        DataFactory.namedNode(iri)
      )
    )
  }
  const accessAuthorization = factory.immutable.accessAuthorization(
    accessAuthorizationIri,
    accessAuthorizationData
  )
  expect(accessAuthorization.dataset).toBeRdfDatasetContaining(...accessAuthorizationQuads)

  const dataAuthorizationPutSpy = vi.spyOn(dataAuthorization, 'put')
  const accessAuthorizationPutSpy = vi.spyOn(accessAuthorization, 'put')
  // @ts-ignore
  accessAuthorization.factory = { readable: { accessAuthorization: vi.fn() } }

  await accessAuthorization.store()
  expect(dataAuthorizationPutSpy).toBeCalled()
  expect(accessAuthorizationPutSpy).toBeCalled()
  expect(accessAuthorization.factory.readable.accessAuthorization).toBeCalledWith(
    accessAuthorizationIri
  )
})
