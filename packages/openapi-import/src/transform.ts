import { dirname } from 'node:path'
import { adapterOas } from '@kubb/adapter-oas'
import { createKubb, Diagnostics, memoryStorage } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginTs } from '@kubb/plugin-ts'
import { parseDocument } from 'yaml'
import { createLocator } from './locate.ts'
import { createMappings, type Segment, type Targets } from './mappings.ts'
import type { Options } from './options.ts'

/**
 * Parameters of the content mapper `transform` request.
 */
export type TransformParams = {
  fileName: string
  content: string
}

/**
 * Result of the content mapper `transform` request: the virtual TypeScript module TypeScript
 * checks in place of the spec file, and the segments linking its names back to the spec.
 */
export type TransformResult = {
  text: string
  extension: '.ts'
  mappings?: Array<Segment>
  diagnostics?: Array<{ messageText: string; start: number; length: number }>
}

/**
 * Generates the `@kubb/plugin-ts` types for one OpenAPI document as a single module.
 *
 * The spec text comes from the request, not the disk, so unsaved editor changes are typed too.
 * It is parsed once: Kubb builds from the parsed object, and the same document places diagnostics
 * and mappings. Nothing is written: the build runs into a memory storage. A failed build returns
 * an empty module with the error-level diagnostics placed on the spec key they point at.
 */
export async function transform({ fileName, content }: TransformParams, { arrayType }: Options = {}): Promise<TransformResult> {
  const document = parseDocument(content)
  if (document.errors.length) {
    return {
      text: 'export {}',
      extension: '.ts',
      diagnostics: document.errors.map((error) => ({ messageText: error.message, start: error.pos[0], length: error.pos[1] - error.pos[0] })),
    }
  }

  const storage = memoryStorage()
  const kubb = createKubb({
    root: dirname(fileName),
    input: document.toJS(),
    output: { path: '.kubb', barrel: false, format: false, lint: false },
    adapter: adapterOas(),
    parsers: [parserTs()],
    plugins: [pluginTs({ arrayType, output: { path: 'index.ts' } })],
    storage,
  })

  const targets: Targets = { schemas: new Map(), operations: new Map() }
  kubb.hooks.hook('kubb:generate:schema', (node, { resolver }) => {
    if (node.name) targets.schemas.set(resolver.name(node.name), node.name)
  })
  kubb.hooks.hook('kubb:generate:operation', (node, { resolver }) => {
    if ('path' in node && node.path && node.method) targets.operations.set(resolver.name(node.operationId), { path: node.path, method: node.method })
  })

  const { diagnostics } = await kubb.safeBuild()
  const errors = diagnostics.filter(Diagnostics.isProblem).filter((diagnostic) => diagnostic.severity === 'error')
  const [key] = await storage.readKeys()
  const text = key ? await storage.readItem(key) : null

  const locate = createLocator(document)

  if (errors.length || !text) {
    return {
      text: 'export {}',
      extension: '.ts',
      diagnostics: errors.map((error) => {
        const range = error.location && 'pointer' in error.location ? locate(error.location) : undefined
        return { messageText: error.message, start: range?.start ?? 0, length: range ? range.end - range.start : 0 }
      }),
    }
  }

  return { text, extension: '.ts', mappings: createMappings(text, (pointer) => locate({ pointer }), targets) }
}
