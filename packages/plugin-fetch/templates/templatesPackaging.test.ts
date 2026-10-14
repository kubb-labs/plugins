import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const packagesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

type TsdownConfig = { entry?: Record<string, string>; outDir?: string; dts?: unknown }

/**
 * The templates ship as `.ts` sources for the copy step, and their sibling imports carry `.ts`
 * extensions. A consumer that type-checks against those sources needs `allowImportingTsExtensions`,
 * so every template also ships a declaration file and the `types` condition points at it.
 */
describe.each(['plugin-fetch', 'plugin-axios'])('%s template declarations', (plugin) => {
  const packageDir = path.join(packagesDir, plugin)
  const templates = readdirSync(path.join(packageDir, 'templates'))
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
    .map((file) => file.slice(0, -'.ts'.length))
    .sort()

  test('emits a declaration for every template', async () => {
    const { default: configs } = (await import(path.join(packageDir, 'tsdown.config.ts'))) as { default: Array<TsdownConfig> }
    const templateConfig = configs.find((config) => config.outDir === 'dist/templates')

    expect(templateConfig?.dts).toStrictEqual({ emitDtsOnly: true })
    expect(Object.keys(templateConfig?.entry ?? {}).sort()).toStrictEqual(templates)
    expect(Object.values(templateConfig?.entry ?? {}).sort()).toStrictEqual(templates.map((name) => `templates/${name}.ts`))
  })

  test('resolves the template types to the declarations and the copy source to the template', () => {
    const { exports } = JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf8'))

    expect(exports['./templates/*.ts']).toStrictEqual({ types: './dist/templates/*.d.ts', default: './templates/*.ts' })
    expect(exports['./templates/*.js']).toStrictEqual({ types: './dist/templates/*.d.ts' })
  })
})
