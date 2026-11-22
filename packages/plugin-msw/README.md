<div align="center">
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img src="https://kubb.dev/og.png" alt="Kubb banner">
  </a>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Stars][stars-src]][stars-href]
[![License][license-src]][license-href]
[![Node][node-src]][node-href]

<h4>
<a href="https://kubb.dev/extensions/kubb-labs/plugin-msw" target="_blank">Documentation</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Report Bug</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Request Feature</a>
</h4>
</div>

<br />

# @kubb/plugin-msw

### Generate MSW request handlers with Kubb

`@kubb/plugin-msw` generates Mock Service Worker (MSW) request handlers with Kubb. The handlers work in both browser and Node.js environments via MSW v3.

## Installation

```bash
npx kubb add plugin-msw
# or
bun add @kubb/plugin-msw
# or
pnpm add @kubb/plugin-msw
# or
npm install @kubb/plugin-msw
```

`kubb add` installs the version the [Kubb registry](https://kubb.dev/registry) pins and adds `pluginMsw()` to your `kubb.config.ts`. Run `npx kubb init` first if you have no config.

The generated handlers import from `msw/http`, which only exists in MSW 3. Install `msw` v3 in the app that uses them:

```bash
npm install msw@^3.0.0
```

With MSW 2, TypeScript fails with `TS2307: Cannot find module 'msw/http'`.

## Documentation

See the [full documentation](https://kubb.dev/extensions/kubb-labs/plugin-msw) for configuration options and examples.

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

[npm-version-src]: https://shieldcn.dev/npm/v/@kubb/plugin-msw.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-version-href]: https://npmx.dev/package/@kubb/plugin-msw
[npm-downloads-src]: https://shieldcn.dev/npm/dm/@kubb/plugin-msw.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-downloads-href]: https://npmx.dev/package/@kubb/plugin-msw
[stars-src]: https://shieldcn.dev/github/stars/kubb-labs/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[stars-href]: https://github.com/kubb-labs/kubb
[license-src]: https://shieldcn.dev/npm/license/@kubb/plugin-msw.svg?variant=secondary&size=xs&theme=zinc
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[node-src]: https://shieldcn.dev/npm/node/@kubb/plugin-msw.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[node-href]: https://npmx.dev/package/@kubb/plugin-msw
