import { File } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import type { ast } from 'kubb/kit'

type Props = {
  imports: Array<Pick<ast.ImportNode, 'name' | 'path' | 'isTypeOnly'>>
  root: string
  keyPrefix: string
  isTypeOnly?: boolean
}

/**
 * Renders one `<File.Import>` per entry, for the imports a resolver returns.
 */
export function ImportList({ imports, root, keyPrefix, isTypeOnly }: Props): KubbReactNode {
  return (
    <>
      {imports.map((imp) => (
        <File.Import key={[keyPrefix, imp.path, imp.name, imp.isTypeOnly].join('-')} root={root} path={imp.path} name={imp.name} isTypeOnly={isTypeOnly} />
      ))}
    </>
  )
}
