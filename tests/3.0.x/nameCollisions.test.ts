import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from '@typescript/typescript6'
import { adapterOas } from '@kubb/adapter-oas'
import { Hookable, createKubb } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginTs, resolverTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { type Config, fsStorage, type KubbHooks } from 'kubb/kit'
import { expect, test } from 'vitest'

const dirname = path.dirname(fileURLToPath(import.meta.url))

test.each(['', 'Api'])('keeps component, operation, and inline enum exports distinct with prefix %j', async (prefix) => {
  const output = await fs.mkdtemp(path.join(dirname, '.name-collisions-'))
  try {
    const { diagnostics } = await createKubb(
      {
        root: dirname,
        input: '../../schemas/3.0.x/nameCollisions.yaml',
        output: { path: output, barrel: false },
        adapter: adapterOas({ validate: false }),
        parsers: [parserTs()],
        reporters: [],
        storage: fsStorage(),
        plugins: [
          pluginTs({ resolver: { name: (name) => `${prefix}${resolverTs.name(name)}` } }),
          pluginZod(),
          pluginFetch({ validator: 'zod' }),
          pluginFaker(),
        ],
      } as Config,
      { hooks: new Hookable<KubbHooks>() },
    ).safeBuild()
    expect(diagnostics.filter((diagnostic) => diagnostic.severity === 'error')).toEqual([])

    const operation = await fs.readFile(path.join(output, 'types/CreateContainer.ts'), 'utf8')
    expect(operation).toContain(`export type ${prefix}CreateContainerBody3 = ${prefix}CreateContainerBody`)
    expect(operation).toContain(`body: ${prefix}CreateContainerBody3`)
    const first = await fs.readFile(path.join(output, 'types/First.ts'), 'utf8')
    const second = await fs.readFile(path.join(output, 'types/Second.ts'), 'utf8')
    expect(first).toContain('export const mitigationActionEnum =')
    expect(second).toContain('export const mitigationActionEnum2 =')
    const auth = await fs.readFile(path.join(output, 'zod/provider/authSchema.ts'), 'utf8')
    expect(auth).toContain('export const providerAuthErrorSchema2 =')
    const factory = await fs.readFile(path.join(output, 'mocks/createCreateContainer.ts'), 'utf8')
    expect(factory).toContain('export function createCreateContainerBody3')

    const files = (await fs.readdir(output, { recursive: true })).filter((file) => file.endsWith('.ts')).map((file) => path.join(output, file))
    const program = ts.createProgram(files, {
      noEmit: true,
      skipLibCheck: true,
      strict: true,
      module: ts.ModuleKind.Preserve,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
    })
    expect(ts.getPreEmitDiagnostics(program).map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))).toEqual([])
  } finally {
    await fs.rm(output, { recursive: true, force: true })
  }
})
