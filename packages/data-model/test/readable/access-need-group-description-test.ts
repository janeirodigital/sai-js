// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { AuthorizationAgentFactory, ReadableAccessNeedGroupDescription } from '../../src';

const webId = 'https://alice.example/#id';
const agentId = 'https://jarvis.alice.example/#agent';
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });
const snippetIri = 'https://projectron.example/descriptions-en#en-need-group-pm';

test('factory should build an access need group description', async () => {
  const description = await factory.readable.accessNeedGroupDescription(snippetIri);
  expect(description).toBeInstanceOf(ReadableAccessNeedGroupDescription);
});

test('getters', async () => {
  const description = await factory.readable.accessNeedGroupDescription(snippetIri);
  const expectedAccessNeedGroupIri = 'https://projectron.example/access-needs#need-group-pm';
  expect(description.hasAccessNeedGroup).toBe(expectedAccessNeedGroupIri);
  const expectedLabel = 'Manage Projects';
  expect(description.label).toBe(expectedLabel);
  const expectedDefinition = 'Allow Projectron to read the Projects you select, and Task in those projects.';
  expect(description.definition).toBe(expectedDefinition);
});
