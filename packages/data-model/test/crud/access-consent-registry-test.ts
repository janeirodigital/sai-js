// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { ReadableAccessConsent, AuthorizationAgentFactory, CRUDAccessConsentRegistry } from '../../src';
import { DataFactory } from 'n3';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { getAllMatchingQuads, getOneMatchingQuad } from '@janeirodigital/interop-utils';

const webId = 'https://alice.example/#id';
const agentId = 'https://jarvis.alice.example/#agent';
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });
const snippetIri = 'https://auth.alice.example/96feb105-063e-4996-ab74-5e504c6ceae5';

test('should provide accessConsents', async () => {
  const registry = await factory.crud.accessConsentRegistry(snippetIri);
  let count = 0;
  for await (const consent of registry.accessConsents) {
    count += 1;
    expect(consent).toBeInstanceOf(ReadableAccessConsent);
  }
  expect(count).toBe(2);
});

test('should provide iriForContained method', async () => {
  const registry = await factory.crud.accessConsentRegistry(snippetIri);
  expect(registry.iriForContained()).toMatch(registry.iri);
});

describe('add', () => {
  let registry: CRUDAccessConsentRegistry;
  let consent: ReadableAccessConsent;

  beforeEach(async () => {
    registry = await factory.crud.accessConsentRegistry(snippetIri);
    consent = {
      iri: registry.iriForContained(),
      registeredAgent: 'https://someone.example/#id'
    } as unknown as ReadableAccessConsent;
  });

  test('should add new quad linking to added consent', async () => {
    const quads = [
      DataFactory.quad(
        DataFactory.namedNode(registry.iri),
        INTEROP.hasAccessConsent,
        DataFactory.namedNode(consent.iri)
      )
    ];
    expect(registry.dataset).not.toBeRdfDatasetContaining(...quads);
    await registry.add(consent);
    expect(registry.dataset).toBeRdfDatasetContaining(...quads);
  });

  test('should remove link to prior consent for that agent if exists', async () => {
    consent = {
      iri: registry.iriForContained(),
      registeredAgent: 'https://projectron.example/#app'
    } as unknown as ReadableAccessConsent;
    const projectronConsentIri = 'https://auth.alice.example/eac2c39c-c8b3-4880-8b9f-a3e12f7f6372';
    const priorQuads = [
      registry.getQuad(
        DataFactory.namedNode(registry.iri),
        INTEROP.hasAccessConsent,
        DataFactory.namedNode(projectronConsentIri)
      )
    ];
    expect(registry.dataset).toBeRdfDatasetContaining(...priorQuads);
    await registry.add(consent);
    expect(registry.dataset).not.toBeRdfDatasetContaining(...priorQuads);
  });

  test('should update itself', async () => {
    const accessRegistrySpy = jest.spyOn(registry, 'update');
    await registry.add(consent);
    expect(accessRegistrySpy).toBeCalled();
  });

  test('should not remove consents for other agents', async () => {
    const numberOfConsentsBefore = registry.getQuadArray(null, INTEROP.hasAccessConsent).length;
    await registry.add(consent);
    const numberOfConsentsAfter = registry.getQuadArray(null, INTEROP.hasAccessConsent).length;
    expect(numberOfConsentsAfter).toBe(numberOfConsentsBefore + 1);
  });
});

describe('findConsent', () => {
  test('should return access consent if exists', async () => {
    const registry = await factory.crud.accessConsentRegistry(snippetIri);
    const agentIri = 'https://projectron.example/#app';
    const consent = await registry.findConsent(agentIri);
    expect(consent).toBeInstanceOf(ReadableAccessConsent);
  });

  test('should return undefined if access consent does not exist', async () => {
    const registry = await factory.crud.accessConsentRegistry(snippetIri);
    const agentIri = 'https://non-existing.example/#oops';
    const consent = await registry.findConsent(agentIri);
    expect(consent).toBeUndefined();
  });
});
