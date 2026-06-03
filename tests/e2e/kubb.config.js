import { adapterOas } from '@kubb/adapter-oas'
import { pluginClient } from '@kubb/plugin-client'
import { pluginCypress } from '@kubb/plugin-cypress'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginMsw } from '@kubb/plugin-msw'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { defineConfig } from 'kubb'

const schemas = [
  // { name: 'test', path: '../../schemas/3.0.x/test.json' },
  // OpenAPI 3.1
  { name: 'train-travel', path: '../../schemas/3.0.x/train-travel.yaml' },
  { name: 'Figma', path: 'https://raw.githubusercontent.com/figma/rest-api-spec/refs/heads/main/openapi/openapi.yaml' },
  { name: 'spotify', path: 'https://raw.githubusercontent.com/sonallux/spotify-web-api/refs/heads/main/official-spotify-open-api.yml', strict: false },
  // OpenAPI 3.0
  { name: 'discriminator', path: '../../schemas/3.0.x/discriminator.yaml' },
  // { name: 'bunq.com', path: '../../schemas/3.0.x/bunq.com.json', strict: false },  // TS2300: duplicate barrel exports in hook index files
  // ~8k generated files: kubb's explicit-file lint overflows oxlint (RangeError/E2BIG). Skip it here;
  // `pnpm lint:gen` lints this output in chunks afterwards (see scripts/lint-gen.mjs).
  { name: 'atlassian.com', path: 'https://developer.atlassian.com/cloud/jira/platform/swagger-v3.v3.json', strict: false, lint: false },
  { name: 'optionalParameters', path: '../../schemas/3.0.x/optionalParameters.json' },
  { name: 'allOf', path: '../../schemas/3.0.x/allOf.json' },
  { name: 'anyOf', path: '../../schemas/3.0.x/anyOf.json' },
  { name: 'petStoreContent', path: '../../schemas/3.0.x/petStoreContent.json' },
  { name: 'twitter', path: '../../schemas/3.0.x/twitter.json' },
  { name: 'jokesOne', path: '../../schemas/3.0.x/jokesOne.yaml' },
  { name: 'readme.io', path: '../../schemas/3.0.x/readme.io.yaml' },
  { name: 'worldtime', path: '../../schemas/3.0.x/worldtime.yaml' },
  { name: 'zalando', path: '../../schemas/3.0.x/zalando.yaml' },
  { name: 'requestBody', path: '../../schemas/3.0.x/requestBody.yaml' },
  { name: 'box', path: '../../schemas/3.0.x/box.json' },
  { name: 'enums', path: '../../schemas/3.0.x/enums.yaml' },
  { name: 'dataset_api', path: '../../schemas/3.0.x/dataset_api.yaml' },
  { name: 'petStoreV3', path: 'https://petstore3.swagger.io/api/v3/openapi.json' },
  { name: 'openai', path: 'https://raw.githubusercontent.com/openai/openai-openapi/refs/heads/manual_spec/openapi.yaml', strict: false },
  // ~11k generated files: kubb's explicit-file lint overflows oxlint (RangeError/E2BIG). Skip it here;
  // `pnpm lint:gen` lints this output in chunks afterwards (see scripts/lint-gen.mjs).
  { name: 'stripe', path: 'https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json', strict: false, lint: false },
  { name: 'vercel', path: 'https://openapi.vercel.sh/', strict: false },
]

/** @type {import('@kubb/core').UserConfig} */
const baseConfig = {
  root: '.',
  input: {
    path: 'https://petstore3.swagger.io/api/v3/openapi.json',
  },
  adapter: adapterOas({ validate: false }),
  output: {
    path: './gen',
    clean: true,
    // The `gen` output is gitignored, which oxlint skips during directory traversal. Linting and
    // formatting are handled by ./scripts/lintFormatGen.mjs via the `done` hook instead.
    lint: false,
    format: false,
  },
  plugins: [
    pluginTs({
      output: {
        path: 'models/ts',
        barrel: false,
      },
      group: {
        type: 'tag',
      },
      enumType: 'asConst',
    }),
    pluginReactQuery({
      output: {
        path: './clients/hooks',
      },
      group: { type: 'tag' },
    }),
    pluginClient({
      output: {
        path: './clients/axios',
      },
      group: {
        type: 'tag',
        name({ group }) {
          return `${group}Service`
        },
      },
    }),
    pluginCypress({
      output: {
        path: './clients/cypress',
        barrel: false,
      },
      group: {
        type: 'tag',
        name({ group }) {
          return `${group}Requests`
        },
      },
    }),
    pluginZod({
      output: {
        path: './zod',
        barrel: false,
      },
      group: { type: 'tag' },
      inferred: true,
      typed: false,
      operations: false,
    }),
    pluginFaker({
      output: {
        path: 'mocks',
        barrel: false,
      },
      group: { type: 'tag' },
    }),
    pluginMsw({
      output: {
        path: 'msw',
      },
      group: { type: 'tag' },
    }),
  ],
}

export default defineConfig(() => {
  return schemas.map(({ name, path, strict, typecheck, lint }) => {
    const genDir = `./gen/${name}`
    return {
      ...baseConfig,
      name,
      output: {
        ...baseConfig.output,
        path: genDir,
      },
      input: {
        path,
      },
      hooks: {
        done: [
          `node ./scripts/lintFormatGen.mjs ${genDir}${lint === false ? ' --no-lint' : ''}`,
          typecheck ? (strict ? 'npm run typecheck -- --strict' : 'npm run typecheck') : undefined,
        ].filter(Boolean),
      },
    }
  })
})
