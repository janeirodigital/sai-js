import { DataFactory } from 'n3';
import { INTEROP, XSD } from '@janeirodigital/interop-namespaces';
import { AuthorizationAgentFactory, DataGrant, ImmutableDataGrant, ReadableAccessGrant } from '..';
import { ImmutableResource } from '.';

type StringData = {
  grantedBy: string;
  grantedWith: string;
  grantee: string;
  hasAccessNeedGroup: string;
};

export type AccessGrantData = StringData & {
  dataGrants: (ImmutableDataGrant | DataGrant)[];
};

export class ImmutableAccessGrant extends ImmutableResource {
  dataGrants: (ImmutableDataGrant | DataGrant)[];

  public constructor(iri: string, factory: AuthorizationAgentFactory, data: AccessGrantData) {
    super(iri, factory, data);
    this.dataGrants = data.dataGrants;
    const thisNode = DataFactory.namedNode(this.iri);
    const props: (keyof StringData)[] = ['grantedBy', 'grantedWith', 'grantee', 'hasAccessNeedGroup'];
    for (const prop of props) {
      this.dataset.add(DataFactory.quad(thisNode, INTEROP[prop], DataFactory.namedNode(data[prop])));
    }
    for (const dataGrant of data.dataGrants) {
      this.dataset.add(DataFactory.quad(thisNode, INTEROP.hasDataGrant, DataFactory.namedNode(dataGrant.iri)));
    }
    this.dataset.add(
      DataFactory.quad(thisNode, INTEROP.grantedAt, DataFactory.literal(new Date().toISOString(), XSD.dateTime))
    );
  }

  public async store(): Promise<ReadableAccessGrant> {
    // store all immutable data grants first
    await Promise.all(
      this.dataGrants.map((grant) => {
        if (grant instanceof ImmutableDataGrant) {
          return grant.put();
        }
        return Promise.resolve();
      })
    );

    await this.put();

    return this.factory.readable.accessGrant(this.iri);
  }
}
