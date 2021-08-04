// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { ApplicationRegistration, AccessReceipt, InteropFactory } from '../src';

const factory = new InteropFactory({ fetch, randomUUID });
const snippetIri = 'https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659';
const accessReceiptIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe';

describe('build', () => {
  test('should return instance of Application Registration', async () => {
    const applicationRegistration = await ApplicationRegistration.build(snippetIri, factory);
    expect(applicationRegistration).toBeInstanceOf(ApplicationRegistration);
  });

  test('should fetch its data', async () => {
    const applicationRegistration = await ApplicationRegistration.build(snippetIri, factory);
    expect(applicationRegistration.dataset.size).toBeGreaterThan(0);
  });

  test('should build related access receipt', async () => {
    const applicationRegistration = await ApplicationRegistration.build(snippetIri, factory);
    const accessReceipt = applicationRegistration.hasAccessReceipt;
    expect(accessReceipt).toBeInstanceOf(AccessReceipt);
    expect(accessReceipt.iri).toBe(accessReceiptIri);
  });
});
