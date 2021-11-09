import { INTEROP } from '@janeirodigital/interop-namespaces';
import { iterable2array } from '@janeirodigital/interop-utils';
import { NamedNode } from '@rdfjs/types';
import { Memoize } from 'typescript-memoize';
import {
  ReadableResource,
  AuthorizationAgentFactory,
  ReadableAgentRegistry,
  ImmutableDataGrant,
  ReadableDataRegistry
} from '..';

// TODO (elf-pavlik) don't create non All consent where sub == dataowner
export class ReadableDataConsent extends ReadableResource {
  factory: AuthorizationAgentFactory;

  async bootstrap(): Promise<void> {
    await this.fetchData();
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

  // TODO handle Inherit scope
  public async generateDelegatedDataGrants(agentRegistry: ReadableAgentRegistry): Promise<ImmutableDataGrant[]> {
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

      // TODO should be DelegatedDataGrant
      result = [
        ...(await Promise.all(
          matchingDataGrants.map((sourceGrant) => {
            const iri = 'TODO';
            const data = {
              dataOwner: sourceGrant.dataOwner,
              registeredShapeTree: sourceGrant.registeredShapeTree,
              hasDataRegistration: sourceGrant.hasDataRegistration,
              scopeOfGrant: sourceGrant.scopeOfGrant.value,
              accessMode: this.accessMode
            };
            return this.factory.immutable.dataGrant(iri, data);
          })
        )),
        ...result
      ];
      if (this.dataOwner && this.dataOwner === agentRegistration.registeredAgent) {
        break;
      }
    }
    return result;
  }

  public async generateSourceDataGrants(dataRegistries: ReadableDataRegistry[]): Promise<ImmutableDataGrant[]> {
    // TODO: check grant scope
    if (this.dataOwner && this.dataOwner !== this.registeredBy) return [];

    // All
    // AllFromAgent where agent is the owner of data registrations

    // get data registrations from all data registries
    const dataRegistrations = (
      await Promise.all(dataRegistries.map((registry) => iterable2array(registry.registrations)))
    ).flat();

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
    return Promise.all(
      matchingRegistrations.map((registration) => {
        const iri = 'TODO';
        const data = {
          dataOwner: this.dataOwner,
          registeredShapeTree: this.registeredShapeTree,
          hasDataRegistration: registration.iri,
          scopeOfGrant: INTEROP.AllFromRegistry.value, // TODO adjust based on scope of consent
          accessMode: this.accessMode
        };
        return this.factory.immutable.dataGrant(iri, data);
      })
    );
  }
}
