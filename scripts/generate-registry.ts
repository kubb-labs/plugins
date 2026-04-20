import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url))
const PACKAGES_DIR = join(REPO_ROOT, 'packages')
const PLUGINS_DIR = join(REPO_ROOT, 'plugins')
const REGISTRY_FILE = join(REPO_ROOT, 'registry.yaml')
const PLUGIN_SCHEMA = 'https://raw.githubusercontent.com/kubb-labs/kubb/main/schemas/plugins/plugin.json'
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

function pluginToYamlLines(plugin: PluginMeta, indent = ''): string[] {
  const i = indent
  const lines: string[] = []

  lines.push(`${i}id: ${plugin.id}`)
  lines.push(`${i}name: ${plugin.name}`)
  lines.push(`${i}description: ${plugin.description}`)
  lines.push(`${i}category: ${plugin.category}`)
  lines.push(`${i}type: ${plugin.type}`)
  lines.push(`${i}version: ${plugin.version}`)
  lines.push(`${i}npmPackage: '${plugin.npmPackage}'`)

  if (plugin.docsPath) {
    lines.push(`${i}docsPath: ${plugin.docsPath}`)
  }

  if (plugin.repo) {
    lines.push(`${i}repo: ${plugin.repo}`)
  }

  if (plugin.maintainers?.length) {
    lines.push(`${i}maintainers:`)
    for (const m of plugin.maintainers) {
      lines.push(`${i}  - name: ${m.name}`)
      lines.push(`${i}    github: ${m.github}`)
      if (m.avatar) {
        lines.push(`${i}    avatar: ${m.avatar}`)
      }
    }
  }

  if (plugin.compatibility) {
    lines.push(`${i}compatibility:`)
    if (plugin.compatibility.kubb) {
      lines.push(`${i}  kubb: '${plugin.compatibility.kubb}'`)
    }
    if (plugin.compatibility.node) {
      lines.push(`${i}  node: '${plugin.compatibility.node}'`)
    }
  }

  if (plugin.tags?.length) {
    lines.push(`${i}tags:`)
    for (const tag of plugin.tags) {
      lines.push(`${i}  - ${tag}`)
    }
  }

  if (plugin.dependencies !== undefined) {
    if (plugin.dependencies.length === 0) {
      lines.push(`${i}dependencies: []`)
    } else {
      lines.push(`${i}dependencies:`)
      for (const dep of plugin.dependencies) {
        lines.push(`${i}  - ${dep}`)
      }
    }
  }

  return lines
}

function toRegistryEntry(plugin: PluginMeta): string {
  // Registry entries are list items indented by 2 spaces; inner fields by 4.
  const inner = pluginToYamlLines(plugin, '    ').join('\n')
  return `  - ${inner.trimStart()}`
}

function toPluginFile(plugin: PluginMeta): string {
  const header = `# yaml-language-server: $schema=${PLUGIN_SCHEMA}\n`
  return header + pluginToYamlLines(plugin).join('\n') + '\n'
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
  } catch (err) {
    const isNotFound = err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT'
    if (!isNotFound) {
      console.error(`Error reading ${pluginJsonPath}:`, err)
    }
  }
}

// Write registry.yaml
const registryYaml = REGISTRY_HEADER + plugins.map(toRegistryEntry).join('\n\n') + '\n'
writeFileSync(REGISTRY_FILE, registryYaml, 'utf-8')
console.log(`Generated registry.yaml with ${plugins.length} plugins`)

// Write plugins/<id>.yaml
mkdirSync(PLUGINS_DIR, { recursive: true })
for (const plugin of plugins) {
  const dest = join(PLUGINS_DIR, `${plugin.id}.yaml`)
  writeFileSync(dest, toPluginFile(plugin), 'utf-8')
  console.log(`  wrote plugins/${plugin.id}.yaml`)
}
