import { describe, expect, test, vi } from 'vitest'
import { composeClientRuntime, injectClientRuntime, runtimeSource } from './injectRuntime.ts'

const transport = {
  source:
    'const defaultTransport: Transport = (request) => globalThis.fetch(new Request(request.url))\nexport const client = createClientCore({ defaultTransport })',
  imports: ["import type { Transport } from './types'"],
}

describe('runtimeSource', () => {
  test('inlines the shared runtime core', () => {
    expect(runtimeSource).toContain('export function createClientCore')
    expect(runtimeSource).toContain('export class ResponseError')
  })
})

describe('composeClientRuntime', () => {
  test('orders imports, the shared runtime, then the transport prelude', () => {
    const composed = composeClientRuntime(transport)
    const importIndex = composed.indexOf(transport.imports[0]!)
    const runtimeIndex = composed.indexOf('export function createClientCore')
    const transportIndex = composed.indexOf('const defaultTransport')
    expect(importIndex).toBeGreaterThanOrEqual(0)
    expect(importIndex).toBeLessThan(runtimeIndex)
    expect(runtimeIndex).toBeLessThan(transportIndex)
  })

  test('omits the imports block when there are none', () => {
    const composed = composeClientRuntime({ source: 'export const client = null' })
    expect(composed.startsWith('/**')).toBe(true)
  })
})

describe('injectClientRuntime', () => {
  test('injects the composed runtime at .kubb/client.ts', () => {
    const injectFile = vi.fn()
    injectClientRuntime({ injectFile, root: '/out/clients', transport })

    expect(injectFile).toHaveBeenCalledTimes(1)
    const file = injectFile.mock.calls[0]![0]
    expect(file.baseName).toBe('client.ts')
    expect(file.path).toBe('/out/clients/.kubb/client.ts')
    expect(JSON.stringify(file.sources)).toContain('const defaultTransport')
    expect(JSON.stringify(file.sources)).toContain('export function createClientCore')
  })
})
