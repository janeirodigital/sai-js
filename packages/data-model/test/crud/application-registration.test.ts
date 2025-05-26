import { randomUUID } from 'node:crypto'
import { fetch } from '@janeirodigital/interop-test-utils'
import { DataFactory } from 'n3'
import { test } from 'vitest'
import { AuthorizationAgentFactory } from '../../src'
import { expect } from '../expect'

const webId = 'https://alice.example/#id'
const agentId = 'https://jarvis.alice.example/#agent'
const snippetIri = 'https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659'
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID })
const applicationIri = 'https://projectron.example/#app'

test('getters', async () => {
  const applicationRegistration = await factory.crud.applicationRegistration(snippetIri)
  expect(applicationRegistration.registeredAgent).toEqual(applicationIri)
  expect(applicationRegistration.applicationNode).toEqualRdfTerm(
    DataFactory.namedNode(applicationIri)
  )
  expect(applicationRegistration.registeredAt).toBeInstanceOf(Date)
  expect(applicationRegistration.updatedAt).toBeInstanceOf(Date)
  expect(applicationRegistration.name).toEqual('Projectron')
  expect(applicationRegistration.logo).toEqual('https://projectron.example/logo.png')
  expect(applicationRegistration.accessNeedGroup).toEqual('https://projectron.example/needs')
})
