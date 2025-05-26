import { describe, expect, test } from 'vitest'
import {
  getAgentRegistrationIri,
  getDescriptionResource,
  getStorageDescription,
  targetDataRegistrationLink,
} from '../src'

describe('getAgentRegistrationIri', () => {
  const linkHeaderText = `
    <https://projectron.example/#app>;
    anchor="https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659";
    rel="http://www.w3.org/ns/solid/interop#registeredAgent"
  `

  test('should match correct application registration iri', () => {
    expect(getAgentRegistrationIri(linkHeaderText)).toBe(
      'https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659'
    )
  })
})

describe('getDescriptionResource', () => {
  const descriptionResourceIri = 'https://some.iri/.meta'
  const linkHeaderText = `
    <${descriptionResourceIri}>;
    rel="describedby"
  `

  test('should match correct description resource iri', () => {
    expect(getDescriptionResource(linkHeaderText)).toBe(descriptionResourceIri)
  })
})

describe('getStorageDescription', () => {
  const storageDescriptionIri = 'https://some.iri/.desc'
  const linkHeaderText = `
    <${storageDescriptionIri}>;
    rel="http://www.w3.org/ns/solid/terms#storageDescription"
  `

  test('should match correct description resource iri', () => {
    expect(getStorageDescription(linkHeaderText)).toBe(storageDescriptionIri)
  })
})

describe('targetDataRegistrationLink', () => {
  test('should create correct link to target registration', () => {
    const dataRegistrationIri = 'http://some.iri'
    expect(targetDataRegistrationLink(dataRegistrationIri)).toBe(
      `<${dataRegistrationIri}>; rel="http://www.w3.org/ns/solid/interop#targetDataRegistration"`
    )
  })
})
