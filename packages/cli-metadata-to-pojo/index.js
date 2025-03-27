import {
  CliParameterMetadata,
  CliClassMetadata,
} from '@kingjs/cli-metadata'
import { trimPojo } from '@kingjs/pojo-trim'
import { toPojo } from '@kingjs/pojo'

const symbol = Symbol('cli-metadata-to-pojo')

CliClassMetadata[symbol] = {
  [symbol]: 'ref',
  id: 'number',
  name: 'string',
  wellKnown: 'boolean',
  description: 'string',
  baseClass: 'any',
  baren: 'boolean',
  defaultCommand: 'boolean',
  parameters: 'infos',
  commands: 'entries',
  services: 'list',
}

CliParameterMetadata[symbol] = {
  name: 'string',
  description: 'string',
  group: 'string',
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

export async function cliMetadataToPojo(metadata, { type, depth = 1 } = { }) {
  let pojo = await toPojo(metadata, { symbol, type, depth })
  return trimPojo(pojo)
}
