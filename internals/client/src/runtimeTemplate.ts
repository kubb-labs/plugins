import { readFileSync } from 'node:fs'
import { ast, type Config } from 'kubb/kit'

/** Apply the active TypeScript parser's import extension to a copied client runtime. */
export function runtimeTemplate(path: string, config: Config): string {
  const parser = config.parsers.find((item) => item.extNames?.includes('.ts'))
  // Parser instances expose parse(), but not their configured extension map.
  const probe = ast.factory.createFile({
    baseName: 'probe.ts',
    path: 'probe.ts',
    imports: [ast.factory.createImport({ name: ['KubbRuntimeImport'], path: '/probeDependency.ts', root: '/' })],
    sources: [ast.factory.createSource({ name: 'probe', nodes: [ast.factory.createText('KubbRuntimeImport')] })],
  })
  const extension = parser?.parse(probe).match(/from ['"]\.\/probeDependency(\.[^'"]+)?['"]/)?.[1] ?? ''

  return readFileSync(path, 'utf8').replace(/(from ['"]\.\/(?:serializers|standardSchema))(?:\.ts|\.js)?(['"])/g, `$1${extension}$2`)
}
