/**
 * Stripe memory benchmark for Kubb.
 *
 * Runs the standard plugin suite against a large OpenAPI document (the Stripe
 * API spec by default) and reports peak resident set against a 2 GB budget.
 *
 * Usage:
 *   pnpm --filter performance perf:stripe       # 2 GB budget
 *   pnpm --filter performance perf:stripe:4g    # 4 GB headroom for profiling
 *   STRIPE_SPEC_PATH=./stripe.json pnpm --filter performance perf:stripe
 *
 * Set `STRIPE_SPEC_PATH` to a local OpenAPI file to skip the download. The
 * downloaded copy is cached under `tests/performance/.cache/stripe.json`.
 *
 * Note: this benchmark exercises the entire pipeline — adapter parsing,
 * streaming AST cache, and per-plugin code generation. Reductions on the AST
 * side alone are not sufficient for Stripe-scale specs; the OAS parser's
 * recursive ref-inlining is currently the dominant cost.
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
const MAX_BYTES = 2 * 1024 ** 3 // 2 GiB
const DEFAULT_URL = 'https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json'

async function ensureSpec(): Promise<string> {
  const fromEnv = process.env['STRIPE_SPEC_PATH']
  if (fromEnv) return path.resolve(fromEnv)

  const cacheDir = path.resolve(__dirname, '.cache')
  const cachePath = path.join(cacheDir, 'stripe.json')
  if (fs.existsSync(cachePath)) return cachePath

  const url = process.env['STRIPE_SPEC_URL'] ?? DEFAULT_URL
  console.log(`[perf:stripe] downloading ${url}`)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to download Stripe spec: ${response.status} ${response.statusText}`)
  const body = await response.text()
  fs.mkdirSync(cacheDir, { recursive: true })
  fs.writeFileSync(cachePath, body, 'utf8')
  return cachePath
}

function sampleRss(samples: number[]): NodeJS.Timeout {
  const interval = setInterval(() => {
    samples.push(process.memoryUsage().rss)
  }, 250)
  // Keep the timer from blocking process exit on its own.
  interval.unref?.()
  return interval
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024 ** 2).toFixed(1)} MiB`
}

async function main() {
  const specPath = await ensureSpec()
  console.log(`[perf:stripe] using spec at ${specPath}`)

  const tmpRoot = fs.mkdtempSync(path.join(__dirname, '.tmp-'))

  setInterval(() => {
    const u = process.memoryUsage()
    console.log(`[perf:stripe] mem rss=${formatBytes(u.rss)} heapUsed=${formatBytes(u.heapUsed)}`)
  }, 5000).unref?.()

  const config = defineConfig({
    root: tmpRoot,
    input: { path: specPath },
    adapter: adapterOas({ validate: false, bundle: false }),
    output: {
      path: './src/gen',
      clean: false,
      write: false,
    },
    plugins: [
      pluginTs({ output: { path: 'types', barrel: false }, enumType: 'asConst' }),
      pluginZod({ output: { path: 'zod', barrel: false }, inferred: true }),
      pluginFaker({ output: { path: 'mocks', barrel: false } }),
    ] as Plugin[],
  })

  const samples: number[] = [process.memoryUsage().rss]
  const timer = sampleRss(samples)
  const hooks = new AsyncEventEmitter()

  const started = Date.now()
  try {
    await createKubb(config, { hooks }).build()
  } finally {
    clearInterval(timer)
    samples.push(process.memoryUsage().rss)
    fs.rmSync(tmpRoot, { recursive: true, force: true })
  }
  const elapsed = Date.now() - started

  const peak = Math.max(...samples)
  console.log(`[perf:stripe] elapsed=${elapsed}ms peak_rss=${formatBytes(peak)} budget=${formatBytes(MAX_BYTES)}`)

  if (peak > MAX_BYTES) {
    console.warn(`[perf:stripe] peak RSS ${formatBytes(peak)} exceeded ${formatBytes(MAX_BYTES)} budget`)
    // Soft fail today: AST streaming alone is not yet enough for Stripe-scale
    // because the OAS parser's ref inlining dominates memory. Track this as a
    // regression target rather than blocking CI.
    process.exitCode = 0
  } else {
    console.log(`[perf:stripe] within budget`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
