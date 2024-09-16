# Solid Application Interoperability (TypeScript)

[![CI](https://github.com/janeirodigital/sai-js/actions/workflows/ci.yml/badge.svg)](https://github.com/janeirodigital/sai-js/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/janeirodigital/sai-js/branch/main/graph/badge.svg)](https://codecov.io/gh/janeirodigital/sai-js/tree/main)
[![Matrix chat](https://badges.gitter.im/gitterHQ/gitter.png)](https://app.gitter.im/#/room/#solid_specification:gitter.im)
[![MIT license](https://img.shields.io/github/license/janeirodigital/sai-js)](https://github.com/janeirodigital/sai-js/blob/main/LICENSE)

Modules implementing [Solid Application Interoperability Specification](https://solid.github.io/data-interoperability-panel/specification/)

## Intended dependents

|                           | package                                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Solid Applications        | [`@janeirodigital/interop-application`](https://github.com/janeirodigital/sai-js/tree/main/packages/application)                 |
| Solid Authorization Agent | [`@janeirodigital/interop-authorization-agent`](https://github.com/janeirodigital/sai-js/tree/main/packages/authorization-agent) |

## Development

### Docker Shared Services

Default setup assumes `docker` command available, and runs it as non-root user.
Also [mkcert](https://mkcert.dev/) is required.

The setup is using modified `Makefile` and `docker-compose.yaml` from [docker-shared-services](https://github.com/wayofdev/docker-shared-services)

### Node, corepack and pnpm

Requires node.js 22 or higher with corepack
Uses pnpm as package manager.

```bash
corepack prepare pnpm@latest --activate
corepack enable pnpm
```

### Github packages

- generate a [classic github token](https://github.com/settings/tokens/new) (tick only `read:packages` scope)
- Modify `~/.npmrc` ([per-user config file](https://docs.npmjs.com/cli/v7/configuring-npm/npmrc#per-user-config-file))
  and add line `//npm.pkg.github.com/:_authToken=` and the generated token.

### Local DNS

#### macOS

```bash
mkdir /etc/resolver/
sudo sh -c 'echo "nameserver 127.0.0.1" > /etc/resolver/docker'
sudo dscacheutil -flushcache
```

If port 53 is occupied, go to docker and uncheck settings -> resources -> network -> Use kernel networking for UDP

To enable communication to docker network

```bash
# Install via Homebrew
$ brew install chipmk/tap/docker-mac-net-connect

# Run the service and register it to launch at boot
$ sudo brew services start chipmk/tap/docker-mac-net-connect
```

### Bootstrapping

```bash
pnpm install
pnpm build
pnpm test
```

To create local certificates

```bash
make cert-install
```

To start local development

```bash
make up
```

It will run the following:

#### Community Solid Server

Run from [packages/css-solid-fixture](https://github.com/janeirodigital/sai-js/tree/main/packages/css-storage-fixture).
Used for solid storage instances and solid-oidc provider.

Available on https://pod.docker, default demo account is `alice@acme.example` with `password`.

#### Authorization Agent

##### Service

Run from [packages/service](https://github.com/janeirodigital/sai-js/tree/main/packages/service).
Available on https://sai.docker (API only)

##### UI

Run from [ui/authorization](https://github.com/janeirodigital/sai-js/tree/main/ui/authorization).
Available on https://ui.sai.docker , requires signing up with UI first and later signing up in with the service (_Connect server_).
Dev config uses local CSS as default provider when input left empty.

#### Demo app (Vujectron)

Run from [examples/vuejectron](https://github.com/janeirodigital/sai-js/tree/main/examples/vuejectron).
Available on https://vuejectron.docker , requires signup and authorization.
Dev config uses local CSS as default provider when input left empty.

## Localization

The translation project for all relevant components is hosted thanks to the courtesy of [Weblate Libre hosting](https://weblate.org/en/hosting/#libre).

[<img src="https://hosted.weblate.org/widget/sai/open-graph.png" alt="Translation status" width="40%" />](https://hosted.weblate.org/engage/sai/)

## Funding

This project is funded through the [NGI Zero Entrust Fund](https://nlnet.nl/entrust), a fund established by [NLnet](https://nlnet.nl) with financial support from the European Commission's [Next Generation Internet](https://ngi.eu) program. Learn more at the [NLnet project page](https://nlnet.nl/project/SolidInterop3).

[<img src="https://nlnet.nl/logo/banner.png" alt="NLnet foundation logo" height="100px" style="margin-right: 50px" />](https://nlnet.nl)
[<img src="https://nlnet.nl/image/logos/NGI0Entrust_tag.svg" alt="NGI Zero Entrust Logo" height="100px"/>](https://nlnet.nl/entrust)
