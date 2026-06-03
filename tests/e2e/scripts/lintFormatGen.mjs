// Lints and formats a generated output directory.
//
// kubb's built-in `lint`/`format` are disabled for the e2e configs because the `gen` output is
// gitignored, and oxlint skips gitignored files during directory traversal (its `--no-ignore`
// flag only disables `.eslintignore`, not `.gitignore`). Passing the files explicitly bypasses
// that, but oxlint crashes when handed too many paths at once, so the files are linted in chunks.
// oxfmt has no such limitation and formats the directory directly.
//
// Usage: node ./scripts/lintFormatGen.mjs ./gen/<name> [--no-lint]

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../../..')
const oxlintConfig = path.join(repoRoot, 'oxlint.config.ts')
const oxfmtConfig = path.join(repoRoot, 'oxfmt.config.ts')

const LINTABLE = new Set(['.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs'])
const CHUNK_SIZE = 1000

const args = process.argv.slice(2)
const noLint = args.includes('--no-lint')
const target = args.find((arg) => !arg.startsWith('--'))

if (!target) {
  console.error('lintFormatGen: missing target directory')
  process.exit(1)
}

// Put the workspace bins on PATH so `oxlint`/`oxfmt` resolve when spawned from this script.
const env = { ...process.env, PATH: `${path.join(repoRoot, 'node_modules/.bin')}${path.delimiter}${process.env.PATH ?? ''}` }

function run(command, commandArgs) {
  const { status } = spawnSync(command, commandArgs, { stdio: 'inherit', env })
  return status ?? 1
}

function lintableFiles(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true, recursive: true })
      .filter((entry) => entry.isFile() && LINTABLE.has(path.extname(entry.name)))
      .map((entry) => path.join(entry.parentPath, entry.name))
  } catch {
    return []
  }
}

// Nothing to do when the output dir was never written or holds no source files, matching kubb's
// own behavior of skipping the lint/format pass for an unwritten output.
const files = existsSync(target) ? lintableFiles(target) : []
if (files.length === 0) {
  process.exit(0)
}

const formatStatus = run('oxfmt', ['-c', oxfmtConfig, target])

let lintStatus = 0
if (!noLint) {
  for (let i = 0; i < files.length; i += CHUNK_SIZE) {
    const chunk = files.slice(i, i + CHUNK_SIZE)
    const status = run('oxlint', ['-c', oxlintConfig, '--fix', ...chunk])
    if (status !== 0) lintStatus = status
  }
}

process.exit(formatStatus || lintStatus)
