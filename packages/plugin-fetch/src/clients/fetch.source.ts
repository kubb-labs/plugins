// @ts-expect-error - import attributes are handled at build time by importAttributeTextPlugin
import content from '../../templates/fetch.txt' with { type: 'text' }

export const source = content as string
