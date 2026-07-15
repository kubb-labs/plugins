import { describe, expect, test } from 'vitest'
import { resolveTypeSource, resolveTypeSourcePlugin } from './resolveTypeSource.ts'

describe('resolveTypeSourcePlugin', () => {
  test("typeSource: 'ts' selects plugin-ts when it is registered", () => {
    expect(resolveTypeSourcePlugin({ typeSource: 'ts', plugins: [{ name: 'plugin-ts' }] })).toStrictEqual({ kind: 'ts', pluginName: 'plugin-ts' })
  })

  test("typeSource: 'ts' without plugin-ts returns a diagnostic naming the package", () => {
    const result = resolveTypeSourcePlugin({ typeSource: 'ts', plugins: [] })
    expect(result.kind).toBe('error')
    if (result.kind === 'error') expect(result.message).toContain('@kubb/plugin-ts')
  })

  test("typeSource: 'zod' selects plugin-zod when it is registered with inferred: true", () => {
    expect(resolveTypeSourcePlugin({ typeSource: 'zod', plugins: [{ name: 'plugin-zod', options: { inferred: true } }] })).toStrictEqual({
      kind: 'zod',
      pluginName: 'plugin-zod',
    })
  })

  test("typeSource: 'zod' without inferred: true returns a diagnostic asking for it", () => {
    const result = resolveTypeSourcePlugin({ typeSource: 'zod', plugins: [{ name: 'plugin-zod', options: { inferred: false } }] })
    expect(result.kind).toBe('error')
    if (result.kind === 'error') {
      expect(result.message).toContain('@kubb/plugin-zod')
      expect(result.message).toContain('inferred: true')
    }
  })

  test("typeSource: 'zod' without plugin-zod registered returns a diagnostic naming the package", () => {
    const result = resolveTypeSourcePlugin({ typeSource: 'zod', plugins: [] })
    expect(result.kind).toBe('error')
    if (result.kind === 'error') expect(result.message).toContain('@kubb/plugin-zod')
  })

  test('plugin-ts wins over plugin-zod when typeSource is unset and both are registered', () => {
    expect(
      resolveTypeSourcePlugin({ typeSource: undefined, plugins: [{ name: 'plugin-ts' }, { name: 'plugin-zod', options: { inferred: true } }] }),
    ).toStrictEqual({ kind: 'ts', pluginName: 'plugin-ts' })
  })

  test('plugin-zod auto-activates when typeSource is unset and only plugin-zod (inferred) is registered', () => {
    expect(resolveTypeSourcePlugin({ typeSource: undefined, plugins: [{ name: 'plugin-zod', options: { inferred: true } }] })).toStrictEqual({
      kind: 'zod',
      pluginName: 'plugin-zod',
    })
  })

  test('plugin-zod without inferred: true is not picked up automatically', () => {
    const result = resolveTypeSourcePlugin({ typeSource: undefined, plugins: [{ name: 'plugin-zod', options: { inferred: false } }] })
    expect(result.kind).toBe('error')
  })

  test('no type source registered returns a diagnostic asking to add one', () => {
    const result = resolveTypeSourcePlugin({ typeSource: undefined, plugins: [] })
    expect(result.kind).toBe('error')
    if (result.kind === 'error') {
      expect(result.message).toContain('@kubb/plugin-ts')
      expect(result.message).toContain('@kubb/plugin-zod')
    }
  })
})

describe('resolveTypeSource', () => {
  test('returns the resolved type source when valid', () => {
    expect(resolveTypeSource({ typeSource: undefined, plugins: [{ name: 'plugin-ts' }] })).toStrictEqual({ kind: 'ts', pluginName: 'plugin-ts' })
  })

  test('throws with the diagnostic message when no type source is registered', () => {
    expect(() => resolveTypeSource({ typeSource: undefined, plugins: [] })).toThrow('No type source is registered')
  })
})
