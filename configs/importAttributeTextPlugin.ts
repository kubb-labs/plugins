import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Rolldown/tsdown plugin that uses import attributes to replace import with text with the real source
 */
export function importAttributeTextPlugin() {
  return {
    name: 'import-attribute-text-plugin',
    transform(code: string, id: string) {
      if (!id.endsWith('.source.ts')) {
        return
      }

      const match = code.match(/import\s+\w+\s+from\s+['"]([^'"]+)['"]\s+with\s+\{\s*type:\s*['"]text['"]\s*\}/)
      if (!match) {
        return
      }

      const templatePath = path.resolve(path.dirname(id), match[1]!)

      let content: string
      try {
        content = readFileSync(templatePath, 'utf-8')
      } catch (err) {
        throw new Error(`[import-attribute-text-plugin] Could not read template file: ${templatePath}`, { cause: err })
      }

      // Strip // @ts-ignore comments that are only present for type-checking the template itself
      const stripped = content
        .split('\n')
        .filter((line) => !/^\s*\/\/ @ts-nocheck/.test(line))
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()

      return `export const source = ${JSON.stringify(stripped)}`
    },
  }
}
