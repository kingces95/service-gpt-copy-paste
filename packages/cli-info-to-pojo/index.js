import {
  CliParameterInfo,
  CliOptionInfo,
  CliPositionalInfo,
  CliMemberInfo,
  CliCommandInfo,
  CliGroupInfo
} from '@kingjs/cli-info'

import { toPojoSymbol, objectToPojo } from '@kingjs/to-pojo'

CliParameterInfo[toPojoSymbol] = {
  name: 'string',
  description: 'string',
  aliases: 'array',
  choices: 'array',
  conflicts: 'array',
  default: 'any',
  defaultDescription: 'string',
  implies: 'array',
  normalized: 'boolean',
  type: 'string',
  require: 'boolean',
}

CliOptionInfo[toPojoSymbol] = {
  ...CliParameterInfo[toPojoSymbol],
  isGlobal: 'boolean',
  isHidden: 'boolean',
}

CliPositionalInfo[toPojoSymbol] = {
  ...CliParameterInfo[toPojoSymbol]
}

CliMemberInfo[toPojoSymbol] = {
  name: 'string',
  description: 'string',
  options: 'map',
  positionals: 'list'
}

CliCommandInfo[toPojoSymbol] = {
  ...CliMemberInfo[toPojoSymbol]
}

CliGroupInfo[toPojoSymbol] = {
  ...CliMemberInfo[toPojoSymbol],
  groups: 'map',
  commands: 'map'
}

function cliInfoToPojo(info, ...args) {
  return objectToPojo.call(info, ...args)
}

export {
  toPojoSymbol,
  cliInfoToPojo
}