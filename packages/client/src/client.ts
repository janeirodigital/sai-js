/* eslint-disable */
// TODO (angel) re-enable eslint once this file is in a more stable place
import * as RDFJS from 'rdf-js';
import * as path from 'path';
import { INTEROP } from 'interop-namespaces';
import { getAllMatchingQuads, getOneMatchingQuad } from 'interop-utils';
import { Fetch } from './fetch';
import { getRdfResource } from './rdf-functions';
import { sha256 } from './interop-functions';

export interface InteropOptions {
  /** Whether to automatically register the application if not registered already */
  register: boolean;
  applicationWebId: string;
  /** Where to start looking for the registries */
  webId: string;
  fetch: Fetch;
}

export class InteropClient {
  private fetch: Fetch;

  constructor(
    private options: InteropOptions,
  ) {
    this.fetch = options.fetch || window.fetch;
  }

  /**
   *
   * To check for the registration we need to have the URL for the
   * application registration and the probe {ldp}/{application registry}/{uuid},
   * if the response is 401 then it does not exist, else it is registered
   */
  public async checkRegistration(): Promise<boolean> {
    // TODO(angel) don't re-fetch the profile document if it's already in-memory/cached somewhere
    const profileDocument = await getRdfResource(this.options.webId, this.fetch);
    const registrySetUrl = getOneMatchingQuad(profileDocument, null, INTEROP.hasApplicationRegistrySet).object.value;
    const registrySet = await getRdfResource(registrySetUrl, this.fetch);
    const registryUrls = getAllMatchingQuads(registrySet, null, INTEROP.hasRegistry).map((q) => q.object.value);

    for (const registry of registryUrls) {
      const response = await this.fetch(path.join(registry, await sha256(this.options.applicationWebId)));
      if (response.ok) {
        // TODO(angel) should fail only on explicit 404/401
        // TODO(angel) how to handle codes 5xx
        return true;
      }
    }
    return false;
  }

  /**
   * Redirect the user to their authorization agent of preference to register this application
   */
  public requestRegistration(): void {
    // TODO(angel) defined properties needed for the redirect into authz server
    throw new Error('Not yet implemented');
  }

  /**
   * Index all available data into the pod.
   */
  public index(): Promise<void> {
    throw new Error('Not yet implemented');
  }

  /**
   * TODO(angel) should be possible to stream results a là rxjs.Observable
   * Looks for all the registrations for the given shapetree that the application has access to and retrieves them
   * @param shapetree ShapeTree uri for the corresponding data type
   */
  public getAll(shapetree: string): Promise<RDFJS.Dataset> {
    throw new Error('Not yet implemented');
  }
}
