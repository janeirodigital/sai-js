import { randomUUID } from 'node:crypto'
import { fetch } from '@janeirodigital/interop-test-utils'
import { ACL } from '@janeirodigital/interop-utils'
import { describe, test } from 'vitest'
import { AuthorizationAgentFactory, ReadableAccessNeed } from '../../src'
import { expect } from '../expect'

const webId = 'https://alice.example/#id'
const agentId = 'https://jarvis.alice.example/#agent'
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID })
const snippetIri = 'https://projectron.example/access-needs#need-project'
const childIri = 'https://projectron.example/access-needs#need-task'

test('factory should build an access need', async () => {
  const need = await factory.readable.accessNeed(snippetIri)
  expect(need).toBeInstanceOf(ReadableAccessNeed)
})

test('getters', async () => {
  const need = await factory.readable.accessNeed(snippetIri)
  expect(need.registeredShapeTree).toBe('https://solidshapes.example/trees/Project')
  expect(need.inheritsFromNeed).toBeUndefined()
  expect(need.hasInheritingNeed).toEqual(expect.arrayContaining([childIri]))
  expect(need.accessMode).toEqual(
    expect.arrayContaining([ACL.Read.value, ACL.Create.value, ACL.Update.value, ACL.Delete.value])
  )
  expect(need.required).toBe(true)
})

test('children', async () => {
  const need = await factory.readable.accessNeed(snippetIri)
  expect(need.children).toHaveLength(1)
  expect(need.children[0]).toBeInstanceOf(ReadableAccessNeed)
  expect(need.children[0].iri).toBe(childIri)
})

test('parent', async () => {
  const childNeed = await factory.readable.accessNeed(childIri)
  expect(childNeed.inheritsFromNeed).toBe(snippetIri)
  expect(childNeed.hasInheritingNeed).toHaveLength(0)
})

describe('descriptions', () => {
  test('should get description for language', async () => {
    const lang = 'en'
    const need = await factory.readable.accessNeed(snippetIri, lang)
    expect(need.descriptions[lang]).toBeDefined()
    expect(need.descriptions[lang].label).toBe(
      'Access to Projects is essential for Projectron to perform its core function of Project Management'
    )
  })

  test('should gracefully fail if no description set for language', async () => {
    const lang = 'fr'
    const need = await factory.readable.accessNeed(snippetIri, lang)
    expect(need.descriptions[lang]).toBeUndefined()
  })

  test('should gracefully fail if description set with missing description for language', async () => {
    const lang = 'de'
    const need = await factory.readable.accessNeed(snippetIri, lang)
    expect(need.descriptions[lang]).toBeUndefined()
  })

  test('should get description languages', async () => {
    const lang = 'en'
    const accessNeed = await factory.readable.accessNeed(snippetIri, lang)
    expect([...accessNeed.descriptionLanguages]).toStrictEqual(['en', 'pl'])
  })

  test('should get reliable description languages', async () => {
    const accessNeed = await factory.readable.accessNeed(snippetIri)
    expect([...accessNeed.reliableDescriptionLanguages]).toStrictEqual(['en', 'pl'])
  })
})
