import { DataFactory } from 'n3';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { AuthorizationAgentFactory } from '..';
import { ImmutableResource } from '.';

type StringData = {
  grantee: string; // TODO: move to expanded
  registeredShapeTree: string;
  scopeOfAuthorization: string;
  dataOwner?: string;
  hasDataRegistration?: string;
  inheritsFromAuthorization?: string; // TODO: define as separate interface which requires it
  satisfiesAccessNeed?: string; // TODO: make required
};

// TODO consider changing to Set<string>
type ArrayData = {
  accessMode: string[];
  creatorAccessMode?: string[];
  hasDataInstance?: string[];
  hasInheritingAuthorization?: string[];
};

export type DataAuthorizationData = StringData & ArrayData;

export type ExpandedDataAuthorizationData = DataAuthorizationData & {
  grantedBy: string;
};

export class ImmutableDataAuthorization extends ImmutableResource {
  public constructor(iri: string, factory: AuthorizationAgentFactory, data: ExpandedDataAuthorizationData) {
    super(iri, factory, data);
    const thisNode = DataFactory.namedNode(this.iri);
    const props: (keyof (StringData & { grantedBy: string }))[] = [
      'grantee',
      'grantedBy',
      'dataOwner',
      'registeredShapeTree',
      'hasDataRegistration',
      'scopeOfAuthorization',
      'inheritsFromAuthorization',
      'satisfiesAccessNeed'
    ];
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
    // link back to children
    if (data.hasInheritingAuthorization) {
      for (const child of data.hasInheritingAuthorization) {
        this.dataset.add(DataFactory.quad(DataFactory.namedNode(child), INTEROP.inheritsFromAuthorization, thisNode));
      }
    }
  }
}
