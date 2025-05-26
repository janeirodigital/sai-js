import { expect, test } from 'vitest'
import { asyncIterableToArray } from '../src'

test('it produces array with all elements', async () => {
  const asyncIterable = {
    async *[Symbol.asyncIterator]() {
      for (const element of [1, 2, 3, 4]) {
        yield element
      }
    },
  }

  const arr = await asyncIterableToArray(asyncIterable)
  expect(arr.length).toBe(4)
})
