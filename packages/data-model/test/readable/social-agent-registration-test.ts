// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { ReadableSocialAgentRegistration, AuthorizationAgentFactory, ReadableAccessGrant } from '../../src';

const factory = new AuthorizationAgentFactory({ fetch, randomUUID });
const snippetIri = 'https://auth.alice.example/5dc3c14e-7830-475f-b8e3-4748d6c0bccb';

describe('build', () => {
  test('should return instance of Social Agent Registration', async () => {
    const socialAgentRegistration = await factory.readable.socialAgentRegistration(snippetIri);
    expect(socialAgentRegistration).toBeInstanceOf(ReadableSocialAgentRegistration);
  });

  test('should fetch its data', async () => {
    const socialAgentRegistration = await factory.readable.socialAgentRegistration(snippetIri);
    expect(socialAgentRegistration.dataset.size).toBeGreaterThan(0);
  });

  test('should build reciprocal registration', async () => {
    const socialAgentRegistration = await factory.readable.socialAgentRegistration(snippetIri);
    expect(socialAgentRegistration.reciprocalRegistration).toBeInstanceOf(ReadableSocialAgentRegistration);
  });
  test('should build access grant', async () => {
    const acme2bobRegistrationIri = 'https://auth.acme.example/2437895a-3a68-4048-8965-889b7e93936c';
    const socialAgentRegistration = await factory.readable.socialAgentRegistration(acme2bobRegistrationIri);
    expect(socialAgentRegistration.hasAccessGrant).toBeInstanceOf(ReadableAccessGrant);
  });
});
