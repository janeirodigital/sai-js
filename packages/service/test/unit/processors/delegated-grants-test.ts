import type { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import { InMemoryStorage } from '@inrupt/solid-client-authn-node';
import { DelegatedGrantsProcessor, IDelegatedGrantsJob } from '../../../src';

import { SessionManager } from '../../../src/session-manager';
jest.mock('../../../src/session-manager', () => {
  return {
    SessionManager: jest.fn(() => {
      return {
        getSaiSession: jest.fn()
      };
    })
  };
});

const sessionManager = jest.mocked(new SessionManager(new InMemoryStorage()));
const webId = 'https://alice.example';
const registeredAgent = 'https://bob.example';
const job: IDelegatedGrantsJob = { data: { webId, registeredAgent } };
const processor = new DelegatedGrantsProcessor(sessionManager);

const mockedUpdateDG = jest.fn();
const saiSessionMock = {
  updateDelegatedGrants: mockedUpdateDG
} as unknown as AuthorizationAgent;
sessionManager.getSaiSession.mockImplementation(async (webid: string) => saiSessionMock);

beforeEach(() => {
  sessionManager.getSaiSession.mockClear();
  mockedUpdateDG.mockClear();
});

test('gets sai session of the correct user', async () => {
  await processor.processorFunction(job);
  expect(sessionManager.getSaiSession).toBeCalledWith(webId);
});

test('calls updateDelegatedGrants', async () => {
  await processor.processorFunction(job);
  expect(mockedUpdateDG).toBeCalledWith(registeredAgent);
});
