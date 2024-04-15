/* eslint-disable max-classes-per-file */

import { DatasetCore } from '@rdfjs/types';
import { DataFactory } from 'n3';
import { INTEROP, NOTIFY } from './namespaces';
import { getOneMatchingQuad } from './match';
import { getAgentRegistrationIri } from './link-header';
import { RdfFetch, WhatwgFetch } from './fetch';
import { parseJsonld } from './jsonld-parser';

export class RequestError extends Error {
  constructor(
    message: string,
    public response: Response
  ) {
    super(message);
  }
}

export class AgentRegistrationDiscoveryError extends RequestError {
  constructor(public response: Response) {
    super('Agent Registration Discovery request failed', response);
  }
}

export async function discoverAuthorizationAgent(webId: string, rdfFetch: RdfFetch): Promise<string | undefined> {
  const userDataset: DatasetCore = await (await rdfFetch(webId)).dataset();
  const authorizationAgentPattern = [DataFactory.namedNode(webId), INTEROP.hasAuthorizationAgent, null];
  return getOneMatchingQuad(userDataset, ...authorizationAgentPattern)?.object.value;
}

export async function discoverAgentRegistration(
  authorizationAgentIri: string,
  fetch: WhatwgFetch
): Promise<string | undefined> {
  const response = await fetch(authorizationAgentIri, { method: 'HEAD' });
  if (!response.ok) throw new AgentRegistrationDiscoveryError(response);
  const linkHeader = response.headers.get('Link');
  if (!linkHeader) return undefined;
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
  return getOneMatchingQuad(doc, null, INTEROP.hasAuthorizationRedirectEndpoint)!.object.value;
}

export async function discoverWebPushService(
  authorizationAgentIri: string,
  fetch: WhatwgFetch
): Promise<{id: string, vapidPublicKey: string}> {
  const authzAgentDocumentResponse = await fetch(authorizationAgentIri, {
    headers: { Accept: 'application/ld+json' }
  });
  const doc = await parseJsonld(await authzAgentDocumentResponse.text(), authzAgentDocumentResponse.url);
  return {
    id: getOneMatchingQuad(doc, null, INTEROP.pushService)!.object.value, 
    vapidPublicKey: getOneMatchingQuad(doc, null, NOTIFY.vapidPublicKey)!.object.value
  };
}

