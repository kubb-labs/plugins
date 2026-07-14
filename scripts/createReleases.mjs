#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// The lookahead after the version rejects a longer, hyphen-suffixed version
// sharing the same numeric prefix (e.g. searching for "5.0.0" must not match
// a "## v5.0.0-rc.1" heading), while still matching the exact version
// followed by whitespace, a separator, or end of line.
function versionHeadingPattern(version) {
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^##\\s+v?${escaped}(?![\\w.-]).*$`, 'm')
}

// Each package's own CHANGELOG.md (written by @changesets/changelog-github)
// has one `## <version>` heading per release for that package alone, so
// finding the heading and slicing up to the next one is enough — unlike
// kubb-labs/kubb's aggregated root CHANGELOG.md, there's no package
// sub-heading to drill into.
export function extractVersionNotes({ changelog, version }) {
  const versionMatch = versionHeadingPattern(version).exec(changelog)
  if (!versionMatch) return null

  const afterVersion = changelog.slice(versionMatch.index + versionMatch[0].length)
  const nextVersionHeading = /^##\s+/m.exec(afterVersion)
  return (nextVersionHeading ? afterVersion.slice(0, nextVersionHeading.index) : afterVersion).trim()
}

function releaseExists(tag) {
  return spawnSync('gh', ['release', 'view', tag], { encoding: 'utf8' }).status === 0
}

// A re-run of `promote` (e.g. a manual re-dispatch against a version that was
// already tagged and released) would otherwise fail here: `gh release create`
// errors on a tag that already has a release. Skipping cleanly makes promote
// safe to re-run instead of going red on a re-dispatch.
function createRelease({ tag, title, notes }) {
  if (releaseExists(tag)) {
    console.log(`Release ${tag} already exists, skipping.`)
    return
  }

  const result = spawnSync('gh', ['release', 'create', tag, '--title', title, '--notes', notes], { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function getWorkspacePaths() {
  const result = spawnSync('pnpm', ['ls', '-r', '--json', '--depth', '0'], { encoding: 'utf8' })
  if (result.status !== 0) return {}
  try {
    return Object.fromEntries(JSON.parse(result.stdout).map((pkg) => [pkg.name, pkg.path]))
  } catch {
    return {}
  }
}

// Packages here version and changelog independently (see the empty `fixed`
// and `linked` groups in .changeset/config.json), so every staged package
// gets its own GitHub Release, tagged `<name>@<version>`, sourced from its own
// CHANGELOG.md — never one combined release for the whole batch.
function createPerPackageReleases({ staged, repo }) {
  const pkgPaths = getWorkspacePaths()
  for (const pkg of staged) {
    let notes = null
    const pkgPath = pkgPaths[pkg.name]
    if (pkgPath) {
      try {
        notes = extractVersionNotes({ changelog: readFileSync(`${pkgPath}/CHANGELOG.md`, 'utf8'), version: pkg.version })
      } catch {}
    }
    notes ??= `Dependency update only, no direct changes for this package. See [CHANGELOG.md](https://github.com/${repo}/blob/main/${pkgPath ?? '.'}/CHANGELOG.md) for the full release notes.`
    createRelease({ tag: `${pkg.name}@${pkg.version}`, title: `${pkg.name}@${pkg.version}`, notes })
  }
}

function main() {
  const staged = JSON.parse(process.env.STAGED_PACKAGES || '[]')
  if (staged.length === 0) {
    console.error('STAGED_PACKAGES is empty. The promote job only runs when release staged something, so this should never happen.')
    process.exit(1)
  }

  createPerPackageReleases({ staged, repo: process.env.GITHUB_REPOSITORY })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
