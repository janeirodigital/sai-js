import { test, expect } from 'vitest';
import type { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import { getApplications, getUnregisteredApplication } from '../../../src/services/applications';

const saiSession = {
  applicationRegistrations: [
    {
      registeredAgent: 'https://projectron.example',
      name: 'Projectron',
      logo: 'https://projectron.example/logo.png',
      registeredAt: new Date('2020-04-04T20:15:47.000Z'),
      accessNeedGroup: 'https://projectron.example/needs'
    },
    {
      registeredAgent: 'https://performchart.example',
      name: 'PerformChart',
      logo: 'https://performchart.example/logo.png',
      registeredAt: new Date('2021-07-02T10:12:21.000Z'),
      accessNeedGroup: 'https://performchart.example/needs'
    }
  ]
} as unknown as AuthorizationAgent;

test('formats correctly', async () => {
  const applications = await getApplications(saiSession);
  expect(applications).toHaveLength(2);
  expect(applications).toEqual(
    expect.arrayContaining([
      {
        id: 'https://projectron.example',
        name: 'Projectron',
        logo: 'https://projectron.example/logo.png',
        authorizationDate: '2020-04-04T20:15:47.000Z',
        accessNeedGroup: 'https://projectron.example/needs'
      },
      {
        id: 'https://performchart.example',
        name: 'PerformChart',
        logo: 'https://performchart.example/logo.png',
        authorizationDate: '2021-07-02T10:12:21.000Z',
        accessNeedGroup: 'https://performchart.example/needs'
      }
    ])
  );
});

test('get unregistered application profile', async () => {
  const agent = {
    factory: {
      readable: {
        clientIdDocument: () =>
          Promise.resolve({ clientName: 'name', logoUri: 'http://logo', hasAccessNeedGroup: 'https://group' })
      }
    }
  } as unknown as AuthorizationAgent;

  const profile = await getUnregisteredApplication(agent, 'https://id');
  expect(profile.name).toEqual('name');
  expect(profile.logo).toEqual('http://logo');
  expect(profile.accessNeedGroup).toEqual('https://group');
});
