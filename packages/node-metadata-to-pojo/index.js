import {
  NodeLoader,
  NodePackageMetadata,
  NodeExportMetadata,
} from '@kingjs/node-metadata'
import { trimPojo } from '@kingjs/pojo-trim'
import { toPojo } from '@kingjs/pojo'

const symbol = Symbol('node-metadata-to-pojo')

NodeLoader[symbol] = {
  packages: 'infos',
}

NodeExportMetadata[symbol] = {
  name: 'string',
  importString: 'string',
  exports: 'infos',
}

NodePackageMetadata[symbol] = {
  ...NodeExportMetadata[symbol],
  moduleType: 'string',
  isModule: 'boolean',
  isCommonJS: 'boolean',
  scope: 'string',
  version: 'string',
  description: 'string',
  author: 'string',
  homepage: 'string',
  keywords: 'array',
  license: 'string',
  repository: 'string',
}

export async function nodeMetadataToPojo(metadata, type) {
  let pojo = await toPojo(metadata, { symbol, type, depth: 1 })
  return trimPojo(pojo)
}
