/* eslint-disable import/no-extraneous-dependencies */
import { jest } from '@jest/globals';
import { Queue } from 'bullmq';

import { BullQueue } from '../../src';

jest.mock('bullmq', () => ({
  Queue: jest.fn()
}));

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const MockedQueue = Queue as jest.MockedFunction<any>;

const queueMock = { add: jest.fn() };
MockedQueue.mockImplementation(() => queueMock);

const jobName = 'test-job';

beforeEach(() => {
  queueMock.add.mockReset();
});

describe('constructor', () => {
  test('creates bull queue', () => {
    /* eslint-disable-next-line no-new */
    new BullQueue(jobName, {});
    expect(MockedQueue).toBeCalledWith(jobName, { connection: {} });
  });
});

describe('add', () => {
  test('adds job data to bull queue', () => {
    const jobData = { webId: 'https://alice.example' };
    const queue = new BullQueue(jobName, {});
    queue.add(jobData);
    expect(queueMock.add).toBeCalledWith(jobName, jobData, undefined);
  });
});
