import { NodeName } from '@kingjs/node-name'
import { trimPojo } from '@kingjs/pojo-trim'
import { toPojo } from '@kingjs/pojo'

const symbol = Symbol('node-name-to-pojo')

NodeName[symbol] = {
  type: 'string',
  isExportName: 'boolean',
  isTypeName: 'boolean',
  isNamespace: 'boolean',

  isScoped: 'boolean',
  isGlobal: 'boolean',

  url: 'url',
  parentUrl: 'url',
  importString: 'string',
  qualifiedName: 'string',
  scope: 'string',
  packageName: 'string',
  fullName: 'string',
  namespace: 'string',
  nesting: 'string',
  name: 'string',

  exports: 'list',
  namespaces: 'list',
  nestings: 'list',
  
  toString: 'string',
}

export async function nodeNameToPojo(nodeName) {
  let pojo = await toPojo(nodeName, { symbol })
  return trimPojo(pojo)
}
