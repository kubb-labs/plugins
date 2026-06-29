import { adapterOas } from '@kubb/adapter-oas'
import { pluginAxios } from '@kubb/plugin-axios'
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
  { name: 'spotify', path: 'https://raw.githubusercontent.com/sonallux/spotify-web-api/refs/heads/main/official-spotify-open-api.yml' },
  // OpenAPI 3.0
  { name: 'discriminator', path: '../../schemas/3.0.x/discriminator.yaml' },
  { name: 'bunq.com', path: '../../schemas/3.0.x/bunq.com.json' },
  // Note: developer.atlassian.com, petstore3.swagger.io, and openapi.vercel.sh are omitted here.
  // They block CI/bot traffic with 403s and flake the e2e run; the local fixtures plus the
  // raw.githubusercontent.com specs below give equivalent coverage.
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
  { name: 'openai', path: 'https://raw.githubusercontent.com/openai/openai-openapi/refs/heads/manual_spec/openapi.yaml' },
  { name: 'stripe', path: 'https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json' },
  // Real-world APIs (remote, raw.githubusercontent.com so CI is not blocked by bot-unfriendly hosts).
  // These exercise large, deeply-nested specs with discriminators, oneOf/anyOf and webhooks/callbacks;
  // `strict: false` mirrors the loose real-world specs above.
  { name: 'github', path: 'https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json' },
  { name: 'asana', path: 'https://raw.githubusercontent.com/Asana/openapi/master/defs/asana_oas.yaml' },
  { name: 'box', path: 'https://raw.githubusercontent.com/box/box-openapi/main/openapi.json' },
  { name: 'plaid', path: 'https://raw.githubusercontent.com/plaid/plaid-openapi/master/2020-09-14.yml' },
  { name: 'twilio-api', path: 'https://raw.githubusercontent.com/twilio/twilio-oai/main/spec/json/twilio_api_v2010.json' },
  { name: 'twilio-messaging', path: 'https://raw.githubusercontent.com/twilio/twilio-oai/main/spec/json/twilio_messaging_v1.json' },
  { name: 'twilio-verify', path: 'https://raw.githubusercontent.com/twilio/twilio-oai/main/spec/json/twilio_verify_v2.json' },
  { name: 'twilio-lookups', path: 'https://raw.githubusercontent.com/twilio/twilio-oai/main/spec/json/twilio_lookups_v2.json' },
  { name: 'twilio-video', path: 'https://raw.githubusercontent.com/twilio/twilio-oai/main/spec/json/twilio_video_v1.json' },
  { name: 'twilio-studio', path: 'https://raw.githubusercontent.com/twilio/twilio-oai/main/spec/json/twilio_studio_v2.json' },
  { name: 'twilio-conversations', path: 'https://raw.githubusercontent.com/twilio/twilio-oai/main/spec/json/twilio_conversations_v1.json' },
  { name: 'adyen-checkout', path: 'https://raw.githubusercontent.com/Adyen/adyen-openapi/main/json/CheckoutService-v71.json' },
  { name: 'discord', path: 'https://raw.githubusercontent.com/discord/discord-api-spec/main/specs/openapi.json' },
  { name: 'pokeapi', path: 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/openapi.yml' },
  // Small official specs from the OpenAPI Initiative — clean fixtures that cover 3.0/3.1 features
  // (links, callbacks, webhooks, examples) without needing a `strict: false` escape hatch.
  { name: 'tictactoe', path: 'https://raw.githubusercontent.com/OAI/learn.openapis.org/main/examples/v3.1/tictactoe.yaml' },
  { name: 'oai-petstore', path: 'https://raw.githubusercontent.com/OAI/learn.openapis.org/main/examples/v3.0/petstore.yaml' },
  { name: 'uspto', path: 'https://raw.githubusercontent.com/OAI/learn.openapis.org/main/examples/v3.0/uspto.yaml' },
  { name: 'api-with-examples', path: 'https://raw.githubusercontent.com/OAI/learn.openapis.org/main/examples/v3.0/api-with-examples.yaml' },
  { name: 'link-example', path: 'https://raw.githubusercontent.com/OAI/learn.openapis.org/main/examples/v3.0/link-example.yaml' },
  { name: 'callback-example', path: 'https://raw.githubusercontent.com/OAI/learn.openapis.org/main/examples/v3.0/callback-example.yaml' },
  { name: 'webhook-example', path: 'https://raw.githubusercontent.com/OAI/learn.openapis.org/main/examples/v3.1/webhook-example.yaml' },
  { name: 'non-oauth-scopes', path: 'https://raw.githubusercontent.com/OAI/learn.openapis.org/main/examples/v3.1/non-oauth-scopes.yaml' },
  { name: 'swagger-petstore', path: 'https://raw.githubusercontent.com/swagger-api/swagger-petstore/master/src/main/resources/openapi.yaml' },
  // Real-world specs from the APIs-guru aggregator (cloud, payments, comms, media). Machine-converted
  // to OpenAPI 3.0, so `strict: false` like the other loose real-world specs.
  { name: 'slack', path: 'https://raw.githubusercontent.com/APIs-guru/openapi-directory/main/APIs/slack.com/1.7.0/openapi.yaml' },
  { name: 'notion', path: 'https://raw.githubusercontent.com/APIs-guru/openapi-directory/main/APIs/notion.com/1.0.0/openapi.yaml' },
  { name: 'google-calendar', path: 'https://raw.githubusercontent.com/APIs-guru/openapi-directory/main/APIs/googleapis.com/calendar/v3/openapi.yaml' },
  { name: 'google-drive', path: 'https://raw.githubusercontent.com/APIs-guru/openapi-directory/main/APIs/googleapis.com/drive/v2/openapi.yaml' },
  { name: 'google-sheets', path: 'https://raw.githubusercontent.com/APIs-guru/openapi-directory/main/APIs/googleapis.com/sheets/v4/openapi.yaml' },
  { name: 'gmail', path: 'https://raw.githubusercontent.com/APIs-guru/openapi-directory/main/APIs/googleapis.com/gmail/v1/openapi.yaml' },
  { name: 'youtube', path: 'https://raw.githubusercontent.com/APIs-guru/openapi-directory/main/APIs/googleapis.com/youtube/v3/openapi.yaml' },
  { name: 'bigquery', path: 'https://raw.githubusercontent.com/APIs-guru/openapi-directory/main/APIs/googleapis.com/bigquery/v2/openapi.yaml' },
  { name: 'aws-s3', path: 'https://raw.githubusercontent.com/APIs-guru/openapi-directory/main/APIs/amazonaws.com/s3/2006-03-01/openapi.yaml' },
  { name: 'aws-lambda', path: 'https://raw.githubusercontent.com/APIs-guru/openapi-directory/main/APIs/amazonaws.com/lambda/2014-11-11/openapi.yaml' },
  { name: 'aws-dynamodb', path: 'https://raw.githubusercontent.com/APIs-guru/openapi-directory/main/APIs/amazonaws.com/dynamodb/2011-12-05/openapi.yaml' },
  { name: 'aws-ec2', path: 'https://raw.githubusercontent.com/APIs-guru/openapi-directory/main/APIs/amazonaws.com/ec2/2016-11-15/openapi.yaml' },
  { name: 'zoom', path: 'https://raw.githubusercontent.com/APIs-guru/openapi-directory/main/APIs/zoom.us/2.0.0/openapi.yaml' },
  { name: 'sendgrid', path: 'https://raw.githubusercontent.com/APIs-guru/openapi-directory/main/APIs/sendgrid.com/1.0.0/openapi.yaml' },
  { name: 'giphy', path: 'https://raw.githubusercontent.com/APIs-guru/openapi-directory/main/APIs/giphy.com/1.0/openapi.yaml' },
  { name: 'nasa-apod', path: 'https://raw.githubusercontent.com/APIs-guru/openapi-directory/main/APIs/nasa.gov/apod/1.0.0/openapi.yaml' },
  { name: 'nytimes-books', path: 'https://raw.githubusercontent.com/APIs-guru/openapi-directory/main/APIs/nytimes.com/books_api/3.0.0/openapi.yaml' },
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
    // The `gen` output is gitignored, which oxlint skips during directory traversal (its
    // `--no-ignore` flag only disables `.eslintignore`), so linting and formatting are disabled
    // for these e2e fixtures.
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
      enum: { type: 'asConst' },
    }),
    pluginReactQuery({
      output: {
        path: './clients/hooks',
      },
      group: { type: 'tag' },
    }),
    pluginAxios({
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
  return schemas.map(({ name, path }) => {
    return {
      ...baseConfig,
      name,
      output: {
        ...baseConfig.output,
        path: `./gen/${name}`,
      },
      input: {
        path,
      },
      hooks: {
        // Strict-typecheck the generated models + zod for every spec, so invalid generated output (a
        // type that does not compile) fails the run. The script handles the file discovery and a
        // per-spec tsconfig — kubb spawns hooks without a shell, so the logic cannot be inline.
        done: [`node ./typecheckGen.mjs ${name}`],
      },
    }
  })
})
