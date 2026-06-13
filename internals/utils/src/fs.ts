import { posix } from 'node:path'
import { camelCase } from './casing.ts'

function toSlash(p: string): string {
  if (p.startsWith('\\\\?\\')) return p
  return p.replaceAll('\\', '/')
}

/**
 * Returns the relative path from `rootDir` to `filePath`, always using forward slashes
 * and prefixed with `./` when not already traversing upward.
 *
 * @example
 * ```ts
 * getRelativePath('/src/components', '/src/components/Button.tsx') // './Button.tsx'
 * getRelativePath('/src/components', '/src/utils/helpers.ts')      // '../utils/helpers.ts'
 * ```
 */
export function getRelativePath(rootDir?: string | null, filePath?: string | null): string {
  if (!rootDir || !filePath) {
    throw new Error(`Root and file should be filled in when retrieving the relativePath, ${rootDir || ''} ${filePath || ''}`)
  }

  const relativePath = posix.relative(toSlash(rootDir), toSlash(filePath))

  return relativePath.startsWith('../') ? relativePath : `./${relativePath}`
}

/**
 * Builds a nested file path from a dotted name. Splits on dots that precede a letter
 * (so version numbers embedded in operationIds like `v2025.0` stay intact), camelCases
 * every earlier segment, applies `caseLast` to the final segment, and joins with `/`.
 *
 * Empty segments are dropped before joining. They arise when the name starts with a dot
 * followed by a letter (e.g. `..Schema` splits into `['..', 'Schema']` and `'..'` cases to
 * an empty string). Without this a leading `/` would form, which `path.resolve` reads as an
 * absolute path, letting generated files escape the configured output directory.
 *
 * @example Nested path from a dotted name
 * `toFilePath('pet.petId') // 'pet/petId'`
 *
 * @example PascalCase the final segment
 * `toFilePath('pet.Pet', pascalCase) // 'pet/Pet'`
 *
 * @example Suffix applied to the final segment only
 * `toFilePath('tag.tag', (part) => camelCase(part, { suffix: 'schema' })) // 'tag/tagSchema'`
 */
export function toFilePath(name: string, caseLast: (part: string) => string = camelCase): string {
  const parts = name.split(/\.(?=[a-zA-Z])/)
  return parts
    .map((part, i) => (i === parts.length - 1 ? caseLast(part) : camelCase(part)))
    .filter(Boolean)
    .join('/')
}
