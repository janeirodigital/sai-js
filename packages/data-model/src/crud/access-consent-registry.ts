import { DataFactory } from 'n3';
import { getAllMatchingQuads } from '@janeirodigital/interop-utils';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { ReadableAccessConsent } from '../readable';
import { AuthorizationAgentFactory, CRUDContainer } from '..';

export class CRUDAccessConsentRegistry extends CRUDContainer {
  factory: AuthorizationAgentFactory;

  async bootstrap(): Promise<void> {
    await this.fetchData();
  }

  public static async build(iri: string, factory: AuthorizationAgentFactory): Promise<CRUDAccessConsentRegistry> {
    const instance = new CRUDAccessConsentRegistry(iri, factory);
    await instance.bootstrap();
    return instance;
  }

  get accessConsents(): AsyncIterable<ReadableAccessConsent> {
    const accessConsentPattern = [DataFactory.namedNode(this.iri), INTEROP.hasAccessConsent, null, null];
    const accessConsentIris = getAllMatchingQuads(this.dataset, ...accessConsentPattern).map((q) => q.object.value);
    const { factory } = this;
    return {
      async *[Symbol.asyncIterator]() {
        for (const iri of accessConsentIris) {
          yield factory.readable.accessConsent(iri);
        }
      }
    };
  }
}
