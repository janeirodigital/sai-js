// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import {
  AuthorizationAgentFactory,
  ReadableDataRegistration,
  CRUDDataRegistration,
  DataRegistrationData
} from '../../src';
import { DataFactory } from 'n3';
import { INTEROP } from '@janeirodigital/interop-namespaces';

const webId = 'https://alice.example/#id';
const agentId = 'https://jarvis.alice.example/#agent';
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });
const snippetIri = 'https://home.alice.example/2d3d97b4-a26d-434e-afa2-e3bc8e8e2b56';

test('hasRegistration', async () => {
  const dataRegistry = await factory.crud.dataRegistry(snippetIri);
  expect(dataRegistry.hasRegistration).toHaveLength(2);
});

test('registrations', async () => {
  const dataRegistry = await factory.crud.dataRegistry(snippetIri);
  let count = 0;
  for await (const registration of dataRegistry.registrations) {
    expect(registration).toBeInstanceOf(ReadableDataRegistration);
    count += 1;
  }
  expect(count).toBe(2);
});

describe('createRegistration', () => {
  const projectShapeTree = 'https://solidshapes.example/trees/Project';

  test('should throw if registration for given shape tree exists', async () => {
    const dataRegistry = await factory.crud.dataRegistry(snippetIri);
    await expect(dataRegistry.createRegistration(projectShapeTree)).rejects.toThrow('registration already exists');
  });

  test('should return created data registration', async () => {
    const otherShapeTree = 'https://solidshapes.example/tree/Other';
    const dataRegistry = await factory.crud.dataRegistry(snippetIri);
    const registration = await dataRegistry.createRegistration(otherShapeTree);
    expect(registration).toBeInstanceOf(CRUDDataRegistration);
  });

  test('should udpate created data registration', async () => {
    const localFactory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });
    const updateMock = jest.fn();
    localFactory.crud.dataRegistration = jest.fn(
      () => ({ update: updateMock } as unknown as Promise<CRUDDataRegistration>)
    );

    const otherShapeTree = 'https://solidshapes.example/tree/Other';
    const dataRegistry = await localFactory.crud.dataRegistry(snippetIri);
    const registration = await dataRegistry.createRegistration(otherShapeTree);

    expect(updateMock).toBeCalled();
  });

  test('should link to new data registration and update itself', async () => {
    const otherShapeTree = 'https://solidshapes.example/tree/Other';
    const dataRegistry = await factory.crud.dataRegistry(snippetIri);
    const dataRegistryUpdateSpy = jest.spyOn(dataRegistry, 'update');
    const registration = await dataRegistry.createRegistration(otherShapeTree);
    const expectedQuads = [
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.hasRegistration,
        DataFactory.namedNode(registration.iri)
      )
    ];
    expect(dataRegistry.dataset).toBeRdfDatasetContaining(...expectedQuads);
    expect(dataRegistryUpdateSpy).toBeCalled();
  });
});
