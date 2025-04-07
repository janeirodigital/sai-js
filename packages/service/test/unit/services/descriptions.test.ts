import { vi, describe, test, expect, beforeEach } from 'vitest';
import * as S from 'effect/Schema';
import type { AuthorizationAgent, NestedDataAuthorizationData } from '@janeirodigital/interop-authorization-agent';
import {
  CRUDApplicationRegistration,
  ReadableDataInstance,
  ReadableAccessAuthorization,
  ReadableAccessNeedGroup,
  ReadableClientIdDocument,
  ReadableDataRegistration,
  ReadableAccessNeed
} from '@janeirodigital/interop-data-model';
import { ACL, INTEROP } from '@janeirodigital/interop-utils';
import { AgentType, Authorization } from '@janeirodigital/sai-api-messages';
import { getDescriptions, recordAuthorization, listDataInstances } from '../../../src/services';

const projectShapeTree = 'https://solidshapes.example/trees/Project';
const webId = 'https://alice.example';

describe('getDescriptions', () => {
  const applicationIri = 'https://projectron.example';
  const lang = 'en';

  const saiSession = vi.mocked(
    {
      webId,
      registrySet: {
        hasDataRegistry: [{ iri: 'https://home.alice.example/data/' }, { iri: 'https://work.alice.example/data/' }]
      },
      findDataRegistration: vi.fn(),
      socialAgentRegistrations: [
        {
          registeredAgent: 'https://acme.example',
          label: 'ACME',
          reciprocalRegistration: {
            accessGrant: {
              hasDataGrant: [
                {
                  registeredShapeTree: projectShapeTree,
                  hasDataRegistration: 'https://rnd.acme.example/data/projects/',
                  hasDataInstance: new Array(17)
                }
              ]
            }
          }
        }
      ],
      factory: {
        readable: {
          clientIdDocument: vi.fn(),
          accessNeedGroup: vi.fn()
        }
      }
    } as unknown as AuthorizationAgent,
    true
  );

  beforeEach(() => {
    saiSession.factory.readable.clientIdDocument.mockReset();
    saiSession.factory.readable.accessNeedGroup.mockReset();
  });

  test('returns null if no access need group', async () => {
    saiSession.factory.readable.clientIdDocument.mockResolvedValueOnce({} as unknown as ReadableClientIdDocument);

    const descriptions = await getDescriptions(saiSession, applicationIri, AgentType.Application, lang);
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
      getDescription: vi.fn(async (preferredLang: string) => childAccessNeed.descriptions[preferredLang]),
      required: true,
      accessMode: [ACL.Read.value],
      shapeTree: {
        iri: 'https://solidshapes.example/trees/Task',
        descriptions: {
          [lang]: {
            label: 'Tasks'
          }
        },
        getDescription: vi.fn(async (preferredLang: string) => childAccessNeed.shapeTree.descriptions[preferredLang])
      }
    } as unknown as ReadableAccessNeed;
    const accessNeed = {
      iri: accessNeedIri,
      descriptions: {
        [lang]: {
          label: 'label for projects',
          definition: 'definition for projects'
        }
      },
      getDescription: vi.fn(async (preferredLang: string) => accessNeed.descriptions[preferredLang]),
      required: true,
      accessMode: [ACL.Read.value],
      shapeTree: {
        iri: projectShapeTree,
        descriptions: {
          [lang]: {
            label: 'Projects'
          }
        },
        getDescription: vi.fn(async (preferredLang: string) => accessNeed.shapeTree.descriptions[preferredLang])
      },
      children: [childAccessNeed]
    } as unknown as ReadableAccessNeed;

    const accessNeedGroup = {
      iri: 'https://projectron.example/access-needs#need-group-pm',
      descriptions: {
        [lang]: {
          label: 'Projectron',
          definition: 'Manage project and tasks'
        }
      },
      reliableDescriptionLanguages: new Set([lang]),
      getDescription: vi.fn(async (preferredLang: string) => accessNeedGroup.descriptions[preferredLang]),
      accessNeeds: [accessNeed]
    } as unknown as ReadableAccessNeedGroup;
    saiSession.factory.readable.clientIdDocument.mockResolvedValueOnce({
      hasAccessNeedGroup: accessNeedGroup.iri
    } as unknown as ReadableClientIdDocument);
    saiSession.factory.readable.accessNeedGroup.mockResolvedValueOnce(accessNeedGroup);
    saiSession.findDataRegistration.mockImplementationOnce(
      async () =>
        ({
          iri: 'https://home.alice.example/data/projects/',
          contains: new Array(23)
        }) as unknown as ReadableDataRegistration
    );
    saiSession.findDataRegistration.mockImplementationOnce(
      async () =>
        ({
          iri: 'https://work.alice.example/data/projects/',
          contains: new Array(34)
        }) as unknown as ReadableDataRegistration
    );
    const expected = {
      id: applicationIri,
      agentType: AgentType.Application,
      accessNeedGroup: expect.objectContaining({
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
      }),
      dataOwners: [
        {
          id: webId,
          label: webId,
          // @ts-ignore
          dataRegistrations: [
            {
              id: 'https://home.alice.example/data/projects/',
              label: 'https://home.alice.example/data/', // TODO generalize
              shapeTree: projectShapeTree,
              dataRegistry: 'https://home.alice.example/data/',
              count: 23
            },
            {
              id: 'https://work.alice.example/data/projects/',
              label: 'https://work.alice.example/data/', // TODO generalize
              shapeTree: projectShapeTree,
              dataRegistry: 'https://work.alice.example/data/',
              count: 34
            }
          ]
        },
        {
          id: 'https://acme.example',
          label: 'ACME',
          // @ts-ignore
          dataRegistrations: [
            {
              id: 'https://rnd.acme.example/data/projects/',
              label: 'https://rnd.acme.example/data/', // TODO generalize
              shapeTree: projectShapeTree,
              count: 17
            }
          ]
        }
      ]
    };
    const descriptions = await getDescriptions(saiSession, applicationIri, AgentType.Application, lang);
    expect(descriptions).toStrictEqual(expected);
  });
});

describe('listDataInstances', () => {
  const saiSession = vi.mocked(
    {
      webId,
      factory: {
        readable: {
          dataRegistration: vi.fn(),
          dataInstance: vi.fn()
        }
      }
    } as unknown as AuthorizationAgent,
    true
  );

  beforeEach(() => {
    saiSession.factory.readable.dataRegistration.mockReset();
  });

  test('list instances for existing registration', async () => {
    const registrationId = 'https://rnd.acme.example/data/projects/';
    const count = 23;
    const template = {
      iri: 'https://iri.example',
      label: 'Example'
    } as unknown as ReadableDataInstance;
    saiSession.factory.readable.dataRegistration.mockResolvedValueOnce({
      contains: new Array(count)
    } as unknown as ReadableDataRegistration);
    saiSession.factory.readable.dataInstance.mockResolvedValue(template);
    const result = await listDataInstances(saiSession, webId, registrationId);
    expect(saiSession.factory.readable.dataRegistration).toBeCalledWith(registrationId);
    expect(saiSession.factory.readable.dataInstance).toHaveBeenCalledTimes(count);
    for (const instance of result) {
      expect(instance.id).toBe(template.iri);
      expect(instance.label).toBe(template.label);
    }
  });

  test.todo('thorw error if registration does not exist');
});

describe('recordAuthorization', () => {
  const clientIdDocument = {
    callbackEndpoint: 'http://some.iri'
  } as unknown as ReadableClientIdDocument;
  const saiSession = vi.mocked(
    {
      recordAccessAuthorization: vi.fn(),
      findApplicationRegistration: vi.fn(),
      generateAccessGrant: vi.fn(),
      registrySet: {
        hasAgentRegistry: {
          addApplicationRegistration: vi.fn()
        }
      },
      factory: {
        readable: {
          accessNeedGroup: vi.fn(),
          clientIdDocument: vi.fn()
        }
      }
    } as unknown as AuthorizationAgent,
    true
  );

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
    agentType: AgentType.Application,
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
  } as unknown as S.Schema.Type<typeof Authorization>;

  const dataAuthorizations = [
    {
      satisfiesAccessNeed: 'https://projectron.example/access-needs#need-project',
      grantee: bobWebId,
      scopeOfAuthorization: INTEROP.All.value,
      accessMode: [INTEROP.Read.value],
      registeredShapeTree: projectShapeTree,
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
          iri: projectShapeTree
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
    const grantedAuthorization = { ...authorization, granted: true } as S.Schema.Type<typeof Authorization>;
    test('works for existing application registration', async () => {
      saiSession.factory.readable.clientIdDocument.mockResolvedValue(clientIdDocument);
      saiSession.findApplicationRegistration.mockResolvedValueOnce({} as unknown as CRUDApplicationRegistration);

      const accessAuthorization = await recordAuthorization(saiSession, grantedAuthorization);
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
      await recordAuthorization(saiSession, grantedAuthorization);
      expect(saiSession.registrySet.hasAgentRegistry.addApplicationRegistration).toBeCalledWith(
        grantedAuthorization.grantee
      );
    });
  });

  describe('not granted', () => {
    const notGrantedAuthorization = { ...authorization, granted: false } as S.Schema.Type<typeof Authorization>;

    test('works for existing application registration', async () => {
      saiSession.factory.readable.clientIdDocument.mockResolvedValue(clientIdDocument);
      saiSession.findApplicationRegistration.mockResolvedValueOnce({} as unknown as CRUDApplicationRegistration);

      const accessAuthorization = await recordAuthorization(saiSession, notGrantedAuthorization);
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
      await recordAuthorization(saiSession, notGrantedAuthorization);
      expect(saiSession.registrySet.hasAgentRegistry.addApplicationRegistration).toBeCalledWith(
        notGrantedAuthorization.grantee
      );
    });
  });
});
