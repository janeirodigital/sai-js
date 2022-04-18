import { INTEROP } from '@janeirodigital/interop-namespaces';
import { iterable2array } from '@janeirodigital/interop-utils';
import { Memoize } from 'typescript-memoize';
import {
  AuthorizationAgentFactory,
  CRUDAgentRegistry,
  ImmutableDataGrant,
  DataGrantData,
  CRUDDataRegistry,
  ReadableDataRegistration,
  InheritableDataGrant,
  CRUDAgentRegistration
} from '..';
import { ReadableResource } from '.';

export class ReadableDataAuthorization extends ReadableResource {
  factory: AuthorizationAgentFactory;

  hasInheritingAuthorization: ReadableDataAuthorization[];

  async inheritingAuthorizations(): Promise<ReadableDataAuthorization[]> {
    const childIris = this.getSubjectsArray(INTEROP.inheritsFromAuthorization).map((subject) => subject.value);
    return Promise.all(childIris.map((iri) => this.factory.readable.dataAuthorization(iri)));
  }

  async bootstrap(): Promise<void> {
    await this.fetchData();
    this.hasInheritingAuthorization = await this.inheritingAuthorizations();
  }

  @Memoize()
  get grantee(): string {
    return this.getObject('grantee').value;
  }

  @Memoize()
  get registeredShapeTree(): string {
    return this.getObject('registeredShapeTree').value;
  }

  @Memoize()
  get scopeOfAuthorization(): string {
    return this.getObject('scopeOfAuthorization').value;
  }

  @Memoize()
  get grantedBy(): string {
    return this.getObject('grantedBy').value;
  }

  @Memoize()
  get dataOwner(): string | undefined {
    return this.getObject('dataOwner')?.value;
  }

  @Memoize()
  get accessMode(): string[] {
    return this.getObjectsArray('accessMode').map((object) => object.value);
  }

  @Memoize()
  get hasDataRegistration(): string | undefined {
    return this.getObject('hasDataRegistration')?.value;
  }

  @Memoize()
  get hasDataInstance(): string[] {
    return this.getObjectsArray('hasDataInstance').map((obj) => obj.value);
  }

  public static async build(iri: string, factory: AuthorizationAgentFactory): Promise<ReadableDataAuthorization> {
    const instance = new ReadableDataAuthorization(iri, factory);
    await instance.bootstrap();
    return instance;
  }

  private generateChildDelegatedDataGrants(
    parentGrantIri: string,
    sourceGrant: InheritableDataGrant,
    granteeRegistration: CRUDAgentRegistration
  ): ImmutableDataGrant[] {
    return this.hasInheritingAuthorization.map((childAuthorization) => {
      const childGrantIri = granteeRegistration.iriForContained();
      const childSourceGrant = [...sourceGrant.hasInheritingGrant].find(
        (grant) => grant.registeredShapeTree === childAuthorization.registeredShapeTree
      );
      const childData: DataGrantData = {
        dataOwner: childSourceGrant.dataOwner,
        registeredShapeTree: childAuthorization.registeredShapeTree,
        hasDataRegistration: childSourceGrant.hasDataRegistration,
        scopeOfGrant: INTEROP.Inherited.value,
        accessMode: childAuthorization.accessMode.filter((mode) => childSourceGrant.accessMode.includes(mode)),
        inheritsFromGrant: parentGrantIri,
        delegationOfGrant: childSourceGrant.iri
      };
      return this.factory.immutable.dataGrant(childGrantIri, childData);
    });
  }

  private async generateDelegatedDataGrants(
    agentRegistry: CRUDAgentRegistry,
    granteeRegistration: CRUDAgentRegistration
  ): Promise<ImmutableDataGrant[]> {
    if (this.scopeOfAuthorization === INTEROP.Inherited.value) {
      throw new Error('this method should not be callend on data authorizations with Inherited scope');
    }
    let result: ImmutableDataGrant[] = [];

    for await (const agentRegistration of agentRegistry.socialAgentRegistrations) {
      // data onwer is specified but it is not their registration
      if (this.dataOwner && this.dataOwner !== agentRegistration.registeredAgent) {
        // eslint-disable-next-line no-continue
        continue;
      }
      // don't create delegated data grants for data owned by the grantee (registeredAgent)
      if (this.grantee === agentRegistration.registeredAgent) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const accessGrantIri = agentRegistration.reciprocalRegistration?.hasAccessGrant;

      // eslint-disable-next-line no-continue
      if (!accessGrantIri) continue;

      const accessGrant = await this.factory.readable.accessGrant(accessGrantIri);

      // match shape tree
      let matchingDataGrants = accessGrant.hasDataGrant.filter(
        (grant) => grant.registeredShapeTree === this.registeredShapeTree
      );
      // match registration if restricted
      if (this.hasDataRegistration) {
        matchingDataGrants = matchingDataGrants.filter(
          (grant) => grant.hasDataRegistration === this.hasDataRegistration
        );
      }

      result = [
        ...matchingDataGrants.flatMap((sourceGrant) => {
          const regularGrantIri = granteeRegistration.iriForContained();

          const childDataGrants: ImmutableDataGrant[] = this.generateChildDelegatedDataGrants(
            regularGrantIri,
            sourceGrant as InheritableDataGrant,
            granteeRegistration
          );
          // TODO (elf-pavlik) use hasDataInstance if present - add snippet
          const data: DataGrantData = {
            dataOwner: sourceGrant.dataOwner,
            registeredShapeTree: sourceGrant.registeredShapeTree,
            hasDataRegistration: sourceGrant.hasDataRegistration,
            scopeOfGrant: sourceGrant.scopeOfGrant.value,
            delegationOfGrant: sourceGrant.iri,
            accessMode: this.accessMode.filter((mode) => sourceGrant.accessMode.includes(mode))
          };
          if (childDataGrants.length) {
            data.hasInheritingGrant = childDataGrants;
          }
          const regularGrant = this.factory.immutable.dataGrant(regularGrantIri, data);
          return [regularGrant, ...childDataGrants];
        }),
        ...result
      ];
    }
    return result;
  }

  private generateChildSourceDataGrants(
    parentGrantIri: string,
    registration: ReadableDataRegistration,
    dataRegistries: ReadableDataRegistration[][],
    granteeRegistration: CRUDAgentRegistration
  ): ImmutableDataGrant[] {
    return this.hasInheritingAuthorization.map((childAuthorization) => {
      const childGrantIri = granteeRegistration.iriForContained();
      // child data registration must be in the same data registry as parent one
      // each data registry has only one data registration for any given shape tree
      const dataRegistration = dataRegistries
        .find((registry) => registry.find((reg) => reg.iri === registration.iri))
        .find((reg) => reg.registeredShapeTree === childAuthorization.registeredShapeTree);
      const childData: DataGrantData = {
        dataOwner: childAuthorization.grantedBy,
        registeredShapeTree: childAuthorization.registeredShapeTree,
        hasDataRegistration: dataRegistration.iri,
        scopeOfGrant: INTEROP.Inherited.value,
        accessMode: childAuthorization.accessMode,
        inheritsFromGrant: parentGrantIri
      };
      return this.factory.immutable.dataGrant(childGrantIri, childData);
    });
  }

  private async generateSourceDataGrants(
    dataRegistries: CRUDDataRegistry[],
    granteeRegistration: CRUDAgentRegistration
  ): Promise<ImmutableDataGrant[]> {
    if (this.scopeOfAuthorization === INTEROP.Inherited.value) {
      throw new Error('this method should not be callend on data authorizations with Inherited scope');
    }

    // get data registrations from all data registries
    const dataRegistriesArr = await Promise.all(
      dataRegistries.map((registry) => iterable2array(registry.registrations))
    );
    const dataRegistrations = dataRegistriesArr.flat();

    // match shape tree
    let matchingRegistrations = dataRegistrations.filter(
      (registration) => registration.registeredShapeTree === this.registeredShapeTree
    );

    // match registration if restricted
    if (this.hasDataRegistration) {
      matchingRegistrations = matchingRegistrations.filter(
        (registration) => registration.iri === this.hasDataRegistration
      );
    }

    // create source grants
    return matchingRegistrations.flatMap((registration) => {
      const regularGrantIri = granteeRegistration.iriForContained();

      // create children if needed
      const childDataGrants: ImmutableDataGrant[] = this.generateChildSourceDataGrants(
        regularGrantIri,
        registration,
        dataRegistriesArr,
        granteeRegistration
      );

      let scopeOfGrant = INTEROP.AllFromRegistry.value;
      if (this.scopeOfAuthorization === INTEROP.SelectedFromRegistry.value)
        scopeOfGrant = INTEROP.SelectedFromRegistry.value;
      const data: DataGrantData = {
        dataOwner: this.grantedBy,
        registeredShapeTree: this.registeredShapeTree,
        hasDataRegistration: registration.iri,
        scopeOfGrant,
        accessMode: this.accessMode
      };
      if (this.hasDataInstance.length) {
        data.hasDataInstance = this.hasDataInstance;
      }
      if (childDataGrants.length) {
        data.hasInheritingGrant = childDataGrants;
      }
      const regularGrant = this.factory.immutable.dataGrant(regularGrantIri, data);
      return [regularGrant, ...childDataGrants];
    });
  }

  public async generateDataGrants(
    dataRegistries: CRUDDataRegistry[],
    agentRegistry: CRUDAgentRegistry,
    granteeRegistration: CRUDAgentRegistration
  ): Promise<ImmutableDataGrant[]> {
    const dataGrants: ImmutableDataGrant[] = [];
    /* Source grants are only created if Data Authorization is registred by the data owner.
     * This can only happen with scope:
     * - All - there will be no dataOwner set
     * - AllFromAgent - dataOwner will equal grantedBy
     * - lower with same condition as previous
     * Otherwise only delegated data grants are created
     */
    if (!this.dataOwner || this.dataOwner === this.grantedBy) {
      dataGrants.push(...(await this.generateSourceDataGrants(dataRegistries, granteeRegistration)));
    }

    // do not create delegated data grants if granted by data owner, source grants will be created instead
    /* Delegated grants are only created for data owned by others than agent granting the authorization
     * This can only happen with scopes:
     * - All - there will be no dataOwner set
     * - All From Agent - dataOwner will be different than grantedBy
     * - lower with same condition as previous
     * Otherwise only source data grants are created
     */
    if (!this.dataOwner || this.dataOwner !== this.grantedBy) {
      dataGrants.push(...(await this.generateDelegatedDataGrants(agentRegistry, granteeRegistration)));
    }

    return dataGrants;
  }
}
