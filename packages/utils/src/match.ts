import { Term, Quad, DatasetCore } from 'rdf-js';

/**
 *
 * @param dataset
 * @param subject
 * @param predicate
 * @param object
 * @param graph
 */
// eslint-disable-next-line max-len
export const getOneMatchingQuad = (dataset: DatasetCore, subject?: Term, predicate?: Term, object?: Term, graph?: Term): Quad => {
  const matches = dataset.match(subject, predicate, object, graph);

  if (matches.size === 0) {
    throw new Error('Could not find matching quad in the dataset');
  } else {
    return [...matches].shift();
  }
};

// eslint-disable-next-line max-len
export const getAllMatchingQuads = (dataset: DatasetCore, subject?: Term, predicate?: Term, object?: Term, graph?: Term): Array<Quad> => [...dataset.match(subject, predicate, object, graph)];
