import type { IProcessor } from '@janeirodigital/sai-server-interfaces'
import { Worker } from 'bullmq'
import { type MockedClass, beforeEach, describe, expect, test, vi } from 'vitest'
import { BullWorker } from '../../src'

vi.mock('bullmq', () => ({
  Worker: vi.fn(),
}))
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MockedWorker = Worker as MockedClass<any>

const workerMock = { run: vi.fn() }
MockedWorker.mockImplementation(() => workerMock)

const queueName = 'test-queue'
const processor = { processorFunction: vi.fn() } as unknown as IProcessor

beforeEach(() => {
  workerMock.run.mockReset()
})

describe('constructor', () => {
  test('creates bull worker', () => {
    new BullWorker(queueName, processor, {})
    expect(MockedWorker).toBeCalledWith(queueName, expect.any(Function), {
      autorun: false,
      connection: {},
    })
  })
})

describe('run', () => {
  test('runs the bull worker', () => {
    const queue = new BullWorker(queueName, processor, {})
    queue.run()
    expect(workerMock.run).toBeCalledTimes(1)
  })
})
