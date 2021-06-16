import { DataFactory } from 'n3';
import { DatasetCore } from '@rdfjs/types';
import { getAllMatchingQuads } from 'interop-utils';
import { INTEROP } from 'interop-namespaces';
import { AccessReceipt, InteropFactory } from '.';

export class DataGrant {
  iri: string;

  dataset: DatasetCore;

  factory: InteropFactory;

  accessReceipt: AccessReceipt;

  hasReferencedDataGrant: DataGrant[];

  private extractDataSubset(): void {
    const quadPattern = [DataFactory.namedNode(this.iri), null, null, DataFactory.namedNode(this.accessReceipt.iri)];
    this.dataset = this.accessReceipt.dataset.match(...quadPattern);
  }

  private buildReferencedDataGrants(): void {
    const quadPattern = [
      DataFactory.namedNode(this.iri),
      INTEROP.hasReferencedDataGrant,
      null,
      DataFactory.namedNode(this.accessReceipt.iri)
    ];
    this.hasReferencedDataGrant = getAllMatchingQuads(this.dataset, ...quadPattern)
      .map((quad) => quad.object.value)
      .map((referencedIri) => this.factory.dataGrant(referencedIri, this.accessReceipt));
  }

  constructor(iri: string, accessReceipt: AccessReceipt, factory: InteropFactory) {
    this.iri = iri;
    this.factory = factory;
    this.accessReceipt = accessReceipt;
    this.extractDataSubset();
    this.buildReferencedDataGrants();
  }
}
