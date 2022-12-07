import { DatasetCore } from '@rdfjs/types';
import { DataFactory } from 'n3';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { getOneMatchingQuad } from './match';
import { getAgentRegistrationIri } from './link-header';
import { RdfFetch, WhatwgFetch } from './fetch';
import { parseJsonld } from './jsonld-parser';

export async function discoverAuthorizationAgent(webId: string, rdfFetch: RdfFetch): Promise<string | undefined> {
  const userDataset: DatasetCore = await (await rdfFetch(webId)).dataset();
  const authorizationAgentPattern = [DataFactory.namedNode(webId), INTEROP.hasAuthorizationAgent, null];
  return getOneMatchingQuad(userDataset, ...authorizationAgentPattern)?.object.value;
}

export async function discoverAgentRegistration(
  authorizationAgentIri: string,
  fetch: WhatwgFetch
): Promise<string | null> {
  const response = await fetch(authorizationAgentIri, { method: 'HEAD' });
  const linkHeader = response.headers.get('Link');
  if (!linkHeader) return null;
  return getAgentRegistrationIri(linkHeader);
}

export async function discoverAuthorizationRedirectEndpoint(
  authorizationAgentIri: string,
  fetch: WhatwgFetch
): Promise<string> {
  const authzAgentDocumentResponse = await fetch(authorizationAgentIri, {
    headers: { Accept: 'application/ld+json' }
  });
  const doc = await parseJsonld(await authzAgentDocumentResponse.text(), authzAgentDocumentResponse.url);
  return getOneMatchingQuad(doc, null, INTEROP.hasAuthorizationRedirectEndpoint)?.object.value;
}
