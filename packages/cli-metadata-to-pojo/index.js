import {
  CliMetadata,
  CliParameterMetadata,
  CliClassMetadata,
} from '@kingjs/cli-metadata'
import { trimPojo } from '@kingjs/pojo-trim'
import { toPojo } from '@kingjs/pojo'

const symbol = Symbol('cli-metadata-to-pojo')

CliMetadata[symbol] = {
  // __type: 'type',
  id: 'ref',
  name: 'string',
}

CliParameterMetadata[symbol] = {
  ...CliMetadata[symbol],
  description: 'string',
  default: 'any',

  type: 'string',
  required: 'boolean',
  optional: 'boolean',
  variadic: 'boolean',
  local: 'boolean',
  hide: 'boolean',
  position: 'number',
  aliases: 'list',
  choices: 'list',
  conflicts: 'list',
  implications: 'list',

  // coerce, defaultDescription, normalize
}

CliClassMetadata[symbol] = {
  [symbol]: 'ref',
  ...CliMetadata[symbol],
  description: 'string',
  group: 'string',
  scope: 'string',
  baseClass: 'ref',
  baren: 'boolean',
  defaultCommand: 'boolean',
  parameters: 'infos',
  commands: 'entries',
  services: 'refs',
}

export async function cliMetadataToPojo(metadata) {
  let pojo = await toPojo(metadata, { symbol })
  return trimPojo(pojo)
}
