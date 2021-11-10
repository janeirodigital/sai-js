import { INTEROP } from '@janeirodigital/interop-namespaces';
import { getAllMatchingQuads, iterable2array } from '@janeirodigital/interop-utils';
import { NamedNode } from '@rdfjs/types';
import { DataFactory } from 'n3';
import { Memoize } from 'typescript-memoize';
import {
  ReadableResource,
  AuthorizationAgentFactory,
  ReadableAgentRegistry,
  ImmutableDataGrant,
  DataGrantData,
  ReadableDataRegistry,
  ReadableDataRegistration,
  InheritableDataGrant
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
  get registeredShapeTree(): string {
    return this.getObject('registeredShapeTree').value;
  }

  @Memoize()
  get scopeOfConsent(): NamedNode {
    return this.getObject('scopeOfConsent');
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
    sourceGrant: InheritableDataGrant
  ): ImmutableDataGrant[] {
    return this.hasInheritingConsent.map((childConsent) => {
      const childGrantIri = this.factory.randomUUID(); // TODO gen iri
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

  // TODO (elf-pavlik) don't create delegated grants where grantee == dataowner
  public async generateDelegatedDataGrants(agentRegistry: ReadableAgentRegistry): Promise<ImmutableDataGrant[]> {
    if (this.scopeOfConsent === INTEROP.Inherited.value) {
      throw new Error('this method should be callend on grants with Inherited scope');
    }
    let result: ImmutableDataGrant[] = [];
    if (this.dataOwner && this.dataOwner === this.registeredBy) return [];

    //
    for await (const agentRegistration of agentRegistry.socialAgentRegistrations) {
      if (this.dataOwner && this.dataOwner !== agentRegistration.registeredAgent) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const accessGrant = agentRegistration.reciprocalRegistration?.hasAccessGrant;
      if (!accessGrant) return [];

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
          const regularGrantIri = this.factory.randomUUID(); // TODO gen iri

          const childDataGrants: ImmutableDataGrant[] = this.generateChildDelegatedDataGrants(
            regularGrantIri,
            sourceGrant as InheritableDataGrant
          );
          const data: DataGrantData = {
            dataOwner: sourceGrant.dataOwner,
            registeredShapeTree: sourceGrant.registeredShapeTree,
            hasDataRegistration: sourceGrant.hasDataRegistration,
            scopeOfGrant: sourceGrant.scopeOfGrant.value,
            delegationOfGrant: sourceGrant.iri,
            accessMode: this.accessMode.filter((mode) => sourceGrant.accessMode.includes(mode))
          };
          if (childDataGrants.length) {
            data.hasInheritingGrant = childDataGrants.map((grant) => grant.iri);
          }
          const regularGrant = this.factory.immutable.dataGrant(regularGrantIri, data);
          return [regularGrant, ...childDataGrants];
        }),
        ...result
      ];
      if (this.dataOwner && this.dataOwner === agentRegistration.registeredAgent) {
        break;
      }
    }
    return result;
  }

  private generateChildSourceDataGrants(
    parentGrantIri: string,
    registration: ReadableDataRegistration,
    dataRegistries: ReadableDataRegistration[][]
  ): ImmutableDataGrant[] {
    return this.hasInheritingConsent.map((childConsent) => {
      const childGrantIri = this.factory.randomUUID(); // TODO gen iri
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

  public async generateSourceDataGrants(dataRegistries: ReadableDataRegistry[]): Promise<ImmutableDataGrant[]> {
    if (this.scopeOfConsent === INTEROP.Inherited.value) {
      throw new Error('this method should be callend on grants with Inherited scope');
    }
    /* Source grants are only created if Data Consent is registred by the data owner.
     * This can only happen with either scope:
     * - All - there will be no dataOwner set
     * - AllFromAgent - dataOwner will equal registeredBy
     */
    if (this.dataOwner && this.dataOwner !== this.registeredBy) return [];

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
      const regularGrantIri = this.factory.randomUUID(); // TODO gen iri

      // create children if needed
      const childDataGrants: ImmutableDataGrant[] = this.generateChildSourceDataGrants(
        regularGrantIri,
        registration,
        dataRegistriesArr
      );

      let scopeOfGrant = INTEROP.AllFromRegistry.value;
      if (this.scopeOfConsent === INTEROP.SelectedFromRegistry.value) scopeOfGrant = INTEROP.SelectedFromRegistry.value;
      if (this.scopeOfConsent === INTEROP.Inherited.value) scopeOfGrant = INTEROP.Inherited.value;
      const data: DataGrantData = {
        dataOwner: this.registeredBy,
        registeredShapeTree: this.registeredShapeTree,
        hasDataRegistration: registration.iri,
        scopeOfGrant,
        accessMode: this.accessMode
      };
      if (childDataGrants.length) {
        data.hasInheritingGrant = childDataGrants.map((grant) => grant.iri);
      }
      const regularGrant = this.factory.immutable.dataGrant(regularGrantIri, data);
      return [regularGrant, ...childDataGrants];
    });
  }
}
