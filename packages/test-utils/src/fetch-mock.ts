import { readFileSync } from 'node:fs'
import { type RdfFetch, type WhatwgFetch, fetchWrapper } from '@janeirodigital/interop-utils'

const STORAGE_DESCRIPTION_IRI = 'https://fake.example/storage-desription'
const dataFile = new URL('data.json', import.meta.url)
const data = JSON.parse(readFileSync(dataFile, 'utf-8'))

async function common(
  url: string,
  options?: RequestInit,
  state?: { [key: string]: string }
): Promise<Response> {
  // handle storage description requests
  if (url === STORAGE_DESCRIPTION_IRI) {
    return {
      clone: () => ({}) as unknown as Response,
      headers: {
        get: () => 'text/turtle',
      },
      text: async () => `<${STORAGE_DESCRIPTION_IRI}> a <http://www.w3.org/ns/pim/space#Storage> .`,
    } as unknown as Response
  }

  // strip fragment
  const strippedUrl = url.replace(/#.*$/, '')
  const text = async function text() {
    return Promise.resolve(data[strippedUrl])
  }
  // @ts-ignore
  const response: Response = {
    ok: true,
    text,
    headers: {
      get(name) {
        if (name === 'Content-Type') {
          return 'text/turtle'
        }
        if (name === 'Link') {
          return `<http://just.en.example/description-resource>; rel="describedby", <${STORAGE_DESCRIPTION_IRI}>; rel="http://www.w3.org/ns/solid/terms#storageDescription"`
        }
        throw Error(`${name} not supported`)
      },
    } as Headers,
  }
  response.clone = () => ({ ...response })
  // @ts-ignore
  if (!options?.headers?.Accept || options.headers.Accept.match('text/turtle')) {
    response.text = async function responseText() {
      let turtle: string
      if (state) {
        turtle = state[strippedUrl]
      }
      turtle = turtle || data[strippedUrl]
      if (!turtle) {
        throw new Error(`missing snippet: ${strippedUrl}`)
      }
      return turtle
    }
  }
  return response
}

function addState(state: { [key: string]: string }): WhatwgFetch {
  return async function statefulFetch(url: string, options?: RequestInit): Promise<Response> {
    if (options?.method === 'PUT') {
      state[url] = options.body as string
      const response = { ok: true } as Response
      response.clone = () => ({ ...response })
      return response
    }

    return common(url, options, state)
  } as WhatwgFetch
}

export function createFetch(): RdfFetch {
  const state: { [key: string]: string } = {}
  return fetchWrapper(addState(state))
}

export function createStatefulFetch(): WhatwgFetch {
  const state: { [key: string]: string } = {}
  return addState(state)
}

export const statelessFetch = async function statelessFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  // just ok PUT or PATCH
  if (options?.method === 'PUT' || options?.method === 'PATCH') {
    const response = { ok: true } as Response
    response.clone = () => ({ ...response })
    return response
  }
  return common(url, options)
} as WhatwgFetch

export const fetch = fetchWrapper(statelessFetch)

fetch.raw = async () =>
  ({
    headers: {
      get: () =>
        `<${STORAGE_DESCRIPTION_IRI}>; rel="http://www.w3.org/ns/solid/terms#storageDescription"`,
    },
  }) as unknown as Response
