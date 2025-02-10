import {
  CliMetaInfo,
  CliMetaParameterInfo,
  CliMetaClassInfo,
  CliMetaLoader
} from '@kingjs/cli-meta-loader'
import { trimPojo } from '@kingjs/pojo-trim'
import { toPojoSymbol, toPojo } from '@kingjs/pojo-to'

CliMetaLoader[toPojoSymbol] = {
  classes: 'infos',
}

CliMetaInfo[toPojoSymbol] = {
  name: 'string',
  description: 'string',
}

CliMetaClassInfo[toPojoSymbol] = {
  ...CliMetaInfo[toPojoSymbol],
  parameters: 'infos',
  commands: 'any',
}

CliMetaParameterInfo[toPojoSymbol] = {
  ...CliMetaInfo[toPojoSymbol],

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

export async function cliMetaToPojo(meta) {
  let pojo = await toPojo(meta)

  if (meta instanceof CliMetaLoader)
    pojo = pojo.classes
  
  return trimPojo(pojo)
}
