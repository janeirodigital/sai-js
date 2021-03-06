import { DataFactory } from 'n3';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { AuthorizationAgentFactory } from '..';
import { ImmutableResource } from '.';

type StringData = {
  grantee: string;
  registeredShapeTree: string;
  scopeOfAuthorization: string;
  dataOwner?: string;
  hasDataRegistration?: string;
  inheritsFromAuthorization?: string;
};

type ArrayData = {
  accessMode: string[];
  creatorAccessMode?: string[];
  hasDataInstance?: string[];
};

export type DataAuthorizationData = StringData & ArrayData;

export class ImmutableDataAuthorization extends ImmutableResource {
  public constructor(iri: string, factory: AuthorizationAgentFactory, data: DataAuthorizationData) {
    super(iri, factory, data);
    const thisNode = DataFactory.namedNode(this.iri);
    const props: (keyof StringData)[] = [
      'grantee',
      'dataOwner',
      'registeredShapeTree',
      'hasDataRegistration',
      'scopeOfAuthorization',
      'inheritsFromAuthorization'
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
  }
}
