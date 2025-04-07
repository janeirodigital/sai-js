import { vi, test, expect } from 'vitest';
import { type AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import { type CRUDSocialAgentRegistration } from '@janeirodigital/interop-data-model';

import { requestAccessUsingApplicationNeeds } from '../../../src/services';

const applicationIri = 'https://projectron.example';
const accessNeedGroupIri = 'https://projectron.example/needs';
const webId = 'https://bob.example';
const socialAgentRegistration = {
  setAccessNeedGroup: vi.fn()
} as unknown as CRUDSocialAgentRegistration;

const saiSession = {
  findSocialAgentRegistration: vi.fn(async () => socialAgentRegistration),
  factory: {
    readable: {
      clientIdDocument: vi.fn(async () => ({ hasAccessNeedGroup: accessNeedGroupIri }))
    }
  }
} as unknown as AuthorizationAgent;

test('sets access need group using one from the app', async () => {
  await requestAccessUsingApplicationNeeds(saiSession, applicationIri, webId);

  expect(saiSession.findSocialAgentRegistration).toBeCalledWith(webId);
  expect(saiSession.factory.readable.clientIdDocument).toBeCalledWith(applicationIri);
  expect(socialAgentRegistration.setAccessNeedGroup).toBeCalledWith(accessNeedGroupIri);
});
