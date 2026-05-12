export function buildParamsMapping<TParam extends { name: string }>(
  originalParams: ReadonlyArray<TParam>,
  mappedParams: ReadonlyArray<TParam>,
): Record<string, string> | undefined {
  const mapping: Record<string, string> = {}
  let hasChanged = false

  originalParams.forEach((param, i) => {
    const mappedName = mappedParams[i]?.name ?? param.name
    mapping[param.name] = mappedName

    if (param.name !== mappedName) {
      hasChanged = true
    }
  })

  return hasChanged ? mapping : undefined
}

export function buildTransformedParamsMapping<TParam extends { name: string }>(
  params: ReadonlyArray<TParam>,
  transformName: (name: string) => string,
): Record<string, string> | undefined {
  if (!params.length) {
    return undefined
  }

  return buildParamsMapping(
    params,
    params.map((param) => ({ ...param, name: transformName(param.name) })),
  )
}
