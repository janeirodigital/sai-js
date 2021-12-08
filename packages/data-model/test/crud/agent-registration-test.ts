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
    expect(agentRegistration.dataset.size).toBe(2);
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
});
