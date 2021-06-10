// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { ApplicationRegistration } from 'interop-data-model';

import { Application } from '../src';

const applicationRegistrationUrl = 'https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659';

test('should build application registration', async () => {
  const app = new Application({ applicationRegistrationUrl, fetch });
  await app.init();
  expect(app.hasApplicationRegistration).toBeInstanceOf(ApplicationRegistration);
});
