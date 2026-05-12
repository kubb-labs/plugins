<div align="center">
  <h1>@kubb/plugin-client</h1>
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img width="180" src="https://raw.githubusercontent.com/kubb-labs/kubb/main/assets/logo.png" alt="Kubb logo">
  </a>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Coverage][coverage-src]][coverage-href]
[![License][license-src]][license-href]
[![Sponsors][sponsors-src]][sponsors-href]

<h4>
<a href="https://codesandbox.io/s/github/kubb-labs/plugins/tree/main/examples/sdk" target="_blank">View SDK Demo</a>
<span> · </span>
<a href="https://codesandbox.io/s/github/kubb-labs/plugins/tree/main/examples/client" target="_blank">View Client Demo</a>
<span> · </span>
<a href="https://kubb.dev/plugins/client" target="_blank">Documentation</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Report Bug</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Request Feature</a>
</h4>
</div>

`@kubb/plugin-client` generates HTTP clients from your OpenAPI specification. It supports Axios, Fetch, and custom adapters, with request and response types inferred directly from the spec.

## Features

- Supports Axios, Fetch, and custom HTTP adapters
- Infers request params, request body, and response types from the spec
- Works with `@kubb/plugin-ts` and `@kubb/plugin-zod`

## Installation

```bash
bun add @kubb/plugin-client
# or
pnpm add @kubb/plugin-client
# or
npm install @kubb/plugin-client
```

## Documentation

See the [full documentation](https://kubb.dev/plugins/client) for configuration options and examples.

## Supporting Kubb

Kubb is an MIT-licensed open source project with its ongoing development made possible entirely by the support of Sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/stijnvanhulle)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
  </a>
</p>

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@kubb/plugin-client?flat&colorA=18181B&colorB=f58517
[npm-version-href]: https://npmjs.com/package/@kubb/plugin-client
[npm-downloads-src]: https://img.shields.io/npm/dm/@kubb/plugin-client?flat&colorA=18181B&colorB=f58517
[npm-downloads-href]: https://npmjs.com/package/@kubb/plugin-client
[license-src]: https://img.shields.io/github/license/kubb-labs/kubb.svg?flat&colorA=18181B&colorB=f58517
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[build-src]: https://img.shields.io/github/actions/workflow/status/kubb-labs/kubb/ci.yaml?style=flat&colorA=18181B&colorB=f58517
[build-href]: https://www.npmjs.com/package/@kubb/plugin-client
[minified-src]: https://img.shields.io/bundlephobia/min/@kubb/plugin-client?style=flat&colorA=18181B&colorB=f58517
[minified-href]: https://www.npmjs.com/package/@kubb/plugin-client
[coverage-src]: https://img.shields.io/codecov/c/github/kubb-labs/kubb?style=flat&colorA=18181B&colorB=f58517
[coverage-href]: https://www.npmjs.com/package/@kubb/plugin-client
[sponsors-src]: https://img.shields.io/github/sponsors/stijnvanhulle?style=flat&colorA=18181B&colorB=f58517
[sponsors-href]: https://github.com/sponsors/stijnvanhulle/
