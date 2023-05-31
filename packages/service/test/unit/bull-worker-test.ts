import { jest } from '@jest/globals';
import { IProcessor } from '@janeirodigital/sai-server-interfaces';
import { BullWorker } from '../../src';

import { Worker } from 'bullmq';
jest.mock('bullmq', () => {
  return {
    Worker: jest.fn()
  };
});
const MockedWorker = Worker as jest.MockedFunction<any>;

const workerMock = { run: jest.fn() };
MockedWorker.mockImplementation((name: string) => workerMock);

const queueName = 'test-queue';
const processor = { processorFunction: jest.fn() } as unknown as IProcessor;

beforeEach(() => {
  workerMock.run.mockReset();
});

describe('constructor', () => {
  test('creates bull worker', () => {
    new BullWorker(queueName, processor, {});
    expect(MockedWorker).toBeCalledWith(queueName, expect.any(Function), { autorun: false, connection: {} });
  });
});

describe('run', () => {
  test('runs the bull worker', () => {
    const queue = new BullWorker(queueName, processor, {});
    queue.run();
    expect(workerMock.run).toBeCalledTimes(1);
  });
});
