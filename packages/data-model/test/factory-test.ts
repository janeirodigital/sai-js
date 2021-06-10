// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { InteropFactory } from '../src';

describe('constructor', () => {
  it('should set fetch', () => {
    const factory = new InteropFactory(fetch);
    expect(factory.fetch).toBe(fetch);
  });
});
