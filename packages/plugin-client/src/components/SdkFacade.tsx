import { File } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'

type Member = {
  className: string
  propName: string
}

type Props = {
  name: string
  members: Array<Member>
}

/**
 * Renders a composed root SDK class that creates one client from the config and hands it to every tag
 * client, so `new PetStore({ baseURL }).pet.getPetById(...)` reaches an operation through a single entry
 * point bound to one environment. The shared client is the public `client` field, where interceptors
 * registered once apply to every tag. The per-tag clients are read-only fields built in the constructor.
 */
export function SdkFacade({ name, members }: Props): KubbReactNode {
  const fields = ['  readonly client: ClientInstance', ...members.map((member) => `  readonly ${member.propName}: ${member.className}`)]
  const assignments = [
    '    this.client = createClient(config)',
    ...members.map((member) => `    this.${member.propName} = new ${member.className}(this.client)`),
  ]
  const body = [...fields, '', '  constructor(config: ClientConfig = {}) {', ...assignments, '  }'].join('\n')

  const classCode = `export class ${name} {\n${body}\n}`

  return (
    <File.Source name={name} isExportable isIndexable>
      {classCode}
    </File.Source>
  )
}
