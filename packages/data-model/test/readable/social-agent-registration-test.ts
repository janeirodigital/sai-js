// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { ReadableSocialAgentRegistration, AuthorizationAgentFactory, ReadableAccessGrant } from '../../src';

const webId = 'https://alice.example/#id';
const agentId = 'https://jarvis.alice.example/#agent';
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });
const snippetIri = 'https://auth.alice.example/5dc3c14e-7830-475f-b8e3-4748d6c0bccb';

describe('build', () => {
  test('should return instance of Social Agent Registration, with reciprocal', async () => {
    const socialAgentRegistration = await factory.readable.socialAgentRegistration(snippetIri);
    expect(socialAgentRegistration).toBeInstanceOf(ReadableSocialAgentRegistration);
    expect(socialAgentRegistration.reciprocalRegistration).toBeInstanceOf(ReadableSocialAgentRegistration);
  });

  test('should return instance of Social Agent Registration, without reciprocal based on data', async () => {
    const withoutReciprocalIri = 'https://auth.alice.example/76849244-0e74-4d8a-8d07-48eae753faa9';
    const socialAgentRegistration = await factory.readable.socialAgentRegistration(withoutReciprocalIri);
    expect(socialAgentRegistration).toBeInstanceOf(ReadableSocialAgentRegistration);
    expect(socialAgentRegistration.reciprocalRegistration).toBeUndefined();
  });

  test('should provide registeredAgent getter', async () => {
    const socialAgentRegistration = await factory.readable.socialAgentRegistration(snippetIri);
    expect(socialAgentRegistration.registeredAgent).toBe('https://acme.example/#corp');
  });

  test('should provide iriForContained method', async () => {
    const socialAgentRegistration = await factory.readable.socialAgentRegistration(snippetIri);
    expect(socialAgentRegistration.iriForContained()).toMatch(socialAgentRegistration.iri);
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
