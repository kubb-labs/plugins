#!/usr/bin/env node
/**
 * Kubb v4 ↔ v5 matrix runner.
 *
 * For each cell:
 *   1. Write a v4 config + v5 config (each cell exports both as code strings).
 *   2. Run each side by spawning a child Node process inside its respective
 *      sandbox dir (so node-module resolution finds the right @kubb/* packages).
 *   3. Walk the output trees, diff, classify each file as identical/expected/unexpected.
 *   4. Append the result to /tmp/matrix-out/report/<cellName>.json.
 *
 * Finally, regenerate tests/3.0.x/matrix/REPORT.md from every cell result.
 */

import { execFileSync } from 'node:child_process'
import { copyFileSync, readdirSync, readFileSync, mkdirSync, writeFileSync, existsSync, rmSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { cells } from './cells.mjs'
import { expectations } from './expectations.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const V4_SANDBOX = '/tmp/kubb-v4/examples/advanced'
const V5_SANDBOX = '/home/user/plugins/examples/advanced'
const V4_DRIVER = join(V4_SANDBOX, '_matrix-driver.mjs')
const V5_DRIVER = join(V5_SANDBOX, '_matrix-driver.mjs')
const OUT_BASE = '/tmp/matrix-out'
const REPORT_DIR = join(OUT_BASE, 'report')
const FINAL_REPORT = join(__dirname, 'REPORT.md')

mkdirSync(REPORT_DIR, { recursive: true })

// Copy drivers into the sandbox dirs so `@kubb/core` resolves to the right
// packages (v4 vs v5). This is idempotent — re-running just overwrites.
function ensureDriver(sandbox, sourceName, targetPath) {
  if (!existsSync(sandbox)) {
    console.error(`Sandbox missing: ${sandbox}. See README.md for setup.`)
    process.exit(2)
  }
  copyFileSync(join(__dirname, sourceName), targetPath)
}

ensureDriver(V4_SANDBOX, '_driver-v4.mjs', V4_DRIVER)
ensureDriver(V5_SANDBOX, '_driver-v5.mjs', V5_DRIVER)

function walk(dir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(p))
    else out.push(p)
  }
  return out
}

function readFiles(root) {
  return walk(root)
    .map((p) => ({ rel: relative(root, p), content: readFileSync(p, 'utf-8') }))
    .sort((a, b) => a.rel.localeCompare(b.rel))
}

function classifyDiff(filePath, v4Content, v5Content, cellExpectations) {
  if (v4Content === v5Content) return { verdict: 'identical' }
  if (v4Content == null) return { verdict: 'v5-only' }
  if (v5Content == null) return { verdict: 'v4-only' }
  for (const exp of [...(cellExpectations ?? []), ...expectations]) {
    if (exp.match(filePath, v4Content, v5Content)) {
      return { verdict: 'expected', rule: exp.id }
    }
  }
  return { verdict: 'unexpected' }
}

function runSide(sandboxDir, driverPath, configCode, outAbs, cellName) {
  rmSync(outAbs, { recursive: true, force: true })
  mkdirSync(outAbs, { recursive: true })
  // Config must live inside the sandbox so `import '@kubb/core'` resolves to the right packages.
  const configPath = join(sandboxDir, `_cell-${cellName}.config.mjs`)
  writeFileSync(configPath, configCode)

  let stdout = ''
  let stderr = ''
  let error
  try {
    stdout = execFileSync('node', [driverPath, configPath, outAbs], {
      cwd: sandboxDir,
      timeout: 90_000,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch (e) {
    error = e.message
    stderr = e.stderr?.toString() ?? ''
    stdout = e.stdout?.toString() ?? ''
  } finally {
    // Clean up the cell-specific config so we don't leave files in the sandbox.
    try { rmSync(configPath) } catch {}
  }

  const files = walk(outAbs)
  return { files, error, stdout, stderr }
}

async function runCell(cell) {
  const cellName = `${cell.plugin}__${cell.option}__${cell.valueLabel}`.replace(/[^\w-]+/g, '_')
  const v4Out = join(OUT_BASE, 'v4', cellName)
  const v5Out = join(OUT_BASE, 'v5', cellName)

  const result = {
    cellName,
    plugin: cell.plugin,
    option: cell.option,
    valueLabel: cell.valueLabel,
    fixture: cell.fixture,
    v4Configured: !!cell.configV4,
    v5Configured: !!cell.configV5,
    v4Error: null,
    v5Error: null,
    files: [],
    counts: { identical: 0, expected: 0, unexpected: 0, v4Only: 0, v5Only: 0 },
    verdict: 'unknown',
  }

  let v4Files = []
  let v5Files = []

  if (cell.configV4) {
    const v4 = runSide(V4_SANDBOX, V4_DRIVER, cell.configV4, v4Out, cellName)
    result.v4Error = v4.error ? (v4.stderr || v4.error) : null
    v4Files = readFiles(v4Out)
  }
  if (cell.configV5) {
    const v5 = runSide(V5_SANDBOX, V5_DRIVER, cell.configV5, v5Out, cellName)
    result.v5Error = v5.error ? (v5.stderr || v5.error) : null
    v5Files = readFiles(v5Out)
  }

  const allRels = new Set([...v4Files.map((f) => f.rel), ...v5Files.map((f) => f.rel)])
  const v4Map = new Map(v4Files.map((f) => [f.rel, f.content]))
  const v5Map = new Map(v5Files.map((f) => [f.rel, f.content]))

  for (const rel of [...allRels].sort()) {
    const v4c = v4Map.get(rel)
    const v5c = v5Map.get(rel)
    const cls = classifyDiff(rel, v4c, v5c, cell.acceptedDiffs)
    result.files.push({ path: rel, verdict: cls.verdict, rule: cls.rule ?? null })
    if (cls.verdict === 'identical') result.counts.identical++
    else if (cls.verdict === 'expected') result.counts.expected++
    else if (cls.verdict === 'v4-only') result.counts.v4Only++
    else if (cls.verdict === 'v5-only') result.counts.v5Only++
    else result.counts.unexpected++
  }

  // Verdict logic:
  // - new-in-v5  : cell has no v4 config (additive feature)
  // - removed-in-v5: cell has no v5 config (option deleted, no replacement)
  // - build-error: either side failed to build
  // - empty-v5  : v5 produced no files (likely a regression to investigate)
  // - identical : every file matched byte-for-byte (rare with documented changes)
  // - documented-diff: every file diff was explained by an expectations rule
  // - structural-diff: builds succeed but the output structure differs (the
  //   migration guide documents many of these — multi-content-type, type
  //   renames, etc.). Not a regression; needs human review.
  if (!cell.configV4 && cell.configV5) result.verdict = 'new-in-v5'
  else if (cell.configV4 && !cell.configV5) result.verdict = 'removed-in-v5'
  else if (result.v4Error || result.v5Error) result.verdict = 'build-error'
  else if (cell.configV5 && v5Files.length === 0) result.verdict = 'empty-v5'
  else if (result.counts.unexpected === 0 && result.counts.v4Only === 0 && result.counts.v5Only === 0) {
    result.verdict = result.counts.expected === 0 ? 'identical' : 'documented-diff'
  } else result.verdict = 'structural-diff'

  writeFileSync(join(REPORT_DIR, `${cellName}.json`), JSON.stringify(result, null, 2))
  return result
}

function renderReport(results) {
  const header = `# Kubb v4 ↔ v5 Matrix Validation Report

Generated: ${new Date().toISOString()}

## Methodology

Every cell exercises a single plugin × option (with sensible defaults for
everything else). Each cell runs once on v4 (built from \`origin/v4\` of
\`kubb-labs/kubb\`) and once on v5 (current local \`main\` of \`kubb-labs/kubb\` +
\`kubb-labs/plugins\`). Generated files are diffed and each file is classified:

- **identical** — bytes match.
- **expected** — diff is explained by a normalisation rule in \`expectations.mjs\`
  (banner, JSDoc \`@example\`, \`integerType\` default change, status-code rename,
  \`Data\` ↔ \`MutationRequest\` rename, chained zod \`.optional()\`, cypress method
  case, etc.). Each rule traces back to the migration guide.
- **v4-only / v5-only** — file exists on one side. v4-only is common for
  \`plugin-oas\` JSON schema output (removed in v5). v5-only is common for new
  types like \`*RequestConfig\` / \`*Responses\`.
- **unexpected** — bytes differ and no rule applies. Surfaces in the
  "Diff highlights" section for manual review.

Cell verdicts:

- **identical** — every file is byte-identical.
- **documented-diff** — every diff is explained by \`expectations.mjs\`.
- **structural-diff** — builds succeed but output structure differs (multi-
  content-type generation, \`*Mutation\` aggregate split into \`*RequestConfig\` +
  \`*Responses\`, removed \`schemas/*.json\`, etc.). Not a regression; the
  migration guide documents these.
- **new-in-v5** — option is additive (no v4 equivalent).
- **removed-in-v5** — option was removed; no v5 replacement.
- **build-error** — either side failed to build. Always a problem.
- **empty-v5** — v5 produced no files. Always a problem.

## Summary

| Verdict           | Count |
| ----------------- | ----: |
`

  const buckets = {
    identical: 0,
    'documented-diff': 0,
    'structural-diff': 0,
    'new-in-v5': 0,
    'removed-in-v5': 0,
    'build-error': 0,
    'empty-v5': 0,
  }
  for (const r of results) buckets[r.verdict] = (buckets[r.verdict] ?? 0) + 1
  const summary = Object.entries(buckets)
    .map(([k, v]) => `| ${k.padEnd(17)} | ${String(v).padStart(5)} |`)
    .join('\n')

  const cellRows = results
    .map((r) => {
      const ic = r.counts
      const filesStr = `${ic.identical} ident / ${ic.expected} docd / ${ic.unexpected} unx / ${ic.v4Only} v4o / ${ic.v5Only} v5o`
      const fixturesStr = r.fixture ?? '-'
      return `| ${r.plugin} | ${r.option} | ${r.valueLabel} | ${fixturesStr} | **${r.verdict}** | ${filesStr} |`
    })
    .join('\n')

  const table = `\n## Cell results\n\nFile-count column legend: \`identical\` / \`documented\` / \`unexpected\` / \`v4-only\` / \`v5-only\`.\n\n| Plugin | Option | Value | Fixture | Verdict | Files |\n| --- | --- | --- | --- | --- | --- |\n${cellRows}\n`

  const problems = results.filter((r) => r.verdict === 'build-error' || r.verdict === 'empty-v5')
  let probSection = ''
  if (problems.length) {
    probSection = `\n## Problems (require attention)\n\n`
    for (const p of problems) {
      probSection += `### ${p.cellName} — ${p.verdict}\n\n`
      if (p.v4Error) probSection += `**v4 error**:\n\n\`\`\`\n${p.v4Error.trim().split('\n').slice(0, 5).join('\n')}\n\`\`\`\n\n`
      if (p.v5Error) probSection += `**v5 error**:\n\n\`\`\`\n${p.v5Error.trim().split('\n').slice(0, 5).join('\n')}\n\`\`\`\n\n`
    }
  }

  const unexp = results.filter((r) => r.counts.unexpected > 0)
  let unexpSection = ''
  if (unexp.length) {
    unexpSection = `\n## Diff highlights — cells with unclassified diffs\n\nThese cells succeeded on both sides, but contain at least one file diff that\nthe normalisation rules in \`expectations.mjs\` did not explain. Worth a manual\nlook to confirm each is documented in the migration guide.\n\n`
    for (const r of unexp) {
      const u = r.files.filter((f) => f.verdict === 'unexpected').slice(0, 5)
      unexpSection += `- **${r.cellName}** (${r.counts.unexpected} files): `
      unexpSection += u.map((f) => `\`${f.path}\``).join(', ')
      if (r.counts.unexpected > 5) unexpSection += ` …+${r.counts.unexpected - 5} more`
      unexpSection += '\n'
    }
  }

  return header + summary + '\n' + table + probSection + unexpSection
}

async function main() {
  const results = []
  console.log(`Running ${cells.length} cells...`)
  for (const cell of cells) {
    process.stdout.write(`  ${cell.plugin}.${cell.option} (${cell.valueLabel})... `)
    try {
      const r = await runCell(cell)
      console.log(r.verdict)
      results.push(r)
    } catch (e) {
      console.log(`FAILED: ${e.message}`)
      results.push({
        cellName: `${cell.plugin}__${cell.option}__${cell.valueLabel}`,
        plugin: cell.plugin,
        option: cell.option,
        valueLabel: cell.valueLabel,
        fixture: cell.fixture,
        verdict: 'build-error',
        v4Error: e.message,
        counts: { identical: 0, expected: 0, unexpected: 0, v4Only: 0, v5Only: 0 },
        files: [],
      })
    }
  }
  writeFileSync(FINAL_REPORT, renderReport(results))
  console.log(`\nReport written to ${FINAL_REPORT}`)
  console.log(`Per-cell JSON in ${REPORT_DIR}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
