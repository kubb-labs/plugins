import { macroSimplifyUnion } from 'kubb/kit'
import type { ast } from 'kubb/kit'

/**
 * Macros the client plugins apply by default, ahead of any user macros. `macroSimplifyUnion`
 * drops union members a broader scalar already covers, keeping the generated response and error
 * unions tidy. A plugin wires them with `ctx.setMacros([...defaultMacros, ...userMacros])`.
 */
export const defaultMacros: ReadonlyArray<ast.Macro> = [macroSimplifyUnion]
