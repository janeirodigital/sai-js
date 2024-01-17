import { jest } from '@jest/globals';
import { IProcessor } from '@janeirodigital/sai-server-interfaces';
import { Worker } from 'bullmq';
import { BullWorker } from '../../src';

jest.mock('bullmq', () => ({
  Worker: jest.fn()
}));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MockedWorker = Worker as jest.MockedFunction<any>;

const workerMock = { run: jest.fn() };
MockedWorker.mockImplementation(() => workerMock);

const queueName = 'test-queue';
const processor = { processorFunction: jest.fn() } as unknown as IProcessor;

beforeEach(() => {
  workerMock.run.mockReset();
});

describe('constructor', () => {
  test('creates bull worker', () => {
    // eslint-disable-next-line no-new
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
