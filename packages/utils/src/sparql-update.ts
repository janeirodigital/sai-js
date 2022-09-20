import { DatasetCore } from '@rdfjs/types';
import { serializeTurtle } from './turtle-serializer';

export async function insertPatch(dataset: DatasetCore): Promise<string> {
  return `
    INSERT DATA {
      ${await serializeTurtle(dataset)}
    }
  `;
}
