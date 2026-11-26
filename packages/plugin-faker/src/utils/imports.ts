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

export type ImportAliasesOptions = {
  imports: Array<ast.ImportNode>
  reservedNames: Iterable<string>
}

/**
 * The imports with each name that clashes with a local helper renamed to `${name}Schema`, and the
 * text rewrite that points the calls at those aliases.
 */
export class ImportAliases {
  readonly imports: Array<ast.ImportNode>
  readonly #aliases = new Map<string, string>()

  constructor({ imports, reservedNames }: ImportAliasesOptions) {
    const reserved = new Set(reservedNames)
    this.imports = imports.map((entry) => {
      const names = ast.file.getNames(entry)
      if (!names.some((item) => !item.alias && reserved.has(item.name))) return entry

      const aliasedNames = names.map((item) => {
        if (item.alias || !reserved.has(item.name)) return item
        const alias = `${item.name}Schema`
        this.#aliases.set(item.name, alias)
        return { ...item, alias }
      })

      return ast.factory.createImport({ names: aliasedNames, path: entry.path, root: entry.root })
    })
  }

  /**
   * Points each call to a renamed import at its alias.
   */
  rewrite(text: string): string {
    // shortcut: a string literal that holds `name(` is still rewritten; alias in the ref handler if that shows up.
    return Array.from(this.#aliases).reduce((acc, [name, alias]) => acc.replace(new RegExp(`(?<![.\\w])${escapeRegExp(name)}(?=\\s*[<(])`, 'g'), alias), text)
  }
}

export function createImportAliases(options: ImportAliasesOptions): ImportAliases {
  return new ImportAliases(options)
}
