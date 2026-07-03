#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'

function escapeForRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// @changesets/changelog-github writes a `## <version>` heading at the top of
// each package's own CHANGELOG.md. The lookahead rejects a longer, hyphen-
// suffixed version sharing the same numeric prefix (searching for "5.0.0"
// must not match a "## 5.0.0-rc.1" heading).
function versionHeadingPattern(version) {
  return new RegExp(`^##\\s+v?${escapeForRegExp(version)}(?![\\w.-]).*$`, 'm')
}

export function extractVersionNotes({ changelog, version }) {
  const versionMatch = versionHeadingPattern(version).exec(changelog)
  if (!versionMatch) return null

  const afterVersion = changelog.slice(versionMatch.index + versionMatch[0].length)
  const nextVersionHeading = /^##\s+/m.exec(afterVersion)
  return (nextVersionHeading ? afterVersion.slice(0, nextVersionHeading.index) : afterVersion).trim()
}

function getWorkspacePaths() {
  const result = spawnSync('pnpm', ['ls', '-r', '--json', '--depth', '0'], { encoding: 'utf8' })
  if (result.status !== 0) return {}
  try {
    return Object.fromEntries(JSON.parse(result.stdout).map((pkg) => [pkg.name, path.relative(process.cwd(), pkg.path)]))
  } catch {
    return {}
  }
}

function createRelease({ tag, title, notes }) {
  const result = spawnSync('gh', ['release', 'create', tag, '--title', title, '--notes', notes], { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function main() {
  const staged = JSON.parse(process.env.STAGED_PACKAGES || '[]')
  if (staged.length === 0) {
    console.error('STAGED_PACKAGES is empty. The promote job only runs when release staged something, so this should never happen.')
    process.exit(1)
  }

  const repo = process.env.GITHUB_REPOSITORY
  const pkgPaths = getWorkspacePaths()

  for (const pkg of staged) {
    const pkgPath = pkgPaths[pkg.name]
    const changelogPath = pkgPath ? `${pkgPath}/CHANGELOG.md` : null

    let notes = null
    if (changelogPath) {
      try {
        notes = extractVersionNotes({ changelog: readFileSync(changelogPath, 'utf8'), version: pkg.version })
      } catch {}
    }

    notes ??= `No changelog entry for this version. See [CHANGELOG.md](https://github.com/${repo}/blob/main/${changelogPath ?? 'CHANGELOG.md'}) for the full history.`
    createRelease({ tag: `${pkg.name}@${pkg.version}`, title: `${pkg.name}@${pkg.version}`, notes })
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
