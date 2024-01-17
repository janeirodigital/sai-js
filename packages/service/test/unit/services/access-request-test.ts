import { jest } from '@jest/globals';
import { type AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import { type CRUDSocialAgentRegistration } from '@janeirodigital/interop-data-model';

import { requestAccessUsingApplicationNeeds } from '../../../src/services';

const applicationIri = 'https://projectron.example';
const accessNeedGroupIri = 'https://projectron.example/needs';
const webId = 'https://bob.example';
const socialAgentRegistration = {
  setAccessNeedGroup: jest.fn()
} as unknown as CRUDSocialAgentRegistration;

const saiSession = {
  findSocialAgentRegistration: jest.fn(async () => socialAgentRegistration),
  factory: {
    readable: {
      clientIdDocument: jest.fn(async () => ({ hasAccessNeedGroup: accessNeedGroupIri }))
    }
  }
} as unknown as AuthorizationAgent;

test('sets access need group using one from the app', async () => {
  await requestAccessUsingApplicationNeeds(applicationIri, webId, saiSession);

  expect(saiSession.findSocialAgentRegistration).toBeCalledWith(webId);
  expect(saiSession.factory.readable.clientIdDocument).toBeCalledWith(applicationIri);
  expect(socialAgentRegistration.setAccessNeedGroup).toBeCalledWith(accessNeedGroupIri);
});
