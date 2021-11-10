import { DataFactory } from 'n3';
import { INTEROP, XSD } from '@janeirodigital/interop-namespaces';
import { AuthorizationAgentFactory, ImmutableDataGrant, ImmutableResource, ReadableAccessGrant } from '..';

type StringData = {
  registeredBy: string;
  registeredWith: string;
  registeredAgent: string;
  hasAccessNeedGroup: string;
};

export type AccessGrantData = StringData & {
  dataGrants: ImmutableDataGrant[];
};

export class ImmutableAccessGrant extends ImmutableResource {
  dataGrants: ImmutableDataGrant[];

  public constructor(iri: string, factory: AuthorizationAgentFactory, data: AccessGrantData) {
    super(iri, factory, data);
    this.dataGrants = data.dataGrants;
    const thisNode = DataFactory.namedNode(this.iri);
    const props: (keyof StringData)[] = ['registeredBy', 'registeredWith', 'registeredAgent', 'hasAccessNeedGroup'];
    for (const prop of props) {
      if (data[prop]) {
        this.dataset.add(DataFactory.quad(thisNode, INTEROP[prop], DataFactory.namedNode(data[prop])));
      }
    }
    for (const dataGrant of data.dataGrants) {
      this.dataset.add(DataFactory.quad(thisNode, INTEROP.hasDataGrant, DataFactory.namedNode(dataGrant.iri)));
    }
    this.dataset.add(
      DataFactory.quad(thisNode, INTEROP.registeredAt, DataFactory.literal(new Date().toISOString(), XSD.dateTime))
    );
  }

  public async store(): Promise<ReadableAccessGrant> {
    // store all data grants first
    await Promise.all(this.dataGrants.map((grant) => grant.put()));

    await this.put();

    return this.factory.readable.accessGrant(this.iri);
  }
}
