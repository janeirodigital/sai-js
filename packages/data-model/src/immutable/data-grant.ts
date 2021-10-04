import { DataFactory } from 'n3';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { ApplicationFactory, DataGrant, ImmutableResource } from '..';

type StringData = {
  dataOwner: string;
  registeredShapeTree: string;
  hasDataRegistration: string;
  scopeOfGrant: string;
  inheritsFromGrant?: string;
};

export type DataGrantData = StringData & {
  accessMode: string[];
  creatorAccessMode?: string[];
  hasDataInstance?: string[];
};

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
    for (const mode of data.accessMode) {
      this.dataset.add(DataFactory.quad(thisNode, INTEROP.accessMode, DataFactory.namedNode(mode)));
    }
    if (data.creatorAccessMode) {
      for (const mode of data.creatorAccessMode) {
        this.dataset.add(DataFactory.quad(thisNode, INTEROP.creatorAccessMode, DataFactory.namedNode(mode)));
      }
    }
    if (data.hasDataInstance) {
      for (const instance of data.hasDataInstance) {
        this.dataset.add(DataFactory.quad(thisNode, INTEROP.hasDataInstance, DataFactory.namedNode(instance)));
      }
    }
  }
  public static async build(iri: string, factory: ApplicationFactory, data: DataGrantData): Promise<DataGrant> {
    const dataGrant = new ImmutableDataGrant(iri, factory, data);
    await dataGrant.build();
    return factory.readable.dataGrant(iri);
  }
}
