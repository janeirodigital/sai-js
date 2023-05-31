import { jest } from '@jest/globals';
import { BullQueue } from '../../src';

import { Queue } from 'bullmq';
jest.mock('bullmq', () => {
  return {
    Queue: jest.fn()
  };
});
const MockedQueue = Queue as jest.MockedFunction<any>;

const queueMock = { add: jest.fn() };
MockedQueue.mockImplementation((name: string) => queueMock);

const jobName = 'test-job';

beforeEach(() => {
  queueMock.add.mockReset();
});

describe('constructor', () => {
  test('creates bull queue', () => {
    new BullQueue(jobName, {});
    expect(MockedQueue).toBeCalledWith(jobName, { connection: {} });
  });
});

describe('add', () => {
  test('adds job data to bull queue', () => {
    const jobData = { webId: 'https://alice.example' };
    const queue = new BullQueue(jobName, {});
    queue.add(jobData);
    expect(queueMock.add).toBeCalledWith(jobName, jobData);
  });
});
