import { DataFactory } from 'n3';
import { Memoize } from 'typescript-memoize';
import { getAllMatchingQuads } from '@janeirodigital/interop-utils';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import {
  ReadableResource,
  ReadableDataConsent,
  ReadableAgentRegistry,
  ReadableSocialAgentRegistration,
  ReadableAccessGrant,
  ReadableDataRegistry
} from '.';
import { AuthorizationAgentFactory, DataGrant } from '..';

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

  async newAccessGrant(agentRegistry: ReadableAgentRegistry, dataGrants: DataGrant[]): Promise<ReadableAccessGrant> {
    let agentRegistration;
    for await (const registration of agentRegistry.socialAgentRegistrations) {
      if (registration.registeredAgent.value === this.registeredAgent) {
        agentRegistration = registration;
        break;
      }
    }
    // TODO iriPrefix
    const iri = `${agentRegistration.iri}${this.factory.randomUUID()}`;
    const accessGrant = this.factory.immutable.accessGrant(iri, {
      registeredBy: 'TODO',
      registeredWith: 'TODO',
      registeredAgent: this.registeredAgent,
      hasAccessNeedGroup: 'TODO',
      hasDataGrant: dataGrants.map((grant) => grant.iri)
    });
    return accessGrant;
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
  ): Promise<void> {
    const regularConsents: ReadableDataConsent[] = [];
    const childConsents: ReadableDataConsent[] = [];
    let dataGrants: DataGrant[] = [];

    for await (const dataConsent of this.dataConsents) {
      if (dataConsent.scopeOfConsent.value === INTEROP.Inherit) {
        childConsents.push(dataConsent);
      } else {
        regularConsents.push(dataConsent);
      }
    }
    for (const dataConsent of regularConsents) {
      if (dataConsent.scopeOfConsent.value === INTEROP.All.value) {
        // eslint-disable-next-line no-await-in-loop
        dataGrants = [...(await dataConsent.generateSourceDataGrants(dataRegistries)), ...dataGrants];
        // eslint-disable-next-line no-await-in-loop
        for await (const agentRegistration of agentRegistry.socialAgentRegistrations) {
          if (agentRegistration.registeredAgent.value !== this.registeredAgent) {
            dataGrants = [...(await dataConsent.generateDelegatedDataGrants(agentRegistration)), ...dataGrants];
          }
        }
      } else {
        let dataOwnerRegistration: ReadableSocialAgentRegistration;
        if (dataConsent.dataOwner && dataConsent.dataOwner !== this.registeredBy) {
          // eslint-disable-next-line no-await-in-loop
          for await (const agentRegistration of agentRegistry.socialAgentRegistrations) {
            if (agentRegistration.registeredAgent.value === dataConsent.dataOwner) {
              dataOwnerRegistration = agentRegistration;
              break;
            }
          }
        }
        if (this.registeredBy === dataConsent.dataOwner) {
          // eslint-disable-next-line no-await-in-loop
          dataGrants = [...(await dataConsent.generateSourceDataGrants(dataRegistries)), ...dataGrants];
        } else {
          // eslint-disable-next-line no-await-in-loop
          dataGrants = [...(await dataConsent.generateDelegatedDataGrants(dataOwnerRegistration)), ...dataGrants];
        }
      }
    }
    for (const dataConsent of childConsents) {
      // TODO
      // const parentConsent = dataConsent.parent;
    }
    // add all dataGrants to accessGrant
    // save new (draft) data grants
    // save access Receipt

    await this.newAccessGrant(agentRegistry, dataGrants);
  }
}
