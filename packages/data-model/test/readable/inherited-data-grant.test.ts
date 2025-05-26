import { randomUUID } from 'node:crypto'
import { fetch } from '@janeirodigital/interop-test-utils'
import { INTEROP } from '@janeirodigital/interop-utils'
import { beforeAll, describe, test } from 'vitest'
import {
  AbstractDataGrant,
  ApplicationFactory,
  DataInstance,
  InheritedDataGrant,
  type ReadableAccessGrant,
} from '../../src'
import { expect } from '../expect'

const factory = new ApplicationFactory({ fetch, randomUUID })
const selectedFromRegistryDataGrantIri =
  'https://auth.alice.example/cd247a67-0879-4301-abd0-828f63abb252'
const accessGrantIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe'

const inheritsFromSelectedFromRegistryIri =
  'https://auth.alice.example/9827ae00-2778-4655-9f22-08bb9daaee26'
const inheritsFromAllFromRegistryIri =
  'https://auth.alice.example/54b1a123-23ca-4733-9371-700b52b9c567'

let accessGrant: ReadableAccessGrant

beforeAll(async () => {
  accessGrant = await factory.readable.accessGrant(accessGrantIri)
})

test('should use correct subclass', async () => {
  const dataGrant = await factory.readable.dataGrant(inheritsFromSelectedFromRegistryIri)
  expect(dataGrant).toBeInstanceOf(InheritedDataGrant)
})

test('should set correct scopeOfGrant', async () => {
  const dataGrant = await factory.readable.dataGrant(inheritsFromSelectedFromRegistryIri)
  expect(dataGrant.scopeOfGrant).toEqualRdfTerm(INTEROP.Inherited)
})

test('should set iriPrefix', async () => {
  const dataGrant = await factory.readable.dataGrant(inheritsFromSelectedFromRegistryIri)
  const iriPrefix = 'https://pro.alice.example/'
  expect(dataGrant.iriPrefix).toEqual(iriPrefix)
})

test('should set correct canCreate', async () => {
  const dataGrant = await factory.readable.dataGrant(inheritsFromSelectedFromRegistryIri)
  expect(dataGrant.canCreate).toBeTruthy()
})

test('should set inheritsFromGrantIri', async () => {
  const dataGrant = (await factory.readable.dataGrant(
    inheritsFromSelectedFromRegistryIri
  )) as InheritedDataGrant
  expect(dataGrant.inheritsFromGrantIri).toBe(selectedFromRegistryDataGrantIri)
})

test('should set inheritsFromGrant', async () => {
  const dataGrant = (await factory.readable.dataGrant(
    inheritsFromSelectedFromRegistryIri
  )) as InheritedDataGrant
  expect(dataGrant.inheritsFromGrant).toBeInstanceOf(AbstractDataGrant)
})
test('should set inheritsFromGrant', async () => {
  const dataGrant = (await factory.readable.dataGrant(
    inheritsFromSelectedFromRegistryIri
  )) as InheritedDataGrant
  expect(dataGrant.inheritsFromGrant).toBeInstanceOf(AbstractDataGrant)
})

// depends on slash semantics
test('should provide dataRegistryIri', async () => {
  const dataGrant = (await factory.readable.dataGrant(
    inheritsFromSelectedFromRegistryIri
  )) as InheritedDataGrant
  expect(dataGrant.dataRegistryIri).toBe('https://')
})

test('should provide data instance iterator for Inherited of AllFromRegistry', async () => {
  const inheritingGrant = accessGrant.hasDataGrant.find(
    (grant) => grant.iri === inheritsFromAllFromRegistryIri
  )!
  let count = 0
  for await (const instance of inheritingGrant.getDataInstanceIterator()) {
    expect(instance).toBeInstanceOf(DataInstance)
    count += 1
  }
  expect(count).toBe(2)
})

test('should provide data instance iterator for Inherited of SelectedFromRegistry', async () => {
  const inheritingGrant = accessGrant.hasDataGrant.find(
    (grant) => grant.iri === inheritsFromSelectedFromRegistryIri
  )!
  let count = 0
  for await (const instance of inheritingGrant.getDataInstanceIterator()) {
    expect(instance).toBeInstanceOf(DataInstance)
    count += 1
  }
  expect(count).toBe(1)
})

describe('newDataInstance', () => {
  test('should create data instance', async () => {
    const parentInstanceIri =
      'https://pro.alice.example/ccbd77ae-f769-4e07-b41f-5136501e13e7#project'
    const dataGrant = (await factory.readable.dataGrant(
      inheritsFromSelectedFromRegistryIri
    )) as InheritedDataGrant
    const parentInstance = await factory.dataInstance(
      parentInstanceIri,
      dataGrant.inheritsFromGrant
    )
    const newDataInstance = await dataGrant.newDataInstance(parentInstance)
    expect(newDataInstance.iri).toMatch(dataGrant.hasDataRegistration)
  })
})
