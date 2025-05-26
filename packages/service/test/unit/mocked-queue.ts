import type { IQueue } from '@janeirodigital/sai-server-interfaces'
import { vi } from 'vitest'

export class MockedQueue implements IQueue {
  constructor(public name: string) {}

  add = vi.fn(async (): Promise<void> => undefined)
}
