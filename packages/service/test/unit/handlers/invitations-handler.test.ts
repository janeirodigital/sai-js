import { vi, describe, test, beforeEach, expect } from 'vitest';
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

vi.mock('../../../src/session-manager', async (originalImport) => {
  const originalModule = (await originalImport()) as object;

  return {
    ...originalModule,
    SessionManager: vi.fn(() => ({
      getSaiSession: vi.fn()
    }))
  };
});

let reciprocalQueue: MockedQueue;

const aliceWebId = 'https://alice.example';
const bobWebId = 'https://bob.example';
const capabilityUrl = invitationCapabilityUrl(aliceWebId, crypto.randomUUID());
const label = 'Bob';
const note = 'some dude';

const manager = vi.mocked(new SessionManager(new InMemoryStorage()));
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

  test('should respond with WebID', async () => {
    const addSocialAgentRegistrationMock = vi.fn(
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
          update: vi.fn()
        }) as unknown as CRUDSocialAgentInvitation,
      findSocialAgentRegistration: vi.fn(),
      registrySet: {
        hasAgentRegistry: {
          addSocialAgentRegistration: addSocialAgentRegistrationMock
        } as unknown as CRUDAgentRegistry
      } as CRUDRegistrySet
    } as unknown as AuthorizationAgent);

    await new Promise<void>((done) => {
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
  });

  test('should work if registration already exists', async () => {
    manager.getSaiSession.mockResolvedValueOnce({
      findSocialAgentInvitation: async () =>
        ({
          update: vi.fn()
        }) as unknown as CRUDSocialAgentInvitation,
      findSocialAgentRegistration: async () =>
        ({
          registeredAgent: bobWebId
        }) as CRUDSocialAgentRegistration
    } as unknown as AuthorizationAgent);

    await new Promise<void>((done) => {
      invitationsHandler.handle(ctx).subscribe((response) => {
        expect(response.body).toContain(aliceWebId);
        expect(reciprocalQueue.add).not.toBeCalled();
        done();
      });
    });
  });

  test('should throw if invitation not found', async () => {
    manager.getSaiSession.mockResolvedValueOnce({
      findSocialAgentInvitation: vi.fn()
    } as unknown as AuthorizationAgent);

    await new Promise<void>((done) => {
      invitationsHandler.handle(ctx).subscribe({
        error: (e: HttpError) => {
          expect(e).toBeInstanceOf(Error);
          expect(reciprocalQueue.add).not.toBeCalled();
          done();
        }
      });
    });
  });
});
