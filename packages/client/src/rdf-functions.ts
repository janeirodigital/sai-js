import * as RDFJS from 'rdf-js';
import * as N3 from 'n3';
import { Fetch } from './fetch';
import { parseTurtle } from 'interop-utils';

/**
 * Retrieves and parses the content of the URL into an RDF store
 * @param url Location of the RDF document
 * @param fetch Fetch function to use
 */
export const getRdfResource = async (url: string, fetch: Fetch): Promise<RDFJS.Store> => {
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

/**
 *
 * @param dataset
 * @param subject
 * @param predicate
 * @param object
 * @param graph
 */
export const getOneMatchingQuad = (dataset: RDFJS.Dataset, subject?: RDFJS.Term, predicate?: RDFJS.Term, object?: RDFJS.Term, graph?: RDFJS.Term): RDFJS.Quad => {
    // TODO(angel) unsure if the usage of the graph param is correct here
    const matches = dataset.match(subject, predicate, object, graph);

    if (matches.size === 0) {
        throw new Error('Could not find matching quad in the dataset');
    } else {
        return [...matches].shift();
    }
}

export const getAllMatchingQuads = (dataset: RDFJS.Dataset, subject?: RDFJS.Term, predicate?: RDFJS.Term, object?: RDFJS.Term): Array<RDFJS.Quad> => {
    return [...dataset.match(subject, predicate, object)];
}
