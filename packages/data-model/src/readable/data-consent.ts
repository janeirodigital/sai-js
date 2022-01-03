import { INTEROP } from '@janeirodigital/interop-namespaces';
import { getAllMatchingQuads, iterable2array } from '@janeirodigital/interop-utils';
import { DataFactory } from 'n3';
import { Memoize } from 'typescript-memoize';
import {
  ReadableResource,
  AuthorizationAgentFactory,
  ReadableAgentRegistry,
  ImmutableDataGrant,
  DataGrantData,
  CRUDDataRegistry,
  ReadableDataRegistration,
  InheritableDataGrant,
  ReadableAgentRegistration
} from '..';

export class ReadableDataConsent extends ReadableResource {
  factory: AuthorizationAgentFactory;

  hasInheritingConsent: ReadableDataConsent[];

  async inheritingConsents(): Promise<ReadableDataConsent[]> {
    const pattern = [null, INTEROP.inheritsFromConsent, DataFactory.namedNode(this.iri)];
    const childIris = getAllMatchingQuads(this.dataset, ...pattern).map((quad) => quad.subject.value);
    return Promise.all(childIris.map((iri) => this.factory.readable.dataConsent(iri)));
  }

  async bootstrap(): Promise<void> {
    await this.fetchData();
    this.hasInheritingConsent = await this.inheritingConsents();
  }

  @Memoize()
  get registeredAgent(): string {
    return this.getObject('registeredAgent').value;
  }

  @Memoize()
  get registeredShapeTree(): string {
    return this.getObject('registeredShapeTree').value;
  }

  @Memoize()
  get scopeOfConsent(): string {
    return this.getObject('scopeOfConsent').value;
  }

  @Memoize()
  get registeredBy(): string {
    return this.getObject('registeredBy').value;
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

  public static async build(iri: string, factory: AuthorizationAgentFactory): Promise<ReadableDataConsent> {
    const instance = new ReadableDataConsent(iri, factory);
    await instance.bootstrap();
    return instance;
  }

  private generateChildDelegatedDataGrants(
    parentGrantIri: string,
    sourceGrant: InheritableDataGrant,
    granteeRegistration: ReadableAgentRegistration
  ): ImmutableDataGrant[] {
    return this.hasInheritingConsent.map((childConsent) => {
      const childGrantIri = granteeRegistration.iriForContained();
      const childSourceGrant = [...sourceGrant.hasInheritingGrant].find(
        (grant) => grant.registeredShapeTree === childConsent.registeredShapeTree
      );
      const childData: DataGrantData = {
        dataOwner: childSourceGrant.dataOwner,
        registeredShapeTree: childConsent.registeredShapeTree,
        hasDataRegistration: childSourceGrant.hasDataRegistration,
        scopeOfGrant: INTEROP.Inherited.value,
        accessMode: childConsent.accessMode.filter((mode) => childSourceGrant.accessMode.includes(mode)),
        inheritsFromGrant: parentGrantIri,
        delegationOfGrant: childSourceGrant.iri
      };
      return this.factory.immutable.dataGrant(childGrantIri, childData);
    });
  }

  private async generateDelegatedDataGrants(
    agentRegistry: ReadableAgentRegistry,
    granteeRegistration: ReadableAgentRegistration
  ): Promise<ImmutableDataGrant[]> {
    if (this.scopeOfConsent === INTEROP.Inherited.value) {
      throw new Error('this method should not be callend on data consents with Inherited scope');
    }
    let result: ImmutableDataGrant[] = [];

    for await (const agentRegistration of agentRegistry.socialAgentRegistrations) {
      // data onwer is specified but it is not their registration
      if (this.dataOwner && this.dataOwner !== agentRegistration.registeredAgent) {
        // eslint-disable-next-line no-continue
        continue;
      }
      // don't create delegated data grants for data owned by the grantee (registeredAgent)
      if (this.registeredAgent === agentRegistration.registeredAgent) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const accessGrant = agentRegistration.reciprocalRegistration?.hasAccessGrant;

      // eslint-disable-next-line no-continue
      if (!accessGrant) continue;

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
          // TODO (elf-pavlik) use hasDataInstance if present
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
    granteeRegistration: ReadableAgentRegistration
  ): ImmutableDataGrant[] {
    return this.hasInheritingConsent.map((childConsent) => {
      const childGrantIri = granteeRegistration.iriForContained();
      // child data registration must be in the same data registry as parent one
      // each data registry has only one data registration for any given shape tree
      const dataRegistration = dataRegistries
        .find((registry) => registry.find((reg) => reg.iri === registration.iri))
        .find((reg) => reg.registeredShapeTree === childConsent.registeredShapeTree);
      const childData: DataGrantData = {
        dataOwner: childConsent.registeredBy,
        registeredShapeTree: childConsent.registeredShapeTree,
        hasDataRegistration: dataRegistration.iri,
        scopeOfGrant: INTEROP.Inherited.value,
        accessMode: childConsent.accessMode,
        inheritsFromGrant: parentGrantIri
      };
      return this.factory.immutable.dataGrant(childGrantIri, childData);
    });
  }

  private async generateSourceDataGrants(
    dataRegistries: CRUDDataRegistry[],
    granteeRegistration: ReadableAgentRegistration
  ): Promise<ImmutableDataGrant[]> {
    if (this.scopeOfConsent === INTEROP.Inherited.value) {
      throw new Error('this method should not be callend on data consents with Inherited scope');
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
      if (this.scopeOfConsent === INTEROP.SelectedFromRegistry.value) scopeOfGrant = INTEROP.SelectedFromRegistry.value;
      const data: DataGrantData = {
        dataOwner: this.registeredBy,
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
    agentRegistry: ReadableAgentRegistry,
    granteeRegistration: ReadableAgentRegistration
  ): Promise<ImmutableDataGrant[]> {
    const dataGrants: ImmutableDataGrant[] = [];
    /* Source grants are only created if Data Consent is registred by the data owner.
     * This can only happen with scope:
     * - All - there will be no dataOwner set
     * - AllFromAgent - dataOwner will equal registeredBy
     * - lower with same condition as previous
     * Otherwise only delegated data grants are created
     */
    if (!this.dataOwner || this.dataOwner === this.registeredBy) {
      dataGrants.push(...(await this.generateSourceDataGrants(dataRegistries, granteeRegistration)));
    }

    // do not create delegated data grants if granted by data owner, source grants will be created instead
    /* Delegated grants are only created for data owned by others than agent granting the consent
     * This can only happen with scopes:
     * - All - there will be no dataOwner set
     * - All From Agent - dataOwner will be different than registeredBy
     * - lower with same condition as previous
     * Otherwise only source data grants are created
     */
    if (!this.dataOwner || this.dataOwner !== this.registeredBy) {
      dataGrants.push(...(await this.generateDelegatedDataGrants(agentRegistry, granteeRegistration)));
    }

    return dataGrants;
  }
}
