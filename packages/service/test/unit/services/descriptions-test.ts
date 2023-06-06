import { jest } from '@jest/globals';
import type { AuthorizationAgent, NestedDataAuthorizationData } from '@janeirodigital/interop-authorization-agent';
import {
  CRUDApplicationRegistration,
  ReadableAccessAuthorization,
  ReadableAccessNeedGroup,
  ReadableClientIdDocument
} from '@janeirodigital/interop-data-model';
import { getDescriptions, recordAuthorization } from '../../../src/services';
import { ACL, INTEROP } from '@janeirodigital/interop-namespaces';
import { Authorization } from '@janeirodigital/sai-api-messages';

jest.setTimeout(30000);

describe('getDescriptions', () => {
  const applicationIri = 'https://projectron.example';
  const lang = 'en';

  const saiSession = jest.mocked({
    factory: {
      readable: {
        clientIdDocument: jest.fn(),
        accessNeedGroup: jest.fn()
      }
    }
  } as unknown as AuthorizationAgent);

  beforeEach(() => {
    saiSession.factory.readable.clientIdDocument.mockReset();
    saiSession.factory.readable.accessNeedGroup.mockReset();
  });

  test('returns null if no access need group', async () => {
    saiSession.factory.readable.clientIdDocument.mockResolvedValueOnce({} as unknown as ReadableClientIdDocument);

    const descriptions = await getDescriptions(applicationIri, lang, saiSession);
    expect(descriptions).toBeNull();
  });

  test('returns well formatted descriptions', async () => {
    const accessNeedIri = 'https://projectron.example/access-needs#need-projects';
    const childAccessNeed = {
      iri: 'https://projectron.example/access-needs#need-tasks',
      inheritsFromNeed: accessNeedIri,
      descriptions: {
        [lang]: {
          label: 'label for tasks',
          definition: 'definition for tasks'
        }
      },
      required: true,
      accessMode: [ACL.Read],
      shapeTree: {
        iri: 'https://solidshapes.example/trees/Task',
        descriptions: {
          [lang]: {
            label: 'Tasks'
          }
        }
      }
    };
    const accessNeed = {
      iri: accessNeedIri,
      descriptions: {
        [lang]: {
          label: 'label for projects',
          definition: 'definition for projects'
        }
      },
      required: true,
      accessMode: [ACL.Read],
      shapeTree: {
        iri: 'https://solidshapes.example/trees/Project',
        descriptions: {
          [lang]: {
            label: 'Projects'
          }
        }
      },
      children: [childAccessNeed]
    };

    const accessNeedGroup = {
      iri: 'https://projectron.example/access-needs#need-group-pm',
      descriptions: {
        [lang]: {
          label: 'Projectron',
          definition: 'Manage project and tasks'
        }
      },
      accessNeeds: [accessNeed]
    } as unknown as ReadableAccessNeedGroup;
    saiSession.factory.readable.clientIdDocument.mockResolvedValueOnce({
      hasAccessNeedGroup: accessNeedGroup.iri
    } as unknown as ReadableClientIdDocument);
    saiSession.factory.readable.accessNeedGroup.mockResolvedValueOnce(accessNeedGroup);

    const expected = {
      id: applicationIri,
      accessNeedGroup: {
        id: accessNeedGroup.iri,
        label: accessNeedGroup.descriptions[lang].label,
        description: accessNeedGroup.descriptions[lang].definition,
        needs: [
          {
            id: accessNeed.iri,
            label: accessNeed.descriptions[lang].label,
            description: accessNeed.descriptions[lang].definition,
            required: accessNeed.required,
            access: accessNeed.accessMode,
            shapeTree: {
              id: accessNeed.shapeTree.iri,
              label: accessNeed.shapeTree.descriptions[lang].label
            },
            children: [
              {
                id: childAccessNeed.iri,
                parent: childAccessNeed.inheritsFromNeed,
                label: childAccessNeed.descriptions[lang].label,
                description: childAccessNeed.descriptions[lang].definition,
                required: childAccessNeed.required,
                access: childAccessNeed.accessMode,
                shapeTree: {
                  id: childAccessNeed.shapeTree.iri,
                  label: childAccessNeed.shapeTree.descriptions[lang].label
                }
              }
            ]
          }
        ]
      }
    };

    const descriptions = await getDescriptions(applicationIri, lang, saiSession);
    expect(descriptions).toStrictEqual(expected);
  });
});

describe('recordAuthorization', () => {
  const clientIdDocument = {
    callbackEndpoint: 'http://some.iri'
  } as unknown as ReadableClientIdDocument;
  const saiSession = jest.mocked({
    recordAccessAuthorization: jest.fn(),
    findApplicationRegistration: jest.fn(),
    generateAccessGrant: jest.fn(),
    registrySet: {
      hasAgentRegistry: {
        addApplicationRegistration: jest.fn()
      }
    },
    factory: {
      readable: {
        accessNeedGroup: jest.fn(),
        clientIdDocument: jest.fn()
      }
    }
  } as unknown as AuthorizationAgent);

  beforeEach(() => {
    saiSession.recordAccessAuthorization.mockClear();
    saiSession.findApplicationRegistration.mockClear();
    saiSession.generateAccessGrant.mockClear();
    saiSession.registrySet.hasAgentRegistry.addApplicationRegistration.mockClear();
    saiSession.factory.readable.accessNeedGroup.mockClear();
  });

  const bobWebId = 'https://bob.example';

  const accessNeedGroupIri = 'https://projectron.example/access-needs#need-group-pm';
  const authorization = {
    grantee: bobWebId,
    accessNeedGroup: accessNeedGroupIri,
    dataAuthorizations: [
      {
        accessNeed: 'https://projectron.example/access-needs#need-project',
        scope: 'All'
      },
      {
        accessNeed: 'https://projectron.example/access-needs#need-task',
        scope: 'Inherited'
      }
    ]
  } as unknown as Authorization;

  const dataAuthorizations = [
    {
      satisfiesAccessNeed: 'https://projectron.example/access-needs#need-project',
      grantee: bobWebId,
      scopeOfAuthorization: INTEROP.All.value,
      accessMode: [INTEROP.Read.value],
      registeredShapeTree: 'https://solidshapes.example/trees/Project',
      children: [
        {
          satisfiesAccessNeed: 'https://projectron.example/access-needs#need-task',
          grantee: bobWebId,
          scopeOfAuthorization: INTEROP.Inherited.value,
          accessMode: [INTEROP.Read.value],
          registeredShapeTree: 'https://solidshapes.example/trees/Task'
        }
      ]
    }
  ] as NestedDataAuthorizationData[];

  const accessNeedGroup = {
    iri: accessNeedGroupIri,
    accessNeeds: [
      {
        iri: 'https://projectron.example/access-needs#need-project',
        shapeTree: {
          iri: 'https://solidshapes.example/trees/Project'
        },
        accessMode: [INTEROP.Read.value],
        children: [
          {
            iri: 'https://projectron.example/access-needs#need-task',
            shapeTree: {
              iri: 'https://solidshapes.example/trees/Task'
            },
            accessMode: [INTEROP.Read.value],
            inheritsFromNeed: 'https://projectron.example/access-needs#need-project'
          }
        ]
      }
    ]
  } as unknown as ReadableAccessNeedGroup;

  const recordedAccessAuthorizationIri = 'https://auth.alice.example/some-authorization';

  saiSession.recordAccessAuthorization.mockResolvedValue({} as ReadableAccessAuthorization);
  saiSession.factory.readable.accessNeedGroup.mockResolvedValue(accessNeedGroup);
  saiSession.recordAccessAuthorization.mockResolvedValue({
    iri: recordedAccessAuthorizationIri
  } as unknown as ReadableAccessAuthorization);

  describe('granted', () => {
    const grantedAuthorization = { ...authorization, granted: true } as Authorization;
    test('works for existing application registration', async () => {
      saiSession.factory.readable.clientIdDocument.mockResolvedValue(clientIdDocument);
      saiSession.findApplicationRegistration.mockResolvedValueOnce({} as unknown as CRUDApplicationRegistration);

      const accessAuthorization = await recordAuthorization(grantedAuthorization, saiSession);
      expect(saiSession.registrySet.hasAgentRegistry.addApplicationRegistration).not.toBeCalled();
      expect(saiSession.factory.readable.accessNeedGroup).toBeCalledWith(accessNeedGroupIri);
      expect(saiSession.recordAccessAuthorization).toBeCalledWith({
        grantee: grantedAuthorization.grantee,
        granted: grantedAuthorization.granted,
        hasAccessNeedGroup: grantedAuthorization.accessNeedGroup,
        dataAuthorizations
      });
      expect(accessAuthorization).toStrictEqual({
        id: recordedAccessAuthorizationIri,
        callbackEndpoint: clientIdDocument.callbackEndpoint,
        ...grantedAuthorization
      });
      expect(saiSession.generateAccessGrant).toBeCalledWith(recordedAccessAuthorizationIri);
    });

    test('creates application registration if one does not exist', async () => {
      saiSession.findApplicationRegistration.mockResolvedValue(undefined);
      saiSession.factory.readable.clientIdDocument.mockResolvedValue(clientIdDocument);
      await recordAuthorization(grantedAuthorization, saiSession);
      expect(saiSession.registrySet.hasAgentRegistry.addApplicationRegistration).toBeCalledWith(
        grantedAuthorization.grantee
      );
    });
  });

  describe('not granted', () => {
    const notGrantedAuthorization = { ...authorization, granted: false } as Authorization;

    test('works for existing application registration', async () => {
      saiSession.factory.readable.clientIdDocument.mockResolvedValue(clientIdDocument);
      saiSession.findApplicationRegistration.mockResolvedValueOnce({} as unknown as CRUDApplicationRegistration);

      const accessAuthorization = await recordAuthorization(notGrantedAuthorization, saiSession);
      expect(saiSession.registrySet.hasAgentRegistry.addApplicationRegistration).not.toBeCalled();
      expect(saiSession.recordAccessAuthorization).toBeCalledWith({
        grantee: notGrantedAuthorization.grantee,
        granted: notGrantedAuthorization.granted,
        hasAccessNeedGroup: notGrantedAuthorization.accessNeedGroup
      });
      expect(accessAuthorization).toStrictEqual({
        id: recordedAccessAuthorizationIri,
        callbackEndpoint: clientIdDocument.callbackEndpoint,
        ...notGrantedAuthorization
      });
      expect(saiSession.generateAccessGrant).toBeCalledWith(recordedAccessAuthorizationIri);
    });

    test('creates application registration if one does not exist', async () => {
      saiSession.findApplicationRegistration.mockResolvedValue(undefined);
      saiSession.factory.readable.clientIdDocument.mockResolvedValue(clientIdDocument);
      await recordAuthorization(notGrantedAuthorization, saiSession);
      expect(saiSession.registrySet.hasAgentRegistry.addApplicationRegistration).toBeCalledWith(
        notGrantedAuthorization.grantee
      );
    });
  });
});
