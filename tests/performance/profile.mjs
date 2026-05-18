/**
 * Profile script — run with:
 *   node --prof tests/performance/profile.mjs
 *   node --prof-process isolate-*.log > profile.txt
 *
 * Uses the installed (dist) packages to avoid tsx/alias issues.
 * Runs kubb beta.16 streaming on twitter.json 5 times to get enough samples.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { adapterOas } from '@kubb/adapter-oas'
import { AsyncEventEmitter, createKubb } from '@kubb/core'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { defineConfig } from 'kubb'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../..')
const specPath = path.resolve(__dirname, '../../schemas/3.0.x/twitter.json')

const plugins = [
  pluginTs({ output: { path: 'types', barrel: false }, enumType: 'asConst' }),
  pluginZod({ output: { path: 'zod', barrel: false }, inferred: true }),
]

async function run() {
  const adapter = adapterOas({ validate: false })
  const config = defineConfig({
    root: rootDir,
    input: { path: specPath },
    adapter,
    output: { path: './src/gen', clean: false, write: false },
    plugins,
  })
  await createKubb(config, { hooks: new AsyncEventEmitter() }).build()
}

// one warmup, then profiled runs
await run()
const RUNS = 5
const t0 = performance.now()
for (let i = 0; i < RUNS; i++) await run()
console.log(`${RUNS} runs: ${Math.round(performance.now() - t0)} ms total, ${Math.round((performance.now() - t0) / RUNS)} ms avg`)
