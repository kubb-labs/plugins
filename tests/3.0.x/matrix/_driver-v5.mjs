#!/usr/bin/env node
/**
 * v5 single-cell driver. Copied into a v5 sandbox dir (e.g.
 * /home/user/plugins/examples/advanced) by the matrix runner so that
 * `kubb` and `@kubb/*` imports resolve to the local workspace packages.
 *
 * Args: [configPath, outAbs]
 */

import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const [, , configPath, outAbs] = process.argv
if (!configPath || !outAbs) {
  console.error('usage: node _driver-v5.mjs <configPath> <outAbs>')
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
  if (typeof core.createKubb !== 'function') {
    console.error('v5 sandbox missing createKubb export')
    process.exit(5)
  }
  const result = await core.createKubb(finalCfg).safeBuild()
  if (result.error) {
    console.error('v5 build error:', result.error.message ?? result.error)
    process.exit(3)
  }
  if (result.failedPlugins && result.failedPlugins.size > 0) {
    const errs = [...result.failedPlugins].map((it) => `${it.plugin?.name ?? it}: ${it.error?.message ?? ''}`).join('; ')
    console.error('v5 failed plugins:', errs)
    process.exit(4)
  }
  console.log(`v5 generated ${result.files?.length ?? 0} files to ${output}`)
}

if (Array.isArray(cfg)) {
  for (const c of cfg) await runOne(c, resolve(outAbs, c.name ?? 'default'))
} else {
  await runOne(cfg, outAbs)
}
