import { adapterOas } from '@kubb/adapter-oas'
import { pluginAxios } from '@kubb/plugin-axios'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig } from 'kubb/config'

const specs = ['petstore3.json', 'httpbin.yaml', 'wikimedia.yaml', 'local-sse.yaml'] as const
const baseURLs: Partial<Record<(typeof specs)[number], string>> = {
  'petstore3.json': 'https://petstore3.swagger.io/api/v3',
  'httpbin.yaml': 'https://httpbin.org',
  'wikimedia.yaml': 'https://stream.wikimedia.org',
}

// One fetch and one axios client per document, so each suite runs the same calls through both transports.
export default specs.flatMap((spec) =>
  (['fetch', 'axios'] as const).map((flavor) => {
    const name = `${spec.split('.')[0]}-${flavor}`
    const plugin = flavor === 'fetch' ? pluginFetch : pluginAxios
    return defineConfig({
      name,
      root: '.',
      input: `./specs/${spec}`,
      output: { path: `./gen/${name}`, clean: true, barrel: { type: 'named' }, format: false, lint: false },
      // The local SSE document is OpenAPI 3.2, which the validator does not cover yet.
      adapter: adapterOas({ unknownType: 'unknown', validate: false }),
      plugins: [
        pluginTs({ output: { path: 'models', barrel: { type: 'named' } } }),
        plugin({ output: { path: './clients', barrel: { type: 'named' } }, baseURL: baseURLs[spec] }),
      ],
    })
  }),
)
