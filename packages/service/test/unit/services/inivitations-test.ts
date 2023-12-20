// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import { type Mocked } from 'jest-mock';
import { Invitation } from '@janeirodigital/sai-api-messages';
import { type AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import type { CRUDSocialAgentInvitation, CRUDSocialAgentRegistration } from '@janeirodigital/interop-data-model';
import { encodeWebId } from '../../../src';
import { getSocialAgentInvitations, createInvitation, acceptInvitation } from '../../../src/services';

const webId = 'https://bob.example';
const aliceId = 'https://alice.example';

describe('getSocialAgentInvitations', () => {
  const saiSession = {
    socialAgentInvitations: {
      async *[Symbol.asyncIterator]() {
        yield {
          iri: 'https://alice.example/invitations/yori',
          capabilityUrl: 'https://auth.alice.example/invitation/secret-yori',
          label: 'Yori',
          note: 'Cage fighter'
        } as CRUDSocialAgentInvitation;
        yield {
          iri: 'https://alice.example/invitations/sam',
          capabilityUrl: 'https://auth.alice.example/invitation/secret-sam',
          label: 'Sam',
          note: 'Juggler'
        } as CRUDSocialAgentInvitation;
      }
    }
  } as unknown as Mocked<AuthorizationAgent>;
  test('gets formated inviatations', async () => {
    const result = await getSocialAgentInvitations(saiSession);
    expect(result).toEqual([
      {
        id: 'https://alice.example/invitations/yori',
        capabilityUrl: 'https://auth.alice.example/invitation/secret-yori',
        label: 'Yori',
        note: 'Cage fighter'
      },
      {
        id: 'https://alice.example/invitations/sam',
        capabilityUrl: 'https://auth.alice.example/invitation/secret-sam',
        label: 'Sam',
        note: 'Juggler'
      }
    ]);
  });
});

describe('createInvitation', () => {
  const saiSession = {
    webId,
    registrySet: {
      hasAgentRegistry: {
        addSocialAgentInvitation: jest.fn()
      }
    }
  } as unknown as Mocked<AuthorizationAgent>;

  test('creates invitation', async () => {
    const invitationBase = {
      label: 'Yori',
      note: 'Cage fighter'
    };
    const invitation = {
      iri: 'https://alice.example/invitations/yori',
      capabilityUrl: 'https://auth.alice/example/invitation/secret-yori',
      ...invitationBase
    } as CRUDSocialAgentInvitation;
    saiSession.registrySet.hasAgentRegistry.addSocialAgentInvitation.mockResolvedValueOnce(invitation);
    const result = await createInvitation(saiSession, invitationBase);
    expect(saiSession.registrySet.hasAgentRegistry.addSocialAgentInvitation).toBeCalledWith(
      expect.stringContaining(encodeWebId(webId)),
      invitationBase.label,
      invitationBase.note
    );
    expect(result).toEqual({
      id: 'https://alice.example/invitations/yori',
      capabilityUrl: 'https://auth.alice/example/invitation/secret-yori',
      ...invitationBase
    });
  });
});

describe('acceptInvitation', () => {
  const saiSession = {
    fetch: {
      raw: jest.fn()
    },
    findSocialAgentRegistration: jest.fn(),
    registrySet: {
      hasAgentRegistry: {
        addSocialAgentRegistration: jest.fn()
      }
    }
  } as unknown as Mocked<AuthorizationAgent>;
  const invitation = {
    capabilityUrl: 'https://auth.alice/example/invitation/secret-yori',
    label: 'Alice',
    note: 'Manager'
  } as Invitation;

  test('throws if fetch failed', async () => {
    saiSession.fetch.raw.mockResolvedValue({ ok: false } as Response);
    expect(acceptInvitation(saiSession, invitation)).rejects.toThrow('failed');
  });

  test('throws if did not get webid', async () => {
    saiSession.fetch.raw.mockResolvedValue({
      ok: true,
      text: () => ''
    } as unknown as Response);
    expect(acceptInvitation(saiSession, invitation)).rejects.toThrow('can not accept');
  });

  test('does nothing if already exists', async () => {
    saiSession.fetch.raw.mockResolvedValue({
      ok: true,
      text: () => aliceId
    } as unknown as Response);
    const socialAgentRegistration = {
      registeredAgent: aliceId,
      label: 'Alice',
      registeredAt: new Date('2023-12-27T19:30:01.822Z'),
      reciprocalRegistration: 'https://alice.example/agents/bob',
      discoverAndUpdateReciprocal: jest.fn()
    } as unknown as CRUDSocialAgentRegistration;
    saiSession.findSocialAgentRegistration.mockResolvedValueOnce(socialAgentRegistration);
    const result = await acceptInvitation(saiSession, invitation);
    expect(saiSession.registrySet.hasAgentRegistry.addSocialAgentRegistration).not.toBeCalled();
    expect(socialAgentRegistration.discoverAndUpdateReciprocal).not.toBeCalled();
    expect(result).toEqual(
      expect.objectContaining({
        id: socialAgentRegistration.registeredAgent,
        label: socialAgentRegistration.label,
        authorizationDate: socialAgentRegistration.registeredAt!.toISOString()
      })
    );
  });

  test('accepts invitation', async () => {
    saiSession.fetch.raw.mockResolvedValue({
      ok: true,
      text: () => aliceId
    } as unknown as Response);
    const socialAgentRegistration = {
      registeredAgent: aliceId,
      label: 'Alice',
      registeredAt: new Date('2023-12-27T19:30:01.822Z'),
      discoverAndUpdateReciprocal: jest.fn()
    } as unknown as CRUDSocialAgentRegistration;
    saiSession.findSocialAgentRegistration.mockResolvedValueOnce(undefined);
    saiSession.registrySet.hasAgentRegistry.addSocialAgentRegistration.mockResolvedValueOnce(socialAgentRegistration);
    const result = await acceptInvitation(saiSession, invitation);
    expect(saiSession.registrySet.hasAgentRegistry.addSocialAgentRegistration).toBeCalledWith(
      aliceId,
      invitation.label,
      invitation.note
    );
    expect(socialAgentRegistration.discoverAndUpdateReciprocal).toBeCalledWith(saiSession.fetch.raw);
    expect(result).toEqual(
      expect.objectContaining({
        id: socialAgentRegistration.registeredAgent,
        label: socialAgentRegistration.label,
        authorizationDate: socialAgentRegistration.registeredAt!.toISOString()
      })
    );
  });
});
