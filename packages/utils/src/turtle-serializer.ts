import type { DatasetCore } from '@rdfjs/types'
import { DataFactory, Store, Writer } from 'n3'

const trimNamedGraph = (dataset: DatasetCore): DatasetCore => {
  const newDataset = new Store()

  for (const q of dataset) {
    newDataset.add(DataFactory.quad(q.subject, q.predicate, q.object, DataFactory.defaultGraph()))
  }

  return newDataset
}

/**
 * Wrapper around N3.Writer to convert from callback style to Promise.
 * @param dataset DatasetCore with data to serialize
 * @param trim Whether to trim the named graph off the dataset or not. If the dataset has a named graph and is not trimmed
 *             the serialization will be done in trig format instead of turtle.
 */
export const serializeTurtle = async (dataset: DatasetCore, trim = false): Promise<string> => {
  const writer = new Writer({ format: 'text/turtle' })

  for (const quad of trim ? trimNamedGraph(dataset) : dataset) {
    writer.addQuad(quad)
  }

  return new Promise((resolve, reject) => {
    writer.end((error: Error, text: string) => {
      if (error) {
        reject(error)
      } else {
        resolve(text)
      }
    })
  })
}
