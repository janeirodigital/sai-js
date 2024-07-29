import { randomUUID } from 'crypto';
import { vi, describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { SolidTestUtils } from '@janeirodigital/css-test-utils';
import { statelessFetch } from '@janeirodigital/interop-test-utils';
import { ReadableApplicationRegistration, DataOwner } from '@janeirodigital/interop-data-model';
import { RdfResponse } from '@janeirodigital/interop-utils';
import * as utils from '@janeirodigital/interop-utils';

import { Application } from '../src';

vi.setConfig({ testTimeout: 200_000, hookTimeout: 200_000 });

const aliceWebId = 'http://localhost:3000/alice/profile/card#me';
const stu = new SolidTestUtils(aliceWebId, 'alice@acme.example', 'password');
beforeAll(async () => stu.beforeAll());
afterAll(async () => stu.afterAll());

const webId = 'https://alice.example/#id';
const applicationId = 'https://projectron.example/';

const linkString = `
  <https://projectron.example/#app>;
  anchor="https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659";
  rel="http://www.w3.org/ns/solid/interop#registeredAgent"
`;

describe('applicatrion registration exists', () => {
  const mocked = vi.fn(statelessFetch);
  const responseMock = {
    ok: true,
    headers: { get: (name: string): string | null => (name === 'Link' ? linkString : null) }
  } as unknown as RdfResponse;
  responseMock.clone = () => ({ ...responseMock });

  test('should build application registration if discovered', async () => {
    mocked.mockResolvedValueOnce(await statelessFetch(webId)).mockResolvedValueOnce(responseMock);
    const app = await Application.build(webId, applicationId, { fetch: mocked, randomUUID });
    expect(app.hasApplicationRegistration).toBeInstanceOf(ReadableApplicationRegistration);
  });

  test('should have dataOwners getter', async () => {
    mocked.mockResolvedValueOnce(await statelessFetch(webId)).mockResolvedValueOnce(responseMock);
    const app = await Application.build(webId, applicationId, { fetch: mocked, randomUUID });
    expect(app.dataOwners).toHaveLength(3);
    for (const owner of app.dataOwners) {
      expect(owner).toBeInstanceOf(DataOwner);
    }
  });
});
describe('discovery helpers', () => {
  const expectedRedirectUriBase = 'https://auth.example/authorize';
  const mocked = vi.fn(statelessFetch);
  const responseMock = { ok: true, headers: { get: (): null => null } } as unknown as RdfResponse;
  responseMock.clone = () => ({ ...responseMock });

  test('should not build appliction registration if not discovered', async () => {
    mocked.mockResolvedValueOnce(await statelessFetch(webId)).mockResolvedValueOnce(responseMock);
    const app = await Application.build(webId, applicationId, { fetch: mocked, randomUUID });
    expect(app.hasApplicationRegistration).toBeUndefined();
  });

  test('should have authorizationRedirectEndpoint discovered', async () => {
    mocked.mockResolvedValueOnce(await statelessFetch(webId)).mockResolvedValueOnce(responseMock);
    const app = await Application.build(webId, applicationId, { fetch: mocked, randomUUID });
    expect(app.authorizationRedirectEndpoint).toBe(expectedRedirectUriBase);
  });

  test('should have correct authorizationRedirectUri', async () => {
    mocked.mockResolvedValueOnce(await statelessFetch(webId)).mockResolvedValueOnce(responseMock);
    const app = await Application.build(webId, applicationId, { fetch: mocked, randomUUID });
    expect(app.authorizationRedirectUri).toBe(
      `${expectedRedirectUriBase}?client_id=${encodeURIComponent(applicationId)}`
    );
  });

  test('should have dataOwners getter returning an empty array', async () => {
    mocked.mockResolvedValueOnce(await statelessFetch(webId)).mockResolvedValueOnce(responseMock);
    const app = await Application.build(webId, applicationId, { fetch: mocked, randomUUID });
    expect(app.dataOwners).toHaveLength(0);
  });

  // TODO: refactor to be independent from order of query parameters
  test('should provide shareUri', async () => {
    mocked.mockResolvedValueOnce(await statelessFetch(webId)).mockResolvedValueOnce(responseMock);
    const app = await Application.build(webId, applicationId, { fetch: mocked, randomUUID });
    const resourceUri = 'some-resource-uri';
    const shareUri = app.getShareUri(resourceUri);
    expect(shareUri).toBe(
      `${expectedRedirectUriBase}?resource=${encodeURIComponent(resourceUri)}&client_id=${encodeURIComponent(
        applicationId
      )}`
    );
  });
});

describe('describe discovery', () => {
  const responseMock = {
    ok: true,
    headers: { get: (name: string): string | null => (name === 'Link' ? linkString : null) }
  } as unknown as RdfResponse;
  responseMock.clone = () => ({ ...responseMock });

  beforeEach(() => {
    vi.spyOn(utils, 'discoverAgentRegistration').mockResolvedValueOnce(
      'http://localhost:3000/alice/agentRegistry/vuejectron/'
    );
    vi.spyOn(utils, 'discoverAuthorizationRedirectEndpoint').mockResolvedValueOnce('http://localhost:4000/TODO');
    vi.spyOn(utils, 'discoverWebPushService').mockResolvedValueOnce({
      id: 'http://localhost:4000/TODO',
      vapidPublicKey: 'TODO'
    });
  });

  describe('resourceOwners', () => {
    test('should return set of owenrs', async () => {
      const resourceOwners = new Set([
        'http://localhost:3000/acme/profile/card#me',
        'http://localhost:3000/alice/profile/card#me'
      ]);
      const app = await Application.build(aliceWebId, applicationId, { fetch: stu.authFetch, randomUUID });
      expect(app.resourceOwners()).toEqual(resourceOwners);
    });
  });

  describe('resourceServers', () => {
    test('should return set of resource servers', async () => {
      const scope = 'http://localhost:3000/shapetrees/trees/Project';
      const resourceServers = new Set(['http://localhost:3000/alice-home/', 'http://localhost:3000/alice-work/']);
      const app = await Application.build(aliceWebId, applicationId, { fetch: stu.authFetch, randomUUID });
      expect(app.resourceServers(aliceWebId, scope)).toEqual(resourceServers);
    });
  });

  describe('resources', () => {
    test('should return set of resource ids', async () => {
      const resourceServer = 'http://localhost:3000/alice-home/';
      const scope = 'http://localhost:3000/shapetrees/trees/Project';
      const resources = new Set([
        'http://localhost:3000/alice-home/dataRegistry/projects/project-1',
        'http://localhost:3000/alice-home/dataRegistry/projects/project-2'
      ]);
      const app = await Application.build(aliceWebId, applicationId, { fetch: stu.authFetch, randomUUID });
      expect(await app.resources(resourceServer, scope)).toEqual(resources);
    });
  });

  describe('childInfo', () => {
    test('should return info for a child resource', async () => {
      const id = 'http://localhost:3000/alice-home/dataRegistry/tasks/task-1';
      const parent = 'http://localhost:3000/alice-home/dataRegistry/projects/project-1';
      const scope = 'http://localhost:3000/shapetrees/trees/Task';
      const parentScope = 'http://localhost:3000/shapetrees/trees/Project';
      const resourceServer = 'http://localhost:3000/alice-home/';
      const info = {
        id,
        scope,
        resourceServer,
        parent
      };
      const app = await Application.build(aliceWebId, applicationId, { fetch: stu.authFetch, randomUUID });

      // populate parentMap
      await app.resources(resourceServer, parentScope);

      expect(await app.childInfo(id, scope, parent)).toEqual(info);
    });
  });

  describe('setChildInfo', () => {
    test('should set child info in the childMap', async () => {
      const id = 'http://localhost:3000/alice-home/dataRegistry/tasks/task-1';
      const parent = 'http://localhost:3000/alice-home/dataRegistry/projects/project-1';
      const scope = 'http://localhost:3000/shapetrees/trees/Task';
      const parentScope = 'http://localhost:3000/shapetrees/trees/Project';
      const resourceServer = 'http://localhost:3000/alice-home/';
      const info = {
        id,
        scope,
        resourceServer,
        parent
      };
      const app = await Application.build(aliceWebId, applicationId, { fetch: stu.authFetch, randomUUID });

      // populate parentMap
      await app.resources(resourceServer, parentScope);

      // set child info
      await app.setChildInfo(id, scope, parent);

      // @ts-expect-error
      expect(app.getInfo(id)).toEqual(info);
    });
  });

  describe('canCreate', () => {
    test('should check if can create new resources in the scope', async () => {
      const resourceServer = 'http://localhost:3000/alice-home/';
      const scope = 'http://localhost:3000/shapetrees/trees/Project';
      const app = await Application.build(aliceWebId, applicationId, { fetch: stu.authFetch, randomUUID });
      expect(await app.canCreate(resourceServer, scope)).toEqual(true);
    });
  });

  describe('canCreateChild', () => {
    test('should check if can create a new child for a resource', async () => {
      const parent = 'http://localhost:3000/alice-home/dataRegistry/projects/project-1';
      const parentScope = 'http://localhost:3000/shapetrees/trees/Project';
      const scope = 'http://localhost:3000/shapetrees/trees/Task';
      const resourceServer = 'http://localhost:3000/alice-home/';
      const app = await Application.build(aliceWebId, applicationId, { fetch: stu.authFetch, randomUUID });

      // populate parentMap
      await app.resources(resourceServer, parentScope);

      expect(app.canCreateChild(parent, scope)).toBe(true);
    });
  });

  describe('canUpdate', () => {
    test('should check if can update the resource', async () => {
      const id = 'http://localhost:3000/alice-home/dataRegistry/projects/project-1';
      const resourceServer = 'http://localhost:3000/alice-home/';
      const scope = 'http://localhost:3000/shapetrees/trees/Project';
      const app = await Application.build(aliceWebId, applicationId, { fetch: stu.authFetch, randomUUID });

      // populate parentMap
      await app.resources(resourceServer, scope);

      expect(await app.canUpdate(id)).toEqual(true);
    });
  });

  describe('canDelete', () => {
    test('should check if can delete the resource', async () => {
      const id = 'http://localhost:3000/alice-home/dataRegistry/projects/project-1';
      const resourceServer = 'http://localhost:3000/alice-home/';
      const scope = 'http://localhost:3000/shapetrees/trees/Project';
      const app = await Application.build(aliceWebId, applicationId, { fetch: stu.authFetch, randomUUID });

      // populate parentMap
      await app.resources(resourceServer, scope);

      expect(await app.canDelete(id)).toEqual(true);
    });
  });

  describe('iriForNew', () => {
    test('should mint correct id for new resource', async () => {
      const resourceServer = 'http://localhost:3000/alice-home/';
      const scope = 'http://localhost:3000/shapetrees/trees/Project';
      const app = await Application.build(aliceWebId, applicationId, { fetch: stu.authFetch, randomUUID });
      expect(await app.iriForNew(resourceServer, scope)).toMatch(
        'http://localhost:3000/alice-home/dataRegistry/projects/'
      );
    });
  });

  describe('iriForChild', () => {
    test('should mint correct id for new child for a resource', async () => {
      const parent = 'http://localhost:3000/alice-home/dataRegistry/projects/project-1';
      const parentScope = 'http://localhost:3000/shapetrees/trees/Project';
      const scope = 'http://localhost:3000/shapetrees/trees/Task';
      const resourceServer = 'http://localhost:3000/alice-home/';
      const app = await Application.build(aliceWebId, applicationId, { fetch: stu.authFetch, randomUUID });

      // populate parentMap
      await app.resources(resourceServer, parentScope);

      expect(await app.iriForChild(parent, scope)).toMatch('http://localhost:3000/alice-home/dataRegistry/tasks/');
    });
  });

  describe('findParent', () => {
    test('should find parent resource given a child resource', async () => {
      const id = 'http://localhost:3000/alice-home/dataRegistry/tasks/task-1';
      const parent = 'http://localhost:3000/alice-home/dataRegistry/projects/project-1';
      const scope = 'http://localhost:3000/shapetrees/trees/Task';
      const parentScope = 'http://localhost:3000/shapetrees/trees/Project';
      const resourceServer = 'http://localhost:3000/alice-home/';
      const app = await Application.build(aliceWebId, applicationId, { fetch: stu.authFetch, randomUUID });

      // populate parentMap
      await app.resources(resourceServer, parentScope);

      // set child info
      await app.setChildInfo(id, scope, parent);

      expect(app.findParent(id)).toEqual(parent);
    });
  });

  describe('discoverDescription', () => {
    test('should find auxiliary description resource', async () => {
      const id = 'http://localhost:3000/alice-work/dataRegistry/images/cat';
      const app = await Application.build(aliceWebId, applicationId, { fetch: stu.authFetch, randomUUID });
      expect(await app.discoverDescription(id)).toEqual(
        'http://localhost:3000/alice-work/dataRegistry/images/cat.meta'
      );
    });
  });
});
