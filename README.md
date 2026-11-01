<div align="center">
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img src="https://kubb.dev/og.png" alt="Kubb banner">
  </a>

[![Stars][stars-src]][stars-href]
[![License][license-src]][license-href]
[![OC Backers][oc-backers-src]][oc-backers-href]

  <h4>
    <a href="https://kubb.dev" target="_blank">Documentation</a>
    <span> · </span>
    <a href="https://github.com/kubb-labs/plugins/issues/" target="_blank">Report Bug</a>
    <span> · </span>
    <a href="https://github.com/kubb-labs/plugins/issues/" target="_blank">Request Feature</a>
  </h4>
</div>

> [!IMPORTANT]
> **We are looking for maintainers.** Want to help shape Kubb? Email [kubb@kubb.dev](mailto:kubb@kubb.dev) or chat with us on [Discord](https://discord.gg/shfBFeczrm).

<br />

# Kubb Plugins

**Official and community plugins for [Kubb](https://kubb.dev).**

This monorepo is home to official and community plugins for [Kubb](https://kubb.dev), which turns your API spec into type-safe code. Point Kubb at your OpenAPI specification and it generates TypeScript types, API clients, Zod schemas, TanStack Query hooks for React, composables for Vue, SWR hooks, Faker mocks, MSW handlers, and more.

Want to build your own plugin? See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Use plugins in Kubb Studio

[Kubb Studio](https://kubb.studio) lets you configure and inspect Kubb generations in the browser while your project or self-hosted agent runs Kubb. [Connect a project](https://kubb.dev/docs/5.x/integrations/studio) to use these plugins in that workflow.

## Official plugins

Maintained by the Kubb team. Kubb v5 OpenAPI configs use [`@kubb/adapter-oas`](https://npmx.dev/package/@kubb/adapter-oas) as the adapter layer.

### TypeScript

| Package                                   | Version                                                                                                      | Description                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| [`@kubb/plugin-ts`](./packages/plugin-ts) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-ts.svg)](https://npmx.dev/package/@kubb/plugin-ts) | TypeScript types and interfaces generation |

### Clients

| Package                                         | Version                                                                                                            | Description                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| [`@kubb/plugin-axios`](./packages/plugin-axios) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-axios.svg)](https://npmx.dev/package/@kubb/plugin-axios) | Type-safe HTTP client based on [Axios](https://github.com/axios/axios) |
| [`@kubb/plugin-fetch`](./packages/plugin-fetch) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-fetch.svg)](https://npmx.dev/package/@kubb/plugin-fetch) | Type-safe HTTP client based on the Fetch API                           |

### Zod

| Package                                     | Version                                                                                                        | Description                                                                       |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [`@kubb/plugin-zod`](./packages/plugin-zod) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-zod.svg)](https://npmx.dev/package/@kubb/plugin-zod) | [Zod](https://github.com/colinhacks/zod) schema generation for runtime validation |

### Data fetching

| Package                                                     | Version                                                                                                                        | Description                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| [`@kubb/plugin-react-query`](./packages/plugin-react-query) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-react-query.svg)](https://npmx.dev/package/@kubb/plugin-react-query) | [TanStack Query](https://github.com/TanStack/query) hooks for React     |
| [`@kubb/plugin-vue-query`](./packages/plugin-vue-query)     | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-vue-query.svg)](https://npmx.dev/package/@kubb/plugin-vue-query)     | [TanStack Query](https://github.com/TanStack/query) composables for Vue |
| [`@kubb/plugin-swr`](./packages/plugin-swr)                 | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-swr.svg)](https://npmx.dev/package/@kubb/plugin-swr)                 | [SWR](https://github.com/vercel/swr) hooks for React                    |

### Testing and mocking

| Package                                             | Version                                                                                                                | Description                                                          |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [`@kubb/plugin-faker`](./packages/plugin-faker)     | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-faker.svg)](https://npmx.dev/package/@kubb/plugin-faker)     | [Faker.js](https://github.com/faker-js/faker) mock data generation   |
| [`@kubb/plugin-msw`](./packages/plugin-msw)         | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-msw.svg)](https://npmx.dev/package/@kubb/plugin-msw)         | [Mock Service Worker](https://github.com/mswjs/msw) handlers         |
| [`@kubb/plugin-cypress`](./packages/plugin-cypress) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-cypress.svg)](https://npmx.dev/package/@kubb/plugin-cypress) | [Cypress](https://github.com/cypress-io/cypress) e2e test generation |

### Documentation and AI

| Package                                         | Version                                                                                                            | Description                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| [`@kubb/plugin-redoc`](./packages/plugin-redoc) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-redoc.svg)](https://npmx.dev/package/@kubb/plugin-redoc) | [ReDoc](https://github.com/Redocly/redoc) API documentation generation |
| [`@kubb/plugin-mcp`](./packages/plugin-mcp)     | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-mcp.svg)](https://npmx.dev/package/@kubb/plugin-mcp)     | Model Context Protocol tools for AI assistants                         |

## Community plugins

Plugins built and maintained by the community. Want to add yours? See [CONTRIBUTING.md](./CONTRIBUTING.md).

> No community plugins listed yet. Be the first to [contribute one](./CONTRIBUTING.md#adding-a-plugin).

## Examples

| Example                                 | Description                         |
| --------------------------------------- | ----------------------------------- |
| [`typescript`](./examples/typescript)   | Generate TypeScript types           |
| [`client`](./examples/client)           | Generate API clients with Axios     |
| [`fetch`](./examples/fetch)             | Generate API clients with Fetch     |
| [`zod`](./examples/zod)                 | Generate Zod validation schemas     |
| [`react-query`](./examples/react-query) | Generate React Query hooks          |
| [`vue-query`](./examples/vue-query)     | Generate Vue Query composables      |
| [`faker`](./examples/faker)             | Generate Faker.js mock data         |
| [`msw`](./examples/msw)                 | Generate MSW handlers               |
| [`cypress`](./examples/cypress)         | Generate Cypress tests              |
| [`mcp`](./examples/mcp)                 | Generate MCP tools                  |
| [`advanced`](./examples/advanced)       | Advanced multi-plugin configuration |

## Contributing

We welcome contributions, and there are a few ways to get involved:

- Found a bug? File it in the [issue tracker](https://github.com/kubb-labs/plugins/issues).
- Have an idea for a plugin or improvement? [Open an issue](https://github.com/kubb-labs/plugins/issues/new) to share it.
- Need help? Ask the community on [Discord](https://discord.gg/4dQjA6vrWX).

Want to contribute to an existing plugin or add a new one, official or community? See [CONTRIBUTING.md](./CONTRIBUTING.md) for the project structure, prerequisites, local setup, and commands.

## Contributors [![Contributors][contributors-src]][contributors-href]

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://www.stijnvanhulle.be"><img src="https://avatars.githubusercontent.com/u/5904681?v=4?s=100" width="100px;" alt="Stijn Van Hulle"/><br /><sub><b>Stijn Van Hulle</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=stijnvanhulle" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Ericlm"><img src="https://avatars.githubusercontent.com/u/19361503?v=4?s=100" width="100px;" alt="Éric Le Maître"/><br /><sub><b>Éric Le Maître</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=Ericlm" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://sferadev.com"><img src="https://avatars.githubusercontent.com/u/2181866?v=4?s=100" width="100px;" alt="Alexis Rico"/><br /><sub><b>Alexis Rico</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=SferaDev" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://xeoneux.com"><img src="https://avatars.githubusercontent.com/u/3099626?v=4?s=100" width="100px;" alt="Aayush Kapoor"/><br /><sub><b>Aayush Kapoor</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=xeoneux" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/julian99m"><img src="https://avatars.githubusercontent.com/u/54702068?v=4?s=100" width="100px;" alt="Julian Meyer"/><br /><sub><b>Julian Meyer</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=julian99m" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://ghettoddos.su"><img src="https://avatars.githubusercontent.com/u/47575319?v=4?s=100" width="100px;" alt="Egor"/><br /><sub><b>Egor</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=ghettoDdOS" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/mohammad-naji7"><img src="https://avatars.githubusercontent.com/u/13167378?v=4?s=100" width="100px;" alt="Mohammad Alhamdan"/><br /><sub><b>Mohammad Alhamdan</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=mohammad-naji7" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/rajp33"><img src="https://avatars.githubusercontent.com/u/44758822?v=4?s=100" width="100px;" alt="Raj Patel"/><br /><sub><b>Raj Patel</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=rajp33" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/georgialoper"><img src="https://avatars.githubusercontent.com/u/22507118?v=4?s=100" width="100px;" alt="Georgia Loper"/><br /><sub><b>Georgia Loper</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=georgialoper" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/DemonStore"><img src="https://avatars.githubusercontent.com/u/5083650?v=4?s=100" width="100px;" alt="Dmitry Los"/><br /><sub><b>Dmitry Los</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=DemonStore" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## Sponsors

Kubb's development is funded by sponsors. To support the project, [become a sponsor on GitHub](https://github.com/sponsors/stijnvanhulle) or [back us on Open Collective](https://opencollective.com/kubb). See [sponsorship tiers and our sponsors](https://kubb.dev/sponsors).

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://shieldcn.dev/sponsors/stijnvanhulle.svg?titleAlign=center&mode=dark" alt="stijnvanhulle sponsors" width="100%" />
  </a>
</p>

## License

[MIT](./LICENSE) © [Stijn Van Hulle](https://github.com/stijnvanhulle)

## Star history

<img alt="Star history chart" src="https://shieldcn.dev/chart/github/stars/kubb-labs/plugins.svg?theme=orange" width="100%" />

<!-- Badges -->

[stars-src]: https://shieldcn.dev/github/stars/kubb-labs/plugins.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[stars-href]: https://github.com/kubb-labs/plugins
[license-src]: https://shieldcn.dev/npm/license/@kubb/plugin-ts.svg?variant=secondary&size=xs&theme=zinc
[license-href]: https://github.com/kubb-labs/plugins/blob/main/LICENSE
[coverage-src]: https://shieldcn.dev/codecov/github/kubb-labs/plugins.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[coverage-href]: https://app.codecov.io/gh/kubb-labs/plugins
[oc-backers-src]: https://shieldcn.dev/opencollective/backers/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[oc-backers-href]: https://opencollective.com/kubb
[contributors-src]: https://shieldcn.dev/github/contributors/kubb-labs/plugins.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[contributors-href]: #contributors-
