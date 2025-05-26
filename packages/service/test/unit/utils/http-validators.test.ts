import type { HttpHandlerContext } from '@digita-ai/handlersjs-http'
import { describe, expect, test } from 'vitest'
import { validateContentType } from '../../../src/utils/http-validators'

describe('validateContentType', () => {
  test('should handle content type with extra parameter', () => {
    const json = 'application/json'
    const ctx = {
      request: {
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      },
    } as unknown as HttpHandlerContext
    expect(validateContentType(ctx, json))
  })
})
