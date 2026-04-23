<div align="center">
  <h1>Plugin Barrel</h1>
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img width="180" src="https://raw.githubusercontent.com/kubb-labs/kubb/main/assets/logo.png" alt="Kubb logo">
  </a>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Sponsors][sponsors-src]][sponsors-href]

<h4>
<a href="https://kubb.dev/" target="_blank">Documentation</a>
<span> · </span>
<a href="https://github.com/kubb-labs/plugins/issues/" target="_blank">Report Bug</a>
<span> · </span>
<a href="https://github.com/kubb-labs/plugins/issues/" target="_blank">Request Feature</a>
</h4>
</div>

## Install

```sh
pnpm add @kubb/plugin-barrel
```

## Usage

See [the documentation](https://kubb.dev/plugins/plugin-barrel) for full configuration options.

```ts
import { defineConfig } from 'kubb'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginBarrel } from '@kubb/plugin-barrel'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginTs({
      output: { path: 'types', barrelType: 'named' },
    }),
    pluginBarrel({
      root: { barrelType: 'named' },
      plugins: [
        { name: 'plugin-ts', barrelType: 'named' },
      ],
    }),
  ],
})
```

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@kubb/plugin-barrel/latest.svg?style=flat&colorA=18181B&colorB=f58517
[npm-version-href]: https://npmjs.com/package/@kubb/plugin-barrel
[npm-downloads-src]: https://img.shields.io/npm/dm/@kubb/plugin-barrel.svg?style=flat&colorA=18181B&colorB=f58517
[npm-downloads-href]: https://npmjs.com/package/@kubb/plugin-barrel
[license-src]: https://img.shields.io/github/license/kubb-labs/plugins.svg?style=flat&colorA=18181B&colorB=f58517
[license-href]: https://github.com/kubb-labs/plugins/blob/main/LICENSE
[sponsors-src]: https://img.shields.io/github/sponsors/stijnvanhulle?style=flat&colorA=18181B&colorB=f58517
[sponsors-href]: https://github.com/sponsors/stijnvanhulle
