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

CliMetadata[symbol] = {
  name: 'string',
  description: 'string',
}

CliClassMetadata[symbol] = {
  // ...CliMetadata[symbol],
  [symbol]: 'ref',
  id: 'number',
  name: 'string',
  baseClass: 'any',
  description: 'string',
  parameters: 'infos',
  commands: 'entries',
}

CliParameterMetadata[symbol] = {
  ...CliMetadata[symbol],
  default: 'any',

  type: 'string',
  require: 'boolean',
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
