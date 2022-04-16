# Solid Application Interoperability (TypeScript)

[![CI](https://github.com/janeirodigital/sai-js/actions/workflows/ci.yml/badge.svg)](https://github.com/janeirodigital/sai-js/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/janeirodigital/sai-js/branch/main/graph/badge.svg)](https://codecov.io/gh/janeirodigital/sai-js/tree/main)
[![Gitter chat](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/solid/data-interoperability-panel)
[![MIT license](https://img.shields.io/github/license/janeirodigital/sai-js)](https://github.com/janeirodigital/sai-js/blob/main/LICENSE)

Modules implementing [Solid Application Interoperability Specification](https://solid.github.io/data-interoperability-panel/specification/)

## Development

Requires node.js 15.6.0 or higher. ([Volta](https://volta.sh/) may help with managing node versions)

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

## Current dependencies

- [N3.js](https://github.com/rdfjs/N3.js)
- [typescript-memoize](https://github.com/darrylhodgins/typescript-memoize)
- [http-link-header](https://github.com/jhermsmeier/node-http-link-header)
