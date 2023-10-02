import { IQueue } from '@janeirodigital/sai-server-interfaces';

export class MockedQueue implements IQueue {
  constructor(public name: string) {}

  add = jest.fn(async (data: any): Promise<void> => undefined);
}
