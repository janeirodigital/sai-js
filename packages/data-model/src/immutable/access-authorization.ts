import { DataFactory } from 'n3';
import { INTEROP, XSD } from '@janeirodigital/interop-namespaces';
import { AuthorizationAgentFactory, ImmutableDataAuthorization, ReadableAccessAuthorization } from '..';
import { ImmutableResource } from '.';

type StringData = {
  grantedBy: string;
  grantedWith: string;
  grantee: string;
  hasAccessNeedGroup: string;
};

export type AccessAuthorizationData = StringData & {
  dataAuthorizations: ImmutableDataAuthorization[];
  granted: boolean;
};

export class ImmutableAccessAuthorization extends ImmutableResource {
  dataAuthorizations: ImmutableDataAuthorization[];
  data: AccessAuthorizationData;

  factory: AuthorizationAgentFactory;

  public constructor(iri: string, factory: AuthorizationAgentFactory, data: AccessAuthorizationData) {
    super(iri, factory, data);
    this.dataAuthorizations = data.dataAuthorizations;
    const thisNode = DataFactory.namedNode(this.iri);
    const props: (keyof StringData)[] = ['grantedBy', 'grantedWith', 'grantee', 'hasAccessNeedGroup'];
    for (const prop of props) {
      this.dataset.add(DataFactory.quad(thisNode, INTEROP[prop], DataFactory.namedNode(data[prop])));
    }
    for (const dataAuthorization of data.dataAuthorizations) {
      this.dataset.add(
        DataFactory.quad(thisNode, INTEROP.hasDataAuthorization, DataFactory.namedNode(dataAuthorization.iri))
      );
    }
    this.dataset.add(
      DataFactory.quad(thisNode, INTEROP.grantedAt, DataFactory.literal(new Date().toISOString(), XSD.dateTime))
    );
    this.dataset.add(
      DataFactory.quad(thisNode, INTEROP.granted, DataFactory.literal(data.granted.toString(), XSD.boolean))
    );
  }

  public async store(): Promise<ReadableAccessAuthorization> {
    // store all data grants first
    // TODO: take into account retrying - if given grant already exists just move on
    await Promise.all(this.dataAuthorizations.map((grant) => grant.put()));
    await this.put();
    return this.factory.readable.accessAuthorization(this.iri);
  }
}
