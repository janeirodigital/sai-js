import { RdfRequestInit, RdfResponse, parseTurtle, RdfFetch } from '@janeirodigital/interop-utils';
import data from 'data-interoperability-panel';

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
  const response: RdfResponse = {
    ok: true,
    text,
    headers: {
      get(name) {
        if (name === 'Content-Type') {
          return 'text/turtle';
        }
        throw Error(`${name} not supported`);
      }
    } as Headers
  };
  // @ts-ignore
  if (!options?.headers?.Accept || options.headers.Accept.match('text/turtle')) {
    response.dataset = async function dataset() {
      if (!data[strippedUrl]) throw new Error(`missing snippet: ${strippedUrl}`);
      return parseTurtle(data[strippedUrl], strippedUrl);
    };
  }
  return response;
} as RdfFetch;
