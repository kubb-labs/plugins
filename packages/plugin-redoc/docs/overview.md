# Redoc

The Redoc plugin generates a single HTML page that documents your OpenAPI spec with Redoc. The whole spec is embedded in the page, so you can publish it to any static host without a build step.

Viewing the page needs network access. It loads a pinned Redoc bundle from jsDelivr, checked with a Subresource Integrity hash, and its fonts from Google Fonts.

## Setup

No other plugins or packages are needed. The plugin reads the spec through the default OpenAPI adapter, `adapterOas`, and fails with `KUBB_ADAPTER_REQUIRED` for any other adapter.

## Options worth knowing

| Option                                                                                 | Default       | What it does                                                                                                           |
| -------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [`output.path`](https://kubb.dev/extensions/kubb-labs/plugin-redoc/options#outputpath) | `'docs.html'` | Path of the HTML file, relative to the root `output.path`. End it with `.html`, because it names a file, not a folder. |

The plugin has no other options.

## Example

The config below writes the page to `src/gen/docs.html`. The page title is the spec's `info.title`.

::code-group

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

```text [Output]
src/
└── gen/
    └── docs.html
```

::
