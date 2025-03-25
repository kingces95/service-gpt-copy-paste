import {
  CliParameterInfo,
  CliCommandInfo,
} from '@kingjs/cli-info'
import { trimPojo } from '@kingjs/pojo-trim'
import { toPojo } from '@kingjs/pojo'

const symbol = Symbol('cli-metadata-to-pojo')

CliParameterInfo[symbol] = {
  name: 'string',
  kababName: 'string',
  position: 'number',
  description: 'string',
  type: 'string',
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
  name: 'string',
  kababName: 'string',
  description: 'string',
  isDefaultCommand: 'boolean',
  parameters: 'infos',
  commands: 'infos',
}

export async function cliInfoToPojo(info, type) {
  let pojo = await toPojo(info, { symbol, type, depth: 1 })
  return trimPojo(pojo)
}
