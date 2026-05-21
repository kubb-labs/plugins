#!/usr/bin/env node
/**
 * v4 single-cell driver. Copied into a v4 sandbox dir (e.g.
 * /tmp/kubb-v4/examples/advanced) by the matrix runner so that
 * `@kubb/*` imports resolve to the v4 worktree's built packages.
 *
 * Args: [configPath, outAbs]
 */

import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const [, , configPath, outAbs] = process.argv
if (!configPath || !outAbs) {
  console.error('usage: node _driver-v4.mjs <configPath> <outAbs>')
  process.exit(2)
}

const core = await import('@kubb/core')
const cfgUrl = pathToFileURL(resolve(configPath)).href
const mod = await import(cfgUrl)
let cfg = mod.default ?? mod.config
if (typeof cfg === 'function') cfg = await cfg({})
if (cfg && typeof cfg.then === 'function') cfg = await cfg

async function runOne(userCfg, output) {
  const finalCfg = {
    ...userCfg,
    output: { ...userCfg.output, path: output, clean: true, format: false, lint: false },
    hooks: undefined,
  }
  const result = await core.safeBuild({ config: finalCfg })
  if (result.error) {
    console.error('v4 build error:', result.error.message ?? result.error)
    process.exit(3)
  }
  if (result.failedPlugins && result.failedPlugins.size > 0) {
    const errs = [...result.failedPlugins].map((it) => `${it.plugin?.name}: ${it.error?.message}`).join('; ')
    console.error('v4 failed plugins:', errs)
    process.exit(4)
  }
  console.log(`v4 generated ${result.files?.length ?? 0} files to ${output}`)
}

if (Array.isArray(cfg)) {
  for (const c of cfg) await runOne(c, resolve(outAbs, c.name ?? 'default'))
} else {
  await runOne(cfg, outAbs)
}
