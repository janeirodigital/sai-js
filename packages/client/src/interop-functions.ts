import * as RDFJS from 'rdf-js';
import { getOneMatchingQuad } from 'interop-utils';
import { INTEROP } from 'interop-namespaces';
import { RegistrySet } from './storage';

/**
 * Parses an RDF document to find the different registry sets URIs
 * @param document RDF Graph of the document where the user webId is located
 */
export const parseRegistrySets = (document: RDFJS.Dataset): RegistrySet => {
  const application = getOneMatchingQuad(document, null, INTEROP.hasApplicationRegistrySet).object.value;
  const data = getOneMatchingQuad(document, null, INTEROP.hasDataRegistrySet).object.value;
  const accessGrant = getOneMatchingQuad(document, null, INTEROP.hasAccessGrantRegistrySet).object.value;
  const accessReceipt = getOneMatchingQuad(document, null, INTEROP.hasAccessReceiptRegistrySet).object.value;
  const remoteData = getOneMatchingQuad(document, null, INTEROP.hasRemoteDataRegistrySet).object.value;

  return {
    application, data, accessGrant, accessReceipt, remoteData,
  };
};

/**
 * Creates a hex representation of the SHA-256 encryption of the given string
 * Generating a SHA-256 in JS: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
 * @param value string to encrypt
 * @private
 */
export const sha256 = async (value: string): Promise<string> => {
  const code = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  const hashArray = Array.from(new Uint8Array(code));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};
