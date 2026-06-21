import { File } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'

type ClientController = {
  className: string
  propertyName: string
}

type Props = {
  name: string
  controllers: Array<ClientController>
  isExportable?: boolean
  isIndexable?: boolean
}

export function WrapperClient({ name, controllers, isExportable = true, isIndexable = true }: Props): KubbReactNode {
  const properties = controllers.map(({ className, propertyName }) => `  readonly ${propertyName}: ${className}`).join('\n')
  const assignments = controllers.map(({ className, propertyName }) => `    this.${propertyName} = new ${className}(config)`).join('\n')

  const classCode = `export class ${name} {
${properties}

  constructor(config: Partial<RequestConfig> & { client?: ClientInstance } = {}) {
${assignments}
  }
}`

  return (
    <File.Source name={name} isExportable={isExportable} isIndexable={isIndexable}>
      {classCode}
    </File.Source>
  )
}
