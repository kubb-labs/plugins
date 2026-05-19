/**
 * Comparative benchmarks: Kubb vs Orval vs Hey-API
 *
 * Measures performance (time + memory) of three OpenAPI code generators across:
 * - 3 schemas: petStore (~22 KB, small), twitter (~375 KB, medium), stripe (~7.7 MB, large)
 * - 7 plugin combinations:
 *     A) TypeScript only
 *     B) TypeScript + Client (fetch)
 *     C) TypeScript + Zod
 *     D) TypeScript + React-Query + Zod
 *     E) TypeScript + Vue-Query + Zod
 *     F) TypeScript + MSW  (mock handlers)
 *     G) TypeScript + Faker (mock data factories)  – Hey-API has no equivalent
 *
 * Disk I/O policy:
 *   Kubb    → write: false   (pure in-memory, no disk I/O)
 *   Hey-API → dryRun: true   (pure in-memory, no disk I/O)
 *   Orval   → writes to /tmp (disk I/O is part of its cost; no dry-run API exists)
 *
 * Run from the benchmark directory:
 *   pnpm bench
 */

import { mkdirSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient as heyApiCreate, type UserConfig as HeyApiConfig } from '@hey-api/openapi-ts'
import { adapterOas } from '@kubb/adapter-oas'
import { AsyncEventEmitter, createKubb, type Plugin } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginMsw } from '@kubb/plugin-msw'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginVueQuery } from '@kubb/plugin-vue-query'
import { pluginZod } from '@kubb/plugin-zod'
import { defineConfig } from 'kubb'
import { generate as orvalGenerate } from 'orval'
import { afterAll, bench, describe } from 'vitest'

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCHEMAS = path.resolve(__dirname, '../../schemas/3.0.x')
const TMP_ORVAL = path.join(os.tmpdir(), 'kubb-benchmark', 'orval')

mkdirSync(TMP_ORVAL, { recursive: true })

const schema = {
  petStore: path.join(SCHEMAS, 'petStore.yaml'),
  twitter: path.join(SCHEMAS, 'twitter.json'),
  stripe: path.join(SCHEMAS, 'stripe.json'),
}

// ---------------------------------------------------------------------------
// Memory tracking
// ---------------------------------------------------------------------------

const memDeltas = new Map<string, number[]>()

function recordMem(key: string, baseline: number) {
  const delta = process.memoryUsage().heapUsed - baseline
  const bucket = memDeltas.get(key) ?? []
  bucket.push(delta)
  memDeltas.set(key, bucket)
}

// ---------------------------------------------------------------------------
// Kubb plugin stacks (write: false = pure in-memory, no disk I/O)
// ---------------------------------------------------------------------------

const ts = () => pluginTs({ output: { path: 'types', barrel: false }, enumType: 'asConst' })
const zod = () => pluginZod({ output: { path: 'zod', barrel: false } })
const rq = () => pluginReactQuery({ output: { path: 'hooks' } })
const vq = () => pluginVueQuery({ output: { path: 'hooks' } })
const client = () => pluginClient({ output: { path: 'client' } })
const msw = () => pluginMsw({ output: { path: 'msw' } })
const faker = () => pluginFaker({ output: { path: 'faker' } })

const kubbTsOnly: Plugin[] = [ts()] as Plugin[]
const kubbTsClient: Plugin[] = [ts(), client()] as Plugin[]
const kubbTsZod: Plugin[] = [ts(), zod()] as Plugin[]
const kubbTsZodRq: Plugin[] = [ts(), zod(), rq()] as Plugin[]
const kubbTsZodVq: Plugin[] = [ts(), zod(), vq()] as Plugin[]
const kubbTsMsw: Plugin[] = [ts(), msw()] as Plugin[]
const kubbTsFaker: Plugin[] = [ts(), faker()] as Plugin[]

async function runKubb(schemaPath: string, plugins: Plugin[]) {
  const config = defineConfig({
    root: '.',
    input: { path: schemaPath },
    adapter: adapterOas({ validate: false }),
    output: { path: './src/gen', clean: false, write: false },
    plugins,
  })
  await createKubb(config, { hooks: new AsyncEventEmitter() }).build()
}

// ---------------------------------------------------------------------------
// Orval runners (always writes to /tmp; no dry-run API)
// ---------------------------------------------------------------------------

type OrvalClient = 'fetch' | 'axios' | 'react-query' | 'vue-query'

const ZOD_GENERATE = {
  generate: { body: true, query: true, param: true, header: true, response: true },
}

async function runOrval(schemaPath: string, opts: { client: OrvalClient; withZod?: boolean; mock?: boolean | 'msw' }) {
  await orvalGenerate(
    {
      input: { target: schemaPath, validation: false },
      output: {
        target: path.join(TMP_ORVAL, 'api.ts'),
        client: opts.client,
        mode: 'single',
        clean: false,
        ...(opts.withZod ? { override: { zod: ZOD_GENERATE } } : {}),
        ...(opts.mock ? { mock: opts.mock } : {}),
      },
    },
    __dirname,
  )
}

// ---------------------------------------------------------------------------
// Hey-API runners (dryRun: true = pure in-memory, no disk I/O)
// ---------------------------------------------------------------------------

async function runHeyApi(schemaPath: string, plugins: HeyApiConfig['plugins']) {
  await heyApiCreate({
    input: schemaPath,
    output: path.join(os.tmpdir(), 'kubb-benchmark', 'heyapi'),
    plugins,
    dryRun: true,
    logs: { level: 'silent' },
  })
}

// ---------------------------------------------------------------------------
// Memory report (printed once after all benchmarks finish)
// ---------------------------------------------------------------------------

afterAll(() => {
  const MB = (n: number) => `${(Math.abs(n) / 1_048_576).toFixed(2)} MB`
  const lines: string[] = [
    '',
    '══════════════════════════════════════════════════════════════════════',
    '  Memory Usage Report (approximate heap delta per iteration)',
    '══════════════════════════════════════════════════════════════════════',
  ]

  for (const [key, deltas] of memDeltas) {
    if (deltas.length === 0) continue
    const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length
    const max = Math.max(...deltas)
    const min = Math.min(...deltas)
    lines.push(`  ${key.padEnd(60)} avg ${MB(avg).padStart(9)}  min ${MB(min).padStart(9)}  max ${MB(max).padStart(9)}  (n=${deltas.length})`)
  }

  lines.push('══════════════════════════════════════════════════════════════════════')
  console.log(lines.join('\n'))
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBenchFn(key: string, fn: () => Promise<void>) {
  return async () => {
    const baseline = process.memoryUsage().heapUsed
    await fn()
    recordMem(key, baseline)
  }
}

// ---------------------------------------------------------------------------
// Iteration budgets
// ---------------------------------------------------------------------------

// For twitter/stripe, hey-api is much slower so it gets fewer iterations.
// Stripe hey-api excluded entirely (>2 min/run).
const psFull = { iterations: 5, warmupIterations: 1 }  // petStore: all tools
const twFull = { iterations: 3, warmupIterations: 1 }  // twitter: kubb + orval
const twSlow = { iterations: 1, warmupIterations: 0 }  // twitter: hey-api
const stFull = { iterations: 2, warmupIterations: 1 }  // stripe: kubb + orval

// ---------------------------------------------------------------------------
// Benchmark suites
// ---------------------------------------------------------------------------

// Helper: build a suite for one plugin combo across all three schemas
function suite(
  label: string,
  kubbPlugins: Plugin[],
  orvalOpts: Parameters<typeof runOrval>[1],
  heyApiPlugins: HeyApiConfig['plugins'] | null, // null = no hey-api equivalent
) {
  const k = label.replace(/\s+/g, '')

  describe(`petStore (small ~22 KB) › ${label}`, () => {
    bench('kubb',    makeBenchFn(`petStore › ${label} › kubb`,    () => runKubb(schema.petStore, kubbPlugins)), psFull)
    bench('orval',   makeBenchFn(`petStore › ${label} › orval`,   () => runOrval(schema.petStore, orvalOpts)), psFull)
    if (heyApiPlugins) bench('hey-api', makeBenchFn(`petStore › ${label} › hey-api`, () => runHeyApi(schema.petStore, heyApiPlugins)), psFull)
  })

  describe(`twitter (medium ~375 KB) › ${label}`, () => {
    bench('kubb',    makeBenchFn(`twitter › ${label} › kubb`,    () => runKubb(schema.twitter, kubbPlugins)), twFull)
    bench('orval',   makeBenchFn(`twitter › ${label} › orval`,   () => runOrval(schema.twitter, orvalOpts)), twFull)
    if (heyApiPlugins) bench('hey-api', makeBenchFn(`twitter › ${label} › hey-api`, () => runHeyApi(schema.twitter, heyApiPlugins)), twSlow)
  })

  // stripe: hey-api excluded (>2 min/run)
  describe(`stripe (large ~7.7 MB) › ${label}`, () => {
    bench('kubb',  makeBenchFn(`stripe › ${label} › kubb`,  () => runKubb(schema.stripe, kubbPlugins)), stFull)
    bench('orval', makeBenchFn(`stripe › ${label} › orval`, () => runOrval(schema.stripe, orvalOpts)), stFull)
  })
}

// A) TypeScript only
suite(
  'TypeScript only',
  kubbTsOnly,
  { client: 'fetch' },
  ['@hey-api/typescript'],
)

// B) TypeScript + Client (fetch)
suite(
  'TypeScript + Client',
  kubbTsClient,
  { client: 'fetch' },
  ['@hey-api/typescript', '@hey-api/sdk', '@hey-api/client-fetch'],
)

// C) TypeScript + Zod
suite(
  'TypeScript + Zod',
  kubbTsZod,
  { client: 'fetch', withZod: true },
  ['@hey-api/typescript', 'zod'],
)

// D) TypeScript + React-Query + Zod
suite(
  'TypeScript + React-Query + Zod',
  kubbTsZodRq,
  { client: 'react-query', withZod: true },
  ['@hey-api/typescript', 'zod', '@tanstack/react-query'],
)

// E) TypeScript + Vue-Query + Zod
suite(
  'TypeScript + Vue-Query + Zod',
  kubbTsZodVq,
  { client: 'vue-query', withZod: true },
  ['@hey-api/typescript', 'zod', '@tanstack/vue-query'],
)

// F) TypeScript + MSW
suite(
  'TypeScript + MSW',
  kubbTsMsw,
  { client: 'fetch', mock: 'msw' },
  ['@hey-api/typescript', '@hey-api/msw'],
)

// G) TypeScript + Faker  (Hey-API has no faker equivalent)
suite(
  'TypeScript + Faker',
  kubbTsFaker,
  { client: 'fetch', mock: true },
  null, // no hey-api equivalent
)
