import { DataFactory, NamedNode } from 'n3';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { getOneMatchingQuad, RdfFetch } from '@janeirodigital/interop-utils';
import {
  ReadableAccessGrant,
  ReadableApplicationRegistration,
  ReadableDataRegistration,
  DataInstance,
  InheritInstancesDataGrant,
  AllInstancesDataGrant,
  SelectedInstancesDataGrant,
  DataGrant,
  ReadableShapeTree
} from '.';

interface CachedDataGrants {
  [key: string]: DataGrant;
}

interface CachedShapeTrees {
  [key: string]: ReadableShapeTree;
}

interface Cache {
  dataGrant: CachedDataGrants;
  shapeTree: CachedShapeTrees;
}

interface FactoryDependencies {
  fetch: RdfFetch;
  randomUUID(): string;
}

export class InteropFactory {
  fetch: RdfFetch;

  randomUUID: () => string;

  cache: Cache;

  constructor(dependencies: FactoryDependencies) {
    this.fetch = dependencies.fetch;
    this.randomUUID = dependencies.randomUUID;
    this.cache = {
      dataGrant: {},
      shapeTree: {}
    };
  }

  async accessGrant(iri: string): Promise<ReadableAccessGrant> {
    return ReadableAccessGrant.build(iri, this);
  }

  async applicationRegistration(iri: string): Promise<ReadableApplicationRegistration> {
    return ReadableApplicationRegistration.build(iri, this);
  }

  async dataRegistration(iri: string): Promise<ReadableDataRegistration> {
    return ReadableDataRegistration.build(iri, this);
  }

  async dataInstance(iri: string, grant: DataGrant, parent?: DataInstance): Promise<DataInstance> {
    return DataInstance.build(iri, grant, this, parent);
  }

  async shapeTree(iri: string): Promise<ReadableShapeTree> {
    // return cached if exists
    const cached = this.cache.shapeTree[iri];
    if (cached) return cached;

    const shapeTree = await ReadableShapeTree.build(iri, this);

    // store in cache for future access
    this.cache.shapeTree[iri] = shapeTree;
    return shapeTree;
  }

  async dataGrant(iri: string): Promise<DataGrant> {
    // return cached if exists
    const cached = this.cache.dataGrant[iri];
    if (cached) return cached;

    const response = await this.fetch(iri);
    const dataset = await response.dataset();

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
