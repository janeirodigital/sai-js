# Solid Application Interoperability (TypeScript)

[![CI](https://github.com/janeirodigital/sai-js/actions/workflows/ci.yml/badge.svg)](https://github.com/janeirodigital/sai-js/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/janeirodigital/sai-js/branch/main/graph/badge.svg)](https://codecov.io/gh/janeirodigital/sai-js/tree/main)
[![Gitter chat](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/solid/data-interoperability-panel)
[![MIT license](https://img.shields.io/github/license/janeirodigital/sai-js)](https://github.com/janeirodigital/sai-js/blob/main/LICENSE)

Modules implementing [Solid Application Interoperability Specification](https://solid.github.io/data-interoperability-panel/specification/)

## Intended dependents

|                           | package                                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Solid Applications        | [`@janeirodigital/interop-application`](https://github.com/janeirodigital/sai-js/tree/main/packages/application)                 |
| Solid Authorization Agent | [`@janeirodigital/interop-authorization-agent`](https://github.com/janeirodigital/sai-js/tree/main/packages/authorization-agent) |

## Development

### Docker

Default setup assumes `docker` command available, and runs it as non-root user.
It only uses [official redis image](https://hub.docker.com/_/redis) for the authorization agent service.

### Node, corepack and pnpm

Requires node.js 20 or higher with corepack ([Volta](https://volta.sh/) may help with managing node versions).
Uses pnpm as package manager.

```bash
volta install node@20
volta install corepack
corepack prepare pnpm@latest --activate
```

### Github packages

- generate [github token](https://github.com/settings/tokens) ( only `packages:read` scope)
- Modify `~/.npmrc` ([per-user config file](https://docs.npmjs.com/cli/v7/configuring-npm/npmrc#per-user-config-file))
  and add line `//npm.pkg.github.com/:_authToken=` and the generated token.

### Bootstrapping

```bash
pnpm install
pnpx turbo run build
pnpx turbo run test
pnpx turbo run dev
```

It will run following:

#### Community Solid Server

Run from [packages/css-solid-fixture](https://github.com/janeirodigital/sai-js/tree/main/packages/css-storage-fixture).
Used for solid storage instances and solid-oidc provider.

Available on http://localhost:3000, default demo account is `alice@example.org` with `password`.

#### Authorization Agent

##### Service

Run from [packages/service](https://github.com/janeirodigital/sai-js/tree/main/packages/service).
Available on http://localhost:4000 (API only)

##### UI

Run from [ui/authorization](https://github.com/janeirodigital/sai-js/tree/main/ui/authorization).
Available on http://localhost:4200 , requires signing up with UI first and later signing up in with the service (_Connect server_).
Dev config uses local CSS as default provider when input left empty.

#### Demo app (Vujectron)

Run from [examples/vuejectron](https://github.com/janeirodigital/sai-js/tree/main/examples/vuejectron).
Available on http://localhost:4500 , requires signup and authorization.
Dev config uses local CSS as default provider when input left empty.
