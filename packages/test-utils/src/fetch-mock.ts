import { WhatwgFetch, RdfFetch, fetchWrapper } from '@janeirodigital/interop-utils';
import data from 'data-interoperability-panel';

async function common(url: string, options?: RequestInit, state?: { [key: string]: string }): Promise<Response> {
  // strip fragment
  const strippedUrl = url.replace(/#.*$/, '');
  const text = async function text() {
    return Promise.resolve(data[strippedUrl]);
  };
  // @ts-ignore
  const response: Response = {
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
  response.clone = () => ({ ...response });
  // @ts-ignore
  if (!options?.headers?.Accept || options.headers.Accept.match('text/turtle')) {
    response.text = async function responseText() {
      let turtle: string;
      if (state) {
        turtle = state[strippedUrl];
      }
      turtle = turtle || data[strippedUrl];
      if (!turtle) {
        throw new Error(`missing snippet: ${strippedUrl}`);
      }
      return turtle;
    };
  }
  return response;
}

function addState(state: { [key: string]: string }): WhatwgFetch {
  return async function statefulFetch(url: string, options?: RequestInit): Promise<Response> {
    if (options?.method === 'PUT') {
      // eslint-disable-next-line no-param-reassign
      state[url] = options.body as string;
      const response = { ok: true } as Response;
      response.clone = () => ({ ...response });
      return response;
    }

    return common(url, options, state);
  } as WhatwgFetch;
}

export function createFetch(): RdfFetch {
  const state: { [key: string]: string } = {};
  return fetchWrapper(addState(state));
}

export function createStatefulFetch(): WhatwgFetch {
  const state: { [key: string]: string } = {};
  return addState(state);
}

export const statelessFetch = async function statelessFetch(url: string, options?: RequestInit): Promise<Response> {
  // just ok PUT
  if (options?.method === 'PUT') {
    const response = { ok: true } as Response;
    response.clone = () => ({ ...response });
    return response;
  }
  return common(url, options);
} as WhatwgFetch;

export const fetch = fetchWrapper(statelessFetch);
