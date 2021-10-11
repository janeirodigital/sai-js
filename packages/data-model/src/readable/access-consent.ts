import { DataFactory } from 'n3';
import { Memoize } from 'typescript-memoize';
import { getAllMatchingQuads } from '@janeirodigital/interop-utils';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import {
  ReadableResource,
  ReadableDataConsent,
  ReadableAgentRegistry,
  ReadableSocialAgentRegistration,
  ReadableDataRegistry
} from '.';
import { AuthorizationAgentFactory, ImmutableAccessGrant, ImmutableDataGrant } from '..';

export class ReadableAccessConsent extends ReadableResource {
  factory: AuthorizationAgentFactory;

  async bootstrap(): Promise<void> {
    await this.fetchData();
  }

  public static async build(iri: string, factory: AuthorizationAgentFactory): Promise<ReadableAccessConsent> {
    const instance = new ReadableAccessConsent(iri, factory);
    await instance.bootstrap();
    return instance;
  }

  get dataConsents(): AsyncIterable<ReadableDataConsent> {
    const dataConsentPattern = [DataFactory.namedNode(this.iri), INTEROP.hasDataConsent, null, null];
    const dataConsentIris = getAllMatchingQuads(this.dataset, ...dataConsentPattern).map((q) => q.object.value);
    const { factory } = this;
    return {
      async *[Symbol.asyncIterator]() {
        for (const iri of dataConsentIris) {
          yield factory.readable.dataConsent(iri);
        }
      }
    };
  }

  @Memoize()
  get registeredBy(): string {
    return this.getObject('registeredBy')?.value;
  }

  @Memoize()
  get registeredAgent(): string {
    return this.getObject('registeredAgent').value;
  }

  async newAccessGrant(
    agentRegistry: ReadableAgentRegistry,
    dataGrants: ImmutableDataGrant[]
  ): Promise<ImmutableAccessGrant> {
    let agentRegistration;
    for await (const registration of agentRegistry.socialAgentRegistrations) {
      if (registration.registeredAgent === this.registeredAgent) {
        agentRegistration = registration;
        break;
      }
    }
    // TODO iriPrefix
    const iri = `${agentRegistration.iri}${this.factory.randomUUID()}`;
    return this.factory.immutable.accessGrant(iri, {
      registeredBy: 'TODO',
      registeredWith: 'TODO',
      registeredAgent: this.registeredAgent,
      hasAccessNeedGroup: 'TODO',
      dataGrants
    });
  }

  /*
   * This method takes into consideration:
   * Scope of each DataConsent
   * If data consent is on issuer data (source data grants) or on someone else's data (delegated data grants)
   * Enusres not to create delegated gransts on data grants from the consent subject
   */

  public async generateAccessGrant(
    dataRegistries: ReadableDataRegistry[],
    agentRegistry: ReadableAgentRegistry
  ): Promise<ImmutableAccessGrant> {
    const regularConsents: ReadableDataConsent[] = [];
    const childConsents: ReadableDataConsent[] = [];
    let dataGrants: ImmutableDataGrant[] = [];

    for await (const dataConsent of this.dataConsents) {
      if (dataConsent.scopeOfConsent.value === INTEROP.Inherit) {
        childConsents.push(dataConsent);
      } else {
        regularConsents.push(dataConsent);
      }
    }
    for (const dataConsent of regularConsents) {
      dataGrants = [
        ...(await dataConsent.generateSourceDataGrants(dataRegistries)),
        ...(await dataConsent.generateDelegatedDataGrants(agentRegistry)),
        ...dataGrants
      ];
    }
    for (const dataConsent of childConsents) {
      // TODO
      // const parentConsent = dataConsent.parent;
    }
    // add all dataGrants to accessGrant
    // save new (draft) data grants
    // save access receipt

    return this.newAccessGrant(agentRegistry, dataGrants);
  }
}
