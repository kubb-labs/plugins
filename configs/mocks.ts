import path, { resolve } from 'node:path'
import { KubbDriver } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import type {
  Adapter,
  AdapterFactoryOptions,
  Config,
  Generator,
  GeneratorContext,
  KubbHooks,
  KubbPluginSetupContext,
  Memo,
  NodeCache,
  NormalizedPlugin,
  Parser,
  Plugin,
  PluginType,
} from 'kubb/kit'
import { ast, camelCase, Diagnostics, Hookable, memoryStorage } from 'kubb/kit'
import type { Options } from 'prettier'
import { format as prettierFormat } from 'prettier'
import pluginTypescript from 'prettier/plugins/typescript'
import { expect, vi } from 'vitest'

// Test helpers copied from kubb's former `kubb/kit/testing` entry, so kubb ships no Vitest-backed API.

function memoOn(store: Map<string, unknown>): Memo {
  return ((key: string, compute: () => unknown) => {
    if (store.has(key)) return store.get(key)
    const value = compute()
    store.set(key, value)
    return value
  }) as Memo
}

function createNodeCache(): NodeCache {
  const store = new Map<string, unknown>()
  return {
    readItem: <TValue>(key: string) => store.get(key) as TValue | undefined,
    writeItem: <TValue>(key: string, value: TValue) => {
      store.set(key, value)
      return value
    },
    ensureItem: <TValue>(key: string, factory: () => TValue) => memoOn(store)(key, factory) as TValue,
  } as NodeCache
}

function pluginNotFoundError({ pluginName, requiredBy }: { pluginName: string; requiredBy?: string }) {
  const by = requiredBy ? ` by "${requiredBy}"` : ''
  const help = requiredBy ? ` (required by "${requiredBy}")` : ''

  return new Diagnostics.Error({
    code: Diagnostics.code.pluginNotFound,
    severity: 'error',
    message: `Plugin "${pluginName}" is required${by} but not found. Make sure it is included in your Kubb config.`,
    help: `Add "${pluginName}" to the \`plugins\` array in kubb.config.ts${help}, or remove the dependency on it.`,
    location: { kind: 'config' },
    ...(requiredBy ? { plugin: requiredBy } : {}),
  })
}

/**
 * Creates a driver for generator tests. `getPlugin` and `getResolver` return `options.plugin` and
 * its resolver for any name, and files land in a real file manager.
 */
export function createMockedPluginDriver(options: { name?: string; plugin?: NormalizedPlugin; config?: Config } = {}): KubbDriver {
  const config = options.config ?? ({ root: '.', output: { path: './path' } } as Config)
  const { fileManager } = new KubbDriver(config, { hooks: new Hookable<KubbHooks>() })

  return {
    config,
    getPlugin: (_pluginName: string) => options.plugin,
    getResolver: (_pluginName: string) => options.plugin?.resolver,
    memo: memoOn(new Map()),
    fileManager,
  } as unknown as KubbDriver
}

/**
 * Creates a `kubb:plugin:setup` context. `requirePlugin` fails for names `plugins` does not list.
 */
export function createMockedSetupContext<TFactory extends PluginType = PluginType>({
  plugins = [],
  options = {} as TFactory['options'],
}: { plugins?: Array<string>; options?: TFactory['options'] } = {}): KubbPluginSetupContext<TFactory> {
  const registered = plugins.map((name) => ({ name }) as unknown as Plugin)

  return {
    config: { plugins: registered } as unknown as Config,
    options,
    addGenerator: vi.fn(),
    setResolver: vi.fn(),
    addMacro: vi.fn(),
    setMacros: vi.fn(),
    setOptions: vi.fn(),
    injectFile: vi.fn(),
    requirePlugin: vi.fn((pluginName: string) => {
      const plugin = registered.find((entry) => entry.name === pluginName)
      if (!plugin) throw pluginNotFoundError({ pluginName })
      return plugin
    }) as KubbPluginSetupContext<TFactory>['requirePlugin'],
    memo: memoOn(new Map()),
  }
}

/**
 * Creates an adapter whose `parse` returns an empty `InputNode` unless `options.parse` is set.
 */
export function createMockedAdapter<TOptions extends AdapterFactoryOptions = AdapterFactoryOptions>(
  options: { name?: TOptions['name']; resolvedOptions?: TOptions['resolvedOptions']; parse?: Adapter<TOptions>['parse'] } = {},
): Adapter<TOptions> {
  return {
    name: (options.name ?? 'oas') as TOptions['name'],
    options: (options.resolvedOptions ?? {}) as TOptions['resolvedOptions'],
    document: null,
    parse: options.parse ?? (async () => ast.factory.createInput()),
    validate: async () => {},
  }
}

/**
 * Creates a plugin with the given name, options, resolver and macros.
 */
export function createMockedPlugin<TOptions extends PluginType = PluginType>(params: {
  name: TOptions['name']
  options: TOptions['resolvedOptions']
  resolver?: TOptions['resolver']
  macros?: Array<ast.Macro>
  dependencies?: Array<string>
}): NormalizedPlugin<TOptions> {
  return {
    name: params.name,
    options: params.options,
    resolver: params.resolver,
    macros: params.macros,
    dependencies: params.dependencies,
    hooks: {},
  } as unknown as NormalizedPlugin<TOptions>
}

type RenderGeneratorOptions<TOptions extends PluginType> = {
  config: Config
  adapter: Adapter
  meta?: ast.InputMeta
  driver: KubbDriver
  plugin: NormalizedPlugin<TOptions>
  options: TOptions['resolvedOptions']
  resolver: TOptions['resolver']
}

function createMockedPluginContext<TOptions extends PluginType>(opts: RenderGeneratorOptions<TOptions>): Omit<GeneratorContext<TOptions>, 'options'> {
  return {
    config: opts.config,
    root: resolve(opts.config.root, opts.config.output.path),
    adapter: opts.adapter,
    resolver: opts.resolver,
    plugin: opts.plugin,
    driver: opts.driver,
    getResolver: (name: string) => opts.driver.getResolver(name),
    requirePlugin: (pluginName: string) => {
      const plugin = opts.driver.getPlugin(pluginName)
      if (!plugin) throw pluginNotFoundError({ pluginName, requiredBy: opts.plugin.name })
      return plugin
    },
    meta: opts.meta ?? {},
    cache: createNodeCache(),
    memo: opts.driver.memo.bind(opts.driver),
    addFile: async (...files: Array<ast.FileNode>) => opts.driver.fileManager.add(...files),
    upsertFile: async (...files: Array<ast.FileNode>) => opts.driver.fileManager.upsert(...files),
    hooks: opts.driver.hooks ?? new Hookable<KubbHooks>(),
    warn: (message: string) => console.warn(message),
    error: (message: string) => console.error(message),
    info: (message: string) => console.info(message),
  } as unknown as Omit<GeneratorContext<TOptions>, 'options'>
}

async function renderNode<TOptions extends PluginType, TNode extends ast.SchemaNode | ast.OperationNode>({
  generator,
  node,
  opts,
  generate,
}: {
  generator: Generator<TOptions>
  node: TNode
  opts: RenderGeneratorOptions<TOptions>
  generate: (node: TNode, ctx: GeneratorContext<TOptions>) => ReturnType<NonNullable<Generator<TOptions>['schema']>>
}): Promise<void> {
  const ctx = { ...createMockedPluginContext(opts), options: opts.options }
  const transformedNode = opts.plugin.macros?.length ? ast.applyMacros(node, opts.plugin.macros) : node
  const matches = generator.match ? await generator.match(transformedNode, ctx) : true
  if (!matches) return
  await opts.driver.fileManager.dispatch({ result: await generate(transformedNode, ctx), renderer: generator.renderer })
}

/**
 * Renders a generator's `schema` method and collects its files on `opts.driver.fileManager`.
 */
export async function renderGeneratorSchema<TOptions extends PluginType>(
  generator: Generator<TOptions>,
  node: ast.SchemaNode,
  opts: RenderGeneratorOptions<TOptions>,
): Promise<void> {
  if (!generator.schema) return
  await renderNode({ generator, node, opts, generate: (transformedNode, ctx) => generator.schema!(transformedNode, ctx) })
}

/**
 * Renders a generator's `operation` method and collects its files on `opts.driver.fileManager`.
 */
export async function renderGeneratorOperation<TOptions extends PluginType>(
  generator: Generator<TOptions>,
  node: ast.OperationNode,
  opts: RenderGeneratorOptions<TOptions>,
): Promise<void> {
  if (!generator.operation) return
  await renderNode({ generator, node, opts, generate: (transformedNode, ctx) => generator.operation!(transformedNode, ctx) })
}

/**
 * Renders a generator's `operations` method and collects its files on `opts.driver.fileManager`.
 */
export async function renderGeneratorOperations<TOptions extends PluginType>(
  generator: Generator<TOptions>,
  nodes: Array<ast.OperationNode>,
  opts: RenderGeneratorOptions<TOptions>,
): Promise<void> {
  if (!generator.operations) return
  const context = createMockedPluginContext(opts)
  const transformedNodes = opts.plugin.macros?.length ? nodes.map((node) => ast.applyMacros(node, opts.plugin.macros!)) : nodes
  const result = await generator.operations(transformedNodes, { ...context, options: opts.options })
  await opts.driver.fileManager.dispatch({ result, renderer: generator.renderer })
}

async function matchFilesBase(
  files: Array<ast.FileNode> | undefined,
  {
    parsers = new Map(),
    format,
    pre,
  }: { parsers?: Map<ast.FileNode['extname'], Parser>; format?: (source?: string) => string | Promise<string>; pre?: string } = {},
): Promise<Map<string, string> | undefined> {
  if (!files?.length) return

  const { fileManager } = createMockedPluginDriver()
  const processed = new Map<string, string>()

  for (const file of files) {
    if (!file?.path || processed.has(file.path)) continue

    const parsed = await fileManager.parse(file, { parsers })
    const code = file.baseName.endsWith('.json') || !format ? parsed : await format(parsed)
    processed.set(file.path, code)

    const snapshotPath = path.join('__snapshots__', ...(pre ? [camelCase(pre)] : []), file.baseName)
    await expect(code).toMatchFileSnapshot(snapshotPath)
  }

  return processed
}

const formatOptions: Options = {
  tabWidth: 2,
  printWidth: 160,
  parser: 'typescript',
  singleQuote: true,
  semi: false,
  bracketSameLine: false,
  endOfLine: 'auto',
  plugins: [pluginTypescript],
}

export async function format(source?: string): Promise<string> {
  if (!source) return ''
  try {
    return prettierFormat(source, formatOptions)
  } catch {
    return source
  }
}

const parsers = new Map<`.${string}`, any>([['.ts', parserTs()]])

/**
 * Renders the driver's `.ts` files to their raw, unformatted source. Snapshots run through
 * prettier (see {@link format}), which silently repairs whitespace, so guarding the generator's
 * own output means inspecting this raw text instead.
 */
export function rawSources(files: Array<ast.FileNode> | undefined): Array<string> {
  return (files ?? []).filter((file) => file.baseName.endsWith('.ts')).map((file) => parserTs().parse(file))
}

/**
 * Guards the raw (pre-prettier) output every generator emits. Prettier repairs whitespace before
 * snapshotting, so without this check a generator could regress to double blank lines or a blank
 * line straight after an opening bracket and no snapshot would notice.
 */
function assertCleanRawOutput(files: Array<ast.FileNode> | undefined): void {
  for (const source of rawSources(files)) {
    expect(source, 'raw output has no double blank lines').not.toMatch(/\n[ \t]*\n[ \t]*\n/)
    expect(source, 'raw output has no blank line right after an opening bracket').not.toMatch(/[([{][ \t]*\n[ \t]*\n/)
  }
}

export function matchFiles(files: Array<ast.FileNode> | undefined, pre?: string) {
  assertCleanRawOutput(files)
  return matchFilesBase(files, { parsers, format, pre })
}

export const testConfig: Config = {
  root: '.',
  input: {},
  output: { path: 'test' },
  plugins: [],
  parsers: [],
  reporters: [],
  adapter: createMockedAdapter(),
  storage: memoryStorage(),
}

/**
 * Dispatches on plugin name (the built-in mock is name-agnostic); unknown names fall back to `plugin-ts`.
 */
export function createMultiPluginDriver(name: string, plugins: Record<string, { resolver?: unknown }>) {
  const fallback = plugins['plugin-ts']
  const driver = createMockedPluginDriver({ name })
  return {
    ...driver,
    getPlugin: (pluginName: string) => plugins[pluginName] ?? fallback,
    getResolver: (pluginName: string) => plugins[pluginName]?.resolver ?? fallback?.resolver,
  } as typeof driver
}
