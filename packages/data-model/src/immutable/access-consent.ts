import { DataFactory } from 'n3';
import { INTEROP, XSD } from '@janeirodigital/interop-namespaces';
import { AuthorizationAgentFactory, ImmutableResource, ImmutableDataConsent, ReadableAccessConsent } from '..';

type StringData = {
  registeredBy: string;
  registeredWith: string;
  registeredAgent: string;
  hasAccessNeedGroup: string;
};

export type AccessConsentData = StringData & {
  dataConsents: ImmutableDataConsent[];
};

export class ImmutableAccessConsent extends ImmutableResource {
  dataConsents: ImmutableDataConsent[];

  factory: AuthorizationAgentFactory;

  public constructor(iri: string, factory: AuthorizationAgentFactory, data: AccessConsentData) {
    super(iri, factory, data);
    this.dataConsents = data.dataConsents;
    const thisNode = DataFactory.namedNode(this.iri);
    const props: (keyof StringData)[] = ['registeredBy', 'registeredWith', 'registeredAgent', 'hasAccessNeedGroup'];
    for (const prop of props) {
      if (data[prop]) {
        this.dataset.add(DataFactory.quad(thisNode, INTEROP[prop], DataFactory.namedNode(data[prop])));
      }
    }
    for (const dataConsent of data.dataConsents) {
      this.dataset.add(DataFactory.quad(thisNode, INTEROP.hasDataConsent, DataFactory.namedNode(dataConsent.iri)));
    }
    this.dataset.add(
      DataFactory.quad(thisNode, INTEROP.registeredAt, DataFactory.literal(new Date().toISOString(), XSD.dateTime))
    );
  }

  public async store(): Promise<ReadableAccessConsent> {
    // store all data grants first
    // TODO: take into account retrying - if given grant already exists just move on
    await Promise.all(this.dataConsents.map((grant) => grant.put()));
    await this.put();
    return this.factory.readable.accessConsent(this.iri);
  }
}
