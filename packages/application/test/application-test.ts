import { randomUUID } from 'crypto';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { ApplicationRegistration, DataOwner } from '@janeirodigital/interop-data-model';

import { Application } from '../src';

const applicationRegistrationUrl = 'https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659';

test('should build application registration', async () => {
  const app = await Application.build({ applicationRegistrationUrl, fetch, randomUUID });
  expect(app.hasApplicationRegistration).toBeInstanceOf(ApplicationRegistration);
});

test('should have dataOwners getter', async () => {
  const app = await Application.build({ applicationRegistrationUrl, fetch, randomUUID });
  expect(app.dataOwners).toHaveLength(3);
  for (const owner of app.dataOwners) {
    expect(owner).toBeInstanceOf(DataOwner);
  }
});
