import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parserTs } from '@kubb/parser-ts'
import type { Config } from 'kubb/kit'
import { describe, expect, test } from 'vitest'
import { runtimeTemplate } from './runtimeTemplate.ts'

const templates = [
  fileURLToPath(new URL('../../../packages/plugin-fetch/templates/fetch.ts', import.meta.url)),
  fileURLToPath(new URL('../../../packages/plugin-axios/templates/axios.ts', import.meta.url)),
]

describe('runtimeTemplate', () => {
  test.each([
    ['', parserTs()],
    ['.ts', parserTs({ extension: { '.ts': '.ts' } })],
    ['.js', parserTs({ extension: { '.ts': '.js' } })],
  ])('uses %s relative import extensions', (extension, parser) => {
    for (const template of templates) {
      const source = runtimeTemplate(template, { parsers: [parser] } as Config)
      expect(source).toContain(`from './serializers${extension}'`)
      expect(source).toContain(`from './standardSchema${extension}'`)
    }
  })

  test('Node imports the Fetch runtime with .ts specifiers', () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), 'kubb-runtime-'))
    try {
      const clientPath = path.join(directory, 'client.ts')
      writeFileSync(clientPath, runtimeTemplate(templates[0]!, { parsers: [parserTs({ extension: { '.ts': '.ts' } })] } as Config))
      copyFileSync(fileURLToPath(new URL('../../../packages/plugin-fetch/templates/serializers.ts', import.meta.url)), path.join(directory, 'serializers.ts'))
      copyFileSync(
        fileURLToPath(new URL('../../../packages/plugin-fetch/templates/standardSchema.ts', import.meta.url)),
        path.join(directory, 'standardSchema.ts'),
      )

      const result = spawnSync(
        process.execPath,
        ['--experimental-strip-types', '--input-type=module', '-e', `await import(${JSON.stringify(pathToFileURL(clientPath).href)})`],
        {
          encoding: 'utf8',
        },
      )
      expect(result.status, result.stderr).toBe(0)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})
