import { DatasetCore } from '@rdfjs/types';
import { Writer } from 'n3';

/**
 * Wrapper around N3.Writer to convert from callback style to Promise.
 * @param dataset DatasetCore with data to serialize
 */

export const serializeTurtle = async (dataset: DatasetCore): Promise<string> => {
  const writer = new Writer();
  for (const quad of dataset) {
    writer.addQuad(quad);
  }
  return new Promise((resolve, reject) => {
    writer.end((error: Error, text: string) => {
      if (error) {
        reject(error);
      } else {
        resolve(text);
      }
    });
  });
};
