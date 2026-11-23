import { file } from '@kubb/ast'
import type { ImportNode, ModuleName } from '@kubb/ast'

/**
 * Returns the names of `imp`, each marked as a type, for an import that only types use.
 *
 * @example
 * ```tsx
 * <File.Import names={ast.imports.asType(imp)} path={imp.path} root={file.path} />
 * ```
 */
export function asType(imp: ImportNode): Array<ModuleName> {
  return file.getNames(imp).map((item) => ({ ...item, space: 'type' }))
}
