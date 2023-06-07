// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { DataFactory } from 'n3';
import { INTEROP } from '@janeirodigital/interop-utils';
import { AuthorizationAgentFactory, CRUDDataRegistration } from '../../src';

const webId = 'https://alice.example/#id';
const agentId = 'https://jarvis.alice.example/#agent';
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });
const snippetIri = 'https://pro.alice.example/773605f0-b5bf-4d46-878d-5c167eac8b5d';
const newSnippetIri = 'https://auth.alice.example/bd2bb0a3-e95a-4981-a30b-5b6a7358435c';

const data = {
  shapeTree: 'https://solidshapes.example/tree/Other'
};

describe('build', () => {
  test('should return instance of Data Registration', async () => {
    const dataRegistration = await CRUDDataRegistration.build(snippetIri, factory);
    expect(dataRegistration).toBeInstanceOf(CRUDDataRegistration);
  });

  test('should fetch its data if none passed', async () => {
    const dataRegistration = await CRUDDataRegistration.build(snippetIri, factory);
    expect(dataRegistration.dataset.size).toBe(8);
  });

  test('should set dataset if data passed', async () => {
    const quads = [
      DataFactory.quad(DataFactory.namedNode(newSnippetIri), INTEROP.shapeTree, DataFactory.namedNode(data.shapeTree))
    ];
    const dataRegistration = await CRUDDataRegistration.build(newSnippetIri, factory, data);
    expect(dataRegistration.dataset.size).toBe(1);
    expect(dataRegistration.dataset).toBeRdfDatasetContaining(...quads);
  });
});
