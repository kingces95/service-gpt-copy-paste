import {
  CliMetadata,
  CliParameterMetadata,
  CliClassMetadata,
  CliMetadataLoader
} from '@kingjs/cli-metadata'
import { trimPojo } from '@kingjs/pojo-trim'
import { toPojo } from '@kingjs/pojo'

const symbol = Symbol('cli-metadata-to-pojo')

CliMetadataLoader[symbol] = {
  classes: 'list',
}

CliClassMetadata[symbol] = {
  [symbol]: 'ref',
  id: 'number',
  name: 'string',
  description: 'string',
  baseClass: 'any',
  parameters: 'infos',
  commands: 'entries',
}

CliParameterMetadata[symbol] = {
  name: 'string',
  description: 'string',
  default: 'any',

  type: 'string',
  required: 'boolean',
  optional: 'boolean',
  local: 'boolean',
  hide: 'boolean',
  position: 'number',
  aliases: 'list',
  choices: 'list',
  conflicts: 'list',
  implications: 'list',

  // coerce, defaultDescription, normalize
}

export async function cliMetadataToPojo(metadata, type) {
  let pojo = await toPojo(metadata, { symbol, type, depth: 1 })
  return trimPojo(pojo)
}
