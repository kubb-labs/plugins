import { dirname } from 'node:path'
import { cacheTransform } from './cache.ts'
import { loadProjectConfig, type ProjectConfig, selectConfig } from './config.ts'
import { type Options, parseOptions } from './options.ts'
import { createDecoder, encode, type Message } from './rpc.ts'
import { transform, type TransformParams } from './transform.ts'

// stdout carries the protocol, so every other stdout write (any console method, direct writes from
// Kubb or its plugins) goes to stderr.
const writeProtocol = process.stdout.write.bind(process.stdout)
process.stdout.write = process.stderr.write.bind(process.stderr) as typeof process.stdout.write

const projects = new Map<string, { options: Options; config: ProjectConfig }>()

const cachedTransform = cacheTransform(transform)

const handlers: Record<string, (params: never) => unknown> = {
  initialize: () => ({ protocolVersion: 1, positionEncoding: 'utf-16', diagnosticSource: 'kubb' }),
  // `dynamicConfig` in package.json: TypeScript watches `watchedFiles` and opens the project again
  // when one changes, then transforms its specs again when `configIdentity` differs.
  openProject: async ({ projectHandle, configFileName, options }: { projectHandle: string; configFileName?: string; options?: unknown }) => {
    const parsed = parseOptions(options)
    const config = await loadProjectConfig(configFileName ? dirname(configFileName) : process.cwd())
    projects.set(projectHandle, { options: parsed.options, config })

    return {
      configIdentity: config.identity,
      watchedFiles: [config.file],
      ...(parsed.diagnostics.length ? { optionDiagnostics: parsed.diagnostics } : {}),
    }
  },
  closeProject: ({ projectHandle }: { projectHandle: string }) => {
    projects.delete(projectHandle)
    return null
  },
  transform: async (params: TransformParams & { projectHandle: string }) => {
    const project = projects.get(params.projectHandle)
    if (project?.config.error) return { text: 'export {}', extension: '.ts', diagnostics: [{ messageText: project.config.error, start: 0, length: 0 }] }

    return cachedTransform(params, { ...project?.options, config: project && selectConfig(project.config, params.fileName) })
  },
}

async function handle({ id, method = '', params }: Message): Promise<void> {
  const handler = handlers[method]
  if (id === undefined) return

  try {
    if (!handler) {
      writeProtocol(encode({ id, error: { code: -32601, message: `Unknown method "${method}"` } }))
      return
    }
    const result = await handler(params as never)
    writeProtocol(encode({ id, result: result ?? null }))
  } catch (error) {
    writeProtocol(encode({ id, error: { code: -32603, message: error instanceof Error ? (error.stack ?? error.message) : String(error) } }))
  }
}

process.stdin.on(
  'data',
  createDecoder((message) => void handle(message)),
)
