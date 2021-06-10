// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { AccessReceipt, InteropFactory } from '../src';

const factory = new InteropFactory(fetch);
const snippetIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe';

describe('build', () => {
  test('should return instance of Access Receipt', async () => {
    const applicationRegistration = await AccessReceipt.build(snippetIri, factory);
    expect(applicationRegistration).toBeInstanceOf(AccessReceipt);
  });

  test('should fetch its data', async () => {
    const applicationRegistration = await AccessReceipt.build(snippetIri, factory);
    expect(applicationRegistration.dataset.size).toBeGreaterThan(0);
  });
});
