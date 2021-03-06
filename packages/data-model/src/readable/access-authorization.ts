import { Memoize } from 'typescript-memoize';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import {
  ReadableResource,
  ReadableDataAuthorization,
  DataGrant,
  AllFromRegistryDataGrant,
  SelectedFromRegistryDataGrant
} from '.';
import {
  AuthorizationAgentFactory,
  ImmutableAccessGrant,
  ImmutableDataGrant,
  CRUDDataRegistry,
  CRUDAgentRegistration,
  CRUDAgentRegistry
} from '..';

// reuse equivalent data grants
// reuse all child grants if parent grant was reused
function reuseDataGrants(
  immutableDataGrants: ImmutableDataGrant[],
  readableDataGrants: DataGrant[]
): (ImmutableDataGrant | DataGrant)[] {
  const finalGrants: (ImmutableDataGrant | DataGrant)[] = [];
  const parentGrants = immutableDataGrants.filter((grant) => grant.data.scopeOfGrant !== INTEROP.Inherited.value);
  for (const parentGrant of parentGrants) {
    const priorGrant = readableDataGrants.find((readableGrant) => parentGrant.checkEquivalence(readableGrant)) as
      | AllFromRegistryDataGrant
      | SelectedFromRegistryDataGrant;
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
export class ReadableAccessAuthorization extends ReadableResource {
  factory: AuthorizationAgentFactory;

  async bootstrap(): Promise<void> {
    await this.fetchData();
  }

  public static async build(iri: string, factory: AuthorizationAgentFactory): Promise<ReadableAccessAuthorization> {
    const instance = new ReadableAccessAuthorization(iri, factory);
    await instance.bootstrap();
    return instance;
  }

  get dataAuthorizations(): AsyncIterable<ReadableDataAuthorization> {
    const dataAuthorizationIris = this.getObjectsArray(INTEROP.hasDataAuthorization).map((object) => object.value);
    const { factory } = this;
    return {
      async *[Symbol.asyncIterator]() {
        for (const iri of dataAuthorizationIris) {
          yield factory.readable.dataAuthorization(iri);
        }
      }
    };
  }

  @Memoize()
  get grantedBy(): string {
    return this.getObject('grantedBy').value;
  }

  @Memoize()
  get grantee(): string {
    return this.getObject('grantee').value;
  }

  @Memoize()
  get hasAccessNeedGroup(): string {
    return this.getObject('hasAccessNeedGroup').value;
  }

  /*
   * Generates Access Grant with Data Grants
   */

  public async generateAccessGrant(
    dataRegistries: CRUDDataRegistry[],
    agentRegistry: CRUDAgentRegistry,
    granteeRegistration: CRUDAgentRegistration
  ): Promise<ImmutableAccessGrant> {
    const dataGrants: ImmutableDataGrant[] = [];

    const regularAuthorizations: ReadableDataAuthorization[] = [];
    for await (const dataAuthorization of this.dataAuthorizations) {
      if (dataAuthorization.scopeOfAuthorization !== INTEROP.Inherited.value) {
        regularAuthorizations.push(dataAuthorization);
      }
    }
    for (const dataAuthorization of regularAuthorizations) {
      dataGrants.push(
        // eslint-disable-next-line no-await-in-loop
        ...(await dataAuthorization.generateDataGrants(dataRegistries, agentRegistry, granteeRegistration))
      );
    }

    let finalGrants: (ImmutableDataGrant | DataGrant)[];
    const priorAccessGrant = granteeRegistration.accessGrant;
    if (priorAccessGrant) {
      finalGrants = reuseDataGrants(dataGrants, priorAccessGrant.hasDataGrant);
    } else {
      finalGrants = dataGrants;
    }

    const accessGrantIri = granteeRegistration.iriForContained();
    return this.factory.immutable.accessGrant(accessGrantIri, {
      grantedBy: this.factory.webId,
      grantedWith: this.factory.agentId,
      grantee: this.grantee,
      hasAccessNeedGroup: this.hasAccessNeedGroup,
      dataGrants: finalGrants
    });
  }
}
