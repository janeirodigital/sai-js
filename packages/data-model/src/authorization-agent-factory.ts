import {
  CRUDApplicationRegistration,
  ApplicationRegistrationData,
  BaseFactory,
  DataGrantData,
  DataGrant,
  ImmutableDataGrant
} from '.';
export class AuthorizationAgentFactory extends BaseFactory {
  get crud() {
    const factory = this;
    return {
      applicationRegistration: async function applicationRegistration(
        iri: string,
        data?: ApplicationRegistrationData
      ): Promise<CRUDApplicationRegistration> {
        return CRUDApplicationRegistration.build(iri, factory, data);
      }
    };
  }
  get immutable() {
    const factory = this;
    return {
      dataGrant: async function dataGrant(iri: string, data: DataGrantData): Promise<DataGrant> {
        return ImmutableDataGrant.build(iri, factory, data);
      }
    };
  }
}
