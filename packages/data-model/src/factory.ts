import { RdfFetch } from 'interop-utils';
import { AccessReceipt, ApplicationRegistration, DataRegistration } from '.';

export class InteropFactory {
  fetch: RdfFetch;

  constructor(fetch: RdfFetch) {
    this.fetch = fetch;
  }

  async accessReceipt(iri: string): Promise<AccessReceipt> {
    return AccessReceipt.build(iri, this);
  }

  async applicationRegistration(iri: string): Promise<ApplicationRegistration> {
    return ApplicationRegistration.build(iri, this);
  }

  async dataRegistration(iri: string): Promise<DataRegistration> {
    return DataRegistration.build(iri, this);
  }
}
