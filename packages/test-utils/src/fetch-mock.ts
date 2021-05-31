import { DatasetCore } from 'rdf-js'
import { parseTurtle } from 'interop-utils'
//@ts-ignore
import * as data from 'data-interoperability-panel'


export async function fetch (url: string): Promise<DatasetCore> {
  return await parseTurtle(data[url], url)
}
