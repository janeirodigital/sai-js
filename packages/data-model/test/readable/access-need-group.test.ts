import { randomUUID } from 'node:crypto'
import { fetch } from '@janeirodigital/interop-test-utils'
import { describe, test } from 'vitest'
import { AuthorizationAgentFactory, ReadableAccessNeed, ReadableAccessNeedGroup } from '../../src'
import { expect } from '../expect'

const webId = 'https://alice.example/#id'
const agentId = 'https://jarvis.alice.example/#agent'
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID })
const snippetIri = 'https://projectron.example/access-needs#need-group-pm'

test('factory should build an access need group', async () => {
  const needGroup = await factory.readable.accessNeedGroup(snippetIri)
  expect(needGroup).toBeInstanceOf(ReadableAccessNeedGroup)
})

test('access needs', async () => {
  const needGroup = await factory.readable.accessNeedGroup(snippetIri)
  const accessNeedIri = 'https://projectron.example/access-needs#need-project'
  expect(needGroup.hasAccessNeed).toHaveLength(1)
  expect(needGroup.hasAccessNeed[0]).toBe(accessNeedIri)
  expect(needGroup.accessNeeds).toHaveLength(1)
  expect(needGroup.accessNeeds[0].iri).toBe(accessNeedIri)
  expect(needGroup.accessNeeds[0]).toBeInstanceOf(ReadableAccessNeed)
})

describe('descriptions', () => {
  test('should get description for language', async () => {
    const lang = 'en'
    const needGroup = await factory.readable.accessNeedGroup(snippetIri, lang)
    expect(needGroup.descriptions[lang]).toBeDefined()
    expect(needGroup.descriptions[lang].label).toBe('Manage Projects')
    expect(needGroup.descriptions[lang].definition).toBe(
      'Allow Projectron to read the Projects you select, and Task in those projects.'
    )
  })

  test('should gracefully fail if no description set for language', async () => {
    const lang = 'fr'
    const needGroup = await factory.readable.accessNeedGroup(snippetIri, lang)
    expect(needGroup.descriptions[lang]).toBeUndefined()
  })

  test('should gracefully fail if description set with missing description for language', async () => {
    const lang = 'de'
    const needGroup = await factory.readable.accessNeedGroup(snippetIri, lang)
    expect(needGroup.descriptions[lang]).toBeUndefined()
  })

  test('should get reliable description languages', async () => {
    const needGroup = await factory.readable.accessNeedGroup(snippetIri)
    expect([...needGroup.reliableDescriptionLanguages]).toStrictEqual(['en', 'pl'])
  })
})
