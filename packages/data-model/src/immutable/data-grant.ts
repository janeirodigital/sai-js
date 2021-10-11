import { DataFactory } from 'n3';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { ApplicationFactory, ImmutableResource } from '..';

type StringData = {
  dataOwner: string;
  registeredShapeTree: string;
  hasDataRegistration: string;
  scopeOfGrant: string;
  inheritsFromGrant?: string;
};

type ArrayData = {
  accessMode: string[];
  creatorAccessMode?: string[];
  hasDataInstance?: string[];
};

export type DataGrantData = StringData & ArrayData;

export class ImmutableDataGrant extends ImmutableResource {
  public constructor(iri: string, factory: ApplicationFactory, data: DataGrantData) {
    super(iri, factory, data);
    const thisNode = DataFactory.namedNode(this.iri);
    const props: (keyof StringData)[] = [
      'dataOwner',
      'registeredShapeTree',
      'hasDataRegistration',
      'scopeOfGrant',
      'inheritsFromGrant'
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
    factory: ApplicationFactory,
    data: DataGrantData
  ): Promise<ImmutableDataGrant> {
    return new ImmutableDataGrant(iri, factory, data);
  }
}
