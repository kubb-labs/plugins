export type ImportName = string | { propertyName: string; name?: string }

export type ImportEntry = {
  name: string | Array<ImportName>
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

export function filterUsedImports(imports: Array<ImportEntry>, text: string, skipImportNames: Array<string> = []): Array<ImportEntry> {
  const skip = new Set(skipImportNames)

  return imports.filter((entry) => {
    const names = getImportNames(entry)

    return names.some((name) => {
      if (skip.has(name)) {
        return false
      }

      return new RegExp(`\\b${escapeRegExp(name)}\\b(?=\\s*\\()`).test(text)
    })
  })
}

export function aliasConflictingImports(
  imports: Array<ImportEntry>,
  reservedNames: Iterable<string>,
): { imports: Array<ImportEntry>; aliases: Map<string, string> } {
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

    return aliasedNames.some((item) => typeof item === 'object' && item.name)
      ? {
          ...entry,
          name: aliasedNames,
        }
      : entry
  })

  return {
    imports: aliasedImports,
    aliases,
  }
}

export function rewriteAliasedImports(text: string, aliases: ReadonlyMap<string, string>): string {
  return Array.from(aliases).reduce((acc, [name, alias]) => acc.replace(new RegExp(`\\b${escapeRegExp(name)}\\b`, 'g'), alias), text)
}
