import { type Options, parseOptions } from './options.ts'
import { createDecoder, encode, type Message } from './rpc.ts'
import { transform, type TransformParams } from './transform.ts'

// stdout carries the protocol, so logs from Kubb or its plugins go to stderr.
console.log = console.info = console.warn = console.error

const projects = new Map<string, Options>()

const handlers: Record<string, (params: never) => unknown> = {
  initialize: () => ({ protocolVersion: 1, positionEncoding: 'utf-16', diagnosticSource: 'kubb' }),
  openProject: ({ projectHandle, options }: { projectHandle: string; options?: unknown }) => {
    const parsed = parseOptions(options)
    projects.set(projectHandle, parsed.options)

    return parsed.diagnostics.length ? { optionDiagnostics: parsed.diagnostics } : {}
  },
  closeProject: ({ projectHandle }: { projectHandle: string }) => {
    projects.delete(projectHandle)
    return null
  },
  transform: (params: TransformParams & { projectHandle: string }) => transform(params, projects.get(params.projectHandle)),
}

async function handle({ id, method = '', params }: Message): Promise<void> {
  const handler = handlers[method]
  if (id === undefined) return

  try {
    if (!handler) {
      process.stdout.write(encode({ id, error: { code: -32601, message: `Unknown method "${method}"` } }))
      return
    }
    const result = await handler(params as never)
    process.stdout.write(encode({ id, result: result ?? null }))
  } catch (error) {
    process.stdout.write(encode({ id, error: { code: -32603, message: error instanceof Error ? (error.stack ?? error.message) : String(error) } }))
  }
}

process.stdin.on(
  'data',
  createDecoder((message) => void handle(message)),
)
