# Redoc

The Redoc plugin generates a single HTML page that documents your OpenAPI spec with Redoc.

The whole spec is embedded in the page, so you can publish the page to any static host without a build step. Viewing the page needs network access, because it loads a pinned Redoc bundle from jsDelivr, checked with a Subresource Integrity hash, and its fonts from Google Fonts.

## Setup

No other plugins or packages are needed. The plugin reads the spec through the default OpenAPI adapter, `adapterOas`, and fails with any other adapter.

## Options worth knowing

- `output.path` sets the HTML file path, relative to the root `output.path`. The default is `docs.html`. End it with `.html`, because it names a file, not a folder.

The plugin has no other options. See [Options](https://kubb.dev/extensions/kubb-labs/plugin-redoc/options) for its type and default.

## Example

The config below writes the page to `src/gen/docs.html`.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginRedoc } from '@kubb/plugin-redoc'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [
    pluginRedoc({ output: { path: 'docs.html' } }),
  ],
})
```
