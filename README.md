# Solid Application Interoperability (TypeScript)

[![CI](https://github.com/janeirodigital/sai-js/actions/workflows/ci.yml/badge.svg)](https://github.com/janeirodigital/sai-js/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/janeirodigital/sai-js/branch/main/graph/badge.svg)](https://codecov.io/gh/janeirodigital/sai-js/tree/main)
[![Gitter chat](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/solid/data-interoperability-panel)
[![MIT license](https://img.shields.io/github/license/janeirodigital/sai-js)](https://github.com/janeirodigital/sai-js/blob/main/LICENSE)

Modules implementing [Solid Application Interoperability Specification](https://solid.github.io/data-interoperability-panel/specification/)

## Development

Requires node.js 18 or higher. ([Volta](https://volta.sh/) may help with managing node versions)

### Github packages

- generate [github token](https://github.com/settings/tokens) ( only `packages:read` scope)
- Modify `~/.npmrc` ([per-user config file](https://docs.npmjs.com/cli/v7/configuring-npm/npmrc#per-user-config-file))
  and add line `//npm.pkg.github.com/:_authToken=` and the generated token.

### Bootstrapping

```bash
yarn install
npx lerna bootstrap
npx lerna run build
npx lerna run test
```

## Intended dependents

|                           | package                                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Solid Applications        | [`@janeirodigital/interop-application`](https://github.com/janeirodigital/sai-js/tree/main/packages/application)                 |
| Solid Authorization Agent | [`@janeirodigital/interop-authorization-agent`](https://github.com/janeirodigital/sai-js/tree/main/packages/authorization-agent) |

## Demo setup

Install node and yarn with [Volta](https://volta.sh/)

```bash
volta install node@16
volta install node@18
volta install yarn@1
```

Create workspace directory and enter it

```bash
mkdir sai
cd sai
```

Clone repositories

```bash
git clone https://github.com/janeirodigital/sai-js.git
git clone https://github.com/janeirodigital/sai-impl-web.git
git clone https://github.com/hackers4peace/projectron.git
```

Run Redis with docker.
It is recommended to delete and recreate _sai-redis_ container before each working session. It prevents problems with expired OIDC tokens.

```bash
docker run --name sai-redis -p 6379:6379 -d redis
```

[Add github packages](#github-packages) and [Bootstrap sai-js monorepo](#bootstrapping)

Run Community Solid Server, by default it will run on `localhost:3000`

```bash
cd sai-js/packages/css-storage-fixture
yarn start
```

Run Authorization Agent Service, by default it will run on `localhost:4000`
It is recommended to restart it any time generated authorization data gets manually discarded or deleted.

```bash
cd sai-js/packages/service
yarn start
```

Run Authorization Agent Web frontend, by default it will run on `localhost:4200`

```bash
cd sai-impl-web
yarn install
yarn start
```

Open http://localhost:4200, Log in using default provider and with `alice@example.org` & `password`.
Connect to server.

Run Projectron demo application, by default it will run on `localhost:4100`

```bash
cd projectron
yarn install
yarn start
```

Open http://localhost:4100, Log in using default provider and request authorization.
