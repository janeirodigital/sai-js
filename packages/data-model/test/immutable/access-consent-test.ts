import { DataFactory } from 'n3';
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { INTEROP, ACL } from '@janeirodigital/interop-namespaces';
import { randomUUID } from 'crypto';
import { AuthorizationAgentFactory, AccessConsentData } from '../../src';

const webId = 'https://alice.example/#id';
const agentId = 'https://jarvis.alice.example/#agent';

test('should set data and store', async () => {
  const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });
  const dataConsentIri = 'https://auth.alice.example/25b18e05-7f75-4e13-94f6-9950a67a89dd';
  const dataConsent = factory.immutable.dataConsent(dataConsentIri, {
    grantee: 'https://projectron.example/#app',
    registeredShapeTree: 'https://solidshapes.example/trees/Project',
    accessMode: [ACL.Read.value, ACL.Write.value],
    scopeOfConsent: INTEROP.All.value
  });
  const accessConsentData = {
    grantedBy: webId,
    grantedWith: agentId,
    grantee: 'https://projectron.example/#app',
    hasAccessNeedGroup: 'https://projectron.example/#some-access-group',
    dataConsents: [dataConsent]
  };
  const accessConsentIri = 'https://auth.alice.example/e791fa95-9363-4852-a9ed-e266aa62c193';
  const accessConsentQuads = [
    DataFactory.quad(
      DataFactory.namedNode(accessConsentIri),
      INTEROP.hasDataConsent,
      DataFactory.namedNode(dataConsent.iri)
    )
  ];
  const props: (keyof AccessConsentData)[] = ['grantedBy', 'grantedWith', 'grantee', 'hasAccessNeedGroup'];
  for (const prop of props) {
    accessConsentQuads.push(
      DataFactory.quad(
        DataFactory.namedNode(accessConsentIri),
        INTEROP[prop],
        DataFactory.namedNode(accessConsentData[prop] as string)
      )
    );
  }
  const accessConsent = factory.immutable.accessConsent(accessConsentIri, accessConsentData);
  expect(accessConsent.dataset).toBeRdfDatasetContaining(...accessConsentQuads);

  const dataConsentPutSpy = jest.spyOn(dataConsent, 'put');
  const accessConsentPutSpy = jest.spyOn(accessConsent, 'put');
  // @ts-ignore
  accessConsent.factory = { readable: { accessConsent: jest.fn() } };

  await accessConsent.store();
  expect(dataConsentPutSpy).toBeCalled();
  expect(accessConsentPutSpy).toBeCalled();
  expect(accessConsent.factory.readable.accessConsent).toBeCalledWith(accessConsentIri);
});
