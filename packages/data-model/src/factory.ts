import { DataFactory, NamedNode } from 'n3';
import { INTEROP } from 'interop-namespaces';
import { getOneMatchingQuad, RandomUUID, RdfFetch } from 'interop-utils';
import {
  AccessReceipt,
  ApplicationRegistration,
  DataRegistration,
  DataInstance,
  InheritInstancesDataGrant,
  AllInstancesDataGrant,
  SelectedInstancesDataGrant,
  SelectedRemoteDataGrant,
  AllRemoteFromAgentDataGrant,
  AllRemoteDataGrant,
  InheritRemoteInstancesDataGrant,
  AnyDataGrant,
  DataGrant,
  ReferencesList,
  InheritableDataGrant,
  InheritableRemoteDataGrant
} from '.';

interface CachedDataGrants {
  [key: string]: AnyDataGrant;
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

  async dataGrant(iri: string, viaRemoteDataGrant?: InheritableRemoteDataGrant): Promise<AnyDataGrant> {
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
        scopedDataGrant = new AllInstancesDataGrant(iri, this, dataset, viaRemoteDataGrant);
        break;
      case INTEROP.SelectedInstances.value:
        scopedDataGrant = new SelectedInstancesDataGrant(iri, this, dataset, viaRemoteDataGrant);
        break;
      case INTEROP.SelectedRemote.value:
        scopedDataGrant = await SelectedRemoteDataGrant.build(iri, this, dataset);
        break;
      case INTEROP.AllRemoteFromAgent.value:
        scopedDataGrant = await AllRemoteFromAgentDataGrant.build(iri, this, dataset);
        break;
      case INTEROP.AllRemote.value:
        scopedDataGrant = await AllRemoteDataGrant.build(iri, this, dataset);
        break;
      case INTEROP.InheritInstances.value:
        scopedDataGrant = new InheritInstancesDataGrant(iri, this, dataset);
        // set parent grant
        scopedDataGrant.inheritsFromGrant = (await this.dataGrant(
          scopedDataGrant.inheritsFromGrantIri
        )) as InheritableDataGrant;
        // register as child in parent grant
        scopedDataGrant.inheritsFromGrant.hasInheritingGrant.add(scopedDataGrant);
        break;
      case INTEROP.InheritRemoteInstances.value:
        scopedDataGrant = await InheritRemoteInstancesDataGrant.build(iri, this, dataset);
        // register as child in parent grant
        scopedDataGrant.inheritsFromGrant.hasInheritingGrant.add(scopedDataGrant);
        break;
      default:
        throw new Error(`Unknown scope: ${scopeOfGrant.value}`);
    }

    // store in cache for future access
    this.cache.dataGrant[iri] = scopedDataGrant;

    return scopedDataGrant;
  }
}
