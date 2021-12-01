// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { DataFactory } from 'n3';
import { INTEROP, XSD } from '@janeirodigital/interop-namespaces';
import { CRUDAgentRegistration, AuthorizationAgentFactory } from '../../src';

const webId = 'https://alice.example/#id';
const agentId = 'https://jarvis.alice.example/#agent';
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });
const snippetIri = 'https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659';
const newSnippetIri = 'https://auth.alice.example/afb6a337-40df-4fbe-9b00-5c9c1e56c812';
const accessGrantIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe';
const data = {
  registeredBy: 'https://some.iri/',
  registeredWith: 'https://another.iri/',
  registeredAgent: 'https://different.iri/',
  hasAccessGrant: 'https://auth.alice.example/b949cb45-5915-451c-880b-747b4c424b6a'
};

describe('build', () => {
  test('should return instance of Agent Registration', async () => {
    const agentRegistration = await CRUDAgentRegistration.build(snippetIri, factory);
    expect(agentRegistration).toBeInstanceOf(CRUDAgentRegistration);
  });

  test('should fetch its data if none passed', async () => {
    const agentRegistration = await CRUDAgentRegistration.build(snippetIri, factory);
    expect(agentRegistration.dataset.size).toBe(7);
  });

  test('should set dataset if data passed', async () => {
    const quads = [
      DataFactory.quad(
        DataFactory.namedNode(newSnippetIri),
        INTEROP.registeredBy,
        DataFactory.namedNode(data.registeredBy)
      ),
      DataFactory.quad(
        DataFactory.namedNode(newSnippetIri),
        INTEROP.registeredWith,
        DataFactory.namedNode(data.registeredWith)
      ),
      DataFactory.quad(
        DataFactory.namedNode(newSnippetIri),
        INTEROP.registeredAgent,
        DataFactory.namedNode(data.registeredAgent)
      ),
      DataFactory.quad(
        DataFactory.namedNode(newSnippetIri),
        INTEROP.hasAccessGrant,
        DataFactory.namedNode(data.hasAccessGrant)
      )
    ];
    const agentRegistration = await CRUDAgentRegistration.build(newSnippetIri, factory, data);
    expect(agentRegistration.dataset.size).toBe(4);
    expect(agentRegistration.dataset).toBeRdfDatasetContaining(...quads);
  });

  test('should have updatedAt and registeredAt uset for new before update', async () => {
    const agentRegistration = await CRUDAgentRegistration.build(newSnippetIri, factory, data);
    expect(agentRegistration.registeredAt).toBeUndefined();
    expect(agentRegistration.updatedAt).toBeUndefined();
  });
});

describe('hasAccessGrant', () => {
  test('should have getter', async () => {
    const agentRegistration = await CRUDAgentRegistration.build(snippetIri, factory);
    expect(agentRegistration.hasAccessGrant).toBe(accessGrantIri);
  });

  test('setter should update dataset accordingly', async () => {
    const newIri = 'https://some.iri';
    const agentRegistration = await CRUDAgentRegistration.build(snippetIri, factory);
    agentRegistration.hasAccessGrant = newIri;
    expect(agentRegistration.hasAccessGrant).toBe(newIri);
  });

  describe('update', () => {
    test('when data is avaliable registeredAt is set', async () => {
      const agentRegistration = await CRUDAgentRegistration.build(newSnippetIri, factory, data);
      agentRegistration.update();
      expect(agentRegistration.registeredAt).toBeInstanceOf(Date);
    });

    test('when data is avaliable updatedAt is set', async () => {
      const agentRegistration = await CRUDAgentRegistration.build(newSnippetIri, factory, data);
      agentRegistration.update();
      expect(agentRegistration.updatedAt).toBeInstanceOf(Date);
    });

    test('when data is not avaliable updatedAt is updated', async () => {
      const agentRegistration = await CRUDAgentRegistration.build(snippetIri, factory);
      const originalDate = agentRegistration.updatedAt;
      agentRegistration.update();
      expect(agentRegistration.updatedAt.getTime()).toBeGreaterThan(originalDate.getTime());
    });
  });

  describe('setters', () => {
    test('registeredAt updates dataset', async () => {
      const currentDate = new Date();
      const agentRegistration = await CRUDAgentRegistration.build(newSnippetIri, factory, data);
      agentRegistration.registeredAt = currentDate;
      const expectedQuad = DataFactory.quad(
        DataFactory.namedNode(newSnippetIri),
        INTEROP.registeredAt,
        DataFactory.literal(currentDate.toISOString(), XSD.dateTime)
      );
      expect(agentRegistration.dataset).toBeRdfDatasetContaining(expectedQuad);
    });
    test('updatedAt updates dataset', async () => {
      const currentDate = new Date();
      const agentRegistration = await CRUDAgentRegistration.build(newSnippetIri, factory, data);
      agentRegistration.updatedAt = currentDate;
      const expectedQuad = DataFactory.quad(
        DataFactory.namedNode(newSnippetIri),
        INTEROP.updatedAt,
        DataFactory.literal(currentDate.toISOString(), XSD.dateTime)
      );
      expect(agentRegistration.dataset).toBeRdfDatasetContaining(expectedQuad);
    });
  });
});
