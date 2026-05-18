import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Adapter } from '@kubb/core'
import { adapterOas } from '@kubb/adapter-oas'
import { AsyncEventEmitter, createKubb, type Plugin } from '@kubb/core'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { defineConfig } from 'kubb'
import { bench, describe } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const schemasDir = path.resolve(__dirname, '../../schemas/3.0.x')
const twitterPath = path.resolve(schemasDir, 'twitter.json')
const digitaloceanPath = path.resolve(schemasDir, 'digitalocean.yaml')
const bunqPath = path.resolve(schemasDir, 'bunq.com.json')

/**
 * Strips `count` and `stream` from an adapter, forcing the core to use
 * the batch `parse()` path regardless of spec size.
 */
function batchOnly(adapter: Adapter): Adapter {
  const { count: _count, stream: _stream, ...rest } = adapter as Adapter & {
    count?: unknown
    stream?: unknown
  }
  return rest as Adapter
}

function buildConfig(specPath: string, streaming: boolean, plugins: Plugin[]) {
  const adapter = adapterOas({ validate: false })
  return defineConfig({
    root: '.',
    input: { path: specPath },
    adapter: streaming ? adapter : batchOnly(adapter),
    output: { path: './src/gen', clean: false, write: false },
    plugins,
  })
}

const tsOnly: Plugin[] = [
  pluginTs({
    output: { path: 'types', barrel: false },
    enumType: 'asConst',
  }),
] as Plugin[]

const tsAndZod: Plugin[] = [
  pluginTs({
    output: { path: 'types', barrel: false },
    enumType: 'asConst',
  }),
  pluginZod({
    output: { path: 'zod', barrel: false },
    inferred: true,
  }),
] as Plugin[]

describe('stream vs batch — twitter.json (236 schemas)', () => {
  bench('batch — plugin-ts', async () => {
    const hooks = new AsyncEventEmitter()
    await createKubb(buildConfig(twitterPath, false, tsOnly), { hooks }).build()
  }, { iterations: 3, warmupIterations: 1 })

  bench('stream — plugin-ts', async () => {
    const hooks = new AsyncEventEmitter()
    await createKubb(buildConfig(twitterPath, true, tsOnly), { hooks }).build()
  }, { iterations: 3, warmupIterations: 1 })

  bench('batch — plugin-ts + plugin-zod', async () => {
    const hooks = new AsyncEventEmitter()
    await createKubb(buildConfig(twitterPath, false, tsAndZod), { hooks }).build()
  }, { iterations: 3, warmupIterations: 1 })

  bench('stream — plugin-ts + plugin-zod', async () => {
    const hooks = new AsyncEventEmitter()
    await createKubb(buildConfig(twitterPath, true, tsAndZod), { hooks }).build()
  }, { iterations: 3, warmupIterations: 1 })
})

describe('stream vs batch — digitalocean.yaml (312 schemas)', () => {
  bench('batch — plugin-ts', async () => {
    const hooks = new AsyncEventEmitter()
    await createKubb(buildConfig(digitaloceanPath, false, tsOnly), { hooks }).build()
  }, { iterations: 3, warmupIterations: 1 })

  bench('stream — plugin-ts', async () => {
    const hooks = new AsyncEventEmitter()
    await createKubb(buildConfig(digitaloceanPath, true, tsOnly), { hooks }).build()
  }, { iterations: 3, warmupIterations: 1 })

  bench('batch — plugin-ts + plugin-zod', async () => {
    const hooks = new AsyncEventEmitter()
    await createKubb(buildConfig(digitaloceanPath, false, tsAndZod), { hooks }).build()
  }, { iterations: 3, warmupIterations: 1 })

  bench('stream — plugin-ts + plugin-zod', async () => {
    const hooks = new AsyncEventEmitter()
    await createKubb(buildConfig(digitaloceanPath, true, tsAndZod), { hooks }).build()
  }, { iterations: 3, warmupIterations: 1 })
})

describe('stream vs batch — bunq.com.json (617 schemas)', () => {
  bench('batch — plugin-ts', async () => {
    const hooks = new AsyncEventEmitter()
    await createKubb(buildConfig(bunqPath, false, tsOnly), { hooks }).build()
  }, { iterations: 3, warmupIterations: 1 })

  bench('stream — plugin-ts', async () => {
    const hooks = new AsyncEventEmitter()
    await createKubb(buildConfig(bunqPath, true, tsOnly), { hooks }).build()
  }, { iterations: 3, warmupIterations: 1 })

  bench('batch — plugin-ts + plugin-zod', async () => {
    const hooks = new AsyncEventEmitter()
    await createKubb(buildConfig(bunqPath, false, tsAndZod), { hooks }).build()
  }, { iterations: 3, warmupIterations: 1 })

  bench('stream — plugin-ts + plugin-zod', async () => {
    const hooks = new AsyncEventEmitter()
    await createKubb(buildConfig(bunqPath, true, tsAndZod), { hooks }).build()
  }, { iterations: 3, warmupIterations: 1 })
})
