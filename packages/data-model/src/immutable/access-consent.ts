import { DataFactory } from 'n3';
import { INTEROP, XSD } from '@janeirodigital/interop-namespaces';
import { AuthorizationAgentFactory, ImmutableResource, ReadableAccessConsent } from '..';

type StringData = {
  registeredBy: string;
  registeredWith: string;
  registeredAgent: string;
  hasAccessNeedGroup: string;
};

export type AccessConsentData = StringData & {
  hasDataConsent: string[];
};

export class ImmutableAccessConsent extends ImmutableResource {
  public constructor(iri: string, factory: AuthorizationAgentFactory, data: AccessConsentData) {
    super(iri, factory, data);
    const thisNode = DataFactory.namedNode(this.iri);
    const props: (keyof StringData)[] = ['registeredBy', 'registeredWith', 'registeredAgent', 'hasAccessNeedGroup'];
    for (const prop of props) {
      if (data[prop]) {
        this.dataset.add(DataFactory.quad(thisNode, INTEROP[prop], DataFactory.namedNode(data[prop])));
      }
    }
    for (const dataConsent of data.hasDataConsent) {
      this.dataset.add(DataFactory.quad(thisNode, INTEROP.hasDataConsent, DataFactory.namedNode(dataConsent)));
    }
    this.dataset.add(
      DataFactory.quad(thisNode, INTEROP.registeredAt, DataFactory.literal(new Date().toISOString(), XSD.dateTime))
    );
  }

  public static async build(
    iri: string,
    factory: AuthorizationAgentFactory,
    data: AccessConsentData
  ): Promise<ReadableAccessConsent> {
    const instance = new ImmutableAccessConsent(iri, factory, data);
    await instance.build();
    return factory.readable.accessConsent(iri);
  }
}
