import { createRequire } from 'node:module'
import path from 'node:path'

/**
 * Reads the `version` field of an installed package's `package.json`, resolved from the user's
 * project root so it reflects what is actually installed rather than a workspace dependency.
 * Returns `undefined` when the package cannot be resolved (not installed, or no `version` field).
 */
export function resolvePackageVersion(packageName: string, root: string): string | undefined {
  try {
    const require = createRequire(path.join(root, 'package.json'))
    const pkg = require(`${packageName}/package.json`) as { version?: string }
    return pkg.version
  } catch {
    return undefined
  }
}

/**
 * Compares two dot-separated version strings (`major.minor.patch`, prerelease suffixes ignored).
 * Missing or non-numeric parts count as `0`.
 */
export function isVersionAtLeast(version: string, minVersion: string): boolean {
  const parse = (value: string) =>
    value
      .split('-')[0]!
      .split('.')
      .map((part) => Number.parseInt(part, 10) || 0)
  const [major = 0, minor = 0, patch = 0] = parse(version)
  const [minMajor = 0, minMinor = 0, minPatch = 0] = parse(minVersion)

  if (major !== minMajor) return major > minMajor
  if (minor !== minMinor) return minor > minMinor
  return patch >= minPatch
}
