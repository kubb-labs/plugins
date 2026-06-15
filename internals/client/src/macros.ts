import type { ast } from '@kubb/core'
import { macroSimplifyUnion } from '@kubb/ast/macros'

/**
 * Macros the slim client plugins apply by default, ahead of any user macros. `macroSimplifyUnion`
 * drops union members a broader scalar already covers, keeping the generated response and error
 * unions tidy. A plugin wires them with `ctx.setMacros([...defaultMacros, ...userMacros])`.
 */
export const defaultMacros: ReadonlyArray<ast.Macro> = [macroSimplifyUnion]
