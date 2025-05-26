import { randomUUID } from 'node:crypto'
import { fetch } from '@janeirodigital/interop-test-utils'
import { describe, test } from 'vitest'
import { ApplicationFactory, ReadableAccessGrant, ReadableApplicationRegistration } from '../../src'
import { expect } from '../expect'

const factory = new ApplicationFactory({ fetch, randomUUID })
const snippetIri = 'https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659'
const accessGrantIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe'

describe('build', () => {
  test('should return instance of Application Registration', async () => {
    const applicationRegistration = await ReadableApplicationRegistration.build(snippetIri, factory)
    expect(applicationRegistration).toBeInstanceOf(ReadableApplicationRegistration)
  })

  test('should fetch its data', async () => {
    const applicationRegistration = await ReadableApplicationRegistration.build(snippetIri, factory)
    expect(applicationRegistration.dataset.size).toBeGreaterThan(0)
  })

  test('should build related access grant', async () => {
    const applicationRegistration = await ReadableApplicationRegistration.build(snippetIri, factory)
    const accessGrant = applicationRegistration.hasAccessGrant
    expect(accessGrant).toBeInstanceOf(ReadableAccessGrant)
    expect(accessGrant.iri).toBe(accessGrantIri)
  })

  test('should provide iriForContained method', async () => {
    const applicationRegistration = await ReadableApplicationRegistration.build(snippetIri, factory)
    expect(applicationRegistration.iriForContained()).toMatch(applicationRegistration.iri)
  })
})
