import path, { resolve } from 'node:path'
import { KubbDriver } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import type {
  Adapter,
  AdapterFactoryOptions,
  Config,
  TemplateContext,
  PrinterContext,
  PrinterFactory,
  KubbHooks,
  KubbPluginSetupContext,
  Memo,
  NormalizedPlugin,
  Parser,
  Plugin,
  PluginType,
  Template,
} from '@kubb/kit'
import { ast, casing, Diagnostics, file, from, Hookable, memo, memoryStorage, withContext } from '@kubb/kit'
import type { Options } from 'prettier'
import { format as prettierFormat } from 'prettier'
import pluginTypescript from 'prettier/plugins/typescript'
import { jsxRenderer } from '@kubb/renderer-jsx'
import { isKubbElement } from '@kubb/renderer-jsx/jsx-runtime'
import { expect, type Mock, vi } from 'vitest'

// Test helpers copied from kubb's former `kubb/kit/testing` entry, so kubb ships no Vitest-backed API.

function memoOn(store: Map<string, unknown>): Memo {
  const cached = (key: string, compute: () => unknown) => memo(store, key, compute)
  return Object.assign(cached, {
    get: (key: string) => store.get(key),
    set: (key: string, value: unknown) => void store.set(key, value),
    has: (key: string) => store.has(key),
  }) as unknown as Memo
}

/**
 * A plugin for template tests. It carries the `resolver` and `macros` the render helpers read,
 * whatever fields the installed `NormalizedPlugin` has.
 */
export type MockedPlugin<TOptions extends PluginType = PluginType> = NormalizedPlugin<TOptions> & {
  resolver?: TOptions['resolver']
  macros?: Array<ast.Macro>
}

/**
 * A driver for template tests, with a `getResolver` the test can replace.
 */
export type MockedPluginDriver = KubbDriver & { getResolver: (pluginName: string) => unknown }

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
 * Creates a driver for template tests. `getPlugin` and `getResolver` return `options.plugin` and
 * its resolver for any name, and files land in a real file manager.
 */
export function createMockedPluginDriver(options: { name?: string; plugin?: MockedPlugin; config?: Config } = {}): MockedPluginDriver {
  const config = options.config ?? ({ root: '.', output: { path: './path' } } as Config)
  const { fileManager } = new KubbDriver(config, { hooks: new Hookable<KubbHooks>() })

  return {
    config,
    getPlugin: (_pluginName: string) => options.plugin,
    getResolver: (_pluginName: string) => options.plugin?.resolver,
    memo: memoOn(new Map()),
    fileManager,
  } as unknown as MockedPluginDriver
}

/**
 * A `kubb:plugin:setup` context whose setup methods are spies.
 */
export type MockedSetupContext<TFactory extends PluginType = PluginType> = KubbPluginSetupContext<TFactory> & {
  plugin: { name: string }
  memo: { get(key: string): unknown }
  setResolver: Mock
  addMacro: Mock
}

/**
 * Creates a `kubb:plugin:setup` context for the plugin `plugin-mock`. `requirePlugin` fails for names `plugins` does not list.
 */
export function createMockedSetupContext<TFactory extends PluginType = PluginType>({
  plugins = [],
  options = {} as TFactory['options'],
}: { plugins?: Array<string>; options?: TFactory['options'] } = {}): MockedSetupContext<TFactory> {
  const registered = plugins.map((name) => ({ name }) as unknown as Plugin)
  const ctx = {
    config: { root: '.', output: { path: './gen' }, plugins: registered } as unknown as Config,
    options,
    plugin: { name: 'plugin-mock', meta: { name: 'plugin-mock' } },
    setResolver: vi.fn(),
    addMacro: vi.fn(),
    setOptions: vi.fn(),
    injectFile: vi.fn(),
    requirePlugin: vi.fn((pluginName: string) => {
      const plugin = registered.find((entry) => entry.name === pluginName)
      if (!plugin) throw pluginNotFoundError({ pluginName })
      return plugin
    }) as KubbPluginSetupContext<TFactory>['requirePlugin'],
    memo: memoOn(new Map()),
  }
  return ctx as unknown as MockedSetupContext<TFactory>
}

/**
 * Returns the templates a plugin registered during a mocked setup, in the order it added them.
 */
export function registeredTemplates(ctx: MockedSetupContext): Array<Template> {
  return (ctx.memo.get(`${ctx.plugin.name}:templates`) as Array<Template> | undefined) ?? []
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
}): MockedPlugin<TOptions> {
  return {
    name: params.name,
    options: params.options,
    resolver: params.resolver,
    macros: params.macros,
    dependencies: params.dependencies,
    hooks: {},
  } as unknown as MockedPlugin<TOptions>
}

export type RenderTemplateOptions<TOptions extends PluginType> = {
  config: Config
  adapter: Adapter
  meta?: ast.InputMeta
  driver: MockedPluginDriver
  plugin: MockedPlugin<TOptions>
  options: TOptions['resolvedOptions']
  resolver: TOptions['resolver']
  /** The plugin's `setPrinter` factory. The template reads its result as `ctx.printer`. */
  printer?: PrinterFactory<TOptions>
}

// Adds `ctx.printer`, `ctx.file` and `ctx.from`, like kit's visitor does. The factory runs with `ctx` as `useKubb()`.
function withPrinter<TOptions extends PluginType>(ctx: PrinterContext<TOptions>, opts: RenderTemplateOptions<TOptions>): TemplateContext<TOptions> {
  const templateContext = { ...ctx, printer: undefined } as TemplateContext<TOptions>
  templateContext.file = (node, options) => withContext(templateContext, () => file(node, options))
  templateContext.from = ((source) => withContext(templateContext, () => from(source))) as TemplateContext<TOptions>['from']
  templateContext.printer = (opts.printer && withContext(ctx, () => opts.printer!(ctx))) as TemplateContext<TOptions>['printer']
  return templateContext
}

function createMockedPluginContext<TOptions extends PluginType>(opts: RenderTemplateOptions<TOptions>): Omit<TemplateContext<TOptions>, 'options' | 'printer'> {
  // A real build registers the plugin under test, so it can look itself up by name.
  const getPlugin = (name: string) => opts.driver.getPlugin(name) ?? (name === opts.plugin.name ? opts.plugin : undefined)
  return {
    config: opts.config,
    root: resolve(opts.config.root, opts.config.output.path),
    adapter: opts.adapter,
    resolver: opts.resolver,
    plugin: opts.plugin,
    getPlugin,
    getResolver: (name: string) => opts.driver.getResolver(name) ?? (name === opts.plugin.name ? opts.resolver : undefined),
    requirePlugin: (pluginName: string) => {
      const plugin = getPlugin(pluginName)
      if (!plugin) throw pluginNotFoundError({ pluginName, requiredBy: opts.plugin.name })
      return plugin
    },
    meta: opts.meta ?? {},
    schemas: opts.driver.inputNode?.schemas ?? [],
    memo: opts.driver.memo,
    addFile: async (...files: Array<ast.FileNode>) => opts.driver.fileManager.add(...files),
    upsertFile: async (...files: Array<ast.FileNode>) => opts.driver.fileManager.upsert(...files),
    getFile: (path: string) => opts.driver.fileManager.files.find((file) => file.path === path),
    hooks: opts.driver.hooks ?? new Hookable<KubbHooks>(),
    warn: (message: string) => console.warn(message),
    error: (message: string) => console.error(message),
    info: (message: string) => console.info(message),
  } as unknown as Omit<TemplateContext<TOptions>, 'options' | 'printer'>
}

/**
 * Renders a template for a node, or for every operation with an `'Operations'` template, and collects its files on
 * `opts.driver.fileManager`. The operations reach `render` as one `OperationsNode`, and JSX renders with `jsxRenderer`,
 * like kit's visitor.
 */
export async function renderTemplate<TOptions extends PluginType>(
  template: Template<TOptions>,
  node: ast.SchemaNode | ast.OperationNode | Array<ast.OperationNode>,
  opts: RenderTemplateOptions<TOptions>,
): Promise<void> {
  const ctx = withPrinter({ ...createMockedPluginContext(opts), options: opts.options }, opts)
  const macros = opts.plugin.macros ?? []
  const apply = <TNode extends ast.SchemaNode | ast.OperationNode>(item: TNode): TNode => (macros.length ? ast.macro.apply(item, macros) : item)
  const transformed = Array.isArray(node) ? ast.factory.createOperations({ operations: node.map(apply) }) : apply(node)
  const render = template.render as (node: unknown, ctx: TemplateContext<TOptions>) => unknown
  const result = await withContext(ctx, () => render.call(ctx, transformed, ctx))
  await opts.driver.fileManager.dispatch({ result, renderer: isKubbElement(result) ? jsxRenderer : null })
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

    const snapshotPath = path.join('__snapshots__', ...(pre ? [casing.camel(pre)] : []), file.baseName)
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
  return prettierFormat(source, formatOptions)
}

const parsers = new Map<`.${string}`, any>([['.ts', parserTs()]])

/**
 * Renders the driver's `.ts` files to their raw, unformatted source. Snapshots run through
 * prettier (see {@link format}), which silently repairs whitespace, so guarding the template's
 * own output means inspecting this raw text instead.
 */
export function rawSources(files: Array<ast.FileNode> | undefined): Array<string> {
  return (files ?? []).filter((file) => file.baseName.endsWith('.ts')).map((file) => parserTs().parse(file))
}

/**
 * Guards the raw (pre-prettier) output every template emits. Prettier repairs whitespace before
 * snapshotting, so without this check a template could regress to double blank lines or a blank
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
