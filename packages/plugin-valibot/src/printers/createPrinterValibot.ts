import { getCircularNames } from '@internals/shared'
import type { PrinterFactory } from '@kubb/kit'
import type { PluginValibot } from '../types.ts'
import { printerValibot } from './printerValibot.ts'

/**
 * The `setPrinter` factory of `@kubb/plugin-valibot`. Templates pass `direction` and `keysToOmit`
 * per node through `printer.with(...)`.
 */
export const createPrinterValibot: PrinterFactory<PluginValibot> = (ctx) => {
  const { regexType, oneOfType, coercion, printer } = ctx.options
  return printerValibot({
    regexType,
    oneOfType,
    coercion,
    resolver: ctx.resolver,
    // A `printer.nodes` override can print differently per call, so its lookups are not cached.
    directionalCache: printer?.nodes ? undefined : new WeakMap(),
    cyclicSchemas: getCircularNames(),
    nodes: printer?.nodes,
  })
}
