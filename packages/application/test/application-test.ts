import { randomUUID } from 'crypto';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { ApplicationRegistration, DataOwner } from '@janeirodigital/interop-data-model';
import { RdfResponse } from '@janeirodigital/interop-utils';
import { Application } from '../src';

const webId = 'https://alice.example/#id';

test('should build application registration', async () => {
  const app = await Application.build(webId, { fetch, randomUUID });
  expect(app.hasApplicationRegistration).toBeInstanceOf(ApplicationRegistration);
});

test('should throw if no appliction registration', async () => {
  const mocked = jest.fn(fetch);
  mocked
    .mockResolvedValueOnce(fetch(webId))
    .mockResolvedValueOnce(Promise.resolve({ ok: true, headers: { get: () => '' } } as unknown as RdfResponse));
  expect(Application.build(webId, { fetch: mocked, randomUUID })).rejects.toThrow('support planned');
});

test('should have dataOwners getter', async () => {
  const app = await Application.build(webId, { fetch, randomUUID });
  expect(app.dataOwners).toHaveLength(3);
  for (const owner of app.dataOwners) {
    expect(owner).toBeInstanceOf(DataOwner);
  }
});
