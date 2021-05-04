import * as RDFJS from 'rdf-js';
import * as N3 from 'n3';
import * as uuid from 'uuid';
import { RegistrySet } from './storage';
import { getOneMatchingQuad, INTEROP, RDF } from './rdf-functions';
import { DataFactory } from 'n3';
import { ApplicationProfile } from './client';

const { quad, namedNode, literal } = DataFactory;

/**
 * Parses an RDF document to find the different registry sets URIs
 * @param document RDF Graph of the document where the user webId is located
 */
export const parseRegistrySets = (document: RDFJS.Dataset): RegistrySet => {
    const application = getOneMatchingQuad(document, null, INTEROP('hasApplicationRegistrySet')).object.value;
    const data = getOneMatchingQuad(document, null, INTEROP('hasDataRegistrySet')).object.value;
    const accessGrant = getOneMatchingQuad(document, null, INTEROP('hasAccessGrantRegistrySet')).object.value;
    const accessReceipt = getOneMatchingQuad(document, null, INTEROP('hasAccessReceiptRegistrySet')).object.value;
    const remoteData = getOneMatchingQuad(document, null, INTEROP('hasRemoteDataRegistrySet')).object.value;

    return { application, data, accessGrant, accessReceipt, remoteData };
}

/**
 * Creates a hex representation of the SHA-256 encryption of the given string
 * Generating a SHA-256 in JS: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
 * @param value string to encrypt
 * @private
 */
export const sha256 = async (value: string): Promise<string> => {
    const code = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    const hashArray = Array.from(new Uint8Array(code));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const createRegistration = (profile: ApplicationProfile): {subject: RDFJS.Term, store: RDFJS.Store} => {
    const subject = new N3.NamedNode('#' + uuid.v4());
    const now = new Date();
    // TODO(angel) use the right object values for some of the properties
    // TODO(angel) fix literal generation for date time objects
    const store = new N3.Store([
        quad(subject, RDF('type'), INTEROP('ApplicationRegistration')),
        quad(subject, INTEROP('registeredBy'), namedNode(profile.applicationName)),
        quad(subject, INTEROP('registeredWith'), namedNode(profile.applicationWebId)),
        quad(subject, INTEROP('registeredAt'), literal(now.toString())),
        quad(subject, INTEROP('updatedAt'), literal(now.toString())),
        quad(subject, INTEROP('registeredApplication'), namedNode(profile.applicationWebId)),
        quad(subject, INTEROP('applicationName'), literal(profile.applicationName)),
        quad(subject, INTEROP('applicationDescription'), literal(profile.applicationDescription)),
        quad(subject, INTEROP('applicationAuthor'), namedNode(profile.authorWebId)),
        quad(subject, INTEROP('applicationAuthorName'), literal(profile.authorName)),
        quad(subject, INTEROP('applicationThumbnail'), namedNode(profile.applicationThumbnail)),
    ]);

    return { subject, store };
}
