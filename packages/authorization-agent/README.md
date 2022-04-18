# Authorization Agent

[![CI](https://github.com/janeirodigital/sai-js/actions/workflows/ci.yml/badge.svg)](https://github.com/janeirodigital/sai-js/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/janeirodigital/sai-js/branch/main/graph/badge.svg?flag=application)](https://codecov.io/gh/janeirodigital/sai-js/tree/codecov/packages/authorization-agent)
[![Gitter chat](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/solid/data-interoperability-panel)
[![npm version](https://badge.fury.io/js/%40janeirodigital%2Finterop-application.svg)](https://www.npmjs.com/package/@janeirodigital/interop-authorization-agent)
[![MIT license](https://img.shields.io/github/license/janeirodigital/sai-js)](https://github.com/janeirodigital/sai-js/blob/main/LICENSE)

## Early access

[Specifications](https://github.com/solid/data-interoperability-panel#solid-application-interoperability)
this library implements are still a work in progress. While we track changes
to the public API of this library with semver, the underlying data will be slightly changing
for the rest of 2021. We are commited to keep this implementation up to date.
If you plan to use your application in production please ask the specification editors
on the [public chatroom](https://gitter.im/solid/data-interoperability-panel)
about the stability of the data model.

## Service

An open-source implementation of a full service using this library is also available:
[sai-impl-service](https://github.com/janeirodigital/sai-impl-service/) (under active development)

## Creating Authorization Agent instance

Authorization Agent class provides a static `build` method to create instances.
It expects:

- `webId` - WebID of the user which this instance will be an authorization agent of.
- `agentId` - Unique IRI denoting this instance. The user will add it to their `WebID` and it will be used
  as `client_id` in Solid-OIDC
- dependencies
  - `fetch` - an authenticated fetch, for example [solid-client-authn-node](https://docs.inrupt.com/developer-tools/api/javascript/solid-client-authn-node/classes/Session.html#fetch)
  - `randomUUID()` - random UUID generator conforming to the [specification](https://wicg.github.io/uuid/)

```ts
import { randomUUID } from 'crypto';
import { getSessionFromStorage, Session } from '@inrupt/solid-client-authn-node';
import { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';

import { storage } from './oidc-storage';

const webId = 'https://alice.example/#id';
const agentId = 'https://authz.alice.example/';

// we assume that webId was used as sessionId the when session was created
const session = await getSessionFromStorage(webId, storage);

const agent = AuthorizationAgent.build(webId, clientId, {
  fetch: oidcSession.fetch,
  randomUUID
});
```

## Agent Registry

An instance of Authorization Agent provides a useful method for accessing agent registrations

### Application Registrations

`applicationRegistrations(): AsyncIterable<CRUDApplicationRegistration`
is an async iterable over all the application registrations

```ts
for await (const registration of agent.applicationRegistrations) {
  // do something with the application registration
}
```

`async findApplicationRegistration(iri: string): Promise<CRUDApplicationRegistration | undefined>`
finds an application registration based on `client_id`, if one exists

```ts
const clientId = 'https://projectron.example/#app';
const registration = await agent.findApplicationRegistration(clientId);
```

### Social Agent Registrations

`socialAgentRegistrations(): AsyncIterable<CRUDSocialAgentRegistration>`
is an async iterable over all the social agent registrations

```ts
for await (const registration of agent.socialAgentRegistrations) {
  // do something with the social agent registration
}
```

`findSocialAgentRegistration(iri: string): Promise<CRUDSocialAgentRegistration | undefined>`
finds a social registration based on `webid`, if one exists

```ts
const webId = 'https://alice.example/#id';
const registration = await agent.findSocialAgentRegistration(webId);
```

## Access Authorization

Creating Access Authorizations is the primary responsibility of an Authorization Agent.

`async recordAccessAuthorization(authorization: AccessAuthorizationStructure): Promise<ReadableAccessAuthorization>`

Since access authorization is immutable, it is required to create a new one to replace the old one.

```ts
type AccessAuthorizationStructure = {
  grantee: string; // webid or clientid
  hasAccessNeedGroup: string; // iri
  dataAuthorizations: DataAuthorizationData[];
};
```

```ts
type DataAuthorizationData = {
  grantee: string; // webid or clientid
  registeredShapeTree: string;
  scopeOfAuthorization: string;
  accessMode: string[];
  dataOwner?: string; // webid
  hasDataRegistration?: string;
  inheritsFromAuthorization?: string;
  creatorAccessMode?: string[];
  hasDataInstance?: string[];
};
```

## Access Grant

Based on existing Access Authorization an Access Grant can be created

`async generateAccessGrant(accessAuthorizationIri: string): Promise<void>`

This method updates the appropriate agent registration to reference the newly created access grant.

```ts
const authorizationData: AccessAuthorizationStructure = {
  /* all the data */
};
const authorization = await agent.recordAccessAuthorization(authorizationData);
await agent.generateAccessGrant(authorization.iri);
```
