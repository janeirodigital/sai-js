import { DataFactory } from 'n3';
import { iterable2array } from '@janeirodigital/interop-utils';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { AuthorizationAgentFactory, CRUDContainer, ReadableAccessConsent, ReadableAccessGrant } from '..';

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
    const accessConsentPattern = [DataFactory.namedNode(this.iri), INTEROP.hasAccessConsent];
    const accessConsentIris = this.getQuadArray(...accessConsentPattern).map((q) => q.object.value);
    const { factory } = this;
    return {
      async *[Symbol.asyncIterator]() {
        for (const iri of accessConsentIris) {
          yield factory.readable.accessConsent(iri);
        }
      }
    };
  }

  // eslint-disable-next-line consistent-return
  async findConsent(agentIri: string): Promise<ReadableAccessConsent | undefined> {
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
    const priorConsent = await this.findConsent(accessConsent.registeredAgent);
    if (priorConsent) {
      const priorQuad = this.getQuad(
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

  // match dataOwner on data consents - scope All will have no dataOwner but we want it to also match
  async findConsentsDelegatingGrant(dataOwner: string): Promise<ReadableAccessConsent[]> {
    const matching: ReadableAccessConsent[] = [];
    for await (const accessConsent of this.accessConsents) {
      let matches = false;
      for await (const dataConsent of accessConsent.dataConsents) {
        if (!dataConsent.dataOwner || dataConsent.dataOwner === dataOwner) {
          matches = true;
        }
      }
      if (matches) {
        matching.push(accessConsent);
      }
    }
    return matching;
  }
}
