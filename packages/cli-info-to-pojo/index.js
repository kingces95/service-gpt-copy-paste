import {
  CliParameterInfo,
  CliOptionInfo,
  CliPositionalInfo,
  CliMemberInfo,
  CliCommandInfo,
  CliGroupInfo
} from '@kingjs/cli-info'
import { trimPojo } from '@kingjs/pojo-trim'
import { toPojoSymbol, toPojo } from '@kingjs/pojo'

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
  options: 'infos',
  positionals: 'list'
}

CliCommandInfo[toPojoSymbol] = {
  ...CliMemberInfo[toPojoSymbol]
}

CliGroupInfo[toPojoSymbol] = {
  ...CliMemberInfo[toPojoSymbol],
  groups: 'infos',
  commands: 'infos'
}

export async function cliInfoToPojo(info) {
  const pojo = await toPojo.call(info)
  return trimPojo(pojo)
}
