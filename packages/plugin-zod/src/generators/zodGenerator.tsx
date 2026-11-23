import { getCircularNames } from '@internals/shared'
import { defineGenerator, type PrinterFactory } from '@kubb/kit'
import { jsxRenderer } from '@kubb/renderer-jsx'
import { printerZod } from '../printers/printerZod.ts'
import type { PrinterZodOptions } from '../printers/printerZod.ts'
import { printerZodMini } from '../printers/printerZodMini.ts'
import type { PrinterZodMiniOptions } from '../printers/printerZodMini.ts'
import { zodOperation } from './zodOperation.tsx'
import { zodSchema } from './zodSchema.tsx'
import type { PluginZod } from '../types'

/**
 * The `setPrinter` factory of `@kubb/plugin-zod`: `printerZod`, or `printerZodMini` with `mini: true`.
 * Generators pass `direction` and `keysToOmit` per node through `printer.with(...)`.
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

/**
 * Built-in generator for `@kubb/plugin-zod`, made of the `zodSchema` and `zodOperation` templates.
 *
 * @deprecated Register `zodSchema` and `zodOperation` with `addTemplate`.
 */
export const zodGenerator = defineGenerator<PluginZod>({
  name: 'zod',
  renderer: jsxRenderer,
  schema: (node, ctx) => zodSchema.render(node, ctx),
  operation: (node, ctx) => zodOperation.render(node, ctx),
})
