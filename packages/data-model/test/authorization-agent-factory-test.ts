import { ACL, INTEROP } from '@janeirodigital/interop-namespaces';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { AuthorizationAgentFactory, CRUDApplicationRegistration, ImmutableDataGrant } from '../src';

describe('crud', () => {
  test('builds application registration', async () => {
    const factory = new AuthorizationAgentFactory({ fetch, randomUUID });
    const applicationRegistrationUrl = 'https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659';
    const applicationRegistration = await factory.crud.applicationRegistration(applicationRegistrationUrl);
    expect(applicationRegistration).toBeInstanceOf(CRUDApplicationRegistration);
  });
});

describe('immutable', () => {
  const commonData = {
    dataOwner: 'https://alice.example/#id',
    registeredShapeTree: 'https://solidshapes.example/tree/Project',
    hasDataRegistration: 'https://pro.alice.example/123',
    accessMode: [ACL.Read.value]
  };

  test('builds AllInstances data grant', async () => {
    const allInstancesData = {
      scopeOfGrant: INTEROP.AllInstances.value,
      ...commonData
    };
    const factory = new AuthorizationAgentFactory({ fetch, randomUUID });
    const dataGrantIri = 'https://auth.alice.example/7b2bc4ff-b4b8-47b8-96f6-06695f4c5126';
    const dataGrant = await factory.immutable.dataGrant(dataGrantIri, allInstancesData);
    expect(dataGrant).toBeInstanceOf(ImmutableDataGrant);
  });

  test('builds SelectedInstances data grant', async () => {
    const selectedInstancesData = {
      scopeOfGrant: INTEROP.SelectedInstances.value,
      ...commonData
    };
    const factory = new AuthorizationAgentFactory({ fetch, randomUUID });
    const dataGrantIri = 'https://auth.alice.example/cd247a67-0879-4301-abd0-828f63abb252';
    const dataGrant = await factory.immutable.dataGrant(dataGrantIri, selectedInstancesData);
    expect(dataGrant).toBeInstanceOf(ImmutableDataGrant);
  });

  test('builds InheritInstances data grant', async () => {
    const inheritnstancesData = {
      scopeOfGrant: INTEROP.InheritInstances.value,
      ...commonData
    };
    const factory = new AuthorizationAgentFactory({ fetch, randomUUID });
    const dataGrantIri = 'https://auth.alice.example/9827ae00-2778-4655-9f22-08bb9daaee26';
    const dataGrant = await factory.immutable.dataGrant(dataGrantIri, inheritnstancesData);
    expect(dataGrant).toBeInstanceOf(ImmutableDataGrant);
  });
});
