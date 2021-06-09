import { DatasetCore } from '@rdfjs/types'
import { parseTurtle } from 'interop-utils'
//@ts-ignore
import * as data from 'data-interoperability-panel'


export async function fetch (url: string): Promise<DatasetCore> {
  return parseTurtle(data[url], url)
}
