/**
 * Resolves `extends:` references in source plugin YAML files and writes
 * self-contained `extension.yaml` files into each package directory.
 *
 * Usage:
 *   node --import tsx/esm scripts/build-plugin-yaml.ts
 *   tsx scripts/build-plugin-yaml.ts
 *
 * Source files:  plugins/<name>.yaml  (may contain extends: references)
 * Shared files:  plugins/_shared/**\/*.yaml
 * Output files:  packages/<name>/extension.yaml  (fully resolved, no extends:)
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { ast, createKubb } from '@kubb/core'
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

function resolveOption(option: PluginOption, baseDir: string): PluginOption {
  let resolved: PluginOption = { ...option }

  if (resolved.extends) {
    const sharedPath = resolve(baseDir, resolved.extends as string)
    if (!existsSync(sharedPath)) {
      console.warn(`  [warn] shared file not found: ${sharedPath}`)
    } else {
      const sharedRaw = readFileSync(sharedPath, 'utf8')
      const sharedData = parse(sharedRaw) as Record<string, unknown>

      delete sharedData['$schema']

      const { extends: _ext, ...localFields } = resolved
      resolved = deepMerge(sharedData, localFields) as PluginOption
    }
  }

  if (Array.isArray(resolved.properties)) {
    resolved.properties = resolved.properties.map((prop) => resolveOption(prop, baseDir))
  }

  return resolved
}

function resolvePluginYaml(doc: PluginYaml, sourceDir: string): PluginYaml {
  if (!Array.isArray(doc.options)) return doc

  return {
    ...doc,
    options: doc.options.map((opt) => resolveOption(opt, sourceDir)),
  }
}

const sourceFiles = [
  'plugin-client',
  'plugin-cypress',
  'plugin-faker',
  'plugin-mcp',
  'plugin-msw',
  'plugin-react-query',
  'plugin-redoc',
  'plugin-swr',
  'plugin-ts',
  'plugin-vue-query',
  'plugin-zod',
]

const resolved = sourceFiles
  .map((name) => ({
    name,
    sourcePath: join(PLUGINS_DIR, `${name}.yaml`),
    packageDir: join(PACKAGES_DIR, name),
  }))
  .filter(({ name, sourcePath, packageDir }) => {
    if (!existsSync(sourcePath)) {
      console.warn(`[skip] source not found: ${sourcePath}`)
      return false
    }
    if (!existsSync(packageDir)) {
      console.warn(`[skip] package dir not found: ${packageDir}`)
      return false
    }
    return true
  })

const kubb = createKubb({
  root: ROOT,
  output: {
    path: './packages',
    defaultBanner: false,
  },
  plugins: [
    {
      name: 'plugin-yaml-builder',
      hooks: {
        'kubb:plugin:setup'({ injectFile }) {
          for (const { name, sourcePath, packageDir } of resolved) {
            const raw = readFileSync(sourcePath, 'utf8')
            const doc = parse(raw) as PluginYaml
            const output = stringify(resolvePluginYaml(doc, dirname(sourcePath)), { blockQuote: 'literal', lineWidth: 0, singleQuote: true })

            injectFile({
              baseName: 'extension.yaml',
              path: join(packageDir, 'extension.yaml'),
              sources: [ast.createSource({ nodes: [ast.createText(output)] })],
            })

            console.log(`[ok] ${name} → packages/${name}/extension.yaml`)
          }
        },
      },
    },
  ],
})

await kubb.build()

// kubb's file writer trims the trailing newline; restore it so the generated
// files keep a final newline (POSIX convention) and regeneration stays idempotent.
for (const { packageDir } of resolved) {
  const outPath = join(packageDir, 'extension.yaml')
  const content = readFileSync(outPath, 'utf8')
  if (!content.endsWith('\n')) writeFileSync(outPath, `${content}\n`)
}

console.log(`\nDone: ${resolved.length} created, ${sourceFiles.length - resolved.length} skipped`)
