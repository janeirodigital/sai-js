import { iterable2array } from '../src';

test('it produces array with all elements', async () => {
  const asyncIterable = {
    async *[Symbol.asyncIterator]() {
      for (const element of [1, 2, 3, 4]) {
        yield element;
      }
    }
  };

  const arr = await iterable2array(asyncIterable);
  expect(arr.length).toBe(4);
});
