import { File } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'

type Member = {
  className: string
  propName: string
}

type Props = {
  name: string
  isExportable?: boolean
  isIndexable?: boolean
  members: Array<Member>
  children?: KubbReactNode
}

/**
 * Renders a composed root SDK class that instantiates every tag client from one shared config, so
 * `new PetStore({ baseURL }).petClient.getPetById(...)` reaches an operation through a single entry
 * point bound to one environment. The per-tag clients are read-only fields built in the constructor.
 */
export function SdkFacade({ name, isExportable = true, isIndexable = true, members, children }: Props): KubbReactNode {
  const fields = members.map((member) => `  readonly ${member.propName}: ${member.className}`)
  const assignments = members.map((member) => `    this.${member.propName} = new ${member.className}(config)`)
  const body = [...fields, '', '  constructor(config: ClientConfig = {}) {', ...assignments, '  }'].join('\n')

  const classCode = `export class ${name} {\n${body}\n}`

  return (
    <File.Source name={name} isExportable={isExportable} isIndexable={isIndexable}>
      {classCode}
      {children}
    </File.Source>
  )
}
