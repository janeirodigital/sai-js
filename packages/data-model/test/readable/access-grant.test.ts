import { randomUUID } from 'node:crypto'
import { fetch } from '@janeirodigital/interop-test-utils'
import { describe, test } from 'vitest'
import { AbstractDataGrant, ApplicationFactory, ReadableAccessGrant } from '../../src'
import { expect } from '../expect'

const factory = new ApplicationFactory({ fetch, randomUUID })
const snippetIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe'

describe('build', () => {
  test('should return instance of Access Receipt', async () => {
    const accessGrant = await ReadableAccessGrant.build(snippetIri, factory)
    expect(accessGrant).toBeInstanceOf(ReadableAccessGrant)
  })

  test('should fetch its data', async () => {
    const accessGrant = await ReadableAccessGrant.build(snippetIri, factory)
    expect(accessGrant.dataset.size).toBeGreaterThan(0)
  })

  test('should build data grants', async () => {
    const accessGrant = await ReadableAccessGrant.build(snippetIri, factory)
    expect(accessGrant.hasDataGrant.length).toBe(10)
    for (const grant of accessGrant.hasDataGrant) {
      expect(grant).toBeInstanceOf(AbstractDataGrant)
    }
  })

  describe('getters', () => {
    test('granted', async () => {
      const accessGrant = await ReadableAccessGrant.build(snippetIri, factory)
      expect(accessGrant.granted).toBe(true)
    })

    test('grantedBy', async () => {
      const accessGrant = await ReadableAccessGrant.build(snippetIri, factory)
      expect(accessGrant.grantedBy).toBeTruthy()
    })
  })
})
