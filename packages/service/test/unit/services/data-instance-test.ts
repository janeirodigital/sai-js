import { jest, describe, test, expect } from '@jest/globals';
import { AgentWithAccess, AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import { ReadableClientIdDocument, ReadableDataInstance } from '@janeirodigital/interop-data-model';
import { ShareAuthorization } from '@janeirodigital/sai-api-messages';
import { getResource, shareResource } from '../../../src/services';

describe('getResource', () => {
  test('sucessful response', async () => {
    const resourceIri = 'some-iri';
    const lang = 'fr';
    const agentsWithAccess = [
      {
        agent: 'https://bob.example'
      },
      {
        agent: 'https://kim.example'
      }
    ] as unknown as AgentWithAccess[];

    const childInfo = {
      shapeTree: {
        iri: 'some-shape-tree',
        label: 'shape tree label'
      },
      count: 42
    };
    const dataInstance = {
      iri: resourceIri,
      label: 'some label',
      shapeTree: {
        iri: 'some-shape-tree',
        label: 'shape tree label'
      },
      children: [childInfo]
    } as unknown as ReadableDataInstance;

    const saiSession = jest.mocked({
      factory: {
        readable: {
          dataInstance: jest.fn()
        }
      },
      findSocialAgentsWithAccess: jest.fn()
    } as unknown as AuthorizationAgent);
    saiSession.factory.readable.dataInstance.mockResolvedValueOnce(dataInstance);
    saiSession.findSocialAgentsWithAccess.mockResolvedValueOnce(agentsWithAccess);

    const expected = {
      id: resourceIri,
      label: dataInstance.label,
      accessGrantedTo: agentsWithAccess.map(({ agent }) => agent),
      children: [
        {
          shapeTree: {
            id: dataInstance.children[0].shapeTree.iri,
            label: dataInstance.children[0].shapeTree.label
          },
          count: dataInstance.children[0].count
        }
      ],
      shapeTree: {
        id: dataInstance.shapeTree.iri,
        label: dataInstance.shapeTree.label
      }
    };

    const resource = await getResource(saiSession, resourceIri, lang);
    expect(resource).toStrictEqual(expected);
  });
});

describe('shareResource', () => {
  test('sucessful response', async () => {
    const saiSession = jest.mocked({
      shareDataInstance: jest.fn(),
      generateAccessGrant: jest.fn(),
      factory: {
        readable: {
          clientIdDocument: jest.fn()
        }
      },
      findSocialAgentsWithAccess: jest.fn()
    } as unknown as AuthorizationAgent);

    const clientIdDocument = {
      callbackEndpoint: 'some-endpoint'
    } as unknown as ReadableClientIdDocument;

    const authorizationIris = ['https://some.iri', 'https://another.iri'];

    saiSession.factory.readable.clientIdDocument.mockResolvedValueOnce(clientIdDocument);
    saiSession.shareDataInstance.mockResolvedValueOnce(authorizationIris);

    const shareAuthorization = {} as unknown as ShareAuthorization;
    const expected = {
      callbackEndpoint: clientIdDocument.callbackEndpoint
    };
    const resource = await shareResource(saiSession, shareAuthorization);
    expect(saiSession.shareDataInstance).toBeCalledWith(shareAuthorization);
    for (const authorizationIri of authorizationIris) {
      expect(saiSession.generateAccessGrant).toBeCalledWith(authorizationIri);
    }
    expect(resource).toStrictEqual(expected);
  });
});
