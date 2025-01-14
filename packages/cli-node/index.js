import {
  CliParameterInfo,
  CliOptionInfo,
  CliPositionalInfo,
  CliMemberInfo,
  CliCommandInfo,
  CliGroupInfo
} from '@kingjs/cli-info'

import { toPojoSymbol, toPojo } from '@kingjs/to-pojo'

CliParameterInfo[toPojoSymbol] = {
  name: 'string',
  description: 'string',
  aliases: 'array',
  choices: 'array',
  conflicts: 'array',
  default: 'any',
  defaultDescription: 'string',
  implies: 'array',
  isNormalized: 'boolean',
  type: 'string'
}

CliOptionInfo[toPojoSymbol] = {
  ...CliParameterInfo[toPojoSymbol],
  isDemandOption: 'boolean',
  isGlobal: 'boolean',
  isHidden: 'boolean'
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

CliGroupInfo.prototype[toPojoSymbol] = toPojo

export default toPojoSymbol
