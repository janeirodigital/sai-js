import { RdfRequestInit, RdfResponse, parseTurtle, RdfFetch } from '@janeirodigital/interop-utils';
import * as data from 'data-interoperability-panel';

export const fetch = async function fetch(url: string, options?: RdfRequestInit): Promise<RdfResponse> {
  // just ok PUT
  if (options?.method === 'PUT') {
    // @ts-ignore
    return { ok: true };
  }
  // strip fragment
  const strippedUrl = url.replace(/#.*$/, '');
  const text = async function text() {
    return Promise.resolve(data[strippedUrl]);
  };
  // @ts-ignore
  const response: RdfResponse = { ok: true, text };
  // @ts-ignore
  if (!options?.headers?.Accept) {
    response.dataset = async function dataset() {
      return parseTurtle(data[strippedUrl], strippedUrl);
    };
  }
  return response;
} as RdfFetch;
