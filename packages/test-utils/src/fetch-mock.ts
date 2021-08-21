import { RdfRequestInit, RdfResponse, parseTurtle, RdfFetch } from '@janeirodigital/interop-utils';
import data from 'data-interoperability-panel';

export const fetch = async function fetch(url: string, options?: RdfRequestInit): Promise<RdfResponse> {
  // just ok PUT
  if (options?.method === 'PUT') {
    // @ts-ignore
    return { ok: true };
  }

  // hard code HEAD for now

  if (options?.method === 'HEAD') {
    // @ts-ignore
    return {
      ok: true,
      headers: {
        get: () => `
      <https://projectron.example/#app>;
      anchor="https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659";
      rel="http://www.w3.org/ns/solid/interop#registeredApplication"
      `
      } as unknown as Headers
    };
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
