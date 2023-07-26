# Authorization Agent (service)

[![CI](https://github.com/janeirodigital/sai-impl-service/actions/workflows/ci.yml/badge.svg)](https://github.com/janeirodigital/sai-impl-service/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/janeirodigital/sai-impl-service/branch/main/graph/badge.svg?flag=service)](https://codecov.io/gh/janeirodigital/sai-impl-service/tree/main/packages/service)
[![Gitter chat](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/solid/data-interoperability-panel)
[![MIT license](https://img.shields.io/github/license/janeirodigital/sai-impl-service)](https://github.com/janeirodigital/sai-impl-service/blob/main/LICENSE)

[Solid Application Interoperability](https://solid.github.io/data-interoperability-panel/specification/) compliant Authorization Agent. It requires a compatible frontend (e.g. [SAI Authorization Agent Web](https://github.com/janeirodigital/sai-impl-web)).

## Stack

- [Components.js](https://componentsjs.readthedocs.io/en/latest/)
- [Handlers.js](https://github.com/digita-ai/handlersjs)
- [sai-js](https://github.com/janeirodigital/sai-js)
- [solid-notifications-client](https://github.com/o-development/solid-notifications-client)
- [web-push](https://www.npmjs.com/package/web-push)

## Features

### Messages based API

[api-messages](https://github.com/janeirodigital/sai-impl-service/tree/main/packages/api-messages)

Used by a compatible frontend for all the functionality driven by user interactions.

### Solid-OIDC

[Solid-OIDC](https://solidproject.org/TR/oidc) is currently the primary authentication method in the Solid ecosystem. The service uses [solid-client-authn-js](https://github.com/inrupt/solid-client-authn-js) when it acts as a client and [solid-oidc-token-verifier](https://github.com/CommunitySolidServer/access-token-verifier) when it acts as a resource server.
We recommend [Community Solid Server](https://communitysolidserver.github.io/CommunitySolidServer) as Solid-OIDC compliant provider (also available in [css-storage-fixture](https://github.com/janeirodigital/sai-impl-service/tree/main/packages/css-storage-fixture) package)

A compatible frontend also uses Solid-OIDC to authenticate with the service.

### Push Notifications

[Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) is used to send notifications to the front end. Currently, it's only being used when the initial [Access Receipt](https://solid.github.io/data-interoperability-panel/specification/#access-receipt) arrives from another social agent and the user gets prompted to create a [Social Agent Registration](https://solid.github.io/data-interoperability-panel/specification/#social-agent-registration) for them. Verifying the identity of that social peer is a high-priority next step on the SAI agenda.

### Solid Notifications (Webhook Subscription)

[Social Agents](https://solid.github.io/data-interoperability-panel/specification/#social-agents) create a [Social Agent Registration](https://solid.github.io/data-interoperability-panel/specification/#social-agent-registration) for each of their social peers and vice-versa. To stay up to date with changes to registration created by social peers, one's Authorization Agent service uses [Webhook Subscription Type](https://github.com/solid/notifications/blob/main/webhook-subscription-2021.md) for [Solid Notifications Protocol](https://solidproject.org/TR/notifications-protocol), specifically [solid-notifications-client](https://github.com/o-development/solid-notifications-client).

The webhook subscription still hasn't landed in CSS ([PR#1388 feat: notification webhooks](https://github.com/CommunitySolidServer/CommunitySolidServer/pull/1388))

A pair of reciprocal social agent registrations can be also used as a private channel for [Access Request](https://solid.github.io/data-interoperability-panel/specification/#access-request). Specifying and implementing it is a high-priority next step on the SAI agenda.

## Configuration

### Components.js

[Components.js](https://componentsjs.readthedocs.io/en/latest/) allows very flexible dependency injection. Currently, it is used for [Handlers.js](https://github.com/digita-ai/handlersjs) and the storage configuration (e.g. [@janeirodigital/solid-redis-token-storage](https://www.npmjs.com/package/@janeirodigital/solid-redis-token-storage))

### Environement variables

- CLIENT_NAME - used when acting as Solid-OIDC client
- FRONTEND_URL - compatible frontend (e.g. [SAI Authorization Agent Web](https://github.com/janeirodigital/sai-impl-web)).
- FRONTEND_AUTHORIZATION_URL - to be advertised as `interop:hasAuthorizationRedirectEndpoint`, apps will redirect to it providing their `client_id` in query parameters.
- VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, PUSH_NOTIFICATION_EMAIL - used by [web-push](https://www.npmjs.com/package/web-push) module to send Push Notifications to the frontend.
