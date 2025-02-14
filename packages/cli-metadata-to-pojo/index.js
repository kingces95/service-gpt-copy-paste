import {
  CliMetadata,
  CliParameterMetadata,
  CliClassMetadata,
  CliMetadataLoader
} from '@kingjs/cli-metadata'
import { NodeName } from '@kingjs/node-name'
import { trimPojo } from '@kingjs/pojo-trim'
import { toPojo } from '@kingjs/pojo'

const symbol = Symbol('cli-metadata-to-pojo')

CliMetadataLoader[symbol] = {
  classes: 'infos',
}

CliMetadata[symbol] = {
  name: 'string',
  description: 'string',
}

CliClassMetadata[symbol] = {
  ...CliMetadata[symbol],
  fullName: 'string',
  url: 'url',
  parameters: 'infos',
  commands: 'any',
}

NodeName[symbol] = 'toString'

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

export async function cliMetadataToPojo(metadata) {
  let pojo = await toPojo(metadata, symbol)
  return trimPojo(pojo)
}
