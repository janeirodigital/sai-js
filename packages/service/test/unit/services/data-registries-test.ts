// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import { getDataRegistries } from '../../../src/services/data-registries';

const webId = 'https://alice.example';

const saiSession = {
  webId,
  factory: {
    readable: {
      shapeTree: jest.fn((iri: string) => {
        if (iri.includes('Project')) {
          return { descriptions: { en: { label: 'Projects' } } };
        }
        return { descriptions: { en: { label: 'Tasks' } } };
      })
    }
  },
  registrySet: {
    hasDataRegistry: [
      {
        iri: 'https://rnd.acme.example/data/',
        registrations: [
          {
            iri: 'https://rnd.acme.example/data/projects/',
            registeredShapeTree: 'https://solidshapes.example/trees/Project',
            contains: ['a', 'b']
          },
          {
            iri: 'https://rnd.acme.example/data/tasks/',
            registeredShapeTree: 'https://solidshapes.example/trees/Task',
            contains: [1, 2, 3]
          }
        ]
      },
      {
        iri: 'https://hr.acme.example/data/',
        registrations: [
          {
            iri: 'https://hr.acme.example/data/projects/',
            registeredShapeTree: 'https://solidshapes.example/trees/Project',
            contains: ['c', 'd']
          },
          {
            iri: 'https://hr.acme.example/data/tasks/',
            registeredShapeTree: 'https://solidshapes.example/trees/Task',
            contains: [5, 6, 7, 8, 9]
          }
        ]
      }
    ]
  }
} as unknown as AuthorizationAgent;

test('gets well formated data registries', async () => {
  const result = await getDataRegistries(webId, 'en', saiSession);
  expect(result).toEqual([
    {
      id: 'https://rnd.acme.example/data/',
      registrations: [
        {
          id: 'https://rnd.acme.example/data/projects/',
          shapeTree: 'https://solidshapes.example/trees/Project',
          dataRegistry: 'https://rnd.acme.example/data/',
          count: 2,
          label: 'Projects'
        },
        {
          id: 'https://rnd.acme.example/data/tasks/',
          shapeTree: 'https://solidshapes.example/trees/Task',
          dataRegistry: 'https://rnd.acme.example/data/',
          count: 3,
          label: 'Tasks'
        }
      ]
    },
    {
      id: 'https://hr.acme.example/data/',
      registrations: [
        {
          id: 'https://hr.acme.example/data/projects/',
          shapeTree: 'https://solidshapes.example/trees/Project',
          dataRegistry: 'https://hr.acme.example/data/',
          count: 2,
          label: 'Projects'
        },
        {
          id: 'https://hr.acme.example/data/tasks/',
          shapeTree: 'https://solidshapes.example/trees/Task',
          dataRegistry: 'https://hr.acme.example/data/',
          count: 5,
          label: 'Tasks'
        }
      ]
    }
  ]);
});
