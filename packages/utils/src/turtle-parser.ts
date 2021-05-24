import * as RDFJS from 'rdf-js'
import * as N3 from 'n3'

/**
 * Wrapper around N3.Parser.parse to convert from callback style to Promise.
 * @param text Text to parse. Either Turtle, N-Triples or N-Quads.
 */


export const parseTurtle = async (text: string): Promise<N3.Store> => { //FIXME DatasetCore n3 needs to update its types
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
