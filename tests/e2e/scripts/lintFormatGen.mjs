// Lints and formats a generated output directory.
//
// kubb's built-in `lint`/`format` are disabled for the e2e configs because the `gen` output is
// gitignored, and oxlint skips gitignored files during directory traversal (its `--no-ignore`
// flag only disables `.eslintignore`, not `.gitignore`). Passing the files explicitly bypasses
// that. The files are linted in chunks bounded by command-line length, which keeps oxlint from
// crashing on too many paths and stays under the Windows command-line limit. oxfmt has no such
// limitation and formats the directory directly.
//
// The linters are launched as `node <bin>` (their bins are Node scripts) so this works on Windows,
// where the `node_modules/.bin` entries are `.cmd` shims that `spawn` cannot run directly.
//
// Usage: node ./scripts/lintFormatGen.mjs ./gen/<name> [--no-lint]

import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../../..')
const oxlintConfig = path.join(repoRoot, 'oxlint.config.ts')
const oxfmtConfig = path.join(repoRoot, 'oxfmt.config.ts')

const LINTABLE = new Set(['.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs'])
// Keep each oxlint invocation's command line comfortably under the Windows limit (~32767) and
// small enough that oxlint doesn't crash on too many paths at once.
const MAX_CHUNK_CHARS = 24000

const require = createRequire(import.meta.url)

function binPath(pkg) {
  const pkgJsonPath = require.resolve(`${pkg}/package.json`)
  const { bin } = JSON.parse(readFileSync(pkgJsonPath, 'utf8'))
  return path.join(path.dirname(pkgJsonPath), typeof bin === 'string' ? bin : bin[pkg])
}

const oxlintBin = binPath('oxlint')
const oxfmtBin = binPath('oxfmt')

const args = process.argv.slice(2)
const noLint = args.includes('--no-lint')
const target = args.find((arg) => !arg.startsWith('--'))

if (!target) {
  console.error('lintFormatGen: missing target directory')
  process.exit(1)
}

function run(binJs, binArgs) {
  const { status } = spawnSync(process.execPath, [binJs, ...binArgs], { stdio: 'inherit' })
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

function chunkByLength(files) {
  const chunks = []
  let current = []
  let length = 0
  for (const file of files) {
    if (current.length && length + file.length + 1 > MAX_CHUNK_CHARS) {
      chunks.push(current)
      current = []
      length = 0
    }
    current.push(file)
    length += file.length + 1
  }
  if (current.length) chunks.push(current)
  return chunks
}

// Nothing to do when the output dir was never written or holds no source files, matching kubb's
// own behavior of skipping the lint/format pass for an unwritten output.
const files = existsSync(target) ? lintableFiles(target) : []
if (files.length === 0) {
  process.exit(0)
}

const formatStatus = run(oxfmtBin, ['-c', oxfmtConfig, target])

let lintStatus = 0
if (!noLint) {
  for (const chunk of chunkByLength(files)) {
    const status = run(oxlintBin, ['-c', oxlintConfig, '--fix', ...chunk])
    if (status !== 0) lintStatus = status
  }
}

process.exit(formatStatus || lintStatus)
