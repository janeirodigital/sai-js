import { test, expect } from 'vitest';
import {
  encodeWebId,
  decodeWebId,
  webId2agentUrl,
  agentUrl2webId,
  agentRedirectUrl,
  webhookTargetUrl
} from '../../src/url-templates';

const webId = 'https://alice.example';
const encodedWebId = 'aHR0cHM6Ly9hbGljZS5leGFtcGxl';
const agentUrl = 'http://localhost:4000/agents/aHR0cHM6Ly9hbGljZS5leGFtcGxl';
const peerWebId = 'https://bob.example';

test('encodeWebId', () => {
  expect(encodeWebId(webId)).toEqual(encodedWebId);
});

test('decodeWebId', () => {
  expect(decodeWebId(encodedWebId)).toEqual(webId);
});

test('webId2agentUrl', () => {
  expect(webId2agentUrl(webId)).toEqual(agentUrl);
});

test('agentUrl2webId', () => {
  expect(agentUrl2webId(agentUrl)).toEqual(webId);
});

test('agentRedirectUrl', () => {
  expect(agentRedirectUrl(agentUrl)).toEqual('http://localhost:4000/agents/aHR0cHM6Ly9hbGljZS5leGFtcGxl/redirect');
});

test('webhookTargetUrl', () => {
  expect(webhookTargetUrl(webId, peerWebId)).toEqual(
    'http://localhost:4000/agents/aHR0cHM6Ly9hbGljZS5leGFtcGxl/webhook/aHR0cHM6Ly9ib2IuZXhhbXBsZQ=='
  );
});
