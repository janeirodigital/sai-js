import type {
  AgentWithAccess,
  AuthorizationAgent,
} from '@janeirodigital/interop-authorization-agent'
import type {
  ReadableClientIdDocument,
  ReadableDataInstance,
} from '@janeirodigital/interop-data-model'
import type { ShareAuthorization } from '@janeirodigital/sai-api-messages'
import type * as S from 'effect/Schema'
import { describe, expect, test, vi } from 'vitest'
import { getResource, shareResource } from '../../../src/services'

describe('getResource', () => {
  test('sucessful response', async () => {
    const resourceIri = 'some-iri'
    const lang = 'fr'
    const agentsWithAccess = [
      {
        agent: 'https://bob.example',
      },
      {
        agent: 'https://kim.example',
      },
    ] as unknown as AgentWithAccess[]

    const childInfo = {
      shapeTree: {
        iri: 'some-shape-tree',
        label: 'shape tree label',
      },
      count: 42,
    }
    const dataInstance = {
      iri: resourceIri,
      label: 'some label',
      shapeTree: {
        iri: 'some-shape-tree',
        label: 'shape tree label',
      },
      children: [childInfo],
    } as unknown as ReadableDataInstance

    const saiSession = vi.mocked(
      {
        factory: {
          readable: {
            dataInstance: vi.fn(),
          },
        },
        findSocialAgentsWithAccess: vi.fn(),
      } as unknown as AuthorizationAgent,
      true
    )
    saiSession.factory.readable.dataInstance.mockResolvedValueOnce(dataInstance)
    saiSession.findSocialAgentsWithAccess.mockResolvedValueOnce(agentsWithAccess)

    const expected = {
      id: resourceIri,
      label: dataInstance.label,
      accessGrantedTo: agentsWithAccess.map(({ agent }) => agent),
      children: [
        {
          shapeTree: {
            id: dataInstance.children[0].shapeTree.iri,
            label: dataInstance.children[0].shapeTree.label,
          },
          count: dataInstance.children[0].count,
        },
      ],
      shapeTree: {
        id: dataInstance.shapeTree.iri,
        label: dataInstance.shapeTree.label,
      },
    }

    const resource = await getResource(saiSession, resourceIri, lang)
    expect(resource).toStrictEqual(expected)
  })
})

describe('shareResource', () => {
  test('sucessful response', async () => {
    const saiSession = vi.mocked(
      {
        shareDataInstance: vi.fn(),
        generateAccessGrant: vi.fn(),
        factory: {
          readable: {
            clientIdDocument: vi.fn(),
          },
        },
        findSocialAgentsWithAccess: vi.fn(),
      } as unknown as AuthorizationAgent,
      true
    )

    const clientIdDocument = {
      callbackEndpoint: 'some-endpoint',
    } as unknown as ReadableClientIdDocument

    const authorizationIris = ['https://some.iri', 'https://another.iri']

    saiSession.factory.readable.clientIdDocument.mockResolvedValueOnce(clientIdDocument)
    saiSession.shareDataInstance.mockResolvedValueOnce(authorizationIris)

    const shareAuthorization = {} as unknown as S.Schema.Type<typeof ShareAuthorization>
    const expected = {
      callbackEndpoint: clientIdDocument.callbackEndpoint,
    }
    const resource = await shareResource(saiSession, shareAuthorization)
    expect(saiSession.shareDataInstance).toBeCalledWith(shareAuthorization)
    for (const authorizationIri of authorizationIris) {
      expect(saiSession.generateAccessGrant).toBeCalledWith(authorizationIri)
    }
    expect(resource).toStrictEqual(expected)
  })
})
