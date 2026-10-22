import { dirname } from 'node:path'
import { adapterOas } from '@kubb/adapter-oas'
import { createKubb, memoryStorage } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginTs } from '@kubb/plugin-ts'

/**
 * Parameters of the content mapper `transform` request.
 */
export type TransformParams = {
  fileName: string
  content: string
}

/**
 * Result of the content mapper `transform` request: the virtual TypeScript module TypeScript
 * checks in place of the spec file.
 */
export type TransformResult = {
  text: string
  extension: '.ts'
  diagnostics?: Array<{ messageText: string; start: number; length: number }>
}

/**
 * Generates the `@kubb/plugin-ts` types for one OpenAPI document as a single module.
 *
 * The spec text comes from the request, not the disk, so unsaved editor changes are typed too.
 * Nothing is written: the build runs into a memory storage. A failed build returns an empty
 * module with the error-level diagnostics placed at the start of the spec.
 */
export async function transform({ fileName, content }: TransformParams): Promise<TransformResult> {
  const storage = memoryStorage()
  const kubb = createKubb({
    root: dirname(fileName),
    input: content,
    output: { path: '.kubb', barrel: false, format: false, lint: false },
    adapter: adapterOas(),
    parsers: [parserTs()],
    plugins: [pluginTs({ output: { path: 'index.ts' } })],
    storage,
  })

  const { diagnostics } = await kubb.safeBuild()
  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === 'error')
  const [key] = await storage.readKeys()
  const text = key ? await storage.readItem(key) : null

  if (errors.length || !text) {
    // shortcut: diagnostics point at offset 0, upgrade once adapter-oas tracks source ranges
    return {
      text: 'export {}',
      extension: '.ts',
      diagnostics: errors.map((error) => ({ messageText: error.message, start: 0, length: 0 })),
    }
  }

  return { text, extension: '.ts' }
}
