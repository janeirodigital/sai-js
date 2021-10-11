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
  ReadableShapeTree,
  FactoryDependencies
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

export class BaseFactory {
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

  get readable() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const factory = this;
    return {
      accessGrant: async function accessGrant(iri: string): Promise<ReadableAccessGrant> {
        return ReadableAccessGrant.build(iri, factory);
      },
      applicationRegistration: async function applicationRegistration(
        iri: string
      ): Promise<ReadableApplicationRegistration> {
        return ReadableApplicationRegistration.build(iri, factory);
      },
      dataRegistration: async function dataRegistration(iri: string): Promise<ReadableDataRegistration> {
        return ReadableDataRegistration.build(iri, factory);
      },
      shapeTree: async function shapeTree(iri: string): Promise<ReadableShapeTree> {
        // return cached if exists
        const cached = factory.cache.shapeTree[iri];
        if (cached) return cached;

        const instance = await ReadableShapeTree.build(iri, factory);

        // store in cache for future access
        factory.cache.shapeTree[iri] = instance;
        return instance;
      },

      dataGrant: async function dataGrant(iri: string): Promise<DataGrant> {
        // return cached if exists
        const cached = factory.cache.dataGrant[iri];
        if (cached) return cached;

        const response = await factory.fetch(iri);
        const dataset = await response.dataset();

        const quadPattern = [DataFactory.namedNode(iri), INTEROP.scopeOfGrant, null, null];
        const scopeOfGrant = getOneMatchingQuad(dataset, ...quadPattern).object as NamedNode;
        let scopedDataGrant;
        switch (scopeOfGrant.value) {
          case INTEROP.AllInstances.value:
          case INTEROP.All.value: // TODO dedup after refactoring scope names
            scopedDataGrant = await AllInstancesDataGrant.build(iri, factory, dataset);
            break;
          case INTEROP.SelectedInstances.value:
            scopedDataGrant = await SelectedInstancesDataGrant.build(iri, factory, dataset);
            break;
          case INTEROP.InheritInstances.value:
          case INTEROP.Inherit.value: // TODO dedup after refactoring scope names
            scopedDataGrant = new InheritInstancesDataGrant(iri, factory, dataset);
            break;
          default:
            throw new Error(`Unknown scope: ${scopeOfGrant.value} on ${iri}`);
        }

        // store in cache for future access
        factory.cache.dataGrant[iri] = scopedDataGrant;

        return scopedDataGrant;
      }
    };
  }

  async dataInstance(iri: string, grant: DataGrant, parent?: DataInstance): Promise<DataInstance> {
    return DataInstance.build(iri, grant, this, parent);
  }
}
