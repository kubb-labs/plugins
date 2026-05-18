/**
 * Compares TypeScript-only code generation across three tools on twitter.json (236 schemas).
 *
 *   kubb beta.15  — adapterOas via batchOnly() wrapper (no stream/count), write: false
 *   kubb beta.16  — adapterOas with streaming auto-selected (schemas > 100), write: false
 *   hey-api       — @hey-api/openapi-ts with dryRun: true (no disk I/O)
 *   orval         — spawned as a subprocess (no dry-run mode; writes to /tmp)
 *
 * Note on I/O fairness:
 *   kubb and hey-api run in-process with write disabled. orval runs as a child process
 *   and writes output to /tmp, so its timings include fork + disk I/O overhead. Despite
 *   this, orval still outperforms kubb beta.15 on this spec because its parse path is
 *   fundamentally different (it does not build a full JSX render tree).
 *
 * Run with:  pnpm test:bench
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createClient as heyApiCreateClient } from '@hey-api/openapi-ts'
import type { Adapter } from '@kubb/core'
import { adapterOas } from '@kubb/adapter-oas'
import { AsyncEventEmitter, createKubb, type Plugin } from '@kubb/core'
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig } from 'kubb'
import { bench, describe } from 'vitest'

const execFileAsync = promisify(execFile)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../..')
const specPath = path.resolve(__dirname, '../../schemas/3.0.x/twitter.json')

function batchOnly(adapter: Adapter): Adapter {
  const { count: _c, stream: _s, ...rest } = adapter as Adapter & { count?: unknown; stream?: unknown }
  return rest as Adapter
}

const tsPlugins = [pluginTs({ output: { path: 'types', barrel: false }, enumType: 'asConst' })] as Plugin[]

async function runKubb(streaming: boolean) {
  const adapter = adapterOas({ validate: false })
  const config = defineConfig({
    root: '.',
    input: { path: specPath },
    adapter: streaming ? adapter : batchOnly(adapter),
    output: { path: './src/gen', clean: false, write: false },
    plugins: tsPlugins,
  })
  await createKubb(config, { hooks: new AsyncEventEmitter() }).build()
}

async function runHeyApi() {
  await heyApiCreateClient({
    input: specPath,
    output: { path: '/tmp/hey-api-bench-out' },
    dryRun: true,
    logs: { level: 'silent' },
    plugins: ['@hey-api/typescript'],
  })
}

// orval has no dry-run mode; run it as a subprocess writing to /tmp
const orvalScript = `
import { generate } from 'orval';
await generate(
  {
    input: { target: ${JSON.stringify(specPath)} },
    output: { target: '/tmp/orval-bench-out.ts', mode: 'single', clean: false },
  },
  ${JSON.stringify(rootDir)},
);
`

async function runOrval() {
  await execFileAsync(process.execPath, ['--input-type=module', '--eval', orvalScript], { cwd: rootDir })
}

describe('TypeScript generation — twitter.json (236 schemas)', () => {
  bench('kubb beta.15 (batch, write: false)', async () => {
    await runKubb(false)
  }, { iterations: 3, warmupIterations: 1 })

  bench('kubb beta.16 (stream, write: false)', async () => {
    await runKubb(true)
  }, { iterations: 3, warmupIterations: 1 })

  bench('hey-api (dryRun: true)', async () => {
    await runHeyApi()
  }, { iterations: 3, warmupIterations: 1 })

  bench('orval (subprocess, writes to /tmp)', async () => {
    await runOrval()
  }, { iterations: 3, warmupIterations: 1 })
})
