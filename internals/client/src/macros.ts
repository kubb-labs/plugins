import { macroDedupeUnion } from '@kubb/kit'
import type { ast } from '@kubb/kit'

/**
 * Macros the client plugins apply by default, ahead of any user macros. `macroDedupeUnion`
 * drops repeated union members, keeping the generated response and error
 * unions tidy. A plugin wires them with `ctx.setMacros([...defaultMacros, ...userMacros])`.
 */
export const defaultMacros: ReadonlyArray<ast.Macro> = [macroDedupeUnion]
