/**
 * Mid-sized OAS benchmark used to measure the before/after delta of the
 * streaming AST cache. Reports peak RSS for full-pipeline code generation.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { adapterOas } from '@kubb/adapter-oas'
import { AsyncEventEmitter, createKubb, type Plugin } from '@kubb/core'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { defineConfig } from 'kubb'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const specPath = path.resolve(__dirname, '.cache', 'synth.json')

function formatBytes(bytes: number): string {
  return `${(bytes / 1024 ** 2).toFixed(1)} MiB`
}

async function main() {
  if (!fs.existsSync(specPath)) {
    console.error(`spec not found at ${specPath}; run synth-spec.ts first`)
    process.exit(1)
  }

  const tmpRoot = fs.mkdtempSync(path.join(__dirname, '.tmp-'))
  const samples: number[] = [process.memoryUsage().rss]
  const interval = setInterval(() => {
    samples.push(process.memoryUsage().rss)
  }, 250)
  interval.unref?.()

  const config = defineConfig({
    root: tmpRoot,
    input: { path: specPath },
    adapter: adapterOas({ validate: false, bundle: false }),
    output: { path: './src/gen', clean: false, write: false },
    plugins: [
      pluginTs({ output: { path: 'types', barrel: false }, enumType: 'asConst' }),
      pluginZod({ output: { path: 'zod', barrel: false }, inferred: true }),
      pluginFaker({ output: { path: 'mocks', barrel: false } }),
    ] as Plugin[],
  })

  const started = Date.now()
  let outcome = 'ok'
  try {
    await createKubb(config, { hooks: new AsyncEventEmitter() }).build()
  } catch (err) {
    outcome = `error: ${(err as Error).message?.slice(0, 80)}`
  } finally {
    clearInterval(interval)
    samples.push(process.memoryUsage().rss)
    fs.rmSync(tmpRoot, { recursive: true, force: true })
  }

  const peak = Math.max(...samples)
  console.log(`[perf:medium] elapsed=${Date.now() - started}ms peak_rss=${formatBytes(peak)} samples=${samples.length} outcome=${outcome}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
