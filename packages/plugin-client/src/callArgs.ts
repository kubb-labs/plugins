import { createFunctionParameter, createFunctionParameters, createObjectBindingPattern, functionPrinter } from '@kubb/plugin-ts'

const callPrinter = functionPrinter({ mode: 'call' })

/**
 * One entry of a client call-arguments object. `value` is the rendered expression; omit it for a
 * shorthand entry whose key doubles as the value (`{ query }`). `spread` emits the entry as
 * `...value`.
 */
export type CallArg = {
  value?: string
  spread?: boolean
}

/**
 * Renders the client call-arguments object literal, for example `{ method: 'GET', url, ...requestConfig }`.
 * Entries keep their insertion order and `null` entries are dropped, so callers express a conditional
 * argument by passing `null`. The object is built with the `@kubb/plugin-ts` factory helpers and
 * printed through the shared `functionPrinter`, matching how every other generated function call is rendered.
 */
export function buildClientCallArgs(args: Record<string, CallArg | null | undefined>): string {
  const elements = Object.entries(args)
    .filter(([, arg]) => arg != null)
    .map(([key, arg]) => ({
      name: arg!.spread ? `...${arg!.value ?? key}` : arg!.value ? `${key}: ${arg!.value}` : key,
    }))

  return (
    callPrinter.print(
      createFunctionParameters({
        params: [createFunctionParameter({ name: createObjectBindingPattern({ elements }) })],
      }),
    ) ?? ''
  )
}

/**
 * Assembles the request object passed to the generated client call. The function client spreads
 * `...requestConfig` last and the class client spreads it first, so `requestConfigPlacement` selects
 * the position, or `null` omits it. Every value is rendered by the caller, keeping the
 * function-versus-class differences (url shape, base URL quoting, header spread) at the call site.
 */
export function buildClientRequestArgs(options: {
  method: string
  url: string
  baseURL?: string | null
  query: CallArg | null
  body: CallArg | null
  contentType: boolean
  responseType?: string | null
  headers?: string | null
  requestConfigPlacement: 'first' | 'last' | null
}): string {
  const { method, url, baseURL, query, body, contentType, responseType, headers, requestConfigPlacement } = options
  const requestConfig: CallArg = { value: 'requestConfig', spread: true }

  return buildClientCallArgs({
    ...(requestConfigPlacement === 'first' ? { requestConfig } : {}),
    method: { value: method },
    url: { value: url },
    baseURL: baseURL ? { value: baseURL } : null,
    query,
    body,
    contentType: contentType ? {} : null,
    responseType: responseType ? { value: responseType } : null,
    ...(requestConfigPlacement === 'last' ? { requestConfig } : {}),
    headers: headers ? { value: headers } : null,
  })
}
