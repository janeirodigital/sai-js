import { Queue } from 'bullmq'
import { type MockedClass, beforeEach, describe, expect, test, vi } from 'vitest'
import { BullQueue } from '../../src'

vi.mock('bullmq', () => ({
  Queue: vi.fn(),
}))

const MockedQueue = Queue as MockedClass<any>

const queueMock = { add: vi.fn() }
MockedQueue.mockImplementation(() => queueMock)

const jobName = 'test-job'

beforeEach(() => {
  queueMock.add.mockReset()
})

describe('constructor', () => {
  test('creates bull queue', () => {
    new BullQueue(jobName, {})
    expect(MockedQueue).toBeCalledWith(jobName, { connection: {} })
  })
})

describe('add', () => {
  test('adds job data to bull queue', () => {
    const jobData = { webId: 'https://alice.example' }
    const queue = new BullQueue(jobName, {})
    queue.add(jobData)
    expect(queueMock.add).toBeCalledWith(jobName, jobData, undefined)
  })
})
