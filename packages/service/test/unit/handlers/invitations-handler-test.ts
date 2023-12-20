// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';

import { InMemoryStorage } from '@inrupt/solid-client-authn-node';
import { type HttpError, type HttpHandlerRequest } from '@digita-ai/handlersjs-http';
import type { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import type {
  CRUDAgentRegistry,
  CRUDRegistrySet,
  CRUDSocialAgentInvitation,
  CRUDSocialAgentRegistration
} from '@janeirodigital/interop-data-model';

import { MockedQueue } from '../mocked-queue';
import {
  InvitationsHandler,
  SessionManager,
  AuthenticatedAuthnContext,
  invitationCapabilityUrl,
  encodeWebId
} from '../../../src';

jest.mock('../../../src/session-manager', () => {
  const originalModule = jest.requireActual('../../../src/session-manager') as object;

  return {
    ...originalModule,
    SessionManager: jest.fn(() => ({
      getSaiSession: jest.fn()
    }))
  };
});

let reciprocalQueue: MockedQueue;

const aliceWebId = 'https://alice.example';
const bobWebId = 'https://bob.example';
const capabilityUrl = invitationCapabilityUrl(aliceWebId, crypto.randomUUID());
const label = 'Bob';
const note = 'some dude';

const manager = jest.mocked(new SessionManager(new InMemoryStorage()));
let invitationsHandler: InvitationsHandler;

beforeEach(() => {
  manager.getSaiSession.mockReset();
  reciprocalQueue = new MockedQueue('reciprocal-registrations');
  invitationsHandler = new InvitationsHandler(manager, reciprocalQueue);
});

describe('capability url request', () => {
  const request = {
    headers: {},
    parameters: {
      encodedWebId: encodeWebId(aliceWebId)
    },
    url: capabilityUrl
  } as unknown as HttpHandlerRequest;
  const authn = {
    authenticated: true,
    webId: bobWebId
  };
  const ctx = { request, authn } as AuthenticatedAuthnContext;

  test('should respond with WebID', (done) => {
    const addSocialAgentRegistrationMock = jest.fn(
      () =>
        ({
          registeredAgent: bobWebId
        }) as CRUDSocialAgentRegistration
    );
    manager.getSaiSession.mockResolvedValueOnce({
      findSocialAgentInvitation: async () =>
        ({
          label,
          note,
          update: jest.fn()
        }) as unknown as CRUDSocialAgentInvitation,
      findSocialAgentRegistration: jest.fn(),
      registrySet: {
        hasAgentRegistry: {
          addSocialAgentRegistration: addSocialAgentRegistrationMock
        } as unknown as CRUDAgentRegistry
      } as CRUDRegistrySet
    } as unknown as AuthorizationAgent);

    invitationsHandler.handle(ctx).subscribe((response) => {
      expect(response.body).toContain(aliceWebId);
      expect(addSocialAgentRegistrationMock).toBeCalledWith(bobWebId, label, note);
      expect(reciprocalQueue.add).toBeCalledWith(
        {
          webId: aliceWebId,
          registeredAgent: bobWebId
        },
        { delay: 10000 }
      );
      done();
    });
  });

  test('should work if registration already exists', (done) => {
    manager.getSaiSession.mockResolvedValueOnce({
      findSocialAgentInvitation: async () =>
        ({
          update: jest.fn()
        }) as unknown as CRUDSocialAgentInvitation,
      findSocialAgentRegistration: async () =>
        ({
          registeredAgent: bobWebId
        }) as CRUDSocialAgentRegistration
    } as unknown as AuthorizationAgent);

    invitationsHandler.handle(ctx).subscribe((response) => {
      expect(response.body).toContain(aliceWebId);
      expect(reciprocalQueue.add).not.toBeCalled();
      done();
    });
  });

  test('should throw if invitation not found', (done) => {
    manager.getSaiSession.mockResolvedValueOnce({
      findSocialAgentInvitation: jest.fn()
    } as unknown as AuthorizationAgent);

    invitationsHandler.handle(ctx).subscribe({
      error: (e: HttpError) => {
        expect(e).toBeInstanceOf(Error);
        expect(reciprocalQueue.add).not.toBeCalled();
        done();
      }
    });
  });
});
