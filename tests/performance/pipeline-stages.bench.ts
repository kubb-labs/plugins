/**
 * Pipeline stage isolation for kubb beta.16 on twitter.json (236 schemas).
 *
 * Isolates each pipeline stage by diffing run times:
 *
 *   baseline  full build with a no-op plugin (framework + adapter only)
 *   tsOnly    full build with plugin-ts
 *   tsZod     full build with plugin-ts + plugin-zod
 *
 *   tsOnly  − baseline  =  generators + JSX render + TypeScript print  (plugin-ts)
 *   tsZod   − tsOnly    =  marginal cost of adding plugin-zod
 *
 * Run with:  pnpm test:bench
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Adapter } from '@kubb/core'
import { adapterOas } from '@kubb/adapter-oas'
import { AsyncEventEmitter, createKubb, definePlugin, type Plugin } from '@kubb/core'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { defineConfig } from 'kubb'
import { bench, describe, afterAll } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const specPath = path.resolve(__dirname, '../../schemas/3.0.x/twitter.json')

function batchAdapter(): Adapter {
  const { count: _c, stream: _s, ...rest } = adapterOas({ validate: false }) as Adapter & { count?: unknown; stream?: unknown }
  return rest as Adapter
}

function streamAdapter(): Adapter {
  return adapterOas({ validate: false })
}

// A plugin that registers no generators — measures pure framework + adapter overhead
const noopPlugin = definePlugin(() => ({
  name: 'noop',
})) as unknown as Plugin

const tsPlugins = [pluginTs({ output: { path: 'types', barrel: false }, enumType: 'asConst' })] as Plugin[]
const tsZodPlugins = [
  pluginTs({ output: { path: 'types', barrel: false }, enumType: 'asConst' }),
  pluginZod({ output: { path: 'zod', barrel: false }, inferred: true }),
] as Plugin[]

const totals: Record<string, { ms: number; n: number }> = {}
function record(label: string, ms: number) {
  totals[label] ??= { ms: 0, n: 0 }
  totals[label]!.ms += ms
  totals[label]!.n++
}

async function run(label: string, adapter: Adapter, plugins: Plugin[]) {
  const t = performance.now()
  await createKubb(
    defineConfig({ root: '.', input: { path: specPath }, adapter, output: { path: './src/gen', clean: false, write: false }, plugins }),
    { hooks: new AsyncEventEmitter() },
  ).build()
  record(label, performance.now() - t)
}

describe('Pipeline stage isolation — twitter.json (236 schemas)', () => {
  bench('baseline — stream  noop plugin', async () => {
    await run('baseline', streamAdapter(), [noopPlugin])
  }, { iterations: 5, warmupIterations: 1 })

  bench('stream  — plugin-ts only', async () => {
    await run('streamTs', streamAdapter(), tsPlugins)
  }, { iterations: 5, warmupIterations: 1 })

  bench('batch   — plugin-ts only', async () => {
    await run('batchTs', batchAdapter(), tsPlugins)
  }, { iterations: 5, warmupIterations: 1 })

  bench('stream  — plugin-ts + plugin-zod', async () => {
    await run('streamTsZod', streamAdapter(), tsZodPlugins)
  }, { iterations: 5, warmupIterations: 1 })

  bench('batch   — plugin-ts + plugin-zod', async () => {
    await run('batchTsZod', batchAdapter(), tsZodPlugins)
  }, { iterations: 5, warmupIterations: 1 })
})

afterAll(() => {
  const avg = (key: string) => {
    const e = totals[key]
    return e && e.n > 0 ? e.ms / e.n : NaN
  }

  const baseline    = avg('baseline')
  const streamTs    = avg('streamTs')
  const batchTs     = avg('batchTs')
  const streamTsZod = avg('streamTsZod')
  const batchTsZod  = avg('batchTsZod')

  const row = (label: string, ms: number, extra = '') =>
    console.log(`  ${label.padEnd(42)} ${ms.toFixed(0).padStart(6)} ms${extra}`)

  console.log('\n── Pipeline stage isolation (avg ms, twitter.json 236 schemas) ──\n')
  row('baseline  (framework + adapter only)', baseline)
  row('stream — plugin-ts', streamTs)
  row('batch  — plugin-ts', batchTs)
  row('stream — plugin-ts + plugin-zod', streamTsZod)
  row('batch  — plugin-ts + plugin-zod', batchTsZod)

  console.log('\n  Derived costs (avg over 5 iterations):')
  row('adapter + framework overhead', baseline)
  row('plugin-ts work (generators+JSX+print, stream)', streamTs - baseline, `  [${((streamTs - baseline) / streamTs * 100).toFixed(0)}% of total]`)
  row('plugin-ts work (generators+JSX+print, batch)',  batchTs  - baseline, `  [${((batchTs  - baseline) / batchTs  * 100).toFixed(0)}% of total]`)
  row('plugin-zod marginal cost (stream)',             streamTsZod - streamTs)
  row('plugin-zod marginal cost (batch)',              batchTsZod  - batchTs)
  row('streaming speedup for plugin-ts',              batchTs - streamTs, `  [${(batchTs / streamTs).toFixed(2)}× batch/stream]`)
  row('streaming speedup for ts+zod',                 batchTsZod - streamTsZod, `  [${(batchTsZod / streamTsZod).toFixed(2)}× batch/stream]`)
  console.log()
})
