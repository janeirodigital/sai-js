import { randomUUID } from 'node:crypto'
import { fetch } from '@janeirodigital/interop-test-utils'
import { test } from 'vitest'
import { ApplicationFactory, DataOwner, ReadableAccessGrant } from '../src'
import { expect } from './expect'

const factory = new ApplicationFactory({ fetch, randomUUID })
const snippetIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe'

test('should select Registrations', async () => {
  const accessGrant = await ReadableAccessGrant.build(snippetIri, factory)
  const webid = 'https://acme.example/#corp'
  const dataOwner = new DataOwner(webid)
  dataOwner.issuedGrants = accessGrant.hasDataGrant.filter((grant) => grant.dataOwner === webid)
  const shapeTree = 'https://solidshapes.example/trees/Project'
  expect(dataOwner.selectRegistrations(shapeTree).length).toBe(2)
})
