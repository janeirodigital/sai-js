import { jest } from '@jest/globals';
import { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import { addSocialAgent, getSocialAgents } from '../../../src/services/social-agents';

const findSocialAgentRegistration = jest.fn();
const addSocialAgentRegistration = jest.fn();
const saiSession = {
  findSocialAgentRegistration,
  registrySet: { hasAgentRegistry: { addSocialAgentRegistration } },
  socialAgentRegistrations: [
    {
      registeredAgent: 'https://alice.example',
      label: 'Alice',
      note: 'A friend from a football team',
      registeredAt: new Date('2020-04-04T20:15:47.000Z')
    },
    {
      registeredAgent: 'https://bob.example',
      label: 'Bob',
      registeredAt: new Date('2021-07-02T10:12:21.000Z'),
      updatedAt: new Date('2021-09-24T11:12:21.000Z')
    }
  ]
} as unknown as AuthorizationAgent;

describe('getSocialAgents', () => {
  test('formats correctly', async () => {
    const socialAgents = await getSocialAgents(saiSession);
    expect(socialAgents).toHaveLength(2);
    expect(socialAgents).toEqual(
      expect.arrayContaining([
        {
          id: 'https://alice.example',
          label: 'Alice',
          note: 'A friend from a football team',
          authorizationDate: '2020-04-04T20:15:47.000Z'
        },
        {
          id: 'https://bob.example',
          label: 'Bob',
          authorizationDate: '2021-07-02T10:12:21.000Z',
          lastUpdateDate: '2021-09-24T11:12:21.000Z'
        }
      ])
    );
  });
});

describe('addSocialAgent', () => {
  const bobWebId = 'https://bob.example';

  beforeEach(() => {
    findSocialAgentRegistration.mockReset();
    addSocialAgentRegistration.mockReset();
  });

  test('if one exists, does not try to create another one', async () => {
    const existing = {
      registeredAgent: bobWebId,
      label: 'Bob',
      registeredAt: new Date()
    };
    findSocialAgentRegistration.mockReturnValueOnce(existing);
    const result = await addSocialAgent(saiSession, { webId: bobWebId, label: 'Bobby' });
    expect(result).toEqual({
      id: existing.registeredAgent,
      label: existing.label,
      authorizationDate: existing.registeredAt.toISOString()
    });
    expect(addSocialAgentRegistration).not.toBeCalled();
  });
  test('creates registration', async () => {
    const label = 'Bobby';
    const note = 'Good old buddy';
    addSocialAgentRegistration.mockReturnValueOnce({
      registeredAgent: bobWebId,
      label,
      note,
      registeredAt: new Date()
    });
    const result = await addSocialAgent(saiSession, { webId: bobWebId, label, note });
    expect(result).toEqual({
      id: bobWebId,
      label,
      note,
      authorizationDate: expect.any(String)
    });
    expect(addSocialAgentRegistration).toBeCalledWith(bobWebId, label, note);
  });
});
