import { vi } from 'vitest';
import type { IQueue } from '@janeirodigital/sai-server-interfaces';

export class MockedQueue implements IQueue {
  constructor(public name: string) {}

  add = vi.fn(async (): Promise<void> => undefined);
}
