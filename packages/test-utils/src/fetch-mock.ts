import { FetchOptions, FetchResponse, parseTurtle, RdfFetch } from '@janeirodigital/interop-utils';
import * as data from 'data-interoperability-panel';

export const fetch = async function fetch(url: string, options?: FetchOptions): Promise<FetchResponse> {
  // strip fragment
  const strippedUrl = url.replace(/#.*$/, '');
  if (!options || options.method === 'GET') {
    const dataset = await parseTurtle(data[strippedUrl], strippedUrl);
    return { ok: true, dataset };
  }

  return { ok: true };
} as RdfFetch;
