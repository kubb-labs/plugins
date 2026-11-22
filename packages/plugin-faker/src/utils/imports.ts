import type { ast } from '@internals/ast'

export type ImportName = string | { propertyName: string; name?: string }

export type ImportEntry = {
  name: string | Array<ImportName>
  names?: Array<ast.ModuleName> | null
  path: string
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getImportNames(entry: ImportEntry): Array<string> {
  return (Array.isArray(entry.name) ? entry.name : [entry.name])
    .map((name) => {
      if (typeof name === 'string') {
        return name
      }

      return name.name ?? name.propertyName
    })
    .filter((name): name is string => Boolean(name))
}

/**
 * Keeps the imports whose names `text` calls, as `name(` or `name<`, minus `skipImportNames`.
 */
export function filterUsedImports<TEntry extends ImportEntry>(imports: Array<TEntry>, text: string, skipImportNames: Array<string> = []): Array<TEntry> {
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

export function aliasConflictingImports<TEntry extends ImportEntry>(
  imports: Array<TEntry>,
  reservedNames: Iterable<string>,
): { imports: Array<TEntry>; aliases: Map<string, string> } {
  const reservedNameSet = new Set(reservedNames)
  const aliases = new Map<string, string>()

  const aliasedImports = imports.map((entry) => {
    const names = Array.isArray(entry.name) ? entry.name : [entry.name]
    const aliasedNames = names.map((item): ImportName => {
      if (typeof item !== 'string' || !reservedNameSet.has(item)) {
        return item
      }

      const alias = `${item}Schema`
      aliases.set(item, alias)

      return { propertyName: item, name: alias }
    })

    if (!aliasedNames.some((item) => typeof item === 'object' && item.name)) return entry
    // An entry with `names` is read from `names`, so the alias goes there too.
    const moduleNames = entry.names?.map((item) => (!item.alias && aliases.has(item.name) ? { ...item, alias: aliases.get(item.name) } : item))
    return Object.assign({}, entry, { name: aliasedNames }, moduleNames ? { names: moduleNames } : {})
  })

  return {
    imports: aliasedImports,
    aliases,
  }
}

export function rewriteAliasedImports(text: string, aliases: ReadonlyMap<string, string>): string {
  return Array.from(aliases).reduce((acc, [name, alias]) => acc.replace(new RegExp(`\\b${escapeRegExp(name)}\\b`, 'g'), alias), text)
}
