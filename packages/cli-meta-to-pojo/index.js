import {
  CliMetaInfo,
  CliMetaParameterInfo,
  CliMetaClassInfo,
  CliMetaLoader
} from '@kingjs/cli-meta-loader'

import { toPojoSymbol, mapToPojo, objectToPojo } from '@kingjs/to-pojo'

CliMetaLoader[toPojoSymbol] = {
  classes: 'map',
}

CliMetaInfo[toPojoSymbol] = {
  name: 'string',
  description: 'string',
}

CliMetaClassInfo[toPojoSymbol] = {
  ...CliMetaInfo[toPojoSymbol],
  parameters: 'map',
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

export function cliMetaToPojo(meta, ...args) {
  if (meta instanceof CliMetaLoader) {
    return mapToPojo(meta.classes(), ...args)
  }
  return objectToPojo(meta, ...args)
}
