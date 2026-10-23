import { dirname } from 'node:path'
import { Hookable, type KubbHooks, type UserConfig } from '@kubb/core'
import { pluginTs } from '@kubb/plugin-ts'
import { generateModule } from 'unplugin-kubb'
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
 * Options from `tsconfig.json`, plus the Kubb config found for the project.
 */
export type TransformSettings = Options & {
  config?: UserConfig
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
 * Generates the output of every plugin in the project's `kubb.config.ts` for one OpenAPI
 * document as a single module, through `generateModule` from `unplugin-kubb`, so a bundler
 * importing the spec gets the same exports. Without a config, only `@kubb/plugin-ts` runs, with
 * `arrayType`.
 *
 * The spec text comes from the request, not the disk, so unsaved editor changes are typed too.
 * It is parsed once: Kubb builds from the parsed object, and the same document places diagnostics
 * and mappings. Nothing is written: the build runs into a memory storage. A failed build returns
 * an empty module with the error-level diagnostics placed on the spec key they point at.
 */
export async function transform({ fileName, content }: TransformParams, { arrayType, config }: TransformSettings = {}): Promise<TransformResult> {
  const document = parseDocument(content)
  if (document.errors.length) {
    return {
      text: 'export {}',
      extension: '.ts',
      diagnostics: document.errors.map((error) => ({ messageText: error.message, start: error.pos[0], length: error.pos[1] - error.pos[0] })),
    }
  }

  const hooks = new Hookable<KubbHooks>()
  const targets: Targets = { schemas: new Map(), operations: new Map() }
  hooks.hook('kubb:generate:schema', (node, { resolver }) => {
    if (node.name) targets.schemas.set(resolver.name(node.name), node.name)
  })
  hooks.hook('kubb:generate:operation', (node, { resolver }) => {
    if ('path' in node && node.path && node.method) targets.operations.set(resolver.name(node.operationId), { path: node.path, method: node.method })
  })

  const { text, errors } = await generateModule({
    root: dirname(fileName),
    input: document.toJS(),
    config: config ?? { output: { path: '.' }, plugins: [pluginTs({ arrayType })] },
    hooks,
  })

  const locate = createLocator(document)

  if (text === null) {
    return {
      text: 'export {}',
      extension: '.ts',
      diagnostics: errors.map((error) => {
        const range = error.location && 'pointer' in error.location ? locate(error.location) : undefined
        return { messageText: error.message, start: range?.start ?? 0, length: range ? range.end - range.start : 0 }
      }),
    }
  }

  return { text, extension: '.ts', mappings: createMappings(text, content, (pointer) => locate({ pointer }), targets) }
}
