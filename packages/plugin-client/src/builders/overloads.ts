import type { OperationBody } from './operationBody.ts'

/**
 * Prints a JSON-or-stream operation as one function with two overloads: `stream: true` returns the typed events, and
 * leaving `stream` out returns the JSON result. The JSON overload comes last, so `ReturnType` and `Parameters` read the
 * JSON call. The implementation takes `stream` out of `options` and sends one call or the other.
 *
 * With `method`, it prints a class method instead, for the SDK.
 */
export function buildStreamOverloads({
  name,
  comments,
  json,
  stream,
  clientRef,
  method = false,
}: {
  name: string
  comments: Array<string>
  json: OperationBody
  stream: OperationBody
  /**
   * The client the call falls back to: `client` in a function, `this.client` in an SDK method.
   */
  clientRef: string
  method?: boolean
}): string {
  const indent = method ? '  ' : ''
  const head = `${method ? `${indent}public ` : 'export function '}${name}<${json.generics.join(', ')}>`
  const streamParam = `${stream.optionsType} & { stream: true }`
  const jsonParam = `${json.optionsType} & { stream?: false }`
  const destructure =
    json.mergeContentType || stream.mergeContentType
      ? `const { client: apiClient = ${clientRef}, stream, contentType, ...config } = options`
      : `const { client: apiClient = ${clientRef}, stream, ...config } = options`
  const body = [destructure, '', 'if (stream) {', `  ${stream.statement}`, '}', '', json.statement].map((line) => (line ? `${indent}  ${line}` : '')).join('\n')
  const jsdoc = comments.length ? `${indent}/**\n${comments.map((line) => `${indent} * ${line}`).join('\n')}\n${indent} */\n` : ''

  return [
    `${jsdoc}${head}(options: ${streamParam}): ${stream.returnType}`,
    `${head}(options${json.isOptional ? '?' : ''}: ${jsonParam}): ${json.returnType}`,
    `${head}(options: (${streamParam}) | (${jsonParam})${json.isOptional ? ' = {}' : ''}): ${stream.returnType} | ${json.returnType} {`,
    body,
    `${indent}}`,
  ].join('\n')
}
