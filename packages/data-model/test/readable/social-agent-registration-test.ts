// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { ReadableSocialAgentRegistration, AuthorizationAgentFactory } from '../../src';

const factory = new AuthorizationAgentFactory({ fetch, randomUUID });
const snippetIri = 'https://auth.alice.example/5dc3c14e-7830-475f-b8e3-4748d6c0bccb';

describe('build', () => {
  test('should return instance of Social Agent Registration', async () => {
    const applicationRegistration = await factory.readable.socialAgentRegistration(snippetIri);
    expect(applicationRegistration).toBeInstanceOf(ReadableSocialAgentRegistration);
  });

  test('should fetch its data', async () => {
    const applicationRegistration = await factory.readable.socialAgentRegistration(snippetIri);
    expect(applicationRegistration.dataset.size).toBeGreaterThan(0);
  });

  test.todo('should build related access receipt');
});
