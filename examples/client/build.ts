import { adapterOas } from '@kubb/adapter-oas'
import { createKubb } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginTs } from '@kubb/plugin-ts'

async function run() {
  const kubb = createKubb({
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen2',
      clean: true,
    },
    adapter: adapterOas(),
    parsers: [parserTs],
    plugins: [pluginTs({ output: { path: './models', barrelType: false } })],
  })
  await kubb.build()
}

run()
