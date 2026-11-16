import type { OperationBody } from './operationBody.ts'

/**
 * Prints a JSON-or-stream operation as one function with three overloads: `stream: true` returns the typed events,
 * `stream: false` returns the JSON result, and leaving `stream` out keeps the call as it was. That default overload
 * comes last, so `ReturnType` and `Parameters` read it. With `method`, it prints a class method instead, for the SDK.
 */
export function buildStreamOverloads({
  name,
  comments,
  base,
  json,
  stream,
  clientRef,
  method = false,
}: {
  name: string
  comments: Array<string>
  base: OperationBody
  json: OperationBody
  stream: OperationBody
  /** The client the call falls back to: `client` in a function, `this.client` in an SDK method. */
  clientRef: string
  method?: boolean
}): string {
  const indent = method ? '  ' : ''
  const head = `${method ? `${indent}public ` : 'export function '}${name}<${base.generics.join(', ')}>`
  const streamParam = `${stream.optionsType} & { stream: true }`
  const jsonParam = `${json.optionsType} & { stream: false }`
  const baseParam = `${base.optionsType} & { stream?: undefined }`
  const destructure = [base, json, stream].some((call) => call.mergeContentType)
    ? `const { client: apiClient = ${clientRef}, stream, contentType, ...config } = options`
    : `const { client: apiClient = ${clientRef}, stream, ...config } = options`
  const body = [
    destructure,
    '',
    'if (stream === true) {',
    `  ${stream.statement}`,
    '}',
    'if (stream === false) {',
    `  ${json.statement}`,
    '}',
    '',
    base.statement,
  ]
    .map((line) => (line ? `${indent}  ${line}` : ''))
    .join('\n')
  const jsdoc = comments.length ? `${indent}/**\n${comments.map((line) => `${indent} * ${line}`).join('\n')}\n${indent} */\n` : ''

  return [
    `${jsdoc}${head}(options: ${streamParam}): ${stream.returnType}`,
    `${head}(options: ${jsonParam}): ${json.returnType}`,
    `${head}(options${base.isOptional ? '?' : ''}: ${baseParam}): ${base.returnType}`,
    `${head}(options: (${streamParam}) | (${jsonParam}) | (${baseParam})${base.isOptional ? ' = {}' : ''}): ${stream.returnType} | ${json.returnType} | ${base.returnType} {`,
    body,
    `${indent}}`,
  ].join('\n')
}
