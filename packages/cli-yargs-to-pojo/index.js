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
  description: 'string',
}

CliYargsParameter[symbol] = {
  ...CliYargs[symbol],
  type: 'string',
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
  local: 'boolean',
  hidden: 'boolean',
  demandOption: 'boolean',
}

CliYargsCommand[symbol] = {
  name: 'string',
  path: 'string',
  template: 'string',
  description: 'string',
  positionals: 'infos',
  options: 'infos',
  commands: 'infos',
}

export async function cliYargsToPojo(info, type) {
  let pojo = await toPojo(info, { symbol, type, depth: 1 })
  return trimPojo(pojo)
}
