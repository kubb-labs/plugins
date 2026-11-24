import { ast } from '@internals/ast'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getImportNames(entry: ast.ImportNode): Array<string> {
  return ast.file.getNames(entry).map((item) => item.alias ?? item.name)
}

/**
 * Keeps the imports whose names `text` calls, as `name(` or `name<`, minus `skipImportNames`.
 */
export function filterUsedImports(imports: Array<ast.ImportNode>, text: string, skipImportNames: Array<string> = []): Array<ast.ImportNode> {
  const skip = new Set(skipImportNames)
  // One scan of `text` instead of a new RegExp per import name. Generated helpers can use explicit
  // type arguments, such as `createPet<object>()`.
  const called = new Set(text.match(/\b\w+(?=\s*[<(])/g))

  return imports.filter((entry) => {
    const names = getImportNames(entry)

    return names.some((name) => {
      if (skip.has(name)) {
        return false
      }

      return /^\w+$/.test(name) ? called.has(name) : new RegExp(`\\b${escapeRegExp(name)}\\b(?=\\s*[<(])`).test(text)
    })
  })
}

export function aliasConflictingImports(
  imports: Array<ast.ImportNode>,
  reservedNames: Iterable<string>,
): { imports: Array<ast.ImportNode>; aliases: Map<string, string> } {
  const reservedNameSet = new Set(reservedNames)
  const aliases = new Map<string, string>()

  const aliasedImports = imports.map((entry) => {
    const names = ast.file.getNames(entry)
    if (!names.some((item) => !item.alias && reservedNameSet.has(item.name))) return entry

    const aliasedNames = names.map((item) => {
      if (item.alias || !reservedNameSet.has(item.name)) return item
      const alias = `${item.name}Schema`
      aliases.set(item.name, alias)
      return { ...item, alias }
    })

    return ast.factory.createImport({ names: aliasedNames, path: entry.path, root: entry.root })
  })

  return {
    imports: aliasedImports,
    aliases,
  }
}

/**
 * Renames the calls of an aliased import, as `name(` or `name<`, so a property key or a string of the same name stays.
 */
export function rewriteAliasedImports(text: string, aliases: ReadonlyMap<string, string>): string {
  // shortcut: a string literal that holds `name(` is still rewritten; alias in the ref handler if that shows up.
  return Array.from(aliases).reduce((acc, [name, alias]) => acc.replace(new RegExp(`(?<![.\\w])${escapeRegExp(name)}(?=\\s*[<(])`, 'g'), alias), text)
}
