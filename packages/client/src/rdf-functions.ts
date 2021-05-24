import { DatasetCore } from 'rdf-js';
import { Fetch } from './fetch';
import { parseTurtle } from 'interop-utils';

/**
 * Retrieves and parses the content of the URL into an RDF store
 * @param url Location of the RDF document
 * @param fetch Fetch function to use
 */
export const getRdfResource = async (url: string, fetch: Fetch): Promise<DatasetCore> => {
    const options = {
        method: 'get',
        headers: new Headers({
            accept: 'text/turtle'
        }),
    };

    const r = await fetch(url, options);

    if (!r.ok) {
        throw Error('Request to pod server failed');
    }
    const store = await parseTurtle(await r.text());
    return Promise.resolve(store);
}
