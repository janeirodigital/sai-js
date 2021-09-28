// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { InteropFactory, CRUDResource } from '../src';

const snippetIri = 'https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659';

class CRUDTestResource extends CRUDResource {
  private async bootstrap(): Promise<void> {
    await this.fetchData();
  }

  public static async build(iri: string, factory: InteropFactory): Promise<CRUDTestResource> {
    const instance = new CRUDTestResource(iri, factory);
    await instance.bootstrap();
    return instance;
  }
}

describe('update', () => {
  test('should properly use fetch', async () => {
    const localFactory = new InteropFactory({ fetch: jest.fn(fetch), randomUUID });
    const testResource = await CRUDTestResource.build(snippetIri, localFactory);
    await testResource.update();

    expect(localFactory.fetch).toHaveBeenCalledWith(snippetIri, {
      method: 'PUT',
      dataset: testResource.dataset
    });
  });

  test('should throw if failed', async () => {
    const fakeFetch = () => Promise.resolve({ ok: false });
    const localFactory = new InteropFactory({ fetch, randomUUID });
    const testResource = await CRUDTestResource.build(snippetIri, localFactory);
    // @ts-ignore
    testResource.fetch = fakeFetch;
    return expect(testResource.update()).rejects.toThrow('failed');
  });
});

describe('delete', () => {
  test('should properly use fetch', async () => {
    const localFactory = new InteropFactory({ fetch: jest.fn(fetch), randomUUID });
    const testResource = await CRUDTestResource.build(snippetIri, localFactory);
    await testResource.delete();
    expect(localFactory.fetch).toHaveBeenCalledWith(snippetIri, { method: 'DELETE' });
  });

  test('should throw if failed', async () => {
    const fakeFetch = () => Promise.resolve({ ok: false });
    const localFactory = new InteropFactory({ fetch, randomUUID });
    const testResource = await CRUDTestResource.build(snippetIri, localFactory);
    // @ts-ignore
    testResource.fetch = fakeFetch;
    return expect(testResource.delete()).rejects.toThrow('failed');
  });
});
