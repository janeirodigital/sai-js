import { DataFactory } from 'n3';
import { Memoize } from 'typescript-memoize';
import { getAllMatchingQuads } from '@janeirodigital/interop-utils';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { ReadableResource, ReadableDataConsent, ReadableAgentRegistry, ReadableAgentRegistration, DataGrant } from '.';
import { AuthorizationAgentFactory, ImmutableAccessGrant, ImmutableDataGrant, CRUDDataRegistry } from '..';

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

  @Memoize()
  get hasAccessNeedGroup(): string {
    return this.getObject('hasAccessNeedGroup').value;
  }

  /*
   * Generates Access Grant with Data Grants
   * TODO: Reuse equivalent Data Grants if Access Grant for that agent already exists
   */

  public async generateAccessGrant(
    dataRegistries: CRUDDataRegistry[],
    agentRegistry: ReadableAgentRegistry,
    granteeRegistration: ReadableAgentRegistration
  ): Promise<ImmutableAccessGrant> {
    let dataGrants: ImmutableDataGrant[] = [];

    const regularConsents: ReadableDataConsent[] = [];
    for await (const dataConsent of this.dataConsents) {
      if (dataConsent.scopeOfConsent !== INTEROP.Inherited.value) {
        regularConsents.push(dataConsent);
      }
    }
    for (const dataConsent of regularConsents) {
      // eslint-disable-next-line no-await-in-loop
      dataGrants.push(...(await dataConsent.generateDataGrants(dataRegistries, agentRegistry, granteeRegistration)));
    }

    // reuse equivalent data grants if prior access grants exists
    // TODO: review for Inherited scope
    const priorAccessGrant = granteeRegistration.hasAccessGrant;

    let finalGrants: (ImmutableDataGrant | DataGrant)[];

    if (priorAccessGrant) {
      finalGrants = dataGrants.map((dataGrant) => {
        const priorGrant = priorAccessGrant.hasDataGrant.find((readableGrant) =>
          dataGrant.checkEquivalence(readableGrant)
        );
        if (priorGrant) return priorGrant;
        else return dataGrant;
      });
    } else {
      finalGrants = dataGrants;
    }

    const accessGrantIri = granteeRegistration.iriForContained();
    return this.factory.immutable.accessGrant(accessGrantIri, {
      registeredBy: this.factory.webId,
      registeredWith: this.factory.agentId,
      registeredAgent: this.registeredAgent,
      hasAccessNeedGroup: this.hasAccessNeedGroup,
      dataGrants: finalGrants
    });
  }
}
