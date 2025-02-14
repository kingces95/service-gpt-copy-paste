import { NodeName, ModuleName, TypeName } from '@kingjs/node-name'
import { trimPojo } from '@kingjs/pojo-trim'
import { toPojo } from '@kingjs/pojo'

const symbol = Symbol('node-name-to-pojo')

NodeName[symbol] = {
  id: 'string',
  parts: 'any',
  segments: 'list',
  path: 'string',
  toString: 'string',
}

ModuleName[symbol] = {
  ...NodeName[symbol],
  import: 'string',
  scope: 'string',
  isScoped: 'boolean',
  isGlobal: 'boolean',
  isLocal: 'boolean',
}

TypeName[symbol] = {
  ...NodeName[symbol],
  moduleName: 'any',
  isDefault: 'boolean',
  fullName: 'string',
  namespace: 'string',
  name: 'string',
}

export async function nodeNameToPojo(nodeName) {
  let pojo = await toPojo(nodeName, symbol)
  return trimPojo(pojo)
}
