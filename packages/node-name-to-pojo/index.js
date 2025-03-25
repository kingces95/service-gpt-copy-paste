import { NodeName } from '@kingjs/node-name'
import { trimPojo } from '@kingjs/pojo-trim'
import { toPojo } from '@kingjs/pojo'

const symbol = Symbol('node-name-to-pojo')

NodeName[symbol] = {
  type: 'string',
  isModuleName: 'boolean',
  isObjectName: 'boolean',

  name: 'string',
  defaultName: 'string',
  defaultTypeName: 'string',
  url: 'url',
  parentUrl: 'url',

  toString: 'string',
}

export async function nodeNameToPojo(nodeName) {
  let pojo = await toPojo(nodeName, { symbol })
  return trimPojo(pojo)
}
