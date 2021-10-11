import { DataFactory } from 'n3';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { ReadableDataConsent, ImmutableResource, AuthorizationAgentFactory } from '..';

type StringData = {
  registeredShapeTree: string;
  scopeOfConsent: string;
  dataOwner?: string;
  hasDataRegistration?: string;
  inheritsFromConsent?: string;
};

type ArrayData = {
  accessMode: string[];
  creatorAccessMode?: string[];
  hasDataInstance?: string[];
};

export type DataConsentData = StringData & ArrayData;

export class ImmutableDataConsent extends ImmutableResource {
  public constructor(iri: string, factory: AuthorizationAgentFactory, data: DataConsentData) {
    super(iri, factory, data);
    const thisNode = DataFactory.namedNode(this.iri);
    const props: (keyof StringData)[] = [
      'dataOwner',
      'registeredShapeTree',
      'hasDataRegistration',
      'scopeOfConsent',
      'inheritsFromConsent'
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

  // TODO remove async or this function
  public static async build(
    iri: string,
    factory: AuthorizationAgentFactory,
    data: DataConsentData
  ): Promise<ImmutableDataConsent> {
    return new ImmutableDataConsent(iri, factory, data);
  }
}
