/**
 * Throws when a plugin that another plugin needs is missing from the config `plugins` array.
 *
 * Call it from a plugin's `kubb:plugin:setup` hook with `ctx.config.plugins`, so a missing
 * dependency fails the run before any file is generated instead of being skipped silently.
 *
 * @example
 * ```ts
 * assertPluginRegistered({
 *   plugins: ctx.config.plugins,
 *   pluginName: 'plugin-zod',
 *   requiredBy: 'plugin-mcp',
 *   reason: 'to build the tool schemas in `server.ts`',
 * })
 * ```
 */
export function assertPluginRegistered(options: { plugins?: ReadonlyArray<unknown>; pluginName: string; requiredBy: string; reason: string }): void {
  const { plugins = [], pluginName, requiredBy, reason } = options
  const registered = plugins.some((plugin) => (plugin as { name?: string } | undefined)?.name === pluginName)

  if (!registered) {
    throw new Error(
      `\`@kubb/${requiredBy}\` needs \`@kubb/${pluginName}\` ${reason}, but \`@kubb/${pluginName}\` is not registered in \`plugins\`. Add it to \`plugins\` in kubb.config.ts.`,
    )
  }
}

/**
 * Throws when an enum-like plugin option holds a value outside its allowed set.
 *
 * Call it from a plugin's `kubb:plugin:setup` hook after defaults are applied, so a typo such as
 * `syntaxType: 'interfaces'` fails the run instead of falling back to other behavior.
 *
 * @example
 * ```ts
 * assertOptionValue({ pluginName: 'plugin-ts', option: 'syntaxType', value: syntaxType, allowed: ['type', 'interface'] })
 * ```
 */
export function assertOptionValue(options: { pluginName: string; option: string; value: unknown; allowed: ReadonlyArray<string> }): void {
  const { pluginName, option, value, allowed } = options

  if (typeof value !== 'string' || !allowed.includes(value)) {
    const received = typeof value === 'string' ? `'${value}'` : String(value)
    const expected = allowed.map((item) => `'${item}'`).join(', ')

    throw new Error(`\`@kubb/${pluginName}\` option \`${option}\` is ${received}, but it must be one of ${expected}.`)
  }
}
