// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
// eslint-disable-next-line import/no-extraneous-dependencies
import { RdfResponse } from '@janeirodigital/interop-utils';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch, statelessFetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { CRUDSocialAgentRegistration, AuthorizationAgentFactory, ReadableAccessGrant } from '../../src';

const webId = 'https://alice.example/#id';
const agentId = 'https://jarvis.alice.example/#agent';

describe('build', () => {
  const snippetIri = 'https://auth.alice.example/5dc3c14e-7830-475f-b8e3-4748d6c0bccb';
  const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });

  test('should return instance of Social Agent Registration, with reciprocal', async () => {
    const socialAgentRegistration = await factory.crud.socialAgentRegistration(snippetIri);
    expect(socialAgentRegistration).toBeInstanceOf(CRUDSocialAgentRegistration);
    expect(socialAgentRegistration.reciprocalRegistration).toBeInstanceOf(CRUDSocialAgentRegistration);
  });

  test('should return instance of Social Agent Registration, without reciprocal based on data', async () => {
    const withoutReciprocalIri = 'https://auth.alice.example/76849244-0e74-4d8a-8d07-48eae753faa9';
    const socialAgentRegistration = await factory.crud.socialAgentRegistration(withoutReciprocalIri);
    expect(socialAgentRegistration).toBeInstanceOf(CRUDSocialAgentRegistration);
    expect(socialAgentRegistration.reciprocalRegistration).toBeUndefined();
  });

  test('should have expected getters', async () => {
    const socialAgentRegistration = await factory.crud.socialAgentRegistration(snippetIri);
    expect(socialAgentRegistration.registeredAgent).toBe('https://acme.example/#corp');
    expect(socialAgentRegistration.label).toBe('ACME');
    expect(socialAgentRegistration.note).toBe('A company making well known gadgets');
  });

  test('should provide iriForContained method', async () => {
    const socialAgentRegistration = await factory.crud.socialAgentRegistration(snippetIri);
    expect(socialAgentRegistration.iriForContained()).toMatch(socialAgentRegistration.iri);
  });

  test('should fetch its data', async () => {
    const socialAgentRegistration = await factory.crud.socialAgentRegistration(snippetIri);
    expect(socialAgentRegistration.dataset.size).toBeGreaterThan(0);
  });

  test('should build reciprocal registration', async () => {
    const socialAgentRegistration = await factory.crud.socialAgentRegistration(snippetIri);
    expect(socialAgentRegistration.reciprocalRegistration).toBeInstanceOf(CRUDSocialAgentRegistration);
  });
  test('should build access grant', async () => {
    const acme2bobRegistrationIri = 'https://auth.acme.example/2437895a-3a68-4048-8965-889b7e93936c';
    const socialAgentRegistration = await factory.crud.socialAgentRegistration(acme2bobRegistrationIri);
    expect(socialAgentRegistration.accessGrant).toBeInstanceOf(ReadableAccessGrant);
  });
});

describe('reciprocal registration discovery', () => {
  const snippetIri = 'https://auth.acme.example/2437895a-3a68-4048-8965-889b7e93936c';
  const agentRegistrationIri = 'https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659';
  const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });

  describe('discoverReciprocal', () => {
    test('should discover registration', async () => {
      const linkString = `
        <https://projectron.example/#app>;
        anchor="${agentRegistrationIri}";
        rel="http://www.w3.org/ns/solid/interop#registeredAgent"
      `;
      const mocked = jest.fn(statelessFetch);
      const responseMock = {
        ok: true,
        headers: { get: (name: string): string | null => (name === 'Link' ? linkString : null) }
      } as unknown as RdfResponse;
      responseMock.clone = () => ({ ...responseMock });
      mocked.mockResolvedValueOnce(responseMock);

      const socialAgentRegistration = await factory.crud.socialAgentRegistration(snippetIri);

      const registrationIri = await socialAgentRegistration.discoverReciprocal(mocked);
      expect(registrationIri).toBe(agentRegistrationIri);
    });

    test('should return null if no authorization agent found', async () => {
      const customSnippetIri = 'https://auth.alice.example/b1f69979-dd47-4709-b2ed-a7119f29b135';
      const socialAgentRegistration = await factory.crud.socialAgentRegistration(customSnippetIri);
      const registrationIri = await socialAgentRegistration.discoverReciprocal(statelessFetch);
      expect(registrationIri).toBeNull();
    });
  });

  describe('discoverAndUpdateReciprocal', () => {
    test('should update reciprocal if discovered (with no prior)', async () => {
      const withoutReciprocalIri = 'https://auth.alice.example/76849244-0e74-4d8a-8d07-48eae753faa9';
      const socialAgentRegistration = await factory.crud.socialAgentRegistration(withoutReciprocalIri);
      socialAgentRegistration.discoverReciprocal = jest.fn(async () => agentRegistrationIri);
      expect(socialAgentRegistration.reciprocalRegistration).toBeUndefined();
      await socialAgentRegistration.discoverAndUpdateReciprocal(statelessFetch);
      expect(socialAgentRegistration.reciprocalRegistration?.iri).toBe(agentRegistrationIri);
    });

    test('should update reciprocal if discovered (with prior)', async () => {
      const customSnippetIri = 'https://auth.alice.example/5dc3c14e-7830-475f-b8e3-4748d6c0bccb';
      const priorAgentRegistrationIri = 'https://auth.acme.example/2437895a-3a68-4048-8965-889b7e93936c';
      const socialAgentRegistration = await factory.crud.socialAgentRegistration(customSnippetIri);
      socialAgentRegistration.discoverReciprocal = jest.fn(async () => agentRegistrationIri);
      expect(socialAgentRegistration.reciprocalRegistration?.iri).toBe(priorAgentRegistrationIri);
      await socialAgentRegistration.discoverAndUpdateReciprocal(statelessFetch);
      expect(socialAgentRegistration.reciprocalRegistration?.iri).toBe(agentRegistrationIri);
    });

    test('should not try to update reciprocal if not discovered', async () => {
      const socialAgentRegistration = await factory.crud.socialAgentRegistration(snippetIri);
      socialAgentRegistration.discoverReciprocal = jest.fn(async () => null);
      // @ts-ignore
      socialAgentRegistration.updateReciprocal = jest.fn();
      await socialAgentRegistration.discoverAndUpdateReciprocal(statelessFetch);
      // @ts-ignore
      expect(socialAgentRegistration.updateReciprocal).not.toBeCalled();
    });
  });
});
