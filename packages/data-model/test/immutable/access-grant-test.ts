import { DataFactory } from 'n3';
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { INTEROP, ACL } from '@janeirodigital/interop-namespaces';
import { randomUUID } from 'crypto';
import { AuthorizationAgentFactory, AccessGrantData } from '../../src';

const webId = 'https://alice.example/#id';
const agentId = 'https://jarvis.alice.example/#agent';

test('should set data and store', async () => {
  const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });
  const dataGrantIri = 'https://auth.alice.example/25b18e05-7f75-4e13-94f6-9950a67a89dd';
  const dataGrant = factory.immutable.dataGrant(dataGrantIri, {
    dataOwner: 'https://acme.example/#corp',
    registeredShapeTree: 'https://solidshapes.example/trees/Project',
    hasDataRegistration: 'https://finance.acme.example/4f3fbf70-49df-47ce-a573-dc54366b01ad',
    accessMode: [ACL.Read.value, ACL.Write.value],
    scopeOfGrant: INTEROP.AllFromRegistry.value
  });
  const accessGrantData: AccessGrantData = {
    registeredBy: webId,
    registeredWith: agentId,
    registeredAgent: 'https://projectron.example/#app',
    hasAccessNeedGroup: 'https://projectron.example/#some-access-group',
    dataGrants: [dataGrant]
  };
  const accessGrantIri = 'https://auth.alice.example/5e8d3d6f-9e61-4e5c-acff-adee83b68ad1';
  const accessGrantQuads = [
    DataFactory.quad(DataFactory.namedNode(accessGrantIri), INTEROP.hasDataGrant, DataFactory.namedNode(dataGrant.iri))
  ];
  const props: (keyof AccessGrantData)[] = ['registeredBy', 'registeredWith', 'registeredAgent', 'hasAccessNeedGroup'];
  for (const prop of props) {
    accessGrantQuads.push(
      DataFactory.quad(
        DataFactory.namedNode(accessGrantIri),
        INTEROP[prop],
        DataFactory.namedNode(accessGrantData[prop] as string)
      )
    );
  }
  const accessGrant = factory.immutable.accessGrant(accessGrantIri, accessGrantData);
  expect(accessGrant.dataset).toBeRdfDatasetContaining(...accessGrantQuads);

  const dataGrantPutSpy = jest.spyOn(dataGrant, 'put');
  const accessGrantPutSpy = jest.spyOn(accessGrant, 'put');
  // @ts-ignore
  accessGrant.factory = { readable: { accessGrant: jest.fn() } };

  await accessGrant.store();
  expect(dataGrantPutSpy).toBeCalled();
  expect(accessGrantPutSpy).toBeCalled();
  expect(accessGrant.factory.readable.accessGrant).toBeCalledWith(accessGrantIri);
});
