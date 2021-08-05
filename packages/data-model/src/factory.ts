import { DataFactory, NamedNode } from 'n3';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { getOneMatchingQuad, RandomUUID, RdfFetch } from '@janeirodigital/interop-utils';
import {
  AccessReceipt,
  ApplicationRegistration,
  DataRegistration,
  DataInstance,
  InheritInstancesDataGrant,
  AllInstancesDataGrant,
  SelectedInstancesDataGrant,
  DataGrant,
  ReferencesList
} from '.';

interface CachedDataGrants {
  [key: string]: DataGrant;
}

interface Cache {
  dataGrant: CachedDataGrants;
}

interface FactoryDependencies {
  fetch: RdfFetch;
  randomUUID: RandomUUID;
}

export class InteropFactory {
  fetch: RdfFetch;

  randomUUID: RandomUUID;

  cache: Cache;

  constructor(dependencies: FactoryDependencies) {
    this.fetch = dependencies.fetch;
    this.randomUUID = dependencies.randomUUID;
    this.cache = {
      dataGrant: {}
    };
  }

  async accessReceipt(iri: string): Promise<AccessReceipt> {
    return AccessReceipt.build(iri, this);
  }

  async applicationRegistration(iri: string): Promise<ApplicationRegistration> {
    return ApplicationRegistration.build(iri, this);
  }

  async dataRegistration(iri: string): Promise<DataRegistration> {
    return DataRegistration.build(iri, this);
  }

  async dataInstance(iri: string, grant: DataGrant): Promise<DataInstance> {
    return DataInstance.build(iri, grant, this);
  }

  async referencesList(iri: string): Promise<ReferencesList> {
    return ReferencesList.build(iri, this);
  }

  async dataGrant(iri: string): Promise<DataGrant> {
    // return cached if exists
    const cached = this.cache.dataGrant[iri];
    if (cached) return cached;

    const { dataset } = await this.fetch(iri);
    if (!dataset) {
      throw new Error('missing dataset');
    }

    const quadPattern = [DataFactory.namedNode(iri), INTEROP.scopeOfGrant, null, null];
    const scopeOfGrant = getOneMatchingQuad(dataset, ...quadPattern).object as NamedNode;
    let scopedDataGrant;
    switch (scopeOfGrant.value) {
      case INTEROP.AllInstances.value:
        scopedDataGrant = await AllInstancesDataGrant.build(iri, this, dataset);
        break;
      case INTEROP.SelectedInstances.value:
        scopedDataGrant = await SelectedInstancesDataGrant.build(iri, this, dataset);
        break;
      case INTEROP.InheritInstances.value:
        scopedDataGrant = new InheritInstancesDataGrant(iri, this, dataset);
        break;
      default:
        throw new Error(`Unknown scope: ${scopeOfGrant.value}`);
    }

    // store in cache for future access
    this.cache.dataGrant[iri] = scopedDataGrant;

    return scopedDataGrant;
  }
}
