/**
 * orval v8 publishes packages with a "development" export condition pointing to
 * TypeScript source files that are NOT included in the npm package. vitest passes
 * --conditions development to its worker processes, causing Node.js to resolve
 * @orval/* to non-existent .ts paths and fail with ERR_MODULE_NOT_FOUND.
 *
 * This script removes the broken "development" condition from every orval-related
 * package.json found in the pnpm store after installation.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const pnpmStore = resolve(__dirname, '../../../node_modules/.pnpm')

// Find all package.json files containing "development" export condition
let candidates
try {
  candidates = execSync(
    `grep -rl '"development"' "${pnpmStore}" --include='package.json' 2>/dev/null || true`,
    { encoding: 'utf8' },
  )
    .trim()
    .split('\n')
    .filter((f) => f && f.includes('orval'))
} catch {
  candidates = []
}

let patched = 0

for (const pkgJson of candidates) {
  let raw
  try {
    raw = JSON.parse(readFileSync(pkgJson, 'utf8'))
  } catch {
    continue
  }

  let changed = false
  for (const key of Object.keys(raw.exports ?? {})) {
    const val = raw.exports[key]
    if (val && typeof val === 'object' && 'development' in val) {
      delete val.development
      changed = true
    }
  }

  if (changed) {
    writeFileSync(pkgJson, JSON.stringify(raw, null, 2))
    console.log(`patched ${pkgJson}`)
    patched++
  }
}

if (patched === 0) {
  console.log('patch-orval: nothing to patch')
} else {
  console.log(`patch-orval: patched ${patched} package(s)`)
}
