// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
import { randomUUID } from 'crypto';
import { DataFactory, Store } from 'n3';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { insertPatch, RdfResponse } from '@janeirodigital/interop-utils';

import { AuthorizationAgentFactory, CRUDContainer } from '../../src';

const webId = 'https://alice.example/#id';
const agentId = 'https://jarvis.alice.example/#agent';
const mockedFetch = jest.fn(fetch);
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch: mockedFetch, randomUUID });

beforeEach(() => {
  mockedFetch.mockClear();
});

const iri = 'https://work.alice.example/something/';
const predicate = 'https://vocab.example/thinks';

describe('replaceStatement', () => {
  test('calls correct patch functions', async () => {
    const priorQuad = DataFactory.quad(
      DataFactory.namedNode(iri),
      DataFactory.namedNode(predicate),
      DataFactory.namedNode(`${iri}beep`)
    );

    const container = new CRUDContainer(iri, factory);
    container.dataset.add(priorQuad);

    const quad = DataFactory.quad(
      DataFactory.namedNode(iri),
      DataFactory.namedNode(predicate),
      DataFactory.namedNode(`${iri}boop`)
    );

    await container.replaceStatement(priorQuad, quad);
    expect(mockedFetch).toBeCalledWith(
      expect.any(String),
      expect.objectContaining({ body: expect.stringContaining('DELETE DATA') })
    );
    expect(mockedFetch).toBeCalledWith(
      expect.any(String),
      expect.objectContaining({ body: expect.stringContaining('INSERT DATA') })
    );
  });
});

describe('applyPatch', () => {
  test('throws if failed to patch', async () => {
    const quad = DataFactory.quad(
      DataFactory.namedNode(iri),
      DataFactory.namedNode(predicate),
      DataFactory.namedNode(`${iri}boop`)
    );
    const sparqlUpdate = await insertPatch(new Store([quad]));
    const container = new CRUDContainer(iri, factory);
    container.descriptionResourceIri = `${iri}.meta`;
    mockedFetch.mockResolvedValueOnce({ ok: false } as unknown as RdfResponse);

    expect(container.applyPatch(sparqlUpdate)).rejects.toThrow('failed to patch');
  });
});
