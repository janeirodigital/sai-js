import { randomUUID } from 'node:crypto'
import { fetch } from '@janeirodigital/interop-test-utils'
import { test } from 'vitest'
import { AuthorizationAgentFactory, ReadableAccessNeedDescription } from '../../src'
import { expect } from '../expect'

const webId = 'https://alice.example/#id'
const agentId = 'https://jarvis.alice.example/#agent'
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID })
const snippetIri = 'https://projectron.example/descriptions-en#en-need-project'

test('factory should build an access need description', async () => {
  const description = await factory.readable.accessNeedDescription(snippetIri)
  expect(description).toBeInstanceOf(ReadableAccessNeedDescription)
})

test('getters', async () => {
  const description = await factory.readable.accessNeedDescription(snippetIri)
  const expectedAccessNeedIri = 'https://projectron.example/access-needs#need-project'
  expect(description.hasAccessNeed).toBe(expectedAccessNeedIri)
  const expectedLabel =
    'Access to Projects is essential for Projectron to perform its core function of Project Management'
  expect(description.label).toBe(expectedLabel)
  expect(description.definition).toBe(undefined)
})
