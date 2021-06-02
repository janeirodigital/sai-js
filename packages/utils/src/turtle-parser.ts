import { Quad, DatasetCore } from 'rdf-js';
import {
  Store, Parser, DataFactory,
} from 'n3';

/**
 * Wrapper around N3.Parser.parse to convert from callback style to Promise.
 * @param text Text to parse. Either Turtle, N-Triples or N-Quads.
 * @param source
 */

export const parseTurtle = async (text: string, source = ''): Promise<DatasetCore> => {
  // TODO (angel) remove the forced type coercion once @types/n3@1.10 is released
  const store = new Store() as unknown as DatasetCore;
  return new Promise((resolve, reject) => {
    const parser = new Parser();
    parser.parse(text, (error: Error, quad: Quad) => {
      if (error) {
        reject(error);
      }
      if (quad) {
        store.add(DataFactory.quad(quad.subject, quad.predicate, quad.object, DataFactory.namedNode(source)));
      } else {
        resolve(store);
      }
    });
  });
};
