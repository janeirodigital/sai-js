import { expect, test } from 'vitest'
import {
  agentRedirectUrl,
  agentUrl2webId,
  decodeWebId,
  encodeWebId,
  webId2agentUrl,
  webhookTargetUrl,
} from '../../src/url-templates'

const webId = 'https://alice.example'
const encodedWebId = 'aHR0cHM6Ly9hbGljZS5leGFtcGxl'
const agentUrl = 'https://sai.docker/agents/aHR0cHM6Ly9hbGljZS5leGFtcGxl'
const peerWebId = 'https://bob.example'

test('encodeWebId', () => {
  expect(encodeWebId(webId)).toEqual(encodedWebId)
})

test('decodeWebId', () => {
  expect(decodeWebId(encodedWebId)).toEqual(webId)
})

test('webId2agentUrl', () => {
  expect(webId2agentUrl(webId)).toEqual(agentUrl)
})

test('agentUrl2webId', () => {
  expect(agentUrl2webId(agentUrl)).toEqual(webId)
})

test('agentRedirectUrl', () => {
  expect(agentRedirectUrl(agentUrl)).toEqual(
    'https://sai.docker/agents/aHR0cHM6Ly9hbGljZS5leGFtcGxl/redirect'
  )
})

test('webhookTargetUrl', () => {
  expect(webhookTargetUrl(webId, peerWebId)).toEqual(
    'https://sai.docker/agents/aHR0cHM6Ly9hbGljZS5leGFtcGxl/webhook/aHR0cHM6Ly9ib2IuZXhhbXBsZQ=='
  )
})
