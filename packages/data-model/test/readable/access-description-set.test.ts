import { randomUUID } from 'node:crypto'
import { fetch } from '@janeirodigital/interop-test-utils'
import { describe, test } from 'vitest'
import {
  AuthorizationAgentFactory,
  ReadableAccessDescriptionSet,
  ReadableAccessNeedDescription,
  ReadableAccessNeedGroupDescription,
} from '../../src'
import { expect } from '../expect'

const webId = 'https://alice.example/#id'
const agentId = 'https://jarvis.alice.example/#agent'
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID })
const snippetIri = 'https://projectron.example/descriptions-en'

test('factory should build an access description set', async () => {
  const descriptionSet = await factory.readable.accessDescriptionSet(snippetIri)
  expect(descriptionSet).toBeInstanceOf(ReadableAccessDescriptionSet)
})

test('should build the descriptions', async () => {
  const descriptionSet = await factory.readable.accessDescriptionSet(snippetIri)
  expect(descriptionSet.accessNeedDescriptions).toHaveLength(2)
  for (const description of descriptionSet.accessNeedDescriptions) {
    expect(description).toBeInstanceOf(ReadableAccessNeedDescription)
  }
  expect(descriptionSet.accessNeedGroupDescriptions).toHaveLength(1)
  for (const description of descriptionSet.accessNeedGroupDescriptions) {
    expect(description).toBeInstanceOf(ReadableAccessNeedGroupDescription)
  }
})

describe('findInLanguage', () => {
  test('finds description set in language given a resource', async () => {
    const lang = 'en'
    const accessNeedIri = 'https://projectron.example/access-needs#need-project'
    const accessNeed = await factory.readable.accessNeed(accessNeedIri)
    const descriptionSetIri = ReadableAccessDescriptionSet.findInLanguage(accessNeed, lang)
    expect(descriptionSetIri).toBe('https://projectron.example/descriptions-en')
  })
})
