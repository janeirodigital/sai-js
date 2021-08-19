import { getApplicationRegistrationIri } from '../src';

const linkHeaderText = `
  <https://projectron.example/#app>;
  anchor="https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659";
  rel="http://www.w3.org/ns/solid/interop#registeredApplication"
`;

test('should match correct application registration iri', () => {
  expect(getApplicationRegistrationIri(linkHeaderText)).toBe(
    'https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659'
  );
});
