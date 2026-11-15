# Options

`pluginRedoc()` takes one option, the path of the HTML file it writes. It takes none of the [shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options).

## Options overview

| Option                         | Purpose                         | Default                 |
| ------------------------------ | ------------------------------- | ----------------------- |
| [`output`](#output)            | Where the HTML file is written. | `{ path: 'docs.html' }` |
| ↳ [`output.path`](#outputpath) | File path of the HTML page.     | `'docs.html'`           |

## Option details

### output

Where the generated Redoc HTML file is written. Unlike the shared `output` option, it takes only `path`.

|          |                         |
| -------- | ----------------------- |
| Type     | `{ path: string }`      |
| Required | `false`                 |
| Default  | `{ path: 'docs.html' }` |

#### output.path

File path of the HTML page, resolved against the root `output.path`. It names a single file, not a folder.

|          |               |
| -------- | ------------- |
| Type     | `string`      |
| Required | `false`       |
| Default  | `'docs.html'` |

| `output.path`      | Root `output.path` | Writes                                      |
| ------------------ | ------------------ | ------------------------------------------- |
| `'docs.html'`      | `'./src/gen'`      | `src/gen/docs.html`                         |
| `'api/index.html'` | `'./src/gen'`      | `src/gen/api/index.html`                    |
| `'docs'`           | `'./src/gen'`      | `src/gen/docs`, a file without an extension |
