<div align="center">
  <h1>@kubb/plugin-ts</h1>
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img width="180" src="https://raw.githubusercontent.com/kubb-labs/kubb/main/assets/logo.png" alt="Kubb logo">
  </a>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Coverage][coverage-src]][coverage-href]
[![License][license-src]][license-href]
[![Sponsors][sponsors-src]][sponsors-href]

<h4>
<a href="https://codesandbox.io/s/github/kubb-labs/plugins/tree/main/examples/typescript" target="_blank">View Demo</a>
<span> · </span>
<a href="https://kubb.dev/plugins/ts" target="_blank">Documentation</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Report Bug</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Request Feature</a>
</h4>
</div>

`@kubb/plugin-ts` generates TypeScript types from your OpenAPI specification. It produces interfaces, enums, union types, and string literals that other Kubb plugins import and build on.

## Features

- Generates interfaces, enums, union types, and string literals from OpenAPI schemas
- Other plugins — `@kubb/plugin-client`, `@kubb/plugin-zod`, and the query plugins — import from its output
- Supports strict typing mode for required vs optional fields
- Controls output organization by tag, operation, or a custom grouping

## Installation

```bash
bun add @kubb/plugin-ts
# or
pnpm add @kubb/plugin-ts
# or
npm install @kubb/plugin-ts
```

## Documentation

See the [full documentation](https://kubb.dev/plugins/ts) for configuration options and examples.

## Supporting Kubb

Kubb is an MIT-licensed open source project with its ongoing development made possible entirely by the support of Sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/stijnvanhulle)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
  </a>
</p>

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@kubb/plugin-ts?flat&colorA=18181B&colorB=f58517
[npm-version-href]: https://npmjs.com/package/@kubb/plugin-ts
[npm-downloads-src]: https://img.shields.io/npm/dm/@kubb/plugin-ts?flat&colorA=18181B&colorB=f58517
[npm-downloads-href]: https://npmjs.com/package/@kubb/plugin-ts
[license-src]: https://img.shields.io/github/license/kubb-labs/kubb.svg?flat&colorA=18181B&colorB=f58517
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[build-src]: https://img.shields.io/github/actions/workflow/status/kubb-labs/kubb/ci.yaml?style=flat&colorA=18181B&colorB=f58517
[build-href]: https://www.npmjs.com/package/@kubb/plugin-ts
[minified-src]: https://img.shields.io/bundlephobia/min/@kubb/plugin-ts?style=flat&colorA=18181B&colorB=f58517
[minified-href]: https://www.npmjs.com/package/@kubb/plugin-ts
[coverage-src]: https://img.shields.io/codecov/c/github/kubb-labs/kubb?style=flat&colorA=18181B&colorB=f58517
[coverage-href]: https://www.npmjs.com/package/@kubb/plugin-ts
[sponsors-src]: https://img.shields.io/github/sponsors/stijnvanhulle?style=flat&colorA=18181B&colorB=f58517
[sponsors-href]: https://github.com/sponsors/stijnvanhulle/
