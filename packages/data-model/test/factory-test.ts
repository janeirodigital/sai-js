// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { InteropFactory } from '../src';

describe('constructor', () => {
  it('should set fetch', () => {
    const factory = new InteropFactory({ fetch, randomUUID });
    expect(factory.fetch).toBe(fetch);
  });
});
