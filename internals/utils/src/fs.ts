import { posix } from 'node:path'

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
