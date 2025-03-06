import {
  CliParameterInfo,
  CliCommandInfo,
} from '@kingjs/cli-info'
import { trimPojo } from '@kingjs/pojo-trim'
import { toPojo } from '@kingjs/pojo'

const symbol = Symbol('cli-metadata-to-pojo')

CliParameterInfo[symbol] = {
  // isPositional: 'boolean',
  // isOption: 'boolean',
  name: 'string',
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
  isHidden: 'boolean',
  isLocal: 'boolean',

  // positionals
  position: 'number',
}

CliCommandInfo[symbol] = {
  name: 'string',
  description: 'string',
  parameters: 'infos',
  commands: 'infos',
}

export async function cliInfoToPojo(info, type) {
  let pojo = await toPojo(info, { symbol, type, depth: 1 })
  return trimPojo(pojo)
}
