import { DataFactory } from 'n3';
import { NamedNode } from '@rdfjs/types';
import { INTEROP, RDF } from '@janeirodigital/interop-namespaces';
import { ApplicationFactory, ImmutableResource } from '..';

type StringData = {
  dataOwner: string;
  registeredShapeTree: string;
  hasDataRegistration: string;
  scopeOfGrant: string;
  inheritsFromGrant?: string;
  delegationOfGrant?: string;
};

type ArrayData = {
  accessMode: string[];
  creatorAccessMode?: string[];
  hasDataInstance?: string[];
};

type InverseArrayData = {
  hasInheritingGrant?: string[];
};

export type DataGrantData = StringData & ArrayData & InverseArrayData;

export class ImmutableDataGrant extends ImmutableResource {
  public constructor(iri: string, factory: ApplicationFactory, data: DataGrantData) {
    super(iri, factory, data);
    const thisNode = DataFactory.namedNode(this.iri);
    const props: (keyof StringData)[] = [
      'dataOwner',
      'registeredShapeTree',
      'hasDataRegistration',
      'scopeOfGrant',
      'inheritsFromGrant',
      'delegationOfGrant'
    ];

    // set type
    const type: NamedNode = data.delegationOfGrant ? INTEROP.DelegatedDataGrant : INTEROP.DataGrant;
    this.dataset.add(DataFactory.quad(thisNode, RDF.type, type));
    // set string data
    for (const prop of props) {
      if (data[prop]) {
        this.dataset.add(DataFactory.quad(thisNode, INTEROP[prop], DataFactory.namedNode(data[prop])));
      }
    }
    const arrProps: (keyof ArrayData)[] = ['accessMode', 'creatorAccessMode', 'hasDataInstance'];
    for (const prop of arrProps) {
      if (data[prop]) {
        for (const element of data[prop]) {
          this.dataset.add(DataFactory.quad(thisNode, INTEROP[prop], DataFactory.namedNode(element)));
        }
      }
    }
    if (data.hasInheritingGrant) {
      for (const child of data.hasInheritingGrant) {
        this.dataset.add(DataFactory.quad(DataFactory.namedNode(child), INTEROP.inheritsFromGrant, thisNode));
      }
    }
  }
}
