import type { DatasetCore, Quad, Term } from '@rdfjs/types'
import { RDF, SPACE } from './namespaces'

/**
 *
 * @param dataset
 * @param subject
 * @param predicate
 * @param object
 * @param graph
 */
export const getOneMatchingQuad = (
  dataset: DatasetCore,
  subject?: Term,
  predicate?: Term,
  object?: Term,
  graph?: Term
): Quad | undefined => {
  const matches = dataset.match(subject, predicate, object, graph)
  return [...matches].shift()
}

export const getAllMatchingQuads = (
  dataset: DatasetCore,
  subject?: Term,
  predicate?: Term,
  object?: Term,
  graph?: Term
): Array<Quad> => [...dataset.match(subject, predicate, object, graph)]

export const getStorageRoot = (dataset: DatasetCore): string =>
  getOneMatchingQuad(dataset, null, RDF.type, SPACE.Storage).subject.value
