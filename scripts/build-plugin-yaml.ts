/**
 * Resolves `extends:` references in source plugin YAML files and writes
 * self-contained `plugin.yaml` files into each package directory.
 *
 * Usage:
 *   node --import tsx/esm scripts/build-plugin-yaml.ts
 *   tsx scripts/build-plugin-yaml.ts
 *
 * Source files:  plugins/<name>.yaml  (may contain extends: references)
 * Shared files:  plugins/_shared/**\/*.yaml
 * Output files:  packages/<name>/plugin.yaml  (fully resolved, no extends:)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { parse, stringify } from 'yaml'

const ROOT = resolve(import.meta.dirname, '..')
const PLUGINS_DIR = join(ROOT, 'plugins')
const PACKAGES_DIR = join(ROOT, 'packages')

type PluginOption = {
  extends?: string
  name?: string
  properties?: PluginOption[]
  [key: string]: unknown
}

type PluginYaml = {
  $schema?: string
  options?: PluginOption[]
  [key: string]: unknown
}

/**
 * Deep-merge two plain objects. Values in `overrides` take precedence.
 * Arrays are replaced (not concatenated).
 */
function deepMerge(base: Record<string, unknown>, overrides: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(overrides)) {
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof result[key] === 'object' &&
      result[key] !== null &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key] as Record<string, unknown>, value as Record<string, unknown>)
    } else {
      result[key] = value
    }
  }
  return result
}

/**
 * Resolve a single option object, recursively resolving extends: and
 * processing nested properties.
 */
function resolveOption(option: PluginOption, baseDir: string): PluginOption {
  let resolved: PluginOption = { ...option }

  if (resolved.extends) {
    const sharedPath = resolve(baseDir, resolved.extends as string)
    if (!existsSync(sharedPath)) {
      console.warn(`  [warn] shared file not found: ${sharedPath}`)
    } else {
      const sharedRaw = readFileSync(sharedPath, 'utf8')
      const sharedData = parse(sharedRaw) as Record<string, unknown>

      // Remove $schema — it's metadata for the shared file, not the merged option
      delete sharedData['$schema']

      // Local fields win; extends: is consumed (not in output)
      const { extends: _ext, ...localFields } = resolved
      resolved = deepMerge(sharedData, localFields) as PluginOption
    }
  }

  if (Array.isArray(resolved.properties)) {
    resolved.properties = resolved.properties.map((prop) => resolveOption(prop, baseDir))
  }

  return resolved
}

/**
 * Resolve all options in a plugin YAML document.
 */
function resolvePluginYaml(doc: PluginYaml, sourceDir: string): PluginYaml {
  if (!Array.isArray(doc.options)) return doc

  return {
    ...doc,
    options: doc.options.map((opt) => resolveOption(opt, sourceDir)),
  }
}

// Discover source YAML files
const sourceFiles = [
  'plugin-client',
  'plugin-cypress',
  'plugin-faker',
  'plugin-mcp',
  'plugin-msw',
  'plugin-react-query',
  'plugin-redoc',
  'plugin-ts',
  'plugin-vue-query',
  'plugin-zod',
]

let created = 0
let skipped = 0

for (const name of sourceFiles) {
  const sourcePath = join(PLUGINS_DIR, `${name}.yaml`)
  const packageDir = join(PACKAGES_DIR, name)
  const outputPath = join(packageDir, 'plugin.yaml')

  if (!existsSync(sourcePath)) {
    console.warn(`[skip] source not found: ${sourcePath}`)
    skipped++
    continue
  }

  if (!existsSync(packageDir)) {
    console.warn(`[skip] package dir not found: ${packageDir}`)
    skipped++
    continue
  }

  const sourceDir = dirname(sourcePath)
  const raw = readFileSync(sourcePath, 'utf8')
  const doc = parse(raw) as PluginYaml
  const resolved = resolvePluginYaml(doc, sourceDir)

  // stringify with block style for readability
  const output = stringify(resolved, { blockQuote: 'literal', lineWidth: 0 })
  writeFileSync(outputPath, output, 'utf8')
  console.log(`[ok] ${name} → packages/${name}/plugin.yaml`)
  created++
}

console.log(`\nDone: ${created} created, ${skipped} skipped`)
