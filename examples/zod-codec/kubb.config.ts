import { adapterOas } from '@kubb/adapter-oas'
import { parserTs } from '@kubb/parser-ts'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginZod } from '@kubb/plugin-zod'
import { defineConfig } from 'kubb/config'
import { customCodecs } from './codecs.ts'

export default defineConfig({
  root: '.',
  input: './petStore.yaml',
  output: {
    path: './src/gen',
    clean: true,
    barrel: false,
    format: false,
    lint: false,
  },
  adapter: adapterOas({ server: { index: 0 } }),
  parsers: [parserTs({ extension: { '.ts': '.ts' } })],
  plugins: [
    pluginZod({
      // infer codec types per direction (request & params: domain -> wire, response: wire -> domain)
      inferred: 'direction',
      output: {
        path: './zod',
        barrel: false,
      },
      printer: {
        nodes: customCodecs,
      },
    }),
    pluginFetch({
      // validate every slot with zod so the codecs run on params, body, and response
      validator: {
        request: 'zod',
        params: 'zod',
        response: 'zod',
      },
      output: {
        path: './clients',
        barrel: false,
      },
    }),
  ],
})
