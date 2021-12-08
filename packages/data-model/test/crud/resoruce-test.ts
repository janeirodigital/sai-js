// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { ApplicationFactory, AuthorizationAgentFactory, CRUDResource } from '../../src';
import { DataFactory, Store } from 'n3';
import { INTEROP, XSD } from '@janeirodigital/interop-namespaces';

const webId = 'https://alice.example/#id';
const agentId = 'https://jarvis.alice.example/#agent';
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });
const snippetIri = 'https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659';
const newSnippetIri = 'https://auth.alice.example/afb6a337-40df-4fbe-9b00-5c9c1e56c812';
const data = {};

class CRUDTestResource extends CRUDResource {
  data: {};

  protected async bootstrap(): Promise<void> {
    if (!this.data) {
      await this.fetchData();
    } else {
      this.dataset = new Store();
    }
  }

  public static async build(iri: string, factory: ApplicationFactory, data?: {}): Promise<CRUDTestResource> {
    const instance = new CRUDTestResource(iri, factory, data);
    await instance.bootstrap();
    return instance;
  }
}

describe('update', () => {
  test('should properly use fetch', async () => {
    const localFactory = new ApplicationFactory({ fetch: jest.fn(fetch), randomUUID });
    const testResource = await CRUDTestResource.build(snippetIri, localFactory);
    await testResource.update();

    expect(localFactory.fetch).toHaveBeenCalledWith(snippetIri, {
      method: 'PUT',
      dataset: testResource.dataset
    });
  });

  test('should throw if failed', async () => {
    const fakeFetch = () => Promise.resolve({ ok: false });
    const localFactory = new ApplicationFactory({ fetch, randomUUID });
    const testResource = await CRUDTestResource.build(snippetIri, localFactory);
    // @ts-ignore
    testResource.fetch = fakeFetch;
    return expect(testResource.update()).rejects.toThrow('failed');
  });
});

describe('setTimestampsAndAgents', () => {
  test('when data is avaliable registeredAt is set', async () => {
    const testResource = await CRUDTestResource.build(newSnippetIri, factory, data);
    testResource.update();
    expect(testResource.registeredAt).toBeInstanceOf(Date);
  });

  test('when data is avaliable updatedAt is set', async () => {
    const testResource = await CRUDTestResource.build(newSnippetIri, factory, data);
    testResource.update();
    expect(testResource.updatedAt).toBeInstanceOf(Date);
  });

  test('when data is avaliable registeredBy is set', async () => {
    const testResource = await CRUDTestResource.build(newSnippetIri, factory, data);
    testResource.update();
    expect(testResource.registeredBy).toBe(webId);
  });

  test('when data is avaliable registeredWith is set', async () => {
    const testResource = await CRUDTestResource.build(newSnippetIri, factory, data);
    testResource.update();
    expect(testResource.registeredWith).toBe(agentId);
  });

  test('when data is not avaliable updatedAt is updated', async () => {
    const testResource = await CRUDTestResource.build(snippetIri, factory);
    const originalDate = testResource.updatedAt;
    testResource.update();
    expect(testResource.updatedAt.getTime()).toBeGreaterThan(originalDate.getTime());
  });
});

describe('setters', () => {
  test('registeredAt updates dataset', async () => {
    const currentDate = new Date();
    const testResource = await CRUDTestResource.build(newSnippetIri, factory, data);
    testResource.registeredAt = currentDate;
    const expectedQuad = DataFactory.quad(
      DataFactory.namedNode(newSnippetIri),
      INTEROP.registeredAt,
      DataFactory.literal(currentDate.toISOString(), XSD.dateTime)
    );
    expect(testResource.dataset).toBeRdfDatasetContaining(expectedQuad);
  });
  test('updatedAt updates dataset', async () => {
    const currentDate = new Date();
    const testResource = await CRUDTestResource.build(newSnippetIri, factory, data);
    testResource.updatedAt = currentDate;
    const expectedQuad = DataFactory.quad(
      DataFactory.namedNode(newSnippetIri),
      INTEROP.updatedAt,
      DataFactory.literal(currentDate.toISOString(), XSD.dateTime)
    );
    expect(testResource.dataset).toBeRdfDatasetContaining(expectedQuad);
  });
});

describe('delete', () => {
  test('should properly use fetch', async () => {
    const localFactory = new ApplicationFactory({ fetch: jest.fn(fetch), randomUUID });
    const testResource = await CRUDTestResource.build(snippetIri, localFactory);
    await testResource.delete();
    expect(localFactory.fetch).toHaveBeenCalledWith(snippetIri, { method: 'DELETE' });
  });

  test('should throw if failed', async () => {
    const fakeFetch = () => Promise.resolve({ ok: false });
    const localFactory = new ApplicationFactory({ fetch, randomUUID });
    const testResource = await CRUDTestResource.build(snippetIri, localFactory);
    // @ts-ignore
    testResource.fetch = fakeFetch;
    return expect(testResource.delete()).rejects.toThrow('failed');
  });
});
