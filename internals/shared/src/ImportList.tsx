import { File } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import type { ast } from 'kubb/kit'

type Props = {
  imports: Array<Pick<ast.ImportNode, 'name' | 'path' | 'isTypeOnly'>>
  /**
   * Path of the file the imports are rendered into. Import paths are made relative to it.
   */
  root: string
  /**
   * Keeps React keys unique when several import lists share a parent.
   */
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
