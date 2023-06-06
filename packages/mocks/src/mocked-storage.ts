import { IStorage } from '@inrupt/solid-client-authn-node';
import { jest } from '@jest/globals';

export class MockedStorage implements IStorage {
  get = jest.fn(async () => undefined);

  set = jest.fn(async () => undefined);

  delete = jest.fn(async () => undefined);
}
