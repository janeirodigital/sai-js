import { getAgentRegistrationIri, targetDataRegistrationLink } from '../src';

describe('getAgentRegistrationIri', () => {
  const linkHeaderText = `
    <https://projectron.example/#app>;
    anchor="https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659";
    rel="http://www.w3.org/ns/solid/interop#registeredAgent"
  `;

  test('should match correct application registration iri', () => {
    expect(getAgentRegistrationIri(linkHeaderText)).toBe(
      'https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659'
    );
  });
});

describe('targetDataRegistrationLink', () => {
  test('should create correct link to target registration', () => {
    const dataRegistrationIri = 'http://some.iri';
    expect(targetDataRegistrationLink(dataRegistrationIri)).toBe(
      `<${dataRegistrationIri}>; rel="http://www.w3.org/ns/solid/interop#targetDataRegistration"`
    );
  });
});
