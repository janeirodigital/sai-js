import type { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent'
import type { CRUDSocialAgentRegistration } from '@janeirodigital/interop-data-model'
import { type Mocked, describe, expect, test, vi } from 'vitest'
import { getDataRegistries } from '../../../src/services/data-registries'

const aliceId = 'https://alice.example'
const bobId = 'https://bob.example'

const projectsTree = 'https://solidshapes.example/trees/Project'
const tasksTree = 'https://solidshapes.example/trees/Task'

const saiSession = {
  webId: aliceId,
  factory: {
    readable: {
      shapeTree: vi.fn((iri: string) => {
        if (iri.includes('Project')) {
          return { descriptions: { en: { label: 'Projects' } } }
        }
        return { descriptions: { en: { label: 'Tasks' } } }
      }),
    },
  },
  registrySet: {
    hasDataRegistry: [
      {
        iri: 'https://rnd.acme.example/data/',
        storageIri: async () => 'https://rnd.acme.example/',
        registrations: [
          {
            iri: 'https://rnd.acme.example/data/projects/',
            registeredShapeTree: projectsTree,
            contains: ['a', 'b'],
          },
          {
            iri: 'https://rnd.acme.example/data/tasks/',
            registeredShapeTree: tasksTree,
            contains: [1, 2, 3],
          },
        ],
      },
      {
        iri: 'https://hr.acme.example/data/',
        storageIri: async () => 'https://hr.acme.example/',
        registrations: [
          {
            iri: 'https://hr.acme.example/data/projects/',
            registeredShapeTree: projectsTree,
            contains: ['c', 'd'],
          },
          {
            iri: 'https://hr.acme.example/data/tasks/',
            registeredShapeTree: tasksTree,
            contains: [5, 6, 7, 8, 9],
          },
        ],
      },
    ],
  },
  findSocialAgentRegistration: vi.fn(),
} as unknown as Mocked<AuthorizationAgent>

describe('owned data', () => {
  test('gets well formated data registries', async () => {
    const result = await getDataRegistries(saiSession, aliceId, 'en')
    expect(result).toEqual([
      {
        id: 'https://rnd.acme.example/data/',
        label: 'https://rnd.acme.example/',
        registrations: [
          {
            id: 'https://rnd.acme.example/data/projects/',
            shapeTree: projectsTree,
            dataRegistry: 'https://rnd.acme.example/data/',
            count: 2,
            label: 'Projects',
          },
          {
            id: 'https://rnd.acme.example/data/tasks/',
            shapeTree: tasksTree,
            dataRegistry: 'https://rnd.acme.example/data/',
            count: 3,
            label: 'Tasks',
          },
        ],
      },
      {
        id: 'https://hr.acme.example/data/',
        label: 'https://hr.acme.example/',
        registrations: [
          {
            id: 'https://hr.acme.example/data/projects/',
            shapeTree: projectsTree,
            dataRegistry: 'https://hr.acme.example/data/',
            count: 2,
            label: 'Projects',
          },
          {
            id: 'https://hr.acme.example/data/tasks/',
            shapeTree: tasksTree,
            dataRegistry: 'https://hr.acme.example/data/',
            count: 5,
            label: 'Tasks',
          },
        ],
      },
    ])
  })
})

describe('peer data', () => {
  test.skip('throw if peer registration not found', async () => {
    expect(getDataRegistries(saiSession, bobId, 'en')).toThrow('missing social agent registration')
  })

  test('throw if reciprocal registration not found', async () => {
    saiSession.findSocialAgentRegistration.mockResolvedValueOnce({} as CRUDSocialAgentRegistration)
    expect(getDataRegistries(saiSession, bobId, 'en')).rejects.toThrow(
      'missing social agent registration'
    )
  })

  test('returns empty array if no access grant', async () => {
    saiSession.findSocialAgentRegistration.mockResolvedValueOnce({
      reciprocalRegistration: {} as CRUDSocialAgentRegistration,
    } as CRUDSocialAgentRegistration)
    const result = await getDataRegistries(saiSession, bobId, 'en')
    expect(result).toEqual([])
  })

  test('gets well formated data registries', async () => {
    const proRegistryIri = 'https://pro.bob.example'
    const homeRegistryIri = 'https://home.bob.example'
    saiSession.findSocialAgentRegistration.mockResolvedValueOnce({
      reciprocalRegistration: {
        accessGrant: {
          hasDataGrant: [
            {
              dataRegistryIri: proRegistryIri,
              storageIri: proRegistryIri,
              hasDataRegistration: 'https://pro.bob.example/projects',
              registeredShapeTree: projectsTree,
            },
            {
              dataRegistryIri: proRegistryIri,
              storageIri: proRegistryIri,
              hasDataRegistration: 'https://pro.bob.example/tasks',
              registeredShapeTree: tasksTree,
            },
            {
              dataRegistryIri: homeRegistryIri,
              storageIri: homeRegistryIri,
              hasDataRegistration: 'https://home.bob.example/projects',
              registeredShapeTree: projectsTree,
            },
          ],
        },
      } as unknown as CRUDSocialAgentRegistration,
    } as CRUDSocialAgentRegistration)
    const result = await getDataRegistries(saiSession, bobId, 'en')
    expect(result).toEqual([
      {
        id: proRegistryIri,
        label: proRegistryIri,
        registrations: [
          {
            id: 'https://pro.bob.example/projects',
            shapeTree: projectsTree,
            dataRegistry: proRegistryIri,
            label: 'Projects',
          },
          {
            id: 'https://pro.bob.example/tasks',
            shapeTree: tasksTree,
            dataRegistry: proRegistryIri,
            label: 'Tasks',
          },
        ],
      },
      {
        id: homeRegistryIri,
        label: homeRegistryIri,
        registrations: [
          {
            id: 'https://home.bob.example/projects',
            shapeTree: projectsTree,
            dataRegistry: homeRegistryIri,
            label: 'Projects',
          },
        ],
      },
    ])
  })
})
