# Cypress

The Cypress plugin generates a typed `cy.request()` helper for each operation in your OpenAPI spec. A helper returns `Cypress.Chainable<{Operation}Response>`.

Each helper takes grouped `path`, `query`, `headers`, `cookies`, and `body` parameters named after the spec.

## Setup

- Add `@kubb/plugin-ts` for the request and response types.
- Install `cypress` v15 or v16 in the project that runs the tests.
- Add `"types": ["cypress"]` to the tsconfig that covers the generated files. The helpers use the global `Cypress` namespace.

## Options worth knowing

| Option                                                                            | Default | What it does                                                                      |
| --------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------- |
| [`baseURL`](https://kubb.dev/extensions/kubb-labs/plugin-cypress/options#baseurl) | None    | Prepends a host. Without it, Cypress resolves the path against its own `baseUrl`. |

The other options are the [shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options).

## Example

This config writes the helpers to `src/gen/cypress`. `contentType` keeps the JSON response of the Petstore spec, which also declares XML, so bodies are not typed as `Pet | string`. `integerType: 'number'` types the `int64` `petId` as `number`.

::code-group

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { adapterOas } from '@kubb/adapter-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginCypress } from '@kubb/plugin-cypress'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  adapter: adapterOas({ contentType: 'application/json', integerType: 'number' }),
  plugins: [
    pluginTs(),
    pluginCypress({ output: { path: 'cypress', mode: 'directory' } }),
  ],
})
```

```typescript [src/gen/cypress/getPetById.ts]
import type { GetPetByIdOptions, GetPetByIdResponse } from '../types/GetPetById'

export function getPetById({ path }: GetPetByIdOptions, options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<GetPetByIdResponse> {
  return cy
    .request<GetPetByIdResponse>({
      method: 'GET',
      url: `/pet/${path.petId}`,
      ...options,
    })
    .then((res) => res.body) as Cypress.Chainable<GetPetByIdResponse>
}
```

```typescript [cypress/e2e/pet.cy.ts]
import { getPetById } from '../../src/gen/cypress/getPetById'

describe('Pet API', () => {
  it('returns the pet by id', () => {
    getPetById({ path: { petId: 1 } }).then((pet) => {
      expect(pet.name).to.be.a('string')
    })
  })
})
```

::
