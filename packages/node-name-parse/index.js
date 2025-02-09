import assert from 'assert'

export function parseModuleName(identifier) {
  assert(typeof identifier == 'string')
  if (!identifier) {
    throw new Error(`Invalid module name: "${identifier}"`)
  }

  const parts = identifier.split('/')
  let scope = null
  let segments = parts
  if (identifier.startsWith('@')) {
    if (parts.length < 2) {
      throw new Error([
        `Invalid scoped module name: "${identifier}".`
        `Expected "@scope/name".`
      ].join(' '))
    }
    scope = parts[0]
    segments = parts.slice(1)
  }

  return { scope, segments }
}

export function parseTypeName(identifier) {
  if (!identifier) {
    throw new Error(`Invalid module name: "${identifier}"`)
  }

  const [moduleName, classPath = ''] = identifier.split(/\s+/)
  if (!moduleName) {
    throw new Error([
      "Invalid identifier format.",
      "Expected \"[moduleName] [dotDelimitedPathToClass]\".",
      `Got "${identifier}".`
    ].join(' '))
  }

  return { 
    module: parseModuleName(moduleName), 
    segments: classPath.split('.'),
    isDefault: !classPath
  }
}
