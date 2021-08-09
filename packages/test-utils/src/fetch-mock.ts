import { RdfRequestInit, RdfResponse, parseTurtle, RdfFetch } from '@janeirodigital/interop-utils';
import * as data from 'data-interoperability-panel';

export const fetch = async function fetch(url: string, options?: RdfRequestInit): Promise<RdfResponse> {
  // strip fragment
  const strippedUrl = url.replace(/#.*$/, '');
  if (!options || options.method === 'GET') {
    const dataset = async function dataset() {
      return parseTurtle(data[strippedUrl], strippedUrl);
    };
    // @ts-ignore
    return { ok: true, dataset };
  }

  // @ts-ignore
  return { ok: true };
} as RdfFetch;
