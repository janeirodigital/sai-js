import * as RDFJS from 'rdf-js';
import * as N3 from 'n3';
import { Fetch } from './fetch';

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
    const store = await parse(await r.text());
    return Promise.resolve(store);
}

/**
 * Wrapper around N3.Parser.parse to convert from callback style to Promise.
 * @param text Text to parse. Either Turtle, N-Triples or N-Quads.
 */


const parse = async (text: string): Promise<RDFJS.Store> => {
    // TODO(angel) investigate what is the difference between Store and Dataset
    const store = new N3.Store();
    return new Promise((resolve, reject) => {
        const parser = new N3.Parser()
        // TODO(angel) better error handling?
        parser.parse(text, (error: Error, quad: RDFJS.Quad, prefixes: N3.Prefixes) => {
            if (error) {
                reject(error);
            }
            if (quad) {
                //@ts-ignore FIXME
                store.add(quad);
            } else {
                resolve(store);
            }
        });
    });
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

export const INTEROP = (prop: string): RDFJS.NamedNode => {
    const base = 'http://www.w3.org/ns/solid/interop#';
    return new N3.NamedNode(base + prop);
}

export const RDF = (prop: string): RDFJS.NamedNode => {
    const base = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
    return new N3.NamedNode(base + prop);
}
