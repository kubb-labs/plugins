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

<br />

# Kubb Plugins

**Official and community plugins for [Kubb](https://kubb.dev).**

This monorepo is home to official and community plugins for [Kubb](https://kubb.dev), the meta framework for code generation. Point Kubb at your OpenAPI specification and it generates TypeScript types, API clients, Effect and Zod schemas, React/Vue/Svelte/Solid Query hooks, Faker mocks, MSW handlers, and more.

Want to build your own plugin? See [CONTRIBUTING.md](./CONTRIBUTING.md).

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

### Effect

| Package                                           | Version                                                                                                              | Description                                                                            |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [`@kubb/plugin-effect`](./packages/plugin-effect) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-effect.svg)](https://npmx.dev/package/@kubb/plugin-effect) | [Effect](https://github.com/Effect-TS/effect-smol) v4 schema and TypeScript generation |

### Data fetching

| Package                                                     | Version                                                                                                                        | Description                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| [`@kubb/plugin-react-query`](./packages/plugin-react-query) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-react-query.svg)](https://npmx.dev/package/@kubb/plugin-react-query) | [TanStack Query](https://github.com/TanStack/query) hooks for React     |
| [`@kubb/plugin-vue-query`](./packages/plugin-vue-query)     | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-vue-query.svg)](https://npmx.dev/package/@kubb/plugin-vue-query)     | [TanStack Query](https://github.com/TanStack/query) composables for Vue |

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
| [`effect`](./examples/effect)           | Generate Effect v4 schemas          |
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
      <td align="center" valign="top" width="14.28%"><a href="https://aluc.io/"><img src="https://avatars.githubusercontent.com/u/15520015?v=4?s=100" width="100px;" alt="Alfred"/><br /><sub><b>Alfred</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=b6pzeusbc54tvhw5jgpyw8pwz2x6gs" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/raveclassic"><img src="https://avatars.githubusercontent.com/u/1743568?v=4?s=100" width="100px;" alt="Kirill Agalakov"/><br /><sub><b>Kirill Agalakov</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=raveclassic" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://wicky.nillia.ms"><img src="https://avatars.githubusercontent.com/u/1091390?v=4?s=100" width="100px;" alt="Nick Williams"/><br /><sub><b>Nick Williams</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=WickyNilliams" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/helt"><img src="https://avatars.githubusercontent.com/u/1732112?v=4?s=100" width="100px;" alt="helt"/><br /><sub><b>helt</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=helt" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Ti-webdev"><img src="https://avatars.githubusercontent.com/u/478565?v=4?s=100" width="100px;" alt="Vasily Mikhaylovsky"/><br /><sub><b>Vasily Mikhaylovsky</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=Ti-webdev" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/chiptus"><img src="https://avatars.githubusercontent.com/u/1381655?v=4?s=100" width="100px;" alt="Chaim Lev-Ari"/><br /><sub><b>Chaim Lev-Ari</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=chiptus" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://projects.pafnuty.name"><img src="https://avatars.githubusercontent.com/u/1635679?v=4?s=100" width="100px;" alt="Pavel Belousov"/><br /><sub><b>Pavel Belousov</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=pafnuty" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dmitry-blackwave"><img src="https://avatars.githubusercontent.com/u/5526543?v=4?s=100" width="100px;" alt="Dmitry Belov"/><br /><sub><b>Dmitry Belov</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=dmitry-blackwave" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/aburgel"><img src="https://avatars.githubusercontent.com/u/341478?v=4?s=100" width="100px;" alt="Alex Burgel"/><br /><sub><b>Alex Burgel</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=aburgel" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dgarciamuria"><img src="https://avatars.githubusercontent.com/u/8144333?v=4?s=100" width="100px;" alt="Daniel Garcia"/><br /><sub><b>Daniel Garcia</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=dgarciamuria" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/wuyuanyi135"><img src="https://avatars.githubusercontent.com/u/11760870?v=4?s=100" width="100px;" alt="wuyuanyi135"/><br /><sub><b>wuyuanyi135</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=wuyuanyi135" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/cjthompson"><img src="https://avatars.githubusercontent.com/u/1958266?v=4?s=100" width="100px;" alt="Chris Thompson"/><br /><sub><b>Chris Thompson</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=cjthompson" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/hkang1"><img src="https://avatars.githubusercontent.com/u/220971?v=4?s=100" width="100px;" alt="Caleb Hoyoul Kang"/><br /><sub><b>Caleb Hoyoul Kang</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=hkang1" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/grreeenn"><img src="https://avatars.githubusercontent.com/u/13204857?v=4?s=100" width="100px;" alt="Gregory Zhukovsky"/><br /><sub><b>Gregory Zhukovsky</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=grreeenn" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ChilloManiac"><img src="https://avatars.githubusercontent.com/u/3761964?v=4?s=100" width="100px;" alt="Christoffer Nørbjerg"/><br /><sub><b>Christoffer Nørbjerg</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=ChilloManiac" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://codefy.de/de/karriere"><img src="https://avatars.githubusercontent.com/u/122524301?v=4?s=100" width="100px;" alt="CHE1RON"/><br /><sub><b>CHE1RON</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=CHE1RON" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ekaradon"><img src="https://avatars.githubusercontent.com/u/9439390?v=4?s=100" width="100px;" alt="ekaradon"/><br /><sub><b>ekaradon</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=ekaradon" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://thijmen.dev"><img src="https://avatars.githubusercontent.com/u/383903?v=4?s=100" width="100px;" alt="Thijmen Stavenuiter"/><br /><sub><b>Thijmen Stavenuiter</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=Thijmen" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/bohdanhusak"><img src="https://avatars.githubusercontent.com/u/13829370?v=4?s=100" width="100px;" alt="Bohdan Husak"/><br /><sub><b>Bohdan Husak</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=bohdanhusak" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Ericlm"><img src="https://avatars.githubusercontent.com/u/19361503?v=4?s=100" width="100px;" alt="Éric Le Maître"/><br /><sub><b>Éric Le Maître</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=Ericlm" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/chambber"><img src="https://avatars.githubusercontent.com/u/11406841?v=4?s=100" width="100px;" alt="Rubens Pereira do Nascimento"/><br /><sub><b>Rubens Pereira do Nascimento</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=chambber" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/msutkowski"><img src="https://avatars.githubusercontent.com/u/784953?v=4?s=100" width="100px;" alt="Matt Sutkowski"/><br /><sub><b>Matt Sutkowski</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=msutkowski" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/vitorcamachoo"><img src="https://avatars.githubusercontent.com/u/20595956?v=4?s=100" width="100px;" alt="Vítor Camacho"/><br /><sub><b>Vítor Camacho</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=vitorcamachoo" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/VasekProchazka"><img src="https://avatars.githubusercontent.com/u/13906845?v=4?s=100" width="100px;" alt="Václav Procházka"/><br /><sub><b>Václav Procházka</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=VasekProchazka" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://codx.dev"><img src="https://avatars.githubusercontent.com/u/59735735?v=4?s=100" width="100px;" alt="Luiz Bett"/><br /><sub><b>Luiz Bett</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=heyBett" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/lambdank"><img src="https://avatars.githubusercontent.com/u/5475129?v=4?s=100" width="100px;" alt="Sebastian Andersen"/><br /><sub><b>Sebastian Andersen</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=lambdank" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://akino.icu"><img src="https://avatars.githubusercontent.com/u/64176534?v=4?s=100" width="100px;" alt="Akino"/><br /><sub><b>Akino</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=akinoccc" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/rmachado-studocu"><img src="https://avatars.githubusercontent.com/u/89906313?v=4?s=100" width="100px;" alt="Ricardo Machado"/><br /><sub><b>Ricardo Machado</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=rmachado-studocu" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://simonelnahas.com"><img src="https://avatars.githubusercontent.com/u/29279201?v=4?s=100" width="100px;" alt="Simon El Nahas"/><br /><sub><b>Simon El Nahas</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=simonelnahas" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/maartenvansambeek"><img src="https://avatars.githubusercontent.com/u/91739524?v=4?s=100" width="100px;" alt="maartenvansambeek"/><br /><sub><b>maartenvansambeek</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=maartenvansambeek" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://sdufresne.info"><img src="https://avatars.githubusercontent.com/u/583851?v=4?s=100" width="100px;" alt="Stefan du Fresne"/><br /><sub><b>Stefan du Fresne</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=SCdF" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://hugofelippe.github.io/"><img src="https://avatars.githubusercontent.com/u/19368365?v=4?s=100" width="100px;" alt="Hugo Felippe de Souza Cruz"/><br /><sub><b>Hugo Felippe de Souza Cruz</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=hugoFelippe" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/belgattitude"><img src="https://avatars.githubusercontent.com/u/259798?v=4?s=100" width="100px;" alt="Sébastien Vanvelthem"/><br /><sub><b>Sébastien Vanvelthem</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=belgattitude" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://bento.me/vitalygashkov"><img src="https://avatars.githubusercontent.com/u/30000398?v=4?s=100" width="100px;" alt="Vitaly Gashkov"/><br /><sub><b>Vitaly Gashkov</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=vitalygashkov" title="Documentation">📖</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://ducduc.nl"><img src="https://avatars.githubusercontent.com/u/9675738?v=4?s=100" width="100px;" alt="Duco Drupsteen"/><br /><sub><b>Duco Drupsteen</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=ducodrupsteen" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/th3l0g4n"><img src="https://avatars.githubusercontent.com/u/326306?v=4?s=100" width="100px;" alt="th3l0g4n"/><br /><sub><b>th3l0g4n</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=th3l0g4n" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://rxliuli.com"><img src="https://avatars.githubusercontent.com/u/24560368?v=4?s=100" width="100px;" alt="rxliuli"/><br /><sub><b>rxliuli</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=rxliuli" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/humarkx"><img src="https://avatars.githubusercontent.com/u/13049940?v=4?s=100" width="100px;" alt="humarkx"/><br /><sub><b>humarkx</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=humarkx" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Jakub-Cerovsky"><img src="https://avatars.githubusercontent.com/u/141134227?v=4?s=100" width="100px;" alt="Jakub Cerovsky"/><br /><sub><b>Jakub Cerovsky</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=Jakub-Cerovsky" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/yukikwi"><img src="https://avatars.githubusercontent.com/u/66879660?v=4?s=100" width="100px;" alt="Pachara Chantawong"/><br /><sub><b>Pachara Chantawong</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=yukikwi" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://volodymyrkushnir.dev/"><img src="https://avatars.githubusercontent.com/u/10290626?v=4?s=100" width="100px;" alt="Volodymyr Kushnir"/><br /><sub><b>Volodymyr Kushnir</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=volodymyr-kushnir" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/GKNewsrooms"><img src="https://avatars.githubusercontent.com/u/201248633?v=4?s=100" width="100px;" alt="GKNewsrooms"/><br /><sub><b>GKNewsrooms</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=GKNewsrooms" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/stepek"><img src="https://avatars.githubusercontent.com/u/5058678?v=4?s=100" width="100px;" alt="Kamil Stepczuk"/><br /><sub><b>Kamil Stepczuk</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=stepek" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/JoaoBrlt"><img src="https://avatars.githubusercontent.com/u/11065509?v=4?s=100" width="100px;" alt="João Brilhante"/><br /><sub><b>João Brilhante</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=JoaoBrlt" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/kamilzki"><img src="https://avatars.githubusercontent.com/u/27976736?v=4?s=100" width="100px;" alt="Kamil Sieradzki"/><br /><sub><b>Kamil Sieradzki</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=kamilzki" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/EricPierlotIdmog"><img src="https://avatars.githubusercontent.com/u/124898024?v=4?s=100" width="100px;" alt="Eric Pierlot"/><br /><sub><b>Eric Pierlot</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=EricPierlotIdmog" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://atholin.se"><img src="https://avatars.githubusercontent.com/u/33940473?v=4?s=100" width="100px;" alt="Alexander Sjöcrona Tholin"/><br /><sub><b>Alexander Sjöcrona Tholin</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=ATholin" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://hyoban.cc"><img src="https://avatars.githubusercontent.com/u/38493346?v=4?s=100" width="100px;" alt="Stephen Zhou"/><br /><sub><b>Stephen Zhou</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=hyoban" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://choly.ca"><img src="https://avatars.githubusercontent.com/u/943597?v=4?s=100" width="100px;" alt="Ilia Choly"/><br /><sub><b>Ilia Choly</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=icholy" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/skoropadas"><img src="https://avatars.githubusercontent.com/u/20700969?v=4?s=100" width="100px;" alt="Alex Skoropad"/><br /><sub><b>Alex Skoropad</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=skoropadas" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://pateljay.io"><img src="https://avatars.githubusercontent.com/u/36803168?v=4?s=100" width="100px;" alt="Jay Patel"/><br /><sub><b>Jay Patel</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=jay-babu" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://hamzamihaidaniel.com"><img src="https://avatars.githubusercontent.com/u/12731515?v=4?s=100" width="100px;" alt="Hamza Mihai Daniel"/><br /><sub><b>Hamza Mihai Daniel</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=hamzamihaidanielx" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://sferadev.com"><img src="https://avatars.githubusercontent.com/u/2181866?v=4?s=100" width="100px;" alt="Alexis Rico"/><br /><sub><b>Alexis Rico</b></sub></a><br /><a href="https://github.com/kubb-labs/plugins/commits?author=SferaDev" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## Sponsors

Kubb's development is funded by sponsors. To support the project, [become a sponsor on GitHub](https://github.com/sponsors/stijnvanhulle) or [back us on Open Collective](https://opencollective.com/kubb).

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
