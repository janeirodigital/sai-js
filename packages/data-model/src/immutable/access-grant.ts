import { DataFactory } from 'n3';
import { INTEROP, XSD } from '@janeirodigital/interop-namespaces';
import { AuthorizationAgentFactory, ImmutableResource, ReadableAccessGrant } from '..';

type StringData = {
  registeredBy: string;
  registeredWith: string;
  registeredAgent: string;
  hasAccessNeedGroup: string;
};

export type AccessGrantData = StringData & {
  hasDataGrant: string[];
};

export class ImmutableAccessGrant extends ImmutableResource {
  public constructor(iri: string, factory: AuthorizationAgentFactory, data: AccessGrantData) {
    super(iri, factory, data);
    const thisNode = DataFactory.namedNode(this.iri);
    const props: (keyof StringData)[] = ['registeredBy', 'registeredWith', 'registeredAgent', 'hasAccessNeedGroup'];
    for (const prop of props) {
      if (data[prop]) {
        this.dataset.add(DataFactory.quad(thisNode, INTEROP[prop], DataFactory.namedNode(data[prop])));
      }
    }
    for (const dataConsent of data.hasDataGrant) {
      this.dataset.add(DataFactory.quad(thisNode, INTEROP.hasDataGrant, DataFactory.namedNode(dataConsent)));
    }
    this.dataset.add(
      DataFactory.quad(thisNode, INTEROP.registeredAt, DataFactory.literal(new Date().toISOString(), XSD.dateTime))
    );
  }

  public static async build(
    iri: string,
    factory: AuthorizationAgentFactory,
    data: AccessGrantData
  ): Promise<ReadableAccessGrant> {
    const dataGrant = new ImmutableAccessGrant(iri, factory, data);
    await dataGrant.build();
    return factory.readable.accessGrant(iri);
  }
}
