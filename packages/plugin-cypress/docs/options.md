# Options

Pass these options to `pluginCypress()`. Shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options), and this page gives only their default here.

## Options overview

| Option                                                                    | Purpose                                                                                                                         | Default                                          |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where files are written.                                                                                                        | `{ path: 'cypress', barrel: { type: 'named' } }` |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)       | Split output by tag or path.                                                                                                    | None                                             |
| [`baseURL`](#baseurl)                                                     | Base URL prepended to every request.                                                                                            | None                                             |
| [`include`](https://kubb.dev/docs/5.x/reference/plugin-options#include)   | Keep only operations that match.                                                                                                | None                                             |
| [`exclude`](https://kubb.dev/docs/5.x/reference/plugin-options#exclude)   | Skip operations that match.                                                                                                     | `[]`                                             |
| [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override) | Apply different options per pattern.                                                                                            | `[]`                                             |
| [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver) | Customize generated names and file paths. Takes one patch or an array of patches. `resolverCypress` adds no members of its own. | `resolverCypress`                                |
| [`macros`](https://kubb.dev/docs/5.x/reference/plugin-options#macros)     | Rewrite AST nodes before printing.                                                                                              | `[]`                                             |

## Option details

### baseURL

Base URL that Kubb writes into each helper's request URL, so no runtime setup is needed. The adapter's server URL is not used.

|          |          |
| -------- | -------- |
| Type     | `string` |
| Required | `false`  |

| Value                            | Helper URL                                              | Resolved by                        |
| -------------------------------- | ------------------------------------------------------- | ---------------------------------- |
| None (default)                   | `` `/pets/${path.petId}` ``                             | Cypress, against its own `baseUrl` |
| `'https://staging.petstore.dev'` | `` `https://staging.petstore.dev/pets/${path.petId}` `` | The helper                         |
