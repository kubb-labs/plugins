# Cypress

The Cypress plugin generates a typed `cy.request()` helper for each operation in your OpenAPI spec. Each helper takes grouped `path`, `query`, `headers`, `cookies`, and `body` parameters named after the spec, and it returns the response body typed as `Cypress.Chainable<{Operation}Response>`.

## Setup

- Add `@kubb/plugin-ts` for the request and response types.
- Install `cypress` v15 or v16 in the project that runs the tests.
- Add `"types": ["cypress"]` to the tsconfig that covers the generated files, because the helpers use the global `Cypress` namespace.

## Options worth knowing

| Option                                                                            | Default | What it does                                                                                       |
| --------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| [`baseURL`](https://kubb.dev/extensions/kubb-labs/plugin-cypress/options#baseurl) | None    | Prepends a host to every request. Without it, Cypress resolves the path against its own `baseUrl`. |

The other options are the [shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options).

## Example

The config below writes the helpers to `src/gen/cypress`. The Petstore spec declares JSON and XML for most responses, so `contentType` keeps the JSON one. Without it, a response body is typed as `Pet | string`. `integerType: 'number'` types the `int64` `petId` as `number` instead of `bigint`.

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
