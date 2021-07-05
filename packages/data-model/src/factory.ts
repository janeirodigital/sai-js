import { getAllMatchingQuads, getOneMatchingQuad, RdfFetch } from 'interop-utils';
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
  DataGrant,
  ReferencesList
} from '.';
import { INTEROP } from 'interop-namespaces';
import { DatasetCore } from 'rdf-js';
import { DataFactory, NamedNode } from 'n3';

export class InteropFactory {
  fetch: RdfFetch;

  constructor(fetch: RdfFetch) {
    this.fetch = fetch;
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

  async dataInstance(iri: string): Promise<DataInstance> {
    return DataInstance.build(iri, this);
  }

  async referencesList(iri: string): Promise<ReferencesList> {
    return ReferencesList.build(iri, this);
  }

  async dataGrant(iri: string, accessReceipt?: AccessReceipt): Promise<DataGrant> {
    let dataset: DatasetCore;
    if (accessReceipt) {
      const quadPattern = [DataFactory.namedNode(iri), null, null, DataFactory.namedNode(accessReceipt.iri)];
      dataset = accessReceipt.dataset.match(...quadPattern);
    } else {
      dataset = await this.fetch(iri);
    }

    const quadPattern = [DataFactory.namedNode(iri), INTEROP.scopeOfGrant, null, null];
    const scopeOfGrant = getOneMatchingQuad(dataset, ...quadPattern).object as NamedNode;
    let scopedDataGrant;
    switch (scopeOfGrant.value) {
      case INTEROP.AllInstances.value:
        scopedDataGrant = new AllInstancesDataGrant(iri, this, dataset);
        break;
      case INTEROP.SelectedInstances.value:
        scopedDataGrant = new SelectedInstancesDataGrant(iri, this, dataset);
        break;
      case INTEROP.SelectedRemote.value:
        scopedDataGrant = new SelectedRemoteDataGrant(iri, this, dataset);
        break;
      case INTEROP.AllRemoteFromAgent.value:
        scopedDataGrant = new AllRemoteFromAgentDataGrant(iri, this, dataset);
        break;
      case INTEROP.AllRemote.value:
        scopedDataGrant = new AllRemoteDataGrant(iri, this, dataset);
        break;

      case INTEROP.InheritInstances.value:
        scopedDataGrant = new InheritInstancesDataGrant(iri, this, dataset);
        break;

      default:
        throw new Error(`Unknown scope: ${scopeOfGrant.value}`);
    }

    return scopedDataGrant;
  }
}
