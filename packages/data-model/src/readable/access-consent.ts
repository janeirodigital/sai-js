import { DataFactory } from 'n3';
import { Memoize } from 'typescript-memoize';
import { getAllMatchingQuads } from '@janeirodigital/interop-utils';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import {
  ReadableResource,
  ReadableDataConsent,
  ReadableAgentRegistry,
  ReadableAgentRegistration,
  DataGrant,
  InheritableDataGrant
} from '.';
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

  // reuse equivalent data grants
  // reuse all child grants if parent grant was reused
  private reuseDataGrants(
    immutableDataGrants: ImmutableDataGrant[],
    readableDataGrants: DataGrant[]
  ): (ImmutableDataGrant | DataGrant)[] {
    const finalGrants: (ImmutableDataGrant | DataGrant)[] = [];
    const parentGrants = immutableDataGrants.filter((grant) => grant.data.scopeOfGrant !== INTEROP.Inherited.value);
    for (const parentGrant of parentGrants) {
      const priorGrant = readableDataGrants.find((readableGrant) =>
        parentGrant.checkEquivalence(readableGrant)
      ) as InheritableDataGrant;
      if (priorGrant) {
        finalGrants.push(priorGrant);
        if (priorGrant.hasInheritingGrant) {
          finalGrants.push(...priorGrant.hasInheritingGrant);
        }
      } else {
        finalGrants.push(parentGrant);
        // push all children if any
        if (parentGrant.data.hasInheritingGrant.length) {
          finalGrants.push(...parentGrant.data.hasInheritingGrant);
        }
      }
    }

    return finalGrants;
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

    let finalGrants: (ImmutableDataGrant | DataGrant)[];
    const priorAccessGrant = granteeRegistration.hasAccessGrant;
    if (priorAccessGrant) {
      finalGrants = this.reuseDataGrants(dataGrants, priorAccessGrant.hasDataGrant);
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
