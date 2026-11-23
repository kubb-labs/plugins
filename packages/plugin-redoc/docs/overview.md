# Redoc

The Redoc plugin generates one Redoc HTML page with your OpenAPI spec embedded. Publish it to any static host without a build step.

> [!NOTE]
> Viewing the page needs network access. It loads a pinned Redoc bundle from jsDelivr, checked with a Subresource Integrity hash, and its fonts from Google Fonts.

## Setup

No other plugins or packages are needed. The plugin needs an adapter that produces an OpenAPI 3 or Swagger 2 document, such as the default `adapterOas`. Without one it fails with `KUBB_ADAPTER_REQUIRED`.

## Options worth knowing

| Option                                                                                 | Default       | What it does                                                                                             |
| -------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| [`output.path`](https://kubb.dev/extensions/kubb-labs/plugin-redoc/options#outputpath) | `'docs.html'` | Path of the HTML file, relative to the root `output.path`. End it with `.html`, because it names a file. |

The plugin has no other options.

## Example

This config writes the page to `src/gen/docs.html`, titled with the spec's `info.title`.

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
