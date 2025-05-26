import { describe, expect, test, vi } from 'vitest'
import { fetchWrapper, parseTurtle } from '../src'

const snippet = `<https://acme.example/4d594c61-7cff-484a-a1d2-1f353ee4e1e7> a <http://www.w3.org/ns/solid/interop#DataRegistration>;
    <http://www.w3.org/ns/solid/interop#registeredBy> <https://garry.example/#id>;
    <http://www.w3.org/ns/solid/interop#registeredWith> <https://solidmin.example/#app>;
    <http://www.w3.org/ns/solid/interop#registeredAt> "2020-08-23T21:12:27.000Z"^^<http://www.w3.org/2001/XMLSchema#dateTime>;
    <http://www.w3.org/ns/solid/interop#registeredShapeTree> <https://solidshapes.example/trees/Project>.
`

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
async function fetchMock(input: RequestInfo, init?: RequestInit): Promise<Response> {
  return {
    clone() {
      return {}
    },
  } as Response
}

describe('fetchWrapper', () => {
  test('should set Accept header on GET', async () => {
    const mock = vi.fn(fetchMock)
    const rdfFetch = fetchWrapper(mock)
    await rdfFetch('https://some.iri')

    expect(mock.mock.calls[0][0]).toBe('https://some.iri')
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const headers = mock.mock.calls[0][1].headers as any
    expect(headers.Accept).toEqual('text/turtle')
  })

  test('should set dataset on response', async () => {
    const mock = vi.fn(fetchMock)
    const responseMock = {
      text: async () => snippet,
      headers: { get: () => 'text/turtle' },
    } as unknown as Response
    responseMock.clone = () => ({ ...responseMock })
    mock.mockReturnValueOnce(Promise.resolve(responseMock))
    const rdfFetch = fetchWrapper(mock)
    const response = await rdfFetch('https://some.iri')

    const expectedDataset = await parseTurtle(snippet)
    const actualDataset = await response.dataset()
    expect(actualDataset.size).toBe(expectedDataset.size)
  })

  test('should process RequestInit on PUT', async () => {
    const dataset = await parseTurtle(snippet)
    const mock = vi.fn(fetchMock)
    const rdfFetch = fetchWrapper(mock)
    await rdfFetch('https://some.iri', { method: 'PUT', dataset, headers: { 'If-Match': '12345' } })

    expect(mock.mock.calls[0][0]).toBe('https://some.iri')
    expect(mock.mock.calls[0][1].body).toMatch(snippet)
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const headers = mock.mock.calls[0][1].headers as any
    expect(headers['Content-Type']).toEqual('text/turtle')
    expect(headers['If-Match']).toEqual('12345')
  })

  test('should throw if dataset called when different Content-Type', async () => {
    const mock = vi.fn(fetchMock)
    const responseMock = {
      text: async () => snippet,
      headers: { get: () => 'text/shex' },
    } as unknown as Response
    responseMock.clone = () => ({ ...responseMock })
    mock.mockReturnValueOnce(Promise.resolve(responseMock))
    const rdfFetch = fetchWrapper(mock)
    const response = await rdfFetch('https://some.iri')
    expect(response.dataset()).rejects.toThrow('Content-Type was text/shex')
  })

  test('should handle Content-Type header with paramter', async () => {
    const mock = vi.fn(fetchMock)
    const responseMock = {
      text: async () => snippet,
      headers: { get: () => 'text/turtle; charset=UTF-8' },
    } as unknown as Response
    responseMock.clone = () => ({ ...responseMock })
    mock.mockReturnValueOnce(Promise.resolve(responseMock))
    const rdfFetch = fetchWrapper(mock)
    const response = await rdfFetch('https://some.iri')

    const expectedDataset = await parseTurtle(snippet)
    const actualDataset = await response.dataset()
    expect(actualDataset.size).toBe(expectedDataset.size)
  })

  test('should set default graph as graph name when parsing turtle', async () => {
    const iri = 'https://some.iri'
    const mock = vi.fn(fetchMock)
    const responseMock = {
      url: iri,
      text: async () => snippet,
      headers: { get: () => 'text/turtle' },
    } as unknown as Response
    responseMock.clone = () => ({ ...responseMock })
    mock.mockReturnValueOnce(Promise.resolve(responseMock))
    const rdfFetch = fetchWrapper(mock)
    const response = await rdfFetch(iri)
    const actualDataset = await response.dataset()
    for (const quad of [...actualDataset]) {
      expect(quad.graph.termType).toBe('DefaultGraph')
    }
  })

  test('should forward the headers', async () => {
    const mock = vi.fn(fetchMock)
    const rdfFetch = fetchWrapper(mock)
    const initHeaders: { [key: string]: string } = {
      'Some-Header-1': 'some value 1',
      'Some-Header-2': 'some value 2',
      'Some-Header-3': 'some value 3',
    }
    await rdfFetch('https://some.iri', { headers: initHeaders })
    expect(mock.mock.calls[0][0]).toBe('https://some.iri')
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const headers = mock.mock.calls[0][1].headers as any
    for (const headerName of Object.keys(initHeaders)) {
      expect(headers[headerName]).toStrictEqual(initHeaders[headerName])
    }
  })
})
