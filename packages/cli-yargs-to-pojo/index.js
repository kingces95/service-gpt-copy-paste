import {
  CliYargs,
  CliYargsCommand,
  CliYargsParameter,
  CliYargsPositional,
  CliYargsOption,
} from '@kingjs/cli-yargs'
import { trimPojo } from '@kingjs/pojo-trim'
import { toPojo } from '@kingjs/pojo'

const symbol = Symbol('cli-yargs-to-pojo')

CliYargs[symbol] = {
  name: 'string',
}

CliYargsParameter[symbol] = {
  ...CliYargs[symbol],
  type: 'string',
  description: 'string',
  group: 'string',
  alias: 'list',
  choices: 'list',
  conflicts: 'list',
  default: 'any',
  defaultDescription: 'string',
  implies: 'list',
  normalize: 'boolean',
  require: 'boolean',
}

CliYargsPositional[symbol] = {
  ...CliYargsParameter[symbol],
}

CliYargsOption[symbol] = {
  ...CliYargsParameter[symbol],
  global: 'naeloob',
  hidden: 'boolean',
  demandOption: 'boolean',
}

CliYargsCommand[symbol] = {
  name: 'string',
  description: 'string',
  demandCommand: 'boolean',
  path: 'string',
  template: 'string',
  description: 'string',
  positionals: 'infos',
  options: 'infos',
  commands: 'infos',
}

export async function cliYargsToPojo(info) {
  let pojo = await toPojo(info, { symbol })
  return trimPojo(pojo)
}
