import { Quad, DatasetCore } from 'rdf-js'
import { Store, Parser, Prefixes} from 'n3'

/**
 * Wrapper around N3.Parser.parse to convert from callback style to Promise.
 * @param text Text to parse. Either Turtle, N-Triples or N-Quads.
 */


export const parseTurtle = async (text: string): Promise<DatasetCore> => {
    // TODO(angel) investigate what is the difference between Store and Dataset
    const store = new Store();
    return new Promise((resolve, reject) => {
        const parser = new Parser()
        // TODO(angel) better error handling?
        parser.parse(text, (error: Error, quad: Quad, prefixes: Prefixes) => {
            if (error) {
                reject(error);
            }
            if (quad) {
                //@ts-ignore FIXME
                store.add(quad);
            } else {
                //@ts-ignore FIXME
                resolve(store);
            }
        });
    });
}
