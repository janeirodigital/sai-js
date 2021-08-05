# Solid Application Interoperability (TypeScript)

[![CI](https://github.com/janeirodigital/sai-js/actions/workflows/ci.yml/badge.svg)](https://github.com/janeirodigital/sai-js/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/janeirodigital/sai-js/branch/main/graph/badge.svg)](https://codecov.io/gh/janeirodigital/sai-js/tree/main)
[![Gitter chat](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/solid/data-interoperability-panel)
[![MIT license](https://img.shields.io/github/license/janeirodigital/sai-js)](https://github.com/janeirodigital/sai-js/blob/main/LICENSE)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fjaneirodigital%2Fsai-js.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fjaneirodigital%2Fsai-js?ref=badge_shield)

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

- Solid Applications
- Solid Authorization Agent

## Current dependencies

- [N3.js](https://github.com/rdfjs/N3.js)
- [typescript-memoize](https://github.com/darrylhodgins/typescript-memoize)

## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fjaneirodigital%2Fsai-js.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fjaneirodigital%2Fsai-js?ref=badge_large)
