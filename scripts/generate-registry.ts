import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const REPO_ROOT = new URL('..', import.meta.url).pathname
const PACKAGES_DIR = join(REPO_ROOT, 'packages')
const REGISTRY_FILE = join(REPO_ROOT, 'registry.yaml')
const REGISTRY_HEADER = `# yaml-language-server: $schema=https://raw.githubusercontent.com/kubb-labs/kubb/main/schemas/plugins/registry.yaml\nversion: '1'\nplugins:\n`

type PluginMeta = {
  id: string
  name: string
  description: string
  category: string
  type: string
  version: string
  npmPackage: string
  docsPath?: string
  repo?: string
  maintainers?: Array<{ name: string; github: string; avatar?: string }>
  compatibility?: { kubb?: string; node?: string }
  tags?: string[]
  dependencies?: string[]
}

function toYaml(plugin: PluginMeta): string {
  const lines: string[] = [`  - id: ${plugin.id}`]

  lines.push(`    name: ${plugin.name}`)
  lines.push(`    description: ${plugin.description}`)
  lines.push(`    category: ${plugin.category}`)
  lines.push(`    type: ${plugin.type}`)
  lines.push(`    version: ${plugin.version}`)
  lines.push(`    npmPackage: '${plugin.npmPackage}'`)

  if (plugin.docsPath) {
    lines.push(`    docsPath: ${plugin.docsPath}`)
  }

  if (plugin.repo) {
    lines.push(`    repo: ${plugin.repo}`)
  }

  if (plugin.maintainers?.length) {
    lines.push('    maintainers:')
    for (const m of plugin.maintainers) {
      lines.push(`      - name: ${m.name}`)
      lines.push(`        github: ${m.github}`)
    }
  }

  if (plugin.compatibility) {
    lines.push('    compatibility:')
    if (plugin.compatibility.kubb) {
      lines.push(`      kubb: '${plugin.compatibility.kubb}'`)
    }
    if (plugin.compatibility.node) {
      lines.push(`      node: '${plugin.compatibility.node}'`)
    }
  }

  if (plugin.tags?.length) {
    lines.push('    tags:')
    for (const tag of plugin.tags) {
      lines.push(`      - ${tag}`)
    }
  }

  if (plugin.dependencies !== undefined) {
    if (plugin.dependencies.length === 0) {
      lines.push('    dependencies: []')
    } else {
      lines.push('    dependencies:')
      for (const dep of plugin.dependencies) {
        lines.push(`      - ${dep}`)
      }
    }
  }

  return lines.join('\n')
}

const pluginDirs = readdirSync(PACKAGES_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort()

const plugins: PluginMeta[] = []

for (const dir of pluginDirs) {
  const pluginJsonPath = join(PACKAGES_DIR, dir, 'plugin.json')
  try {
    const raw = readFileSync(pluginJsonPath, 'utf-8')
    const meta = JSON.parse(raw) as PluginMeta
    plugins.push(meta)
  } catch {
    // skip packages without plugin.json
  }
}

const yaml = REGISTRY_HEADER + plugins.map(toYaml).join('\n\n') + '\n'
writeFileSync(REGISTRY_FILE, yaml, 'utf-8')

console.log(`Generated registry.yaml with ${plugins.length} plugins`)
