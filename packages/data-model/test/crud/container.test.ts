import { randomUUID } from 'node:crypto'
import { fetch } from '@janeirodigital/interop-test-utils'
import { type RdfResponse, insertPatch } from '@janeirodigital/interop-utils'
import { DataFactory, Store } from 'n3'
import { beforeEach, describe, test, vi } from 'vitest'
import { AuthorizationAgentFactory, CRUDContainer } from '../../src'
import { expect } from '../expect'

const webId = 'https://alice.example/#id'
const agentId = 'https://jarvis.alice.example/#agent'
const mockedFetch = vi.fn(fetch)
// @ts-ignore
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch: mockedFetch, randomUUID })

beforeEach(() => {
  mockedFetch.mockClear()
})

const iri = 'https://work.alice.example/something/'
const predicate = 'https://vocab.example/thinks'

describe('replaceStatement', () => {
  test('calls correct patch functions', async () => {
    const priorQuad = DataFactory.quad(
      DataFactory.namedNode(iri),
      DataFactory.namedNode(predicate),
      DataFactory.namedNode(`${iri}beep`)
    )

    const container = new CRUDContainer(iri, factory)
    container.dataset.add(priorQuad)

    const quad = DataFactory.quad(
      DataFactory.namedNode(iri),
      DataFactory.namedNode(predicate),
      DataFactory.namedNode(`${iri}boop`)
    )

    await container.replaceStatement(priorQuad, quad)
    expect(mockedFetch).toBeCalledWith(
      expect.any(String),
      expect.objectContaining({ body: expect.stringContaining('DELETE DATA') })
    )
    expect(mockedFetch).toBeCalledWith(
      expect.any(String),
      expect.objectContaining({ body: expect.stringContaining('INSERT DATA') })
    )
  })
})

describe('applyPatch', () => {
  test('throws if failed to patch', async () => {
    const quad = DataFactory.quad(
      DataFactory.namedNode(iri),
      DataFactory.namedNode(predicate),
      DataFactory.namedNode(`${iri}boop`)
    )
    const sparqlUpdate = await insertPatch(new Store([quad]))
    const container = new CRUDContainer(iri, factory)
    container.descriptionResourceIri = `${iri}.meta`
    mockedFetch.mockResolvedValueOnce({ ok: false } as unknown as RdfResponse)

    expect(container.applyPatch(sparqlUpdate)).rejects.toThrow('failed to patch')
  })
})
