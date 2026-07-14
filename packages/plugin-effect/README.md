<div align="center">
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img src="https://kubb.dev/og.png" alt="Kubb banner">
  </a>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Stars][stars-src]][stars-href]
[![License][license-src]][license-href]
[![Node][node-src]][node-href]
</div>

# @kubb/plugin-effect

`@kubb/plugin-effect` generates Effect v4 schemas and matching TypeScript types from OpenAPI. The beta currently targets `effect@4.0.0-beta.98`.

## Installation

```bash
pnpm add -D @kubb/plugin-effect@beta
pnpm add effect@4.0.0-beta.98
```

## Usage

```ts
import { pluginEffect } from '@kubb/plugin-effect'
import { defineConfig } from 'kubb/config'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [pluginEffect()],
})
```

The plugin generates both `export type Pet` and `export const Pet`. Do not combine the default `plugin-effect` and `plugin-ts` outputs in the same barrel. Use separate output paths or a custom Effect resolver when both plugins are required.

## Documentation

See the [Effect plugin documentation](https://kubb.dev/plugins/plugin-effect) for options and examples.

## License

[MIT](https://github.com/kubb-labs/plugins/blob/main/LICENSE)

[npm-version-src]: https://shieldcn.dev/npm/v/@kubb/plugin-effect.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-version-href]: https://npmx.dev/package/@kubb/plugin-effect
[npm-downloads-src]: https://shieldcn.dev/npm/dm/@kubb/plugin-effect.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-downloads-href]: https://npmx.dev/package/@kubb/plugin-effect
[stars-src]: https://shieldcn.dev/github/stars/kubb-labs/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[stars-href]: https://github.com/kubb-labs/kubb
[license-src]: https://shieldcn.dev/npm/license/@kubb/plugin-effect.svg?variant=secondary&size=xs&theme=zinc
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[node-src]: https://shieldcn.dev/npm/node/@kubb/plugin-effect.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[node-href]: https://npmx.dev/package/@kubb/plugin-effect
