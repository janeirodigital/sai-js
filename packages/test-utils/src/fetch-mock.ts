import { DatasetCore } from '@rdfjs/types';
import { parseTurtle } from 'interop-utils';
import * as data from 'data-interoperability-panel';

export async function fetch(url: string): Promise<DatasetCore> {
  // strip fragment
  const strippedUrl = url.replace(/#.*$/, '');

  return parseTurtle(data[strippedUrl], strippedUrl);
}
