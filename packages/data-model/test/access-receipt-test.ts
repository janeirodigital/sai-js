// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { AccessReceipt, DataGrant, InteropFactory } from '../src';

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

  test('should build data grants', async () => {
    const applicationRegistration = await AccessReceipt.build(snippetIri, factory);
    expect(applicationRegistration.hasDataGrant.length).toBe(2);
    expect(applicationRegistration.hasDataGrant[0]).toBeInstanceOf(DataGrant);
  });

  test('should set combined data grants', async () => {
    const applicationRegistration = await AccessReceipt.build(snippetIri, factory);
    expect(applicationRegistration.combinedDataGrant.length).toBe(4);
    for (const dataGrant of applicationRegistration.combinedDataGrant) {
      expect(dataGrant).toBeInstanceOf(DataGrant);
    }
  });
});
