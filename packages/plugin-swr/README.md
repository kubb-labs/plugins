<div align="center">
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img src="https://kubb.dev/og.png" alt="Kubb banner">
  </a>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Coverage][coverage-src]][coverage-href]
[![License][license-src]][license-href]
[![Sponsors][sponsors-src]][sponsors-href]

<h4>
<a href="https://kubb.dev/plugins/swr" target="_blank">Documentation</a>
<span> · </span>
<a href="https://github.com/kubb-labs/plugins/issues/" target="_blank">Report Bug</a>
<span> · </span>
<a href="https://github.com/kubb-labs/plugins/issues/" target="_blank">Request Feature</a>
</h4>
</div>

<br />

# @kubb/plugin-swr

### Generate SWR hooks from OpenAPI

`@kubb/plugin-swr` generates SWR hooks from your OpenAPI specification. Each operation becomes a typed `useSWR` or `useSWRMutation` hook.

## Installation

```bash
bun add @kubb/plugin-swr
# or
pnpm add @kubb/plugin-swr
# or
npm install @kubb/plugin-swr
```

## Documentation

See the [full documentation](https://kubb.dev/plugins/swr) for configuration options and examples.

## Supporting Kubb

Kubb is an open source project, and its development is funded entirely by sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/stijnvanhulle)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
  </a>
</p>

## License

[MIT](https://github.com/kubb-labs/plugins/blob/main/LICENSE)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@kubb/plugin-swr?style=flat&colorA=18181B&colorB=f58517
[npm-version-href]: https://npmjs.com/package/@kubb/plugin-swr
[npm-downloads-src]: https://img.shields.io/npm/dm/@kubb/plugin-swr?style=flat&colorA=18181B&colorB=f58517
[npm-downloads-href]: https://npmjs.com/package/@kubb/plugin-swr
[coverage-src]: https://qlty.sh/badges/8959bd5b-d8a3-4811-8762-3a8be3bd2c34/test_coverage.svg
[coverage-href]: https://qlty.sh/gh/kubb-labs/projects/plugins
[license-src]: https://img.shields.io/github/license/kubb-labs/plugins.svg?style=flat&colorA=18181B&colorB=f58517
[license-href]: https://github.com/kubb-labs/plugins/blob/main/LICENSE
[sponsors-src]: https://img.shields.io/github/sponsors/stijnvanhulle?style=flat&colorA=18181B&colorB=f58517
[sponsors-href]: https://github.com/sponsors/stijnvanhulle
