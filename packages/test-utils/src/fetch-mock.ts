import { RdfRequestInit, RdfResponse, parseTurtle, RdfFetch } from '@janeirodigital/interop-utils';
import data from 'data-interoperability-panel';

export const fetch = async function fetch(url: string, options?: RdfRequestInit): Promise<RdfResponse> {
  // just ok PUT
  if (options?.method === 'PUT') {
    /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
    // @ts-ignore
    return { ok: true };
  }

  // strip fragment
  const strippedUrl = url.replace(/#.*$/, '');
  const text = async function text() {
    return Promise.resolve(data[strippedUrl]);
  };
  /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
  // @ts-ignore
  const response: RdfResponse = { ok: true, text };
  /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
  // @ts-ignore
  if (!options?.headers?.Accept || options.headers.Accept.match('text/turtle')) {
    response.dataset = async function dataset() {
      return parseTurtle(data[strippedUrl], strippedUrl);
    };
  }
  return response;
} as RdfFetch;
