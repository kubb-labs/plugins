# Cypress

The Cypress plugin generates a typed `cy.request()` helper for each operation in your OpenAPI spec.

Each helper takes grouped `path`, `query`, `headers`, and `body` parameters named after the spec. It returns the response body typed as `Cypress.Chainable<{Operation}Response>`.

## Setup

- Add `@kubb/plugin-ts` for the request and response types.
- Install `cypress` v15 or v16 in the project that runs the tests.
- Add `"types": ["cypress"]` to the tsconfig that covers the generated files, because the helpers use the global `Cypress` namespace.

## Options worth knowing

- `baseURL` is prepended to every request. Without it, Cypress resolves the path against its own `baseUrl`.

See [Options](https://kubb.dev/extensions/kubb-labs/plugin-cypress/options) for every option and its default.

## Example

The config below writes the helpers to `src/gen/cypress`. The Petstore spec declares JSON and XML for most responses, so `contentType` keeps the JSON one. Without it, a response body is typed as `Pet | string`.

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

A test then calls a helper and gets a typed response body. `petId` is an `int64`, which `integerType: 'number'` types as `number` instead of the default `bigint`.

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
