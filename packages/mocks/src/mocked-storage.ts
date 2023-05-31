import { IStorage } from '@inrupt/solid-client-authn-node';
import { jest } from '@jest/globals';

export class MockedStorage implements IStorage {
  get = jest.fn(async () => {
    return undefined;
  });
  set = jest.fn(async () => {
    return undefined;
  });
  delete = jest.fn(async () => {
    return undefined;
  });
}
