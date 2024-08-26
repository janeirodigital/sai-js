import repl from 'node:repl';
import { init } from '@paralleldrive/cuid2';
import type { CRUDRegistrySet, CRUDRegistrySetData } from '@janeirodigital/interop-data-model';
import { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';

import { SolidTestUtils } from './src/solid-test-utils';
import * as accounts from './src/accounts';
import type { Account } from './src/accounts';
import { host } from './src/config';

global.shapeTrees = {
  Gadget: `${host}/solid/trees/Gadget`,
  Widget: `${host}/solid/trees/Widget`
};

global.cuid = init({ length: 6 });

global.bootstrapAccount = async function bootstrapAccount(
  account: Account,
  session: AuthorizationAgent
): Promise<CRUDRegistrySet> {
  const uriForContained = function uriForContained(containerId: string, container = false): string {
    const id = containerId + global.cuid();
    return container ? id + '/' : id;
  };

  // create Agent Registry
  const agentRegistryId = uriForContained(account.auth, true);
  const agentRegistry = await session.factory.crud.agentRegistry(agentRegistryId, {});
  await agentRegistry.create();

  // create Authorization Registry
  const authorizationRegistryId = uriForContained(account.auth, true);
  const authorizationRegistry = await session.factory.crud.authorizationRegistry(authorizationRegistryId, {});
  await authorizationRegistry.create();

  const registrySetData: CRUDRegistrySetData = {
    hasAgentRegistry: agentRegistry.iri,
    hasAuthorizationRegistry: authorizationRegistry.iri,
    hasDataRegistry: []
  };

  // create Data registries
  for (const resourceServer of Object.values(account.data)) {
    const dataRegistryId = uriForContained(resourceServer, true);
    const dataRegistry = await session.factory.crud.dataRegistry(dataRegistryId, {});
    await dataRegistry.create();
    registrySetData.hasDataRegistry.push(dataRegistry.iri);
  }

  const registrySetId = uriForContained(account.auth);
  const registrySet = await session.factory.crud.registrySet(registrySetId, registrySetData);
  await registrySet.update();

  return registrySet;
};

global.buildSession = async function buildSession(account: Account): Promise<AuthorizationAgent> {
  const stu = new SolidTestUtils(account);
  await stu.beforeAll();
  return await AuthorizationAgent.build(
    account.webId,
    `https://auth.example/${account.shortName}`,
    {
      fetch: stu.authFetch,
      randomUUID: global.cuid
    },
    account.registrySet
  );
};

global.accounts = accounts;

repl.start('-> ');
