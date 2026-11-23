import { getCircularNames } from '@internals/shared'
import type { PrinterFactory } from '@kubb/kit'
import type { PluginZod } from '../types.ts'
import { printerZod } from './printerZod.ts'
import type { PrinterZodOptions } from './printerZod.ts'
import { printerZodMini } from './printerZodMini.ts'
import type { PrinterZodMiniOptions } from './printerZodMini.ts'

/**
 * The `setPrinter` factory of `@kubb/plugin-zod`: `printerZod`, or `printerZodMini` with `mini: true`.
 * Templates pass `direction` and `keysToOmit` per node through `printer.with(...)`.
 */
export const createPrinterZod: PrinterFactory<PluginZod> = (ctx) => {
  const { coercion, guidType, regexType, oneOfType, mini, printer } = ctx.options
  const options: PrinterZodOptions = {
    coercion,
    guidType,
    regexType,
    oneOfType,
    resolver: ctx.resolver,
    // A `printer.nodes` override can print differently per call, so its lookups are not cached.
    directionalCache: printer?.nodes ? undefined : new WeakMap(),
    cyclicSchemas: getCircularNames(),
    nodes: printer?.nodes,
  }
  return mini ? printerZodMini(options as PrinterZodMiniOptions) : printerZod(options)
}
