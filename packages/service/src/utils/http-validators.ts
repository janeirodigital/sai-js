import { BadRequestHttpError, type HttpHandlerContext } from '@digita-ai/handlersjs-http'

export const validateContentType = (ctx: HttpHandlerContext, contentType: string): void => {
  if (ctx.request.headers['content-type']?.startsWith(contentType.toLowerCase())) {
    return
  }

  throw new BadRequestHttpError('wrong content-type')
}
