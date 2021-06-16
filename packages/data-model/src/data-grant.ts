import { DataFactory } from 'n3';
import { DatasetCore } from '@rdfjs/types';
import { getOneMatchingQuad } from 'interop-utils';
import { INTEROP } from 'interop-namespaces';
import { AccessReceipt, InteropFactory } from '.';

export class DataGrant {
  iri: string;

  dataset: DatasetCore;

  factory: InteropFactory;

  accessReceipt: AccessReceipt;

  inheritsFromGrantIri?: string;

  inheritsFromGrant?: DataGrant;

  private extractDataSubset(): void {
    const quadPattern = [DataFactory.namedNode(this.iri), null, null, DataFactory.namedNode(this.accessReceipt.iri)];
    this.dataset = this.accessReceipt.dataset.match(...quadPattern);
  }

  private setInheritsFromGrantIri(): void {
    const quadPattern = [
      DataFactory.namedNode(this.iri),
      INTEROP.inheritsFromGrant,
      null,
      DataFactory.namedNode(this.accessReceipt.iri)
    ];
    this.inheritsFromGrantIri = getOneMatchingQuad(this.dataset, ...quadPattern)?.object.value;
  }

  constructor(iri: string, accessReceipt: AccessReceipt, factory: InteropFactory) {
    this.iri = iri;
    this.factory = factory;
    this.accessReceipt = accessReceipt;
    this.extractDataSubset();
    this.setInheritsFromGrantIri();
  }
}
