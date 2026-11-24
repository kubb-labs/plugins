import type { Retry, RetryOptions } from './types'

export type ResolvedRetry = RetryOptions & { limit: number; methods: Array<string>; statusCodes: Array<number> }

// A call's field wins over the client's, and an `undefined` field keeps the client's value. A limit of 0 means no retries.
export function resolveRetry(client: Retry | undefined, call: Retry | undefined): ResolvedRetry {
  const toOptions = (retry: Retry | undefined): RetryOptions => (typeof retry === 'number' ? { limit: retry } : retry || {})
  const [base, own] = [toOptions(client), toOptions(call)]
  // The call's value decides whether retries are on. Without one, the client's does.
  const enabled = (call ?? client ?? false) !== false
  const limit = enabled ? (own.limit ?? base.limit ?? 2) : 0
  return {
    // `NaN` and `Infinity` count as no retries, since no count ever reaches them.
    limit: Number.isFinite(limit) && limit > 0 ? limit : 0,
    methods: (own.methods ?? base.methods ?? ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE', 'TRACE']).map((method) => method.toUpperCase()),
    statusCodes: own.statusCodes ?? base.statusCodes ?? [408, 429, 500, 502, 503, 504],
    delay: own.delay ?? base.delay,
    shouldRetry: own.shouldRetry ?? base.shouldRetry,
    onRetry: own.onRetry ?? base.onRetry,
  }
}

// Exponential from 300 ms, up to 30 seconds, with jitter so clients do not retry in step.
export function backoff(retryCount: number): number {
  return Math.min(300 * 2 ** (retryCount - 1), 30_000) * (0.5 + Math.random() / 2)
}

// Not awaited: a body with a copy settles its cancel only once both are released.
export function release(response: Response | undefined): void {
  void response?.body?.cancel().catch(() => {})
}

// The milliseconds a `Retry-After` header asks for, given as seconds or as an HTTP date.
export function retryAfter(response: Response | undefined): number | undefined {
  const value = response?.headers.get('Retry-After')
  if (!value) return undefined
  const delay = /^\d+(\.\d+)?$/.test(value.trim()) ? Number(value) * 1000 : Date.parse(value) - Date.now()
  return Number.isNaN(delay) ? undefined : Math.max(0, delay)
}

export function sleep(delay: number, signal: AbortSignal | undefined): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason)
    const onAbort = () => {
      clearTimeout(timer)
      reject(signal?.reason)
    }
    // A wait over the timer's maximum would fire at once, so it is capped.
    const timer = setTimeout(
      () => {
        signal?.removeEventListener('abort', onAbort)
        resolve()
      },
      Math.min(delay, 2 ** 31 - 1),
    )
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}
