import { DataFactory } from 'n3';
import { getAllMatchingQuads, getOneMatchingQuad } from '@janeirodigital/interop-utils';
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

  async findConsnent(agentIri: string): Promise<ReadableAccessConsent> {
    for await (const consent of this.accessConsents) {
      if (consent.registeredAgent === agentIri) {
        return consent;
      }
    }
  }

  /*
   * Links access consent from registry
   * If prior consent exists for that agent it gets unlinked
   * Updates itself
   */
  async add(accessConsent: ReadableAccessConsent): Promise<void> {
    const subject = DataFactory.namedNode(this.iri);
    const predicate = INTEROP.hasAccessConsent;
    const object = DataFactory.namedNode(accessConsent.iri);
    // unlink prevoius access consent for that grantee if exists
    const priorConsent = await this.findConsnent(accessConsent.registeredAgent);
    if (priorConsent) {
      const priorQuad = getOneMatchingQuad(
        this.dataset,
        DataFactory.namedNode(this.iri),
        INTEROP.hasAccessConsent,
        DataFactory.namedNode(priorConsent.iri)
      );
      this.dataset.delete(priorQuad);
    }
    // add quad
    this.dataset.add(DataFactory.quad(subject, predicate, object));
    await this.update();
  }
}
