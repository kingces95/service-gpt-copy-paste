import {
  CliInfo,
  CliParameterInfo,
  CliCommandInfo,
} from '@kingjs/cli-info'
import { trimPojo } from '@kingjs/pojo-trim'
import { toPojo } from '@kingjs/pojo'

const symbol = Symbol('cli-metadata-to-pojo')

CliInfo[symbol] = {
  // __type: 'type',
  name: 'string',
}

CliParameterInfo[symbol] = {
  ...CliInfo[symbol],
  description: 'string',
  position: 'number',
  kababName: 'string',
  group: 'string',
  __comment: 'any',
  type: 'string',
  isArray: 'boolean',
  aliases: 'list',
  choices: 'list',
  conflicts: 'list',
  default: 'any',
  defaultDescription: 'string',
  implies: 'list',
  normalized: 'boolean',
  require: 'boolean',
  
  // options
  isRequired: 'boolean',
  isHidden: 'boolean',
  isLocal: 'boolean',
  
  // positionals
  isOptional: 'boolean',
  isVariadic: 'boolean',
}

CliCommandInfo[symbol] = {
  ...CliInfo[symbol],
  description: 'string',
  kababName: 'string',
  __comment: 'any',
  group: 'string',
  isDefaultCommand: 'boolean',
  parameters: 'infos',
  commands: 'infos',
}

export async function cliInfoToPojo(info) {
  let pojo = await toPojo(info, { symbol })
  return trimPojo(pojo)
}
